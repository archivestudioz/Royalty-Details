import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "rd_session";
const GATE_COOKIE = "rd_gate";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const GATE_TTL_SECONDS = 60 * 60 * 24 * 30;

function secret() {
  const s =
    process.env.SESSION_SECRET ||
    (process.env.NODE_ENV !== "production"
      ? "dev-only-insecure-session-secret-do-not-use-in-prod"
      : null);
  if (!s) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(s);
}

export type SessionPayload = {
  sub: string;
  email: string;
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret());

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function readSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}

export async function createGateSession() {
  const token = await new SignJWT({ gate: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${GATE_TTL_SECONDS}s`)
    .sign(secret());

  (await cookies()).set(GATE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GATE_TTL_SECONDS,
  });
}

export const SESSION_COOKIE = COOKIE_NAME;
export const GATE_COOKIE_NAME = GATE_COOKIE;
