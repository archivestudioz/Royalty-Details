"use client";

import { useState, useTransition } from "react";
import { createBooking } from "../actions/bookings";

export function NewBookingForm({
  defaultStartISO,
  onClose,
}: {
  defaultStartISO: string;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const defaultLocal = toLocalDatetime(defaultStartISO);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
        padding: 16,
      }}
    >
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
        className="card"
        style={{ width: "100%", maxWidth: 460, padding: 24 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <strong style={{ fontSize: 16 }}>New booking</strong>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 18, cursor: "pointer" }}>×</button>
        </div>

        <Field label="Customer name *">
          <input name="customerName" required style={input} autoFocus />
        </Field>
        <Field label="Phone">
          <input name="phone" type="tel" style={input} />
        </Field>
        <Field label="Location / address">
          <input name="location" style={input} placeholder="123 Main St, Newark" />
        </Field>
        <Field label="Job type">
          <input name="serviceType" list="service-types" style={input} placeholder="e.g. Full Detail" />
          <datalist id="service-types">
            <option value="Maintenance Wash" />
            <option value="Interior Detail" />
            <option value="Exterior Detail" />
            <option value="Full Detail" />
            <option value="Paint Correction" />
            <option value="Ceramic Coating" />
          </datalist>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 10 }}>
          <Field label="Date & time">
            <input name="startAtLocal" type="datetime-local" defaultValue={defaultLocal} required style={input} />
          </Field>
          <Field label="Duration (min)">
            <input name="durationMin" type="number" defaultValue={60} min={15} step={15} required style={input} />
          </Field>
        </div>
        <Field label="Notes">
          <textarea name="notes" rows={2} style={{ ...input, resize: "vertical" }} />
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

const input: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "#0e0e12",
  color: "var(--text)",
  fontSize: 14,
  marginTop: 4,
};

function toLocalDatetime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
