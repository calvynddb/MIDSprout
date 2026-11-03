"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { PartnerDrawer } from "@/components/PartnerDrawer";
import { EventDrawer } from "@/components/EventDrawer";
import { BranchesView } from "@/components/views/BranchesView";
import { RootView } from "@/components/views/RootView";
import { TreeView } from "@/components/views/TreeView";
import { useCanvasStore } from "@/store/canvas-store";
import { useEventStore } from "@/store/event-store";
import { usePartnerStore } from "@/store/partner-store";
import type { Partnership, PartnershipEvent } from "@/types/partnership";

type RemoteSnapshot = {
  partners: Partnership[];
  events: PartnershipEvent[];
  collaborationTypes: string[];
  committeeOptions: string[];
  empty: boolean;
  revision: string;
};

export function SpatialCanvas() {
  const view = useCanvasStore((s) => s.view);
  const reduceMotion = useReducedMotion();
  const [databaseAvailable, setDatabaseAvailable] = useState(false);
  const lastView = useRef(view);
  const [rootArrival, setRootArrival] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (lastView.current === view) return;
    lastView.current = view;
    if (reduceMotion) {
      setRootArrival(false);
      setTransitioning(false);
      return;
    }
    setTransitioning(true);
    setRootArrival(view === "root");
    const transitionTimer = window.setTimeout(() => setTransitioning(false), 1120);
    const rootTimer = view === "root" ? window.setTimeout(() => setRootArrival(false), 5000) : undefined;
    return () => {
      window.clearTimeout(transitionTimer);
      if (rootTimer) window.clearTimeout(rootTimer);
    };
  }, [view, reduceMotion]);

  useEffect(() => {
    let cancelled = false;
    let busy = false;
    let revision = "";

    const applySnapshot = (snapshot: RemoteSnapshot) => {
      if (cancelled) return;
      revision = snapshot.revision;
      usePartnerStore.getState().replacePartners(snapshot.partners);
      useEventStore.getState().replaceRemoteData(snapshot.events, snapshot.collaborationTypes, snapshot.committeeOptions);
      setDatabaseAvailable(true);
    };

    const refresh = async (bootstrap = false) => {
      if (busy || cancelled) return;
      busy = true;
      try {
        const response = await fetch("/api/data", { cache: "no-store" });
        if (!response.ok) throw new Error((await response.json() as { error?: string }).error ?? "Database unavailable.");
        let snapshot = await response.json() as RemoteSnapshot;
        if (snapshot.empty && !bootstrap) {
          const seedResponse = await fetch("/api/data", {
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
          if (!seedResponse.ok) throw new Error("Could not initialize the shared database.");
          snapshot = await seedResponse.json() as RemoteSnapshot;
        }
        if (!cancelled && (bootstrap || snapshot.revision !== revision)) applySnapshot(snapshot);
      } catch (error) {
        if (!cancelled) {
          setDatabaseAvailable(false);
          console.error("MIDSprout shared database is unavailable:", error);
        }
      } finally {
        busy = false;
      }
    };

    void refresh();
    const timer = window.setInterval(() => { void refresh(true); }, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div data-database={databaseAvailable ? "connected" : "connecting"} className={`canopy-bg relative h-screen w-screen overflow-hidden ${rootArrival ? "canopy-returning-root" : ""}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={view}
          className="absolute inset-0 z-[1] will-change-transform"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.99, filter: "blur(12px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.01, filter: "blur(14px)" }}
          transition={{ duration: reduceMotion ? 0.08 : 0.38, ease: [0.22, 0.68, 0, 1] }}
        >
          {view === "root" ? <RootView /> : view === "tree" ? <TreeView /> : <BranchesView />}
        </motion.div>
      </AnimatePresence>
      {transitioning && <motion.div
        key={`transition-${view}`}
        aria-hidden="true"
        className="page-transition-smoke"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.98, 0.9, 0] }}
        transition={{ duration: 1.12, times: [0, 0.38, 0.64, 1], ease: "easeInOut" }}
      />}
      <PartnerDrawer />
      <EventDrawer />
    </div>
  );
}
