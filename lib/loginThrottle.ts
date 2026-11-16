import { getDatabase } from "@netlify/database";

const MAX_FAILURES = 5;

export async function isLocked(email: string): Promise<boolean> {
  const db = getDatabase();
  const [row] = await db.sql<{ n: number }>`
    SELECT count(*)::int AS n FROM login_attempts
    WHERE email = ${email} AND created_at > now() - interval '15 minutes'`;
  return row.n >= MAX_FAILURES;
}

export async function recordFailure(email: string) {
  await getDatabase().sql`INSERT INTO login_attempts (email) VALUES (${email})`;
}

export async function clearFailures(email: string) {
  await getDatabase().sql`DELETE FROM login_attempts WHERE email = ${email}`;
}
