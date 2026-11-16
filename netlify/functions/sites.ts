import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { z } from "zod";
import { authenticateAdmin } from "../../lib/session";
import { reply, readJson, validationFailed } from "../../lib/http";

const RESERVED = new Set(["www", "api", "admin", "app", "mail"]);
const SUBDOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

const SiteInput = z
  .object({
    subdomain: z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        SUBDOMAIN_RE,
        "Use lowercase letters, numbers and hyphens (max 63)",
      )
      .refine((s) => !RESERVED.has(s), "This subdomain is reserved"),
    companyName: z.string().trim().min(1).max(100),
    logo: z
      .string()
      .trim()
      .url()
      .max(2048)
      .refine((u) => u.startsWith("https://"), "Logo must be an https URL"),
    title: z.string().trim().min(1).max(150),
    description: z.string().trim().min(1).max(500),
    customJs: z.string().max(10_000).nullish(),
  })
  .strict();

export default async (req: Request) => {
  if (req.method !== "POST")
    return reply(
      405,
      { success: false, message: "Method not allowed" },
      { Allow: "POST" },
    );

  let admin;
  try {
    admin = await authenticateAdmin(req);
  } catch (err) {
    console.error("session check failed", (err as Error).message);
    return reply(500, { success: false, message: "Could not verify session" });
  }
  if (!admin) return reply(401, { success: false, message: "Unauthorized" });

  const read = await readJson(req);
  if (!read.ok) return read.res;

  const parsed = SiteInput.safeParse(read.body);
  if (!parsed.success) return validationFailed(parsed.error.issues);

  const s = parsed.data;
  const customJs = s.customJs?.trim() ? s.customJs : null;

  try {
    const db = getDatabase();
    const rows = await db.sql<{ id: string }>`
      INSERT INTO sites (subdomain, company_name, logo, title, description, custom_js, created_by)
      VALUES (${s.subdomain}, ${s.companyName}, ${s.logo}, ${s.title}, ${s.description}, ${customJs}, ${admin.adminId})
      ON CONFLICT (subdomain) DO NOTHING
      RETURNING id`;

    if (rows.length === 0)
      return reply(409, {
        success: false,
        message: "Subdomain already registered",
      });

    const root = process.env.PUBLIC_ROOT_DOMAIN ?? "example.com";
    return reply(201, {
      success: true,
      message: "Website onboarded successfully",
      data: { subdomain: s.subdomain, url: `https://${s.subdomain}.${root}` },
    });
  } catch (err) {
    console.error("onboarding insert failed", (err as Error).message);
    return reply(500, { success: false, message: "Could not create website" });
  }
};

export const config: Config = { path: "/api/sites" };
