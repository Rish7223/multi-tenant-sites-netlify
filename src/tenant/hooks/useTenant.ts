import { useEffect, useState } from "react";
import { DEFAULT_SITE, type SiteConfig } from "../types";

type State = { status: "loading" } | { status: "ready"; site: SiteConfig };

export function useTenant(): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const ctrl = new AbortController();

    fetch("/api/site", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: { tenant: SiteConfig | null }) =>
        setState({ status: "ready", site: data.tenant ?? DEFAULT_SITE }),
      )
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        console.error("tenant load failed", err);
        setState({ status: "ready", site: DEFAULT_SITE });
      });

    return () => ctrl.abort();
  }, []);

  return state;
}
