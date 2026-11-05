"use client";

import { useEffect } from "react";
import { useWorkspaceStore } from "@/store/workspace-store";

export function WorkspaceSync() {
  useEffect(() => {
    const refresh = () => { if (document.visibilityState !== "hidden") void useWorkspaceStore.getState().refresh(); };
    refresh();
    const timer = window.setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, []);
  return null;
}
