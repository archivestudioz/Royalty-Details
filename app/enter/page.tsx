import { enterSite } from "../actions/gate";

export const dynamic = "force-dynamic";

export default async function EnterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        padding: 24,
      }}
    >
      <form action={enterSite} style={{ width: "100%", maxWidth: 320, textAlign: "center" }}>
        <div style={{ fontSize: 18, marginBottom: 16 }}>Enter Password</div>

        <input type="hidden" name="next" value={params.next ?? "/"} />

        <input
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          style={{
            width: "100%",
            padding: "10px 12px",
            background: "#000",
            color: "#fff",
            border: "1px solid #fff",
            borderRadius: 0,
            fontSize: 15,
            outline: "none",
          }}
        />

        {params.error ? (
          <div style={{ marginTop: 12, fontSize: 13 }}>
            {params.error === "config" ? "Site password is not configured." : "Incorrect password."}
          </div>
        ) : null}
      </form>
    </main>
  );
}
