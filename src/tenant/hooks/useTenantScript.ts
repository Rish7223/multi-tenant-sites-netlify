import { useEffect } from "react";

// Module-level guard: survives React StrictMode's double effect run
let injectedFor: string | null = null;

export function useTenantScript(subdomain: string | null, code: string | null) {
  useEffect(() => {
    if (!subdomain || !code?.trim()) return; // default site or no JS → do nothing
    if (injectedFor === subdomain) return; // already ran → don't run twice
    injectedFor = subdomain;

    const el = document.createElement("script");
    el.dataset.tenant = subdomain; // easy to spot in DevTools
    el.textContent = code;
    document.body.appendChild(el);
  }, [subdomain, code]);
}
