"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminSidebarLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link href={href} className={active ? "admin-link admin-link--active" : "admin-link"}>
      {label}
    </Link>
  );
}
