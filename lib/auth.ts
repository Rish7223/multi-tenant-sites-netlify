import { createHash, timingSafeEqual } from "node:crypto";

export function isAuthorized(req: Request): boolean {
  const expected = process.env.ONBOARDING_API_TOKEN;
  if (!expected) throw new Error("ONBOARDING_API_TOKEN not configured");

  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;

  // Hash both so lengths match, then compare in constant time
  const a = createHash("sha256").update(match[1]).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
