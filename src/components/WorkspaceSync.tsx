"use client";

import { useEffect } from "react";
import { useEventStore } from "@/store/event-store";
import { usePartnerStore } from "@/store/partner-store";
import { useWorkspaceStore } from "@/store/workspace-store";
import type { DataSnapshot } from "@/lib/data-snapshot";

export function WorkspaceSync({ onDatabaseAvailable }: { onDatabaseAvailable: (available: boolean) => void }) {
  useEffect(() => {
    let cancelled = false;
    let busy = false;
    let firstRefresh = true;
    let lastApplied: {
      signature: string;
      partners: ReturnType<typeof usePartnerStore.getState>["partners"];
      events: ReturnType<typeof useEventStore.getState>["events"];
      types: string[];
      committees: string[];
    } | null = null;

    const refresh = async () => {
      if (busy || cancelled || document.visibilityState === "hidden") return;
      busy = true;
      try {
        let snapshot = await useWorkspaceStore.getState().refresh();
        if (!snapshot || cancelled) {
          if (!cancelled && useWorkspaceStore.getState().error) onDatabaseAvailable(false);
          return;
        }
        if (snapshot.empty && firstRefresh) {
          const response = await fetch("/api/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "bootstrap",
              snapshot: {
                partners: usePartnerStore.getState().partners,
                events: useEventStore.getState().events,
                collaborationTypes: useEventStore.getState().collaborationTypes,
                committeeOptions: useEventStore.getState().committeeOptions,
              },
            }),
          });
          if (!response.ok) throw new Error("Could not initialize the shared database.");
          snapshot = await response.json() as DataSnapshot;
        }
        if (cancelled) return;
        firstRefresh = false;
        const partners = usePartnerStore.getState();
        const events = useEventStore.getState();
        const signature = JSON.stringify([snapshot.partners, snapshot.events, snapshot.collaborationTypes, snapshot.committeeOptions]);
        // Local changes still reconcile; unchanged polls retain the existing array references.
        if (!lastApplied || signature !== lastApplied.signature || partners.partners !== lastApplied.partners || events.events !== lastApplied.events || events.collaborationTypes !== lastApplied.types || events.committeeOptions !== lastApplied.committees) {
          partners.replacePartners(snapshot.partners);
          events.replaceRemoteData(snapshot.events, snapshot.collaborationTypes, snapshot.committeeOptions);
          lastApplied = {
            signature,
            partners: usePartnerStore.getState().partners,
            events: useEventStore.getState().events,
            types: useEventStore.getState().collaborationTypes,
            committees: useEventStore.getState().committeeOptions,
          };
        }
        onDatabaseAvailable(true);
      } catch (error) {
        if (!cancelled) {
          onDatabaseAvailable(false);
          console.error("MIDSprout shared database is unavailable:", error);
        }
      } finally { busy = false; }
    };
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 5000);
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [onDatabaseAvailable]);
  return null;
}
