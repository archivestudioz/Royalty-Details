import Link from "next/link";
import { signOut } from "../actions/auth";
import { readSession } from "@/lib/session";
import { AdminSidebarLink } from "./AdminSidebarLink";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          borderRight: "1px solid var(--border)",
          background: "var(--panel)",
          padding: "28px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div>
          <Link href="/admin" style={{ color: "var(--gold)", fontWeight: 800, letterSpacing: "0.18em", fontSize: 14 }}>
            ROYALTY <span style={{ color: "var(--text)" }}>DETAILS</span>
          </Link>
          <div className="muted" style={{ fontSize: 11, marginTop: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Admin
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          <AdminSidebarLink href="/admin/analytics" label="Analytics" />
          <AdminSidebarLink href="/admin/submissions" label="Submissions" />
        </nav>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 8, wordBreak: "break-all" }}>
            {session?.email}
          </div>
          <form action={signOut}>
            <button
              type="submit"
              style={{
                width: "100%",
                background: "transparent",
                color: "var(--gold)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
