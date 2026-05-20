// Dev-only mock data — only used when DEV_NO_DB is true.

import type { Submission } from "@/lib/schema";

function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * 60 * 60 * 1000);
}

export function devMockSubmissions(): Submission[] {
  return [
    {
      id: 1,
      name: "Aaliyah Carter",
      email: "aaliyah.c@example.com",
      phone: "551-555-0177",
      vehicle: "2021 Audi A4 — Mythos Black",
      service: "Paint Correction",
      message:
        "Some swirl marks on the hood and a few light scratches on the driver door. Hoping to get it ready before a wedding next month.",
      source: "contact",
      referrer: "https://www.google.com/",
      utmSource: "google",
      utmMedium: "organic",
      utmCampaign: null,
      landingPath: "/services/paint-correction",
      ipAddress: null,
      userAgent: null,
      createdAt: hoursAgo(2),
    },
    {
      id: 2,
      name: "Derek Owens",
      email: "derek@example.com",
      phone: "973-555-0163",
      vehicle: "Ford Transit (fleet)",
      service: "Maintenance Wash",
      message: "Weekly wash for fleet vehicle. Prefer Friday mornings.",
      source: "contact",
      referrer: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      landingPath: "/",
      ipAddress: null,
      userAgent: null,
      createdAt: hoursAgo(20),
    },
    {
      id: 3,
      name: "Sofia Ramirez",
      email: "sofia.r@example.com",
      phone: "201-555-0145",
      vehicle: "2023 Tesla Model Y",
      service: "Ceramic Coating",
      message:
        "Looking at 5-year ceramic. Can you quote interior + exterior? Garage-kept, 8k miles.",
      source: "contact",
      referrer: "https://www.instagram.com/",
      utmSource: "instagram",
      utmMedium: "social",
      utmCampaign: "spring-ceramic",
      landingPath: "/services/ceramic-coating",
      ipAddress: null,
      userAgent: null,
      createdAt: hoursAgo(54),
    },
    {
      id: 4,
      name: "Marcus Reed",
      email: "marcus@example.com",
      phone: "551-555-0114",
      vehicle: null,
      service: "Full Detail",
      message: "Need a full detail before listing the car for sale.",
      source: "contact",
      referrer: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      landingPath: "/",
      ipAddress: null,
      userAgent: null,
      createdAt: hoursAgo(96),
    },
  ];
}
