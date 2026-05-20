import { db, DEV_NO_DB } from "@/lib/db";
import { submissions } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { devMockSubmissions } from "./devMock";
import { SubmissionsList } from "./SubmissionsList";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  const rows = DEV_NO_DB
    ? devMockSubmissions()
    : await db.select().from(submissions).orderBy(desc(submissions.createdAt)).limit(200);

  return (
    <main className="container">
      <div className="header">
        <div>
          <h1>Submissions</h1>
          <div className="muted" style={{ fontSize: 13 }}>
            {rows.length} most recent submission{rows.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      <SubmissionsList rows={rows} />
    </main>
  );
}
