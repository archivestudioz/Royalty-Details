// Dev-only mock data — only used when DEV_NO_DB is true.
// Lets the schedule page render with realistic-looking data without a database.

import { blockHours } from "@/lib/maps";

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function at(d: Date, hours: number) {
  const x = new Date(d);
  x.setHours(hours, 0, 0, 0);
  return x;
}

export function devMockBookings(weekStart: Date) {
  return [
    {
      id: 1,
      customerName: "Marcus Reed",
      phone: "551-555-0114",
      location: "120 River St, Hoboken NJ",
      serviceType: "Full Detail",
      startAtISO: at(addDays(weekStart, 0), 10).toISOString(),
      durationMin: 180,
      status: "scheduled",
      travelMinutes: 25,
      blockHours: blockHours(180, 25),
    },
    {
      id: 2,
      customerName: "Priya Shah",
      phone: "973-555-0182",
      location: "88 Maple Ave, Montclair NJ",
      serviceType: "Ceramic Coating",
      startAtISO: at(addDays(weekStart, 2), 9).toISOString(),
      durationMin: 360,
      status: "scheduled",
      travelMinutes: 35,
      blockHours: blockHours(360, 35),
    },
    {
      id: 3,
      customerName: "Jordan Liu",
      phone: "201-555-0149",
      location: "14 Spring Glen Rd, Hackensack NJ",
      serviceType: "Interior Detail",
      startAtISO: at(addDays(weekStart, 4), 13).toISOString(),
      durationMin: 120,
      status: "scheduled",
      travelMinutes: 15,
      blockHours: blockHours(120, 15),
    },
  ];
}

export function devMockUnscheduled() {
  const now = Date.now();
  return [
    {
      id: 101,
      name: "Aaliyah Carter",
      phone: "551-555-0177",
      email: "aaliyah.c@example.com",
      service: "Paint Correction",
      message: "Some swirl marks on the hood — black Audi A4, '21.",
      createdAtISO: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 102,
      name: "Derek Owens",
      phone: "973-555-0163",
      email: "derek@example.com",
      service: "Maintenance Wash",
      message: "Weekly wash for fleet vehicle. Prefer Friday mornings.",
      createdAtISO: new Date(now - 20 * 60 * 60 * 1000).toISOString(),
    },
  ];
}
