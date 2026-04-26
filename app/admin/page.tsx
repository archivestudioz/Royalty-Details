import { db } from "@/lib/db";
import { submissions } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { readSession } from "@/lib/session";
import { AdminNav } from "./AdminNav";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export default async function AdminPage() {
  const session = await readSession();
  const rows = await db.select().from(submissions).orderBy(desc(submissions.createdAt)).limit(200);

  return (
    <main className="container">
      <AdminNav active="submissions" email={session?.email} />

      <div className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
        {rows.length} most recent submission{rows.length === 1 ? "" : "s"}
      </div>

      {rows.length === 0 ? (
        <div className="empty">No submissions yet. They'll appear here once the contact form is used.</div>
      ) : (
        rows.map((r) => (
          <article key={r.id} className="card">
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <strong>{r.name}</strong>{" "}
                {r.service ? <span className="tag">{r.service}</span> : null}
              </div>
              <div className="muted" style={{ fontSize: 13 }}>{formatDate(new Date(r.createdAt))}</div>
            </div>

            <div className="row">
              <div style={{ flex: 1 }}>
                <div className="field-label">Email</div>
                <div><a href={`mailto:${r.email}`}>{r.email}</a></div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="field-label">Phone</div>
                <div><a href={`tel:${r.phone}`}>{r.phone}</a></div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="field-label">Vehicle</div>
                <div>{r.vehicle ?? <span className="muted">—</span>}</div>
              </div>
            </div>

            {r.message ? <pre className="message">{r.message}</pre> : null}
          </article>
        ))
      )}
    </main>
  );
}
