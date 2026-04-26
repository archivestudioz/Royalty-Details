import { redirect } from "next/navigation";
import { signIn } from "../actions/auth";
import { readSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const session = await readSession();
  const params = await searchParams;
  if (session) redirect(params.next ?? "/admin");

  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: 24 }}>
      <form action={signIn} className="card" style={{ width: "100%", maxWidth: 380, padding: 28 }}>
        <h1 style={{ marginTop: 0, color: "var(--gold)", fontSize: 22 }}>Royalty Details</h1>
        <p className="muted" style={{ marginTop: 4, marginBottom: 22, fontSize: 14 }}>
          Sign in to view form submissions.
        </p>

        <input type="hidden" name="next" value={params.next ?? "/admin"} />

        <label style={{ display: "block", marginBottom: 12 }}>
          <div className="field-label">Email</div>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            autoCapitalize="off"
            style={inputStyle}
          />
        </label>

        <label style={{ display: "block", marginBottom: 18 }}>
          <div className="field-label">Password</div>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            style={inputStyle}
          />
        </label>

        {params.error ? (
          <div style={{ color: "#ff8a8a", fontSize: 13, marginBottom: 12 }}>
            {params.error === "invalid" ? "Email or password is incorrect." : "Sign-in failed."}
          </div>
        ) : null}

        <button type="submit" className="btn" style={{ width: "100%" }}>Sign in</button>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "#0e0e12",
  color: "var(--text)",
  fontSize: 15,
  marginTop: 4,
};
