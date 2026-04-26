/**
 * Create or update an admin user.
 *
 * Usage:
 *   npm run user:create -- --email=you@example.com --password='secret' [--name='Owner']
 */
import bcrypt from "bcryptjs";
import { db } from "../lib/db";
import { users } from "../lib/schema";
import { eq } from "drizzle-orm";

function arg(name: string) {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const password = arg("password");
  const name = arg("name") ?? null;

  if (!email || !password) {
    console.error("Usage: npm run user:create -- --email=you@example.com --password='secret' [--name='Owner']");
    process.exit(1);
  }
  if (password.length < 10) {
    console.error("Password must be at least 10 characters.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    await db.update(users).set({ passwordHash, name: name ?? existing.name }).where(eq(users.id, existing.id));
    console.log(`Updated password for ${email}`);
  } else {
    await db.insert(users).values({ email, passwordHash, name });
    console.log(`Created user ${email}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
