"use server";

import { redirect } from "next/navigation";
import { createGateSession } from "@/lib/session";

export async function enterSite(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  const expected = process.env.SITE_PASSWORD;
  if (!expected) {
    redirect(`/enter?error=config&next=${encodeURIComponent(next)}`);
  }

  if (password !== expected) {
    redirect(`/enter?error=invalid&next=${encodeURIComponent(next)}`);
  }

  await createGateSession();
  redirect(next.startsWith("/") ? next : "/");
}
