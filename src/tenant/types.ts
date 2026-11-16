export type SiteConfig = {
  subdomain: string | null;
  companyName: string;
  logo: string;
  title: string;
  description: string;
  customJs: string | null;
};

export const DEFAULT_SITE: SiteConfig = {
  subdomain: null,
  companyName: "Default Website",
  logo: "https://placehold.co/80x80?text=D",
  title: "Welcome",
  description: "A multi-tenant website platform.",
  customJs: null,
};
