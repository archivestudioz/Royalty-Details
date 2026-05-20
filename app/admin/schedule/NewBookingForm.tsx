"use client";

import { useState, useTransition } from "react";
import { createBooking } from "../actions/bookings";

const SERVICE_OPTIONS = [
  "Maintenance Wash",
  "Interior Detail",
  "Exterior Detail",
  "Full Detail",
  "Paint Correction",
  "Ceramic Coating",
];

export function NewBookingForm({
  defaultStartISO,
  onClose,
}: {
  defaultStartISO: string;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<string[]>([]);

  const defaultLocal = toLocalDatetime(defaultStartISO);

  function toggleService(name: string) {
    setServices((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  }

  return (
    <div onClick={onClose} className="booking-modal">
      <form
        onClick={(e) => e.stopPropagation()}
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            try {
              const startLocal = String(fd.get("startAtLocal") ?? "");
              const startISO = new Date(startLocal).toISOString();
              await createBooking({
                customerName: String(fd.get("customerName") ?? ""),
                phone: String(fd.get("phone") ?? "") || undefined,
                location: String(fd.get("location") ?? "") || undefined,
                serviceType: String(fd.get("serviceType") ?? "") || undefined,
                durationMin: Number(fd.get("durationMin") ?? 60),
                startAt: startISO,
                notes: String(fd.get("notes") ?? "") || undefined,
              });
              onClose();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to create booking");
            }
          });
        }}
        className="card booking-form"
      >
        <div className="booking-form-header">
          <strong style={{ fontSize: 16 }}>New booking</strong>
          <button type="button" onClick={onClose} className="booking-close" aria-label="Close">×</button>
        </div>

        <Field label="Customer name *">
          <input name="customerName" required className="booking-input" autoFocus />
        </Field>
        <Field label="Phone">
          <input name="phone" type="tel" className="booking-input" />
        </Field>
        <Field label="Location / address">
          <input name="location" className="booking-input" placeholder="123 Main St, Newark" />
        </Field>
        <Field label="Job type (select all that apply)">
          <div className="service-checklist">
            {SERVICE_OPTIONS.map((name) => {
              const checked = services.includes(name);
              return (
                <label key={name} className={checked ? "service-chip service-chip--on" : "service-chip"}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleService(name)}
                    className="service-chip-input"
                  />
                  <span>{name}</span>
                </label>
              );
            })}
          </div>
          <input type="hidden" name="serviceType" value={services.join(", ")} />
        </Field>
        <div className="booking-row">
          <Field label="Date & time">
            <input name="startAtLocal" type="datetime-local" defaultValue={defaultLocal} required className="booking-input" />
          </Field>
          <Field label="Duration (min)">
            <input name="durationMin" type="number" defaultValue={60} min={15} step={15} required className="booking-input" />
          </Field>
        </div>
        <Field label="Notes">
          <textarea name="notes" rows={2} className="booking-input booking-textarea" />
        </Field>

        {error ? <div style={{ color: "#ff8a8a", fontSize: 13, marginBottom: 10 }}>{error}</div> : null}

        <button type="submit" disabled={pending} className="btn" style={{ width: "100%", opacity: pending ? 0.7 : 1 }}>
          {pending ? "Saving…" : "Create booking"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <div className="field-label">{label}</div>
      {children}
    </label>
  );
}

function toLocalDatetime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
