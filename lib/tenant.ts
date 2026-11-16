// Turns "priority.localhost" -> "priority", "localhost" -> null
export function resolveSubdomain(
  hostname: string,
  rootDomains: string[],
): string | null {
  const host = hostname.toLowerCase().replace(/\.$/, "");

  for (const root of rootDomains) {
    if (host === root) return null; // root domain → default site
    if (host.endsWith(`.${root}`)) {
      const sub = host.slice(0, -(root.length + 1));
      if (sub === "www" || sub.includes(".")) return null; // ignore www and a.b.example.com
      return sub;
    }
  }
  return null; // e.g. your-site.netlify.app → default site
}
