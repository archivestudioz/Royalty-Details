"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { createSession, destroySession } from "@/lib/session";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!email || !password) {
    redirect(`/sign-in?error=invalid&next=${encodeURIComponent(next)}`);
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    redirect(`/sign-in?error=invalid&next=${encodeURIComponent(next)}`);
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    redirect(`/sign-in?error=invalid&next=${encodeURIComponent(next)}`);
  }

  await createSession({ sub: String(user.id), email: user.email });
  redirect(next.startsWith("/") ? next : "/admin");
}

export async function signOut() {
  await destroySession();
  redirect("/sign-in");
}
