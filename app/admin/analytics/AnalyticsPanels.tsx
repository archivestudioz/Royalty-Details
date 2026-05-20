"use client";

import { useState } from "react";

const PERIODS = [30, 90, 120, 150] as const;
type Period = (typeof PERIODS)[number];

export type DailyEntry = {
  key: string;
  dateISO: string;
  count: number;
  revenueCents: number;
  jobs: number;
};

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function shortDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso));
}

function PeriodSelect({ value, onChange }: { value: Period; onChange: (n: Period) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value) as Period)}
      className="period-select"
      aria-label="Time range"
    >
      {PERIODS.map((p) => (
        <option key={p} value={p}>
          Last {p} days
        </option>
      ))}
    </select>
  );
}

function PanelHeader({
  title,
  period,
  setPeriod,
}: {
  title: string;
  period: Period;
  setPeriod: (n: Period) => void;
}) {
  return (
    <div className="analytic-panel-header">
      <strong className="analytic-panel-title">{title}</strong>
      <PeriodSelect value={period} onChange={setPeriod} />
    </div>
  );
}

export function SubmissionsPanel({ series }: { series: DailyEntry[] }) {
  const [period, setPeriod] = useState<Period>(30);
  const visible = series.slice(-period);
  const total = visible.reduce((s, d) => s + d.count, 0);
  const avgPerDay = (total / period).toFixed(1);

  return (
    <section className="card analytic-panel">
      <PanelHeader title="Submissions" period={period} setPeriod={setPeriod} />
      <div className="analytic-panel-value">{total.toLocaleString()}</div>
      <div className="analytic-panel-sub">Avg {avgPerDay} / day</div>
    </section>
  );
}

export function RevenuePanel({ series }: { series: DailyEntry[] }) {
  const [period, setPeriod] = useState<Period>(30);
  const visible = series.slice(-period);
  const totalCents = visible.reduce((s, d) => s + d.revenueCents, 0);
  const totalJobs = visible.reduce((s, d) => s + d.jobs, 0);
  const avgPerJob = totalJobs > 0 ? Math.round(totalCents / totalJobs) : 0;

  return (
    <section className="card analytic-panel">
      <PanelHeader title="Revenue" period={period} setPeriod={setPeriod} />
      <div className="analytic-panel-value">{formatUsd(totalCents)}</div>
      <div className="analytic-panel-sub">
        {totalJobs > 0
          ? `Avg ${formatUsd(avgPerJob)} / job · ${totalJobs} job${totalJobs === 1 ? "" : "s"}`
          : "No service amounts logged in this period"}
      </div>
    </section>
  );
}

export function DailyChartPanel({ series }: { series: DailyEntry[] }) {
  const [period, setPeriod] = useState<Period>(90);
  const visible = series.slice(-period);
  const maxCount = Math.max(1, ...visible.map((d) => d.count));

  return (
    <section className="card analytic-panel">
      <PanelHeader title="Daily submissions" period={period} setPeriod={setPeriod} />
      <div className="analytic-panel-sub" style={{ marginBottom: 12 }}>
        peak: {maxCount}
      </div>
      <div className="daily-chart">
        {visible.map((d) => {
          const h = d.count === 0 ? 2 : Math.max(4, Math.round((d.count / maxCount) * 170));
          return (
            <div
              key={d.key}
              title={`${shortDate(d.dateISO)}: ${d.count} submission${d.count === 1 ? "" : "s"}`}
              className={d.count > 0 ? "daily-chart-bar daily-chart-bar--filled" : "daily-chart-bar"}
              style={{ height: h }}
            />
          );
        })}
      </div>
      <div className="daily-chart-axis">
        <span>{shortDate(visible[0].dateISO)}</span>
        <span>{shortDate(visible[Math.floor(visible.length / 2)].dateISO)}</span>
        <span>{shortDate(visible[visible.length - 1].dateISO)}</span>
      </div>
    </section>
  );
}
