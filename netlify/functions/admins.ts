import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { z } from "zod";
import { getBearer, safeEqual } from "../../lib/auth";
import { hashPassword } from "../../lib/password";
import { reply, readJson, validationFailed } from "../../lib/http";

const AdminInput = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z
      .string()
      .min(12, "Password must be at least 12 characters")
      .max(128),
  })
  .strict();

export default async (req: Request) => {
  if (req.method !== "POST")
    return reply(
      405,
      { success: false, message: "Method not allowed" },
      { Allow: "POST" },
    );

  const masterKey = process.env.ADMIN_BOOTSTRAP_TOKEN;
  if (!masterKey) return reply(404, { success: false, message: "Not found" }); // endpoint switched off

  const token = getBearer(req);
  if (!token || !safeEqual(token, masterKey)) {
    return reply(401, { success: false, message: "Unauthorized" });
  }

  const read = await readJson(req, 2_000);
  if (!read.ok) return read.res;

  const parsed = AdminInput.safeParse(read.body);
  if (!parsed.success) return validationFailed(parsed.error.issues);

  const { email, password } = parsed.data;

  try {
    const passwordHash = await hashPassword(password);
    const db = getDatabase();
    const rows = await db.sql<{ id: string }>`
      INSERT INTO admins (email, password_hash)
      VALUES (${email}, ${passwordHash})
      ON CONFLICT (email) DO NOTHING
      RETURNING id`;

    if (rows.length === 0)
      return reply(409, { success: false, message: "Admin already exists" });

    return reply(201, { success: true, data: { id: rows[0].id, email } });
  } catch (err) {
    console.error("create admin failed", (err as Error).message);
    return reply(500, { success: false, message: "Could not create admin" });
  }
};

export const config: Config = { path: "/api/admins" };
