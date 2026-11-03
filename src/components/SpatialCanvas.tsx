"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { PartnerDrawer } from "@/components/PartnerDrawer";
import { EventDrawer } from "@/components/EventDrawer";
import { BranchesView } from "@/components/views/BranchesView";
import { RootView } from "@/components/views/RootView";
import { TreeView } from "@/components/views/TreeView";
import { useCanvasStore } from "@/store/canvas-store";

export function SpatialCanvas() {
  const view = useCanvasStore((s) => s.view);
  const reduceMotion = useReducedMotion();
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

  return (
    <div className={`canopy-bg relative h-screen w-screen overflow-hidden ${rootArrival ? "canopy-returning-root" : ""}`}>
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
