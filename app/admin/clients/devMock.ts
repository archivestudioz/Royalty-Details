// Dev-only mock data — only used when DEV_NO_DB is true.

import type { Client } from "@/lib/schema";

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

export function devMockClients(): Client[] {
  return [
    { id: 1, name: "Anthony Russo", phone: "551-555-0190", email: "anthony.russo@example.com", createdAt: daysAgo(120) },
    { id: 2, name: "Bergen Auto Group", phone: "201-555-0132", email: "fleet@bergenauto.example.com", createdAt: daysAgo(86) },
    { id: 3, name: "Tina Marshall", phone: "973-555-0178", email: "tina.m@example.com", createdAt: daysAgo(41) },
    { id: 4, name: "Carlos Mendez", phone: "551-555-0166", email: "carlos@example.com", createdAt: daysAgo(12) },
  ];
}
