import Link from "next/link";
import { signOut } from "../actions/auth";

type Props = { active: "submissions" | "analytics"; email?: string };

export function AdminNav({ active, email }: Props) {
  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: isActive ? "rgba(200,169,106,0.12)" : "transparent",
    color: isActive ? "var(--gold)" : "var(--muted)",
    fontSize: 13,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    fontWeight: 600,
  });

  return (
    <div className="header">
      <div>
        <h1>Royalty Details</h1>
        <div className="muted" style={{ fontSize: 13 }}>
          Signed in as {email}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <Link href="/admin" style={tabStyle(active === "submissions")}>Submissions</Link>
        <Link href="/admin/analytics" style={tabStyle(active === "analytics")}>Analytics</Link>
        <form action={signOut}>
          <button type="submit" className="btn" style={{ background: "transparent", color: "var(--gold)", border: "1px solid var(--border)" }}>
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
