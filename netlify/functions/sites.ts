import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { z } from "zod";
import { isAuthorized } from "../../lib/auth";

const RESERVED = new Set(["www", "api", "admin", "app", "mail"]);
const SUBDOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const MAX_BODY_BYTES = 20_000;

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

const reply = (status: number, body: object) => Response.json(body, { status });

export default async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json(
      { success: false, message: "Method not allowed" },
      { status: 405, headers: { Allow: "POST" } },
    );
  }

  try {
    if (!isAuthorized(req))
      return reply(401, { success: false, message: "Unauthorized" });
  } catch (err) {
    console.error(err);
    return reply(500, { success: false, message: "Server misconfigured" });
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES)
    return reply(413, { success: false, message: "Payload too large" });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return reply(400, { success: false, message: "Invalid JSON" });
  }

  const parsed = SiteInput.safeParse(body);
  if (!parsed.success) {
    return reply(400, {
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
  }

  const s = parsed.data;
  const customJs = s.customJs?.trim() ? s.customJs : null;

  try {
    const db = getDatabase();
    const rows = await db.sql<{ id: string }>`
      INSERT INTO sites (subdomain, company_name, logo, title, description, custom_js)
      VALUES (${s.subdomain}, ${s.companyName}, ${s.logo}, ${s.title}, ${s.description}, ${customJs})
      ON CONFLICT (subdomain) DO NOTHING
      RETURNING id`;

    if (rows.length === 0) {
      return reply(409, {
        success: false,
        message: "Subdomain already registered",
      });
    }

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
