import { getDatabase } from "@netlify/database";
import { getBearer, sha256 } from "./auth";

export type AdminContext = { adminId: string };

export async function authenticateAdmin(
  req: Request,
): Promise<AdminContext | null> {
  const token = getBearer(req);
  if (!token || !token.startsWith("adm_")) return null; // cheap reject, no DB call

  const db = getDatabase();
  const [row] = await db.sql<{ admin_id: string }>`
    SELECT admin_id FROM admin_sessions
    WHERE token_hash = ${sha256(token).toString("hex")}
      AND revoked_at IS NULL
      AND expires_at > now()`;

  return row ? { adminId: row.admin_id } : null;
}
