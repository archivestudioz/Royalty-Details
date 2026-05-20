// Dev-only mock aggregation results — only used when DEV_NO_DB is true.
// Shapes match what drizzle returns from the real queries in page.tsx.

const SERVICES = [
  "Maintenance Wash",
  "Interior Detail",
  "Exterior Detail",
  "Full Detail",
  "Paint Correction",
  "Ceramic Coating",
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function devMockDailyRows(now: Date) {
  const rnd = seededRandom(42);
  const rows: { day: string; count: number; service: string | null }[] = [];

  for (let i = 0; i < 150; i++) {
    const d = new Date(now.getTime() - i * DAY_MS);
    const dayKey = d.toISOString().slice(0, 10);
    const dayOfWeek = d.getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const recency = 1 + (150 - i) / 150;
    const base = (isWeekend ? 2.5 : 1.4) * recency;
    const total = Math.max(0, Math.round(base + rnd() * 2.5 - 1));

    if (total === 0) continue;

    const slices = new Map<string | null, number>();
    for (let k = 0; k < total; k++) {
      const pick =
        rnd() < 0.18
          ? null
          : SERVICES[Math.floor(rnd() * SERVICES.length)];
      slices.set(pick, (slices.get(pick) ?? 0) + 1);
    }
    for (const [service, count] of slices) {
      rows.push({ day: dayKey, count, service });
    }
  }
  return rows;
}

// Per-service typical ticket sizes, in cents
const SERVICE_TICKETS: Record<string, number> = {
  "Maintenance Wash": 12000,
  "Interior Detail": 25000,
  "Exterior Detail": 22000,
  "Full Detail": 40000,
  "Paint Correction": 75000,
  "Ceramic Coating": 200000,
};

export function devMockRevenueRows(now: Date) {
  const rnd = seededRandom(73);
  const rows: { day: string; totalCents: number; jobs: number; service: string | null }[] = [];

  for (let i = 0; i < 150; i++) {
    const d = new Date(now.getTime() - i * DAY_MS);
    const dayKey = d.toISOString().slice(0, 10);
    const dayOfWeek = d.getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    // Only ~60% of leads turn into priced jobs
    const conversion = 0.45 + rnd() * 0.3;
    const baseJobs = (isWeekend ? 2 : 1) * conversion;
    const totalJobs = Math.max(0, Math.round(baseJobs + rnd() * 1.5 - 0.5));
    if (totalJobs === 0) continue;

    const buckets = new Map<string, { totalCents: number; jobs: number }>();
    for (let k = 0; k < totalJobs; k++) {
      const service = SERVICES[Math.floor(rnd() * SERVICES.length)];
      const ticket = SERVICE_TICKETS[service] ?? 20000;
      const variance = 1 + (rnd() - 0.5) * 0.3;
      const cents = Math.round(ticket * variance);
      const cur = buckets.get(service) ?? { totalCents: 0, jobs: 0 };
      cur.totalCents += cents;
      cur.jobs += 1;
      buckets.set(service, cur);
    }
    for (const [service, agg] of buckets) {
      rows.push({ day: dayKey, totalCents: agg.totalCents, jobs: agg.jobs, service });
    }
  }
  return rows;
}

export function devMockSourceRows() {
  return [
    { utmSource: "google", referrer: null, count: 38 },
    { utmSource: "instagram", referrer: null, count: 22 },
    { utmSource: null, referrer: "https://www.yelp.com/", count: 11 },
    { utmSource: "facebook", referrer: null, count: 9 },
    { utmSource: null, referrer: null, count: 14 },
    { utmSource: null, referrer: "https://www.google.com/", count: 6 },
    { utmSource: "tiktok", referrer: null, count: 4 },
  ];
}
