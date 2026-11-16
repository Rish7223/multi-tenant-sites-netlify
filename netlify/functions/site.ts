import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { resolveSubdomain } from "../../lib/tenant";

const ROOT_DOMAINS = (process.env.ROOT_DOMAINS ?? "localhost")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

type SiteRow = {
  subdomain: string;
  company_name: string;
  logo: string;
  title: string;
  description: string;
  custom_js: string | null;
};

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export default async (req: Request) => {
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, 405);

  const hostname = new URL(req.url).hostname;
  const subdomain = resolveSubdomain(hostname, ROOT_DOMAINS);
  if (!subdomain) return json({ tenant: null });

  try {
    const db = getDatabase();
    const rows = await db.sql<SiteRow>`
      SELECT subdomain, company_name, logo, title, description, custom_js
      FROM sites WHERE subdomain = ${subdomain} LIMIT 1`;

    const row = rows[0];
    if (!row) return json({ tenant: null });

    return json({
      tenant: {
        subdomain: row.subdomain,
        companyName: row.company_name,
        logo: row.logo,
        title: row.title,
        description: row.description,
        customJs: row.custom_js,
      },
    });
  } catch (err) {
    console.error("tenant lookup failed", err);
    return json({ error: "lookup_failed" }, 500);
  }
};

export const config: Config = { path: "/api/site" };
