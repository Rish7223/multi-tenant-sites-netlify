import { useEffect } from "react";
import { useTenant } from "./tenant/hooks/useTenant";
import { SiteLayout } from "./components/SiteLayout";
import "./App.css";
import { useTenantScript } from "./tenant/hooks/useTenantScript";

export default function App() {
  const state = useTenant();
  const site = state.status === "ready" ? state.site : null;

  useEffect(() => {
    if (site) document.title = site.title;
  }, [site]);

  useTenantScript(site?.subdomain ?? null, site?.customJs ?? null);

  useEffect(() => {
    if (state.status === "ready") document.title = state.site.title;
  }, [state]);

  if (state.status === "loading")
    return <div className="loading" aria-busy="true" />;
  return <SiteLayout site={state.site} />;
}
