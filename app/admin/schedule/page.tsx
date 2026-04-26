import { db } from "@/lib/db";
import { bookings, submissions } from "@/lib/schema";
import { and, gte, lt, isNull, notInArray, desc } from "drizzle-orm";
import { Calendar } from "./Calendar";
import { blockHours } from "@/lib/maps";

export const dynamic = "force-dynamic";

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day + 6) % 7;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - diff);
  return x;
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const params = await searchParams;
  const anchor = params.week ? new Date(params.week) : new Date();
  const weekStart = startOfWeek(anchor);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Widen the query by 24h on each end so timezone offsets between the
  // server (UTC) and the user's browser can never push a booking out of view.
  // The client filters bookings into day/hour cells using the user's local
  // timezone, so anything outside the visible 7-day grid is silently ignored.
  const queryStart = new Date(weekStart.getTime() - 24 * 60 * 60 * 1000);
  const queryEnd = new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000);

  const weekBookings = await db
    .select()
    .from(bookings)
    .where(and(gte(bookings.startAt, queryStart), lt(bookings.startAt, queryEnd)));

  const bookedSubmissionIds = (
    await db.select({ id: bookings.submissionId }).from(bookings)
  ).map((r) => r.id).filter((x): x is number => x !== null);

  const unscheduled = await db
    .select()
    .from(submissions)
    .where(bookedSubmissionIds.length > 0 ? notInArray(submissions.id, bookedSubmissionIds) : isNull(submissions.id))
    .orderBy(desc(submissions.createdAt))
    .limit(50);

  return (
    <main className="container">
      <div className="header">
        <div>
          <h1>Schedule</h1>
          <div className="muted" style={{ fontSize: 13 }}>
            Drag a lead from the left, or a booking, onto a time slot to schedule.
          </div>
        </div>
      </div>

      <Calendar
        weekStartISO={weekStart.toISOString()}
        bookings={weekBookings.map((b) => ({
          id: b.id,
          customerName: b.customerName,
          phone: b.phone,
          location: b.location,
          serviceType: b.serviceType,
          startAtISO: b.startAt.toISOString(),
          durationMin: b.durationMin,
          status: b.status,
          travelMinutes: b.travelMinutes,
          blockHours: blockHours(b.durationMin, b.travelMinutes),
        }))}
        unscheduled={unscheduled.map((s) => ({
          id: s.id,
          name: s.name,
          phone: s.phone,
          email: s.email,
          service: s.service,
          message: s.message,
          createdAtISO: s.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}
