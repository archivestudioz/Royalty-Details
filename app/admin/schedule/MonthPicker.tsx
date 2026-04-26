"use client";

import { useRouter } from "next/navigation";

export function MonthPicker({ weekStartISO }: { weekStartISO: string }) {
  const router = useRouter();
  const d = new Date(weekStartISO);
  const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  return (
    <input
      type="month"
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        if (!v) return;
        const [y, m] = v.split("-").map(Number);
        const target = new Date(y, m - 1, 1);
        const iso = target.toISOString().slice(0, 10);
        router.push(`/admin/schedule?week=${iso}`);
      }}
      style={{
        background: "transparent",
        color: "var(--gold)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: "6px 10px",
        fontSize: 12,
        fontFamily: "inherit",
        colorScheme: "dark",
      }}
    />
  );
}
