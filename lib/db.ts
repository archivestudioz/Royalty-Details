import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export const DEV_NO_DB =
  !process.env.DATABASE_URL && process.env.NODE_ENV !== "production";

if (!process.env.DATABASE_URL && !DEV_NO_DB) {
  throw new Error("DATABASE_URL is not set");
}

// In dev without a DATABASE_URL, every query chain resolves to []. Lets the
// admin UI render with empty data so layout/UX can be debugged.
function makeStubDb(): ReturnType<typeof drizzle> {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === "then") return (resolve: (v: unknown[]) => void) => resolve([]);
      return new Proxy(() => undefined, handler);
    },
    apply() {
      return new Proxy(() => undefined, handler);
    },
  };
  return new Proxy(() => undefined, handler) as unknown as ReturnType<typeof drizzle>;
}

export const db = DEV_NO_DB
  ? makeStubDb()
  : drizzle(neon(process.env.DATABASE_URL!), { schema });
