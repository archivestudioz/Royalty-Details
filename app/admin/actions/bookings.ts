"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte, lt, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, submissions } from "@/lib/schema";
import { readSession } from "@/lib/session";

const BLOCK_HOURS = 4;
const BLOCK_MS = BLOCK_HOURS * 60 * 60 * 1000;

async function requireUser() {
  const s = await readSession();
  if (!s) throw new Error("Not authenticated");
  return s;
}

async function ensureSlotFree(start: Date, ignoreBookingId?: number) {
  const windowStart = new Date(start.getTime() - BLOCK_MS);
  const windowEnd = new Date(start.getTime() + BLOCK_MS);
  const conflicts = await db
    .select({ id: bookings.id, startAt: bookings.startAt })
    .from(bookings)
    .where(
      ignoreBookingId !== undefined
        ? and(gte(bookings.startAt, windowStart), lt(bookings.startAt, windowEnd), ne(bookings.id, ignoreBookingId))
        : and(gte(bookings.startAt, windowStart), lt(bookings.startAt, windowEnd))
    );
  for (const c of conflicts) {
    const diff = Math.abs(c.startAt.getTime() - start.getTime());
    if (diff < BLOCK_MS) {
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

  await db.insert(bookings).values({
    customerName: name,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    location: input.location?.trim() || null,
    serviceType: input.serviceType?.trim() || null,
    startAt: start,
    durationMin: input.durationMin ?? 60,
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
