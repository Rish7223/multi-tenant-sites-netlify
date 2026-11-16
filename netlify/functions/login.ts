import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { sha256 } from "../../lib/auth";
import { hashPassword, verifyPassword } from "../../lib/password";
import { reply, readJson, validationFailed } from "../../lib/http";
import { isLocked } from "../../lib/loginThrottle";

const LoginInput = z
  .object({
    email: z.string().trim().toLowerCase().min(1).max(254),
    password: z.string().min(1).max(128),
  })
  .strict();

// Created once per function instance, reused for timing equalisation
let dummyHash: Promise<string> | undefined;
const getDummyHash = () =>
  (dummyHash ??= hashPassword("timing-equaliser-not-a-real-password"));

const invalid = () =>
  reply(401, { success: false, message: "Invalid email or password" });

export default async (req: Request) => {
  if (req.method !== "POST")
    return reply(
      405,
      { success: false, message: "Method not allowed" },
      { Allow: "POST" },
    );

  const read = await readJson(req, 2_000);
  if (!read.ok) return read.res;

  const parsed = LoginInput.safeParse(read.body);
  if (!parsed.success) return validationFailed(parsed.error.issues);

  const { email, password } = parsed.data;

  try {
    const db = getDatabase();

    if (await isLocked(email)) {
      return reply(
        429,
        { success: false, message: "Too many attempts. Try again later." },
        { "Retry-After": "900" },
      );
    }

    const [admin] = await db.sql<{ id: string; password_hash: string }>`
      SELECT id, password_hash FROM admins WHERE email = ${email}`;

    // Always run a real scrypt check, even for unknown emails
    const passwordOk = await verifyPassword(
      password,
      admin?.password_hash ?? (await getDummyHash()),
    );
    if (!admin || !passwordOk) return invalid();

    const token = `adm_${randomBytes(32).toString("base64url")}`;
    const tokenHash = sha256(token).toString("hex");

    const [session] = await db.sql<{ expires_at: string }>`
      INSERT INTO admin_sessions (admin_id, token_hash, expires_at)
      VALUES (${admin.id}, ${tokenHash}, now() + interval '1 hour')
      RETURNING expires_at`;

    return reply(200, {
      success: true,
      data: { token, tokenType: "Bearer", expiresAt: session.expires_at },
    });
  } catch (err) {
    console.error("login failed", (err as Error).message);
    return reply(500, { success: false, message: "Login failed" });
  }
};

export const config: Config = {
  path: "/api/auth/login",
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
