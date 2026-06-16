"use client";

import { useState, useTransition } from "react";
import { deleteSubmission, updateSubmissionAmount } from "../actions/submissions";
import type { Submission } from "@/lib/schema";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function centsToInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(/\.00$/, "");
}

function inputToCents(raw: string): number | null {
  const trimmed = raw.trim().replace(/^\$/, "").replace(/,/g, "");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function SubmissionsList({ rows }: { rows: Submission[] }) {
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const visible = rows.filter((r) => !removed.has(r.id));

  if (visible.length === 0) {
    return (
      <div className="empty">No submissions yet. They&apos;ll appear here once the contact form is used.</div>
    );
  }

  return (
    <>
      {visible.map((r) => (
        <SubmissionCard
          key={r.id}
          row={r}
          onRemoved={() => setRemoved((prev) => new Set(prev).add(r.id))}
        />
      ))}
    </>
  );
}

function SubmissionCard({ row, onRemoved }: { row: Submission; onRemoved: () => void }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [amount, setAmount] = useState(centsToInput(row.amountCents));
  const [savedAmount, setSavedAmount] = useState(row.amountCents ?? null);
  const [amountSaving, setAmountSaving] = useState(false);

  function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      try {
        await deleteSubmission(row.id);
        onRemoved();
      } catch {
        setConfirming(false);
      }
    });
  }

  function commitAmount() {
    const cents = inputToCents(amount);
    if (cents === savedAmount) return;
    setAmountSaving(true);
    updateSubmissionAmount(row.id, cents)
      .then(() => {
        setSavedAmount(cents);
        setAmount(centsToInput(cents));
      })
      .catch(() => {
        setAmount(centsToInput(savedAmount));
      })
      .finally(() => setAmountSaving(false));
  }

  return (
    <article className="card" style={{ opacity: pending ? 0.5 : 1, transition: "opacity 0.15s" }}>
      <div className="submission-header">
        <div>
          <strong>{row.name}</strong>{" "}
          {row.service ? <span className="tag">{row.service}</span> : null}
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            {formatDate(new Date(row.createdAt))}
          </div>
        </div>
        <div className="submission-actions">
          {confirming ? (
            <>
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="submission-btn submission-btn--danger"
              >
                {pending ? "Removing…" : "Confirm delete"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={pending}
                className="submission-btn"
              >
                Cancel
              </button>
            </>
          ) : (
            <button type="button" onClick={handleDelete} className="submission-btn">
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="submission-amount-row">
        <div className="field-label">Service amount</div>
        <div className="submission-amount-input-wrap">
          <span className="submission-amount-prefix">$</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={commitAmount}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="submission-amount-input"
            disabled={amountSaving}
          />
          {amountSaving ? <span className="submission-amount-status">Saving…</span> : null}
        </div>
      </div>

      <div className="submission-fields">
        <div>
          <div className="field-label">Email</div>
          <div className="submission-value">
            <a href={`mailto:${row.email}`}>{row.email}</a>
          </div>
        </div>
        <div>
          <div className="field-label">Phone</div>
          <div className="submission-value">
            <a href={`tel:${row.phone}`}>{row.phone}</a>
          </div>
        </div>
        <div>
          <div className="field-label">Vehicle</div>
          <div className="submission-value">{row.vehicle ?? <span className="muted">—</span>}</div>
        </div>
      </div>

      {row.message ? <pre className="message">{row.message}</pre> : null}
    </article>
  );
}
