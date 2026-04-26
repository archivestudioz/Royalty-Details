import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions } from "@/lib/schema";

const ALLOWED = (process.env.ALLOWED_ORIGIN ?? "").split(",").map((o) => o.trim()).filter(Boolean);

function corsHeaders(origin: string | null) {
  const allow = origin && (ALLOWED.length === 0 || ALLOWED.includes(origin)) ? origin : ALLOWED[0] ?? "*";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const vehicle = body.vehicle ? String(body.vehicle).trim() : null;
  const service = body.service ? String(body.service).trim() : null;
  const message = body.message ? String(body.message).trim() : null;

  if (!name || !email || !phone) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400, headers });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400, headers });
  }
  if (name.length > 200 || email.length > 200 || phone.length > 50 || (message?.length ?? 0) > 5000) {
    return NextResponse.json({ error: "Field too long" }, { status: 400, headers });
  }

  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;

  try {
    await db.insert(submissions).values({
      name, email, phone, vehicle, service, message,
      source: "contact", ipAddress, userAgent,
    });
  } catch (err) {
    console.error("[contact] insert failed", err);
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500, headers });
  }

  return NextResponse.json({ ok: true }, { status: 201, headers });
}
