"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte, lt, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, submissions } from "@/lib/schema";
import { readSession } from "@/lib/session";
import { lookupAddress, blockMinutes } from "@/lib/maps";

const FALLBACK_BLOCK_MS = 4 * 60 * 60 * 1000;

async function requireUser() {
  const s = await readSession();
  if (!s) throw new Error("Not authenticated");
  return s;
}

/**
 * Reject the start if it falls within the block window of any other booking
 * (each booking blocks `job + 2*travel + buffer` minutes — see lib/maps).
 */
async function ensureSlotFree(start: Date, ignoreBookingId?: number) {
  // Look at any booking that *could* still overlap, then refine using each one's
  // actual block duration. The 24h pre-window is generous enough to cover the
  // longest realistic job + round-trip travel.
  const lookbackMs = 24 * 60 * 60 * 1000;
  const lookaheadMs = FALLBACK_BLOCK_MS;
  const windowStart = new Date(start.getTime() - lookbackMs);
  const windowEnd = new Date(start.getTime() + lookaheadMs);

  const conflicts = await db
    .select({
      id: bookings.id,
      startAt: bookings.startAt,
      durationMin: bookings.durationMin,
      travelMinutes: bookings.travelMinutes,
    })
    .from(bookings)
    .where(
      ignoreBookingId !== undefined
        ? and(gte(bookings.startAt, windowStart), lt(bookings.startAt, windowEnd), ne(bookings.id, ignoreBookingId))
        : and(gte(bookings.startAt, windowStart), lt(bookings.startAt, windowEnd))
    );

  for (const c of conflicts) {
    const cBlockMs = blockMinutes(c.durationMin, c.travelMinutes) * 60 * 1000;
    const cEnd = c.startAt.getTime() + cBlockMs;
    // The new booking conflicts if its start falls inside another booking's block window.
    if (start.getTime() >= c.startAt.getTime() && start.getTime() < cEnd) {
      throw new Error("Slot conflicts with another booking's job + travel buffer");
    }
  }
}

export async function createBooking(input: {
  customerName: string;
  phone?: string;
  email?: string;
  location?: string;
  serviceType?: string;
  startAt: string;
  durationMin?: number;
  notes?: string;
  submissionId?: number;
}) {
  const s = await requireUser();
  const name = input.customerName.trim();
  if (!name) throw new Error("Customer name required");

  const start = new Date(input.startAt);
  if (Number.isNaN(start.getTime())) throw new Error("Invalid start time");
  await ensureSlotFree(start);

  const geo = await lookupAddress(input.location);

  await db.insert(bookings).values({
    customerName: name,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    location: input.location?.trim() || null,
    serviceType: input.serviceType?.trim() || null,
    startAt: start,
    durationMin: input.durationMin ?? 60,
    latitude: geo?.latitude ?? null,
    longitude: geo?.longitude ?? null,
    travelMinutes: geo?.travelMinutes ?? null,
    notes: input.notes?.trim() || null,
    submissionId: input.submissionId ?? null,
    createdBy: Number(s.sub),
  });
  revalidatePath("/admin/schedule");
}

export async function bookFromSubmission(submissionId: number, startAtISO: string) {
  await requireUser();
  const [sub] = await db.select().from(submissions).where(eq(submissions.id, submissionId)).limit(1);
  if (!sub) throw new Error("Submission not found");
  const start = new Date(startAtISO);
  if (Number.isNaN(start.getTime())) throw new Error("Invalid start time");
  await ensureSlotFree(start);

  // Submissions don't capture address, so we can't compute travel time at this
  // stage — the worker can edit the booking later to add a location.
  await db.insert(bookings).values({
    customerName: sub.name,
    phone: sub.phone,
    email: sub.email,
    location: null,
    serviceType: sub.service,
    startAt: start,
    durationMin: 60,
    notes: sub.message,
    submissionId: sub.id,
  });
  revalidatePath("/admin/schedule");
}

export async function moveBooking(id: number, startAtISO: string) {
  await requireUser();
  const start = new Date(startAtISO);
  if (Number.isNaN(start.getTime())) throw new Error("Invalid start time");
  await ensureSlotFree(start, id);
  await db.update(bookings).set({ startAt: start }).where(eq(bookings.id, id));
  revalidatePath("/admin/schedule");
}

export async function deleteBooking(id: number) {
  await requireUser();
  await db.delete(bookings).where(eq(bookings.id, id));
  revalidatePath("/admin/schedule");
}
