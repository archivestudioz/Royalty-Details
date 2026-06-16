import Link from "next/link";
import { signOut } from "../actions/auth";
import { readSession } from "@/lib/session";
import { AdminSidebarLink } from "./AdminSidebarLink";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand-block">
          <div className="admin-brand">
            ROYALTY <span className="admin-brand-alt">DETAILS</span>
          </div>
          <div className="admin-tag">Admin</div>
        </Link>

        <nav className="admin-nav">
          <AdminSidebarLink href="/admin/analytics" label="Analytics" />
          <AdminSidebarLink href="/admin/schedule" label="Schedule" />
          <AdminSidebarLink href="/admin/submissions" label="Submissions" />
          <AdminSidebarLink href="/admin/clients" label="Clients" />
        </nav>

        <div className="admin-user">
          {session?.email ? <div className="admin-user-email">{session.email}</div> : null}
          <form action={signOut}>
            <button type="submit" className="admin-signout">Sign out</button>
          </form>
        </div>
      </aside>

      <div className="admin-content">{children}</div>
    </div>
  );
}
