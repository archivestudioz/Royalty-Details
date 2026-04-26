"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminSidebarLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      style={{
        display: "block",
        padding: "10px 12px",
        borderRadius: 8,
        fontSize: 13,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontWeight: 600,
        background: active ? "rgba(200,169,106,0.12)" : "transparent",
        color: active ? "var(--gold)" : "var(--muted)",
        border: active ? "1px solid rgba(200,169,106,0.3)" : "1px solid transparent",
        textDecoration: "none",
      }}
    >
      {label}
    </Link>
  );
}
