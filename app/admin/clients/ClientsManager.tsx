"use client";

import { useState, useTransition } from "react";
import { createClient, deleteClient } from "../actions/clients";
import type { Client } from "@/lib/schema";

export function ClientsManager({ clients }: { clients: Client[] }) {
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [optimistic, setOptimistic] = useState<Client[]>([]);
  const visible = [...optimistic, ...clients].filter((c) => !removed.has(c.id));

  return (
    <>
      <AddClientForm
        onAdded={(c) => setOptimistic((prev) => [c, ...prev])}
      />

      {visible.length === 0 ? (
        <div className="empty">No retainer clients yet. Add your first one above.</div>
      ) : (
        visible.map((c) => (
          <ClientCard
            key={c.id}
            client={c}
            onRemoved={() => setRemoved((prev) => new Set(prev).add(c.id))}
          />
        ))
      )}
    </>
  );
}

function AddClientForm({ onAdded }: { onAdded: (c: Client) => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="card"
      action={(fd) => {
        setError(null);
        const name = String(fd.get("name") ?? "").trim();
        const phone = String(fd.get("phone") ?? "").trim();
        const email = String(fd.get("email") ?? "").trim();
        if (!name) {
          setError("Name is required");
          return;
        }
        startTransition(async () => {
          try {
            await createClient({ name, phone: phone || undefined, email: email || undefined });
            onAdded({
              id: -Date.now(),
              name,
              phone: phone || null,
              email: email || null,
              createdAt: new Date(),
            });
            (document.getElementById("add-client-form") as HTMLFormElement | null)?.reset();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add client");
          }
        });
      }}
      id="add-client-form"
    >
      <div className="field-label" style={{ marginBottom: 10, fontSize: 12 }}>Add retainer client</div>
      <div className="client-form-row">
        <input name="name" placeholder="Name *" className="booking-input" required />
        <input name="phone" type="tel" placeholder="Phone" className="booking-input" />
        <input name="email" type="email" placeholder="Email" className="booking-input" />
        <button type="submit" disabled={pending} className="btn client-add-btn">
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
      {error ? <div style={{ color: "#ff8a8a", fontSize: 13, marginTop: 8 }}>{error}</div> : null}
    </form>
  );
}

function ClientCard({ client, onRemoved }: { client: Client; onRemoved: () => void }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      try {
        if (client.id > 0) await deleteClient(client.id);
        onRemoved();
      } catch {
        setConfirming(false);
      }
    });
  }

  return (
    <article className="card" style={{ opacity: pending ? 0.5 : 1, transition: "opacity 0.15s" }}>
      <div className="submission-header">
        <div>
          <strong>{client.name}</strong>
        </div>
        <div className="submission-actions">
          {confirming ? (
            <>
              <button type="button" onClick={handleDelete} disabled={pending} className="submission-btn submission-btn--danger">
                {pending ? "Removing…" : "Confirm delete"}
              </button>
              <button type="button" onClick={() => setConfirming(false)} disabled={pending} className="submission-btn">
                Cancel
              </button>
            </>
          ) : (
            <button type="button" onClick={handleDelete} className="submission-btn">Delete</button>
          )}
        </div>
      </div>

      <div className="submission-fields">
        <div>
          <div className="field-label">Phone</div>
          <div className="submission-value">
            {client.phone ? <a href={`tel:${client.phone}`}>{client.phone}</a> : <span className="muted">—</span>}
          </div>
        </div>
        <div>
          <div className="field-label">Email</div>
          <div className="submission-value">
            {client.email ? <a href={`mailto:${client.email}`}>{client.email}</a> : <span className="muted">—</span>}
          </div>
        </div>
      </div>
    </article>
  );
}
