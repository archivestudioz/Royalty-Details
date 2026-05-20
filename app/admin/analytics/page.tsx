import { db, DEV_NO_DB } from "@/lib/db";
import { submissions } from "@/lib/schema";
import { gte, sql, isNotNull, and } from "drizzle-orm";
import { devMockDailyRows, devMockSourceRows, devMockRevenueRows } from "./devMock";
import {
  SubmissionsPanel,
  RevenuePanel,
  DailyChartPanel,
  type DailyEntry,
} from "./AnalyticsPanels";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
const HORIZON_DAYS = 150;

function startOfDayUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function dateKey(d: Date) {
  return startOfDayUTC(d).toISOString().slice(0, 10);
}

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function AnalyticsPage() {
  const now = new Date();
  const since = new Date(now.getTime() - HORIZON_DAYS * DAY_MS);

  const rows = DEV_NO_DB
    ? devMockDailyRows(now)
    : await db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${submissions.createdAt}), 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
          service: submissions.service,
        })
        .from(submissions)
        .where(gte(submissions.createdAt, since))
        .groupBy(sql`date_trunc('day', ${submissions.createdAt})`, submissions.service);

  const byDay = new Map<string, number>();
  const byService = new Map<string, number>();
  for (const r of rows) {
    byDay.set(r.day, (byDay.get(r.day) ?? 0) + r.count);
    const s = r.service ?? "Unspecified";
    byService.set(s, (byService.get(s) ?? 0) + r.count);
  }

  const services = [...byService.entries()].sort((a, b) => b[1] - a[1]);

  const sourceRows = DEV_NO_DB
    ? devMockSourceRows()
    : await db
        .select({
          utmSource: submissions.utmSource,
          referrer: submissions.referrer,
          count: sql<number>`count(*)::int`,
        })
        .from(submissions)
        .where(gte(submissions.createdAt, since))
        .groupBy(submissions.utmSource, submissions.referrer);

  const bySource = new Map<string, number>();
  for (const r of sourceRows) {
    const label = classifySource(r.utmSource, r.referrer);
    bySource.set(label, (bySource.get(label) ?? 0) + r.count);
  }
  const sources = [...bySource.entries()].sort((a, b) => b[1] - a[1]);

  const totalAll = [...byDay.values()].reduce((s, v) => s + v, 0);

  const revenueRows = DEV_NO_DB
    ? devMockRevenueRows(now)
    : await db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${submissions.createdAt}), 'YYYY-MM-DD')`,
          totalCents: sql<number>`coalesce(sum(${submissions.amountCents}), 0)::int`,
          jobs: sql<number>`count(${submissions.amountCents})::int`,
          service: submissions.service,
        })
        .from(submissions)
        .where(and(gte(submissions.createdAt, since), isNotNull(submissions.amountCents)))
        .groupBy(sql`date_trunc('day', ${submissions.createdAt})`, submissions.service);

  const revenueByDay = new Map<string, number>();
  const jobsByDay = new Map<string, number>();
  const revenueByService = new Map<string, number>();
  let totalCents = 0;
  for (const r of revenueRows) {
    revenueByDay.set(r.day, (revenueByDay.get(r.day) ?? 0) + r.totalCents);
    jobsByDay.set(r.day, (jobsByDay.get(r.day) ?? 0) + r.jobs);
    const s = r.service ?? "Unspecified";
    revenueByService.set(s, (revenueByService.get(s) ?? 0) + r.totalCents);
    totalCents += r.totalCents;
  }
  const revenueServices = [...revenueByService.entries()].sort((a, b) => b[1] - a[1]);

  const series: DailyEntry[] = [];
  for (let i = HORIZON_DAYS - 1; i >= 0; i--) {
    const d = startOfDayUTC(new Date(now.getTime() - i * DAY_MS));
    const key = dateKey(d);
    series.push({
      key,
      dateISO: d.toISOString(),
      count: byDay.get(key) ?? 0,
      revenueCents: revenueByDay.get(key) ?? 0,
      jobs: jobsByDay.get(key) ?? 0,
    });
  }

  return (
    <main className="container">
      <div className="header">
        <div>
          <h1>Analytics</h1>
          <div className="muted" style={{ fontSize: 13 }}>
            Pick a time range for each metric.
          </div>
        </div>
      </div>

      <div className="analytic-panels-grid">
        <SubmissionsPanel series={series} />
        <RevenuePanel series={series} />
      </div>

      <DailyChartPanel series={series} />

      <section className="card" style={{ padding: 24, marginTop: 14 }}>
        <strong style={{ letterSpacing: "0.02em", display: "block", marginBottom: 14 }}>
          By lead source
        </strong>
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
        <strong style={{ letterSpacing: "0.02em", display: "block", marginBottom: 14 }}>
          By service — submissions
        </strong>
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

      <section className="card" style={{ padding: 24, marginTop: 14 }}>
        <strong style={{ letterSpacing: "0.02em", display: "block", marginBottom: 14 }}>
          By service — revenue
        </strong>
        {revenueServices.length === 0 ? (
          <div className="muted" style={{ fontSize: 14 }}>
            No service amounts logged yet. Add a Service amount on a submission to start tracking revenue.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {revenueServices.map(([name, cents]) => {
              const pct = totalCents > 0 ? Math.round((cents / totalCents) * 100) : 0;
              return (
                <div key={name}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span>{name}</span>
                    <span className="muted">{formatUsd(cents)} · {pct}%</span>
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
