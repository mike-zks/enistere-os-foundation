"use client";

import { useEffect, type ReactElement, type ReactNode } from "react";

import {
  runtimeDiagnostics,
  runtimeLifecycle,
  technicalAudit,
} from "./runtime-contract.js";

let baselineRegistered = false;

function registerBaseline(): void {
  if (baselineRegistered) return;
  baselineRegistered = true;
  runtimeDiagnostics.register("web.runtime", () => ({ id: "web.runtime", status: "ready" }));
  runtimeLifecycle.register({
    id: "web.runtime",
    start: () => technicalAudit.emit("runtime.started"),
    stop: () => technicalAudit.emit("runtime.stopped"),
  });
}

export function RuntimeProvider({ children }: { readonly children: ReactNode }): ReactElement {
  useEffect(() => {
    registerBaseline();
    void runtimeLifecycle.start();
    return () => { void runtimeLifecycle.stop(); };
  }, []);
  return <>{children}</>;
}
