import { db, DEV_NO_DB } from "@/lib/db";
import { clients } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { devMockClients } from "./devMock";
import { ClientsManager } from "./ClientsManager";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const rows = DEV_NO_DB
    ? devMockClients()
    : await db.select().from(clients).orderBy(desc(clients.createdAt)).limit(500);

  return (
    <main className="container">
      <div className="header">
        <div>
          <h1>Clients</h1>
          <div className="muted" style={{ fontSize: 13 }}>
            {rows.length} retainer client{rows.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      <ClientsManager clients={rows} />
    </main>
  );
}
