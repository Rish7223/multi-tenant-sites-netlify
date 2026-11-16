import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { getBearer, sha256 } from "../../lib/auth";
import { reply } from "../../lib/http";

export default async (req: Request) => {
  if (req.method !== "POST")
    return reply(
      405,
      { success: false, message: "Method not allowed" },
      { Allow: "POST" },
    );

  const token = getBearer(req);
  if (!token) return reply(401, { success: false, message: "Unauthorized" });

  try {
    const db = getDatabase();
    await db.sql`
      UPDATE admin_sessions SET revoked_at = now()
      WHERE token_hash = ${sha256(token).toString("hex")} AND revoked_at IS NULL`;
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("logout failed", (err as Error).message);
    return reply(500, { success: false, message: "Logout failed" });
  }
};

export const config: Config = { path: "/api/auth/logout" };
