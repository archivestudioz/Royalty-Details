"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import Link from "next/link";
import { bookFromSubmission, moveBooking, deleteBooking } from "../actions/bookings";
import { NewBookingForm } from "./NewBookingForm";
import { MonthPicker } from "./MonthPicker";

type BookingDTO = {
  id: number;
  customerName: string;
  phone: string | null;
  location: string | null;
  serviceType: string | null;
  startAtISO: string;
  durationMin: number;
  status: string;
};
type LeadDTO = {
  id: number;
  name: string;
  phone: string;
  email: string;
  service: string | null;
  message: string | null;
  createdAtISO: string;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BLOCK_HOURS = 4; // each booking blocks its slot + 3 following hours (job time + travel buffer)

function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function addWeeks(d: Date, n: number) { return addDays(d, n * 7); }
function fmtMonthDay(d: Date) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d); }
function fmtHour(h: number) {
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh} ${ampm}`;
}
function slotISO(weekStart: Date, dayIdx: number, hour: number) {
  const d = addDays(weekStart, dayIdx);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export function Calendar({
  weekStartISO,
  bookings,
  unscheduled,
}: {
  weekStartISO: string;
  bookings: BookingDTO[];
  unscheduled: LeadDTO[];
}) {
  const weekStart = useMemo(() => new Date(weekStartISO), [weekStartISO]);
  const [activeDrag, setActiveDrag] = useState<{ kind: "lead" | "booking"; label: string } | null>(null);
  const [, startTransition] = useTransition();
  const [showNew, setShowNew] = useState<string | null>(null); // ISO start time

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const bookingsBySlot = useMemo(() => {
    const m = new Map<string, BookingDTO[]>();
    for (const b of bookings) {
      const d = new Date(b.startAtISO);
      const dayIdx = (d.getDay() + 6) % 7;
      const key = `${dayIdx}:${d.getHours()}`;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(b);
    }
    return m;
  }, [bookings]);

  // Map of slots blocked by a *preceding* booking (the slot itself is empty
  // but it falls within another booking's job + travel window).
  const blockedFollowupSlots = useMemo(() => {
    const m = new Map<string, BookingDTO>();
    for (const b of bookings) {
      const d = new Date(b.startAtISO);
      const dayIdx = (d.getDay() + 6) % 7;
      const startHour = d.getHours();
      for (let i = 1; i < BLOCK_HOURS; i++) {
        const h = startHour + i;
        if (h <= HOURS[HOURS.length - 1]) m.set(`${dayIdx}:${h}`, b);
      }
    }
    return m;
  }, [bookings]);

  function isOccupiedRange(activeId: string | null, dayIdx: number, hour: number) {
    for (let i = 0; i < BLOCK_HOURS; i++) {
      const key = `${dayIdx}:${hour + i}`;
      const conflicts = bookingsBySlot.get(key) ?? [];
      const blocker = blockedFollowupSlots.get(key);
      const movingId = activeId?.startsWith("booking:") ? Number(activeId.slice(8)) : null;
      if (conflicts.some((b) => b.id !== movingId)) return true;
      if (blocker && blocker.id !== movingId) return true;
    }
    return false;
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveDrag(null);
    if (!e.over) return;
    const overId = String(e.over.id);
    if (!overId.startsWith("slot:")) return;
    const [, dayStr, hourStr] = overId.split(":");
    const dayIdx = Number(dayStr);
    const hour = Number(hourStr);
    const activeId = String(e.active.id);

    if (isOccupiedRange(activeId, dayIdx, hour)) return;

    const iso = slotISO(weekStart, dayIdx, hour);
    if (activeId.startsWith("lead:")) {
      const subId = Number(activeId.slice(5));
      startTransition(() => { bookFromSubmission(subId, iso); });
    } else if (activeId.startsWith("booking:")) {
      const bookingId = Number(activeId.slice(8));
      startTransition(() => { moveBooking(bookingId, iso); });
    }
  }

  const prevWeek = addWeeks(weekStart, -1).toISOString().slice(0, 10);
  const nextWeek = addWeeks(weekStart, 1).toISOString().slice(0, 10);
  const today = new Date();

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => {
        const id = String(e.active.id);
        const label = id.startsWith("lead:")
          ? unscheduled.find((u) => u.id === Number(id.slice(5)))?.name ?? "Lead"
          : bookings.find((b) => b.id === Number(id.slice(8)))?.customerName ?? "Booking";
        setActiveDrag({ kind: id.startsWith("lead:") ? "lead" : "booking", label });
      }}
      onDragCancel={() => setActiveDrag(null)}
      onDragEnd={onDragEnd}
    >
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }}>
        <aside>
          <div className="card" style={{ padding: 16, marginBottom: 12 }}>
            <button
              type="button"
              className="btn"
              style={{ width: "100%" }}
              onClick={() => setShowNew(slotISO(weekStart, (today.getDay() + 6) % 7, today.getHours()))}
            >
              + New booking
            </button>
          </div>

          <div style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 4px 8px" }}>
            Unscheduled leads ({unscheduled.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "70vh", overflowY: "auto" }}>
            {unscheduled.length === 0 ? (
              <div className="muted" style={{ fontSize: 13, padding: 12 }}>No leads waiting to be scheduled.</div>
            ) : (
              unscheduled.map((u) => <LeadCard key={u.id} lead={u} />)
            )}
          </div>
        </aside>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              Week of {fmtMonthDay(weekStart)} – {fmtMonthDay(addDays(weekStart, 6))}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <MonthPicker weekStartISO={weekStartISO} />
              <Link href={`/admin/schedule?week=${prevWeek}`} className="btn" style={navBtn}>← Prev</Link>
              <Link href={`/admin/schedule`} className="btn" style={navBtn}>Today</Link>
              <Link href={`/admin/schedule?week=${nextWeek}`} className="btn" style={navBtn}>Next →</Link>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "70px repeat(7, 1fr)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              overflow: "hidden",
              background: "var(--panel)",
            }}
          >
            <div style={headerCell} />
            {DAY_LABELS.map((label, i) => {
              const d = addDays(weekStart, i);
              const isToday = d.toDateString() === today.toDateString();
              return (
                <div key={i} style={{ ...headerCell, color: isToday ? "var(--gold)" : "var(--text)" }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{d.getDate()}</div>
                </div>
              );
            })}

            {HOURS.map((h) => (
              <Row
                key={h}
                hour={h}
                weekStart={weekStart}
                bookingsBySlot={bookingsBySlot}
                blockedFollowupSlots={blockedFollowupSlots}
                onAddNew={(iso) => setShowNew(iso)}
              />
            ))}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeDrag ? (
          <div style={{ ...cardStyle, cursor: "grabbing", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
            <strong style={{ fontSize: 13 }}>{activeDrag.label}</strong>
          </div>
        ) : null}
      </DragOverlay>

      {showNew ? (
        <NewBookingForm defaultStartISO={showNew} onClose={() => setShowNew(null)} />
      ) : null}
    </DndContext>
  );
}

function Row({
  hour,
  weekStart,
  bookingsBySlot,
  blockedFollowupSlots,
  onAddNew,
}: {
  hour: number;
  weekStart: Date;
  bookingsBySlot: Map<string, BookingDTO[]>;
  blockedFollowupSlots: Map<string, BookingDTO>;
  onAddNew: (iso: string) => void;
}) {
  return (
    <>
      <div style={{ ...timeCell }}>{fmtHour(hour)}</div>
      {Array.from({ length: 7 }).map((_, dayIdx) => {
        const key = `${dayIdx}:${hour}`;
        return (
          <Slot
            key={dayIdx}
            dayIdx={dayIdx}
            hour={hour}
            weekStart={weekStart}
            items={bookingsBySlot.get(key) ?? []}
            blockedBy={blockedFollowupSlots.get(key) ?? null}
            onAddNew={onAddNew}
          />
        );
      })}
    </>
  );
}

function Slot({
  dayIdx,
  hour,
  weekStart,
  items,
  blockedBy,
  onAddNew,
}: {
  dayIdx: number;
  hour: number;
  weekStart: Date;
  items: BookingDTO[];
  blockedBy: BookingDTO | null;
  onAddNew: (iso: string) => void;
}) {
  const isBlocked = !!blockedBy && items.length === 0;
  const id = `slot:${dayIdx}:${hour}`;
  const { isOver, setNodeRef } = useDroppable({ id, disabled: isBlocked });
  const iso = slotISO(weekStart, dayIdx, hour);

  if (isBlocked) {
    return (
      <div
        ref={setNodeRef}
        title={`Blocked — ${blockedBy!.customerName} runs through this slot (job + travel buffer)`}
        style={{
          borderTop: "1px solid var(--border)",
          borderLeft: dayIdx === 0 ? "1px solid var(--border)" : "none",
          minHeight: 64,
          padding: 4,
          background: "repeating-linear-gradient(45deg, rgba(200,169,106,0.05) 0 6px, rgba(200,169,106,0.12) 6px 12px)",
          color: "var(--muted)",
          fontSize: 10,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          opacity: 0.7,
        }}
      >
        Reserved
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      onDoubleClick={() => onAddNew(iso)}
      style={{
        borderTop: "1px solid var(--border)",
        borderLeft: dayIdx === 0 ? "1px solid var(--border)" : "none",
        minHeight: 64,
        padding: 4,
        background: isOver ? "rgba(200,169,106,0.18)" : "transparent",
        transition: "background 0.12s ease",
        position: "relative",
      }}
    >
      {items.map((b) => <BookingCard key={b.id} b={b} />)}
    </div>
  );
}

function LeadCard({ lead }: { lead: LeadDTO }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `lead:${lead.id}` });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        ...cardStyle,
        opacity: isDragging ? 0.4 : 1,
        cursor: "grab",
        touchAction: "none",
      }}
    >
      <strong style={{ fontSize: 13 }}>{lead.name}</strong>
      <div className="muted" style={{ fontSize: 12 }}>{lead.phone}</div>
      {lead.service ? <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 2 }}>{lead.service}</div> : null}
    </div>
  );
}

function BookingCard({ b }: { b: BookingDTO }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `booking:${b.id}` });
  const [, startTransition] = useTransition();
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        background: "rgba(200,169,106,0.18)",
        border: "1px solid rgba(200,169,106,0.4)",
        borderRadius: 6,
        padding: "6px 8px",
        marginBottom: 4,
        opacity: isDragging ? 0.4 : 1,
        cursor: "grab",
        touchAction: "none",
        position: "relative",
      }}
    >
      <strong style={{ fontSize: 12, color: "var(--gold)" }}>{b.customerName}</strong>
      {b.serviceType ? <div style={{ fontSize: 11, color: "var(--accent)" }}>{b.serviceType}</div> : null}
      {b.location ? <div style={{ fontSize: 11, color: "var(--muted)" }}>{b.location}</div> : null}
      <button
        type="button"
        title="Delete booking"
        onClick={(e) => {
          e.stopPropagation();
          if (confirm(`Delete booking for ${b.customerName}?`)) {
            startTransition(() => { deleteBooking(b.id); });
          }
        }}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: 2,
          right: 2,
          background: "transparent",
          border: "none",
          color: "var(--muted)",
          cursor: "pointer",
          fontSize: 12,
          padding: "2px 4px",
          lineHeight: 1,
        }}
      >×</button>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--panel)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "10px 12px",
};

const headerCell: React.CSSProperties = {
  padding: "10px 8px",
  textAlign: "center",
  borderBottom: "1px solid var(--border)",
  background: "rgba(255,255,255,0.02)",
};

const timeCell: React.CSSProperties = {
  borderTop: "1px solid var(--border)",
  borderRight: "1px solid var(--border)",
  fontSize: 11,
  color: "var(--muted)",
  textAlign: "right",
  padding: "6px 8px",
};

const navBtn: React.CSSProperties = {
  background: "transparent",
  color: "var(--gold)",
  border: "1px solid var(--border)",
  fontSize: 12,
  padding: "6px 10px",
};
