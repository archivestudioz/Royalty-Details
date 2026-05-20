"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, DEV_NO_DB } from "@/lib/db";
import { submissions } from "@/lib/schema";
import { readSession } from "@/lib/session";

export async function deleteSubmission(id: number) {
  const session = await readSession();
  if (!session) throw new Error("Not authenticated");

  if (!DEV_NO_DB) {
    await db.delete(submissions).where(eq(submissions.id, id));
  }

  revalidatePath("/admin/submissions");
}
