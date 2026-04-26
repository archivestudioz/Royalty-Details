import { db } from "@/lib/db";
import { submissions } from "@/lib/schema";
import { gte, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDayUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function dateKey(d: Date) {
  return startOfDayUTC(d).toISOString().slice(0, 10);
}

function shortDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

export default async function AnalyticsPage() {
  const now = new Date();
  const since90 = new Date(now.getTime() - 90 * DAY_MS);

  const rows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${submissions.createdAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
      service: submissions.service,
    })
    .from(submissions)
    .where(gte(submissions.createdAt, since90))
    .groupBy(sql`date_trunc('day', ${submissions.createdAt})`, submissions.service);

  const byDay = new Map<string, number>();
  const byService = new Map<string, number>();
  for (const r of rows) {
    byDay.set(r.day, (byDay.get(r.day) ?? 0) + r.count);
    const s = r.service ?? "Unspecified";
    byService.set(s, (byService.get(s) ?? 0) + r.count);
  }

  const sumSince = (days: number) => {
    const cutoff = new Date(now.getTime() - days * DAY_MS);
    let total = 0;
    for (const [k, v] of byDay) {
      if (new Date(`${k}T00:00:00Z`) >= cutoff) total += v;
    }
    return total;
  };

  const last30 = sumSince(30);
  const last60 = sumSince(60);
  const last90 = sumSince(90);

  const dailySeries: { date: Date; key: string; count: number }[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = startOfDayUTC(new Date(now.getTime() - i * DAY_MS));
    const key = dateKey(d);
    dailySeries.push({ date: d, key, count: byDay.get(key) ?? 0 });
  }
  const maxCount = Math.max(1, ...dailySeries.map((d) => d.count));

  const services = [...byService.entries()].sort((a, b) => b[1] - a[1]);

  const sourceRows = await db
    .select({
      utmSource: submissions.utmSource,
      referrer: submissions.referrer,
      count: sql<number>`count(*)::int`,
    })
    .from(submissions)
    .where(gte(submissions.createdAt, since90))
    .groupBy(submissions.utmSource, submissions.referrer);

  const bySource = new Map<string, number>();
  for (const r of sourceRows) {
    const label = classifySource(r.utmSource, r.referrer);
    bySource.set(label, (bySource.get(label) ?? 0) + r.count);
  }
  const sources = [...bySource.entries()].sort((a, b) => b[1] - a[1]);

  const totalAll = sumSince(90);
  const avgPerDay = (totalAll / 90).toFixed(1);

  return (
    <main className="container">
      <div className="header">
        <div>
          <h1>Analytics</h1>
          <div className="muted" style={{ fontSize: 13 }}>Form submissions over the last 90 days</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="Last 30 days" value={last30} />
        <StatCard label="Last 60 days" value={last60} />
        <StatCard label="Last 90 days" value={last90} />
        <StatCard label="Avg / day (90d)" value={avgPerDay} />
      </div>

      <section className="card" style={{ padding: 24 }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
          <strong style={{ letterSpacing: "0.02em" }}>Daily submissions — last 90 days</strong>
          <span className="muted" style={{ fontSize: 12 }}>peak: {maxCount}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 180, paddingTop: 6 }}>
          {dailySeries.map((d) => {
            const h = d.count === 0 ? 2 : Math.max(4, Math.round((d.count / maxCount) * 170));
            return (
              <div
                key={d.key}
                title={`${shortDate(d.date)}: ${d.count} submission${d.count === 1 ? "" : "s"}`}
                style={{
                  flex: 1,
                  height: h,
                  background: d.count > 0 ? "var(--gold)" : "var(--border)",
                  borderRadius: 2,
                  opacity: d.count > 0 ? 0.85 : 0.4,
                }}
              />
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--muted)" }}>
          <span>{shortDate(dailySeries[0].date)}</span>
          <span>{shortDate(dailySeries[Math.floor(dailySeries.length / 2)].date)}</span>
          <span>{shortDate(dailySeries[dailySeries.length - 1].date)}</span>
        </div>
      </section>

      <section className="card" style={{ padding: 24, marginTop: 14 }}>
        <strong style={{ letterSpacing: "0.02em", display: "block", marginBottom: 14 }}>By lead source (last 90 days)</strong>
        {sources.length === 0 ? (
          <div className="muted" style={{ fontSize: 14 }}>No submissions yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sources.map(([name, count]) => {
              const pct = totalAll > 0 ? Math.round((count / totalAll) * 100) : 0;
              return (
                <div key={name}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ textTransform: "capitalize" }}>{name}</span>
                    <span className="muted">{count} · {pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "var(--gold)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="card" style={{ padding: 24, marginTop: 14 }}>
        <strong style={{ letterSpacing: "0.02em", display: "block", marginBottom: 14 }}>By service (last 90 days)</strong>
        {services.length === 0 ? (
          <div className="muted" style={{ fontSize: 14 }}>No submissions yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {services.map(([name, count]) => {
              const pct = totalAll > 0 ? Math.round((count / totalAll) * 100) : 0;
              return (
                <div key={name}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span>{name}</span>
                    <span className="muted">{count} · {pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "var(--gold)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function classifySource(utmSource: string | null, referrer: string | null): string {
  if (utmSource) return utmSource.toLowerCase();
  if (!referrer) return "Direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host.includes("google")) return "google";
    if (host.includes("bing")) return "bing";
    if (host.includes("instagram")) return "instagram";
    if (host.includes("facebook") || host.includes("fb.")) return "facebook";
    if (host.includes("tiktok")) return "tiktok";
    if (host.includes("youtube") || host.includes("youtu.be")) return "youtube";
    if (host.includes("twitter") || host.includes("x.com")) return "twitter";
    if (host.includes("yelp")) return "yelp";
    return host;
  } catch {
    return "Other";
  }
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="field-label">{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "var(--gold)", marginTop: 4 }}>{value}</div>
    </div>
  );
}
