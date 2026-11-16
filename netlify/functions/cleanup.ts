import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";

export default async () => {
  const db = getDatabase();
  await db.sql`DELETE FROM admin_sessions WHERE expires_at < now() - interval '1 day'`;
  await db.sql`DELETE FROM login_attempts WHERE created_at < now() - interval '1 day'`;
};

export const config: Config = { schedule: "@daily" };
