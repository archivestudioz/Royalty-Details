"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, DEV_NO_DB } from "@/lib/db";
import { clients } from "@/lib/schema";
import { readSession } from "@/lib/session";

export async function createClient(input: { name: string; phone?: string; email?: string }) {
  const session = await readSession();
  if (!session) throw new Error("Not authenticated");

  const name = input.name.trim();
  if (!name) throw new Error("Client name required");

  if (!DEV_NO_DB) {
    await db.insert(clients).values({
      name,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
    });
  }

  revalidatePath("/admin/clients");
}

export async function deleteClient(id: number) {
  const session = await readSession();
  if (!session) throw new Error("Not authenticated");

  if (!DEV_NO_DB) {
    await db.delete(clients).where(eq(clients.id, id));
  }

  revalidatePath("/admin/clients");
}
