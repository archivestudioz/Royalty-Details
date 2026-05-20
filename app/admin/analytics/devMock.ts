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

  for (let i = 0; i < 90; i++) {
    const d = new Date(now.getTime() - i * DAY_MS);
    const dayKey = d.toISOString().slice(0, 10);
    const dayOfWeek = d.getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const recency = 1 + (90 - i) / 90;
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
