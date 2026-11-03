"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CalendarDays, ClipboardList, Plus, UsersRound } from "lucide-react";
import { useState } from "react";
import { Brand } from "@/components/Brand";
import { DepthButton } from "@/components/ui/DepthButton";
import { useCanvasStore } from "@/store/canvas-store";
import { useEventStore } from "@/store/event-store";
import { usePartnerStore } from "@/store/partner-store";

const formatEventDate = (start: string, end: string) => {
  if (!start) return "Date TBD";
  if (!end || start === end) return start;
  return `${start} – ${end}`;
};

export function RootView() {
  const partners = usePartnerStore((s) => s.partners);
  const events = useEventStore((s) => s.events);
  const openEvent = useEventStore((s) => s.openEvent);
  const openCreateEvent = useEventStore((s) => s.openCreateEvent);
  const openCreatePartner = useCanvasStore((s) => s.openCreateDrawer);
  const goTo = useCanvasStore((s) => s.goTo);
  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const copyEmails = async () => {
    await navigator.clipboard.writeText(partners.map((partner) => partner.email).filter(Boolean).join("; "));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  const appear = (delay: number) => reduceMotion
    ? { initial: false as const, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.28, delay } };

  return (
    <section className="root-viewport flex h-screen w-screen items-center justify-center overflow-y-auto px-4 sm:px-8">
      <main className="workspace-shell">
        <div className="overview-file">
          <header className="overview-file-lip"><Brand compact /></header>
          <div className="overview-grid">
            <motion.section {...appear(0.04)} className="overview-stats" aria-label="Overview statistics">
              <div className="overview-stat overview-stat-organizations">
                <div className="stat-label"><UsersRound size={18} /><span>Organizations</span></div>
                <div className="stat-bottom"><strong>{partners.length}</strong><div className="stat-actions"><button className="stat-add" type="button" onClick={() => openCreatePartner()}><Plus size={15} /><span>Add organization</span></button><button className="stat-add" type="button" onClick={copyEmails}><ClipboardList size={15} /><span>{copied ? "Copied" : "Copy all emails"}</span></button></div></div>
              </div>
              <div className="overview-stat overview-stat-events">
                <div className="stat-label"><CalendarDays size={18} /><span>Collaborations</span></div>
                <div className="stat-bottom"><strong>{events.length}</strong><span className="stat-caption">total</span></div>
              </div>
            </motion.section>

            <motion.div {...appear(0.09)} className="overview-branch-area">
              <DepthButton className="overview-nav overview-nav-branches" onClick={() => goTo("branches")}>
                <span className="overview-nav-copy"><span className="overview-nav-title">Branches</span><span className="overview-nav-count">07</span></span>
              </DepthButton>
            </motion.div>

            <motion.section {...appear(0.14)} className="overview-events" aria-label="Collaborations">
              <div className="overview-events-top"><span className="event-section-mark"><CalendarDays size={19} /></span><button type="button" className="mini-action event-add" onClick={openCreateEvent}><Plus size={16} /> Add collaboration</button></div>
              <div className="overview-events-list">
                {events.length ? events.map((event, index) => (
                  <motion.div key={event.id} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: reduceMotion ? 0 : 0.18 + index * 0.06 }}>
                    <DepthButton onClick={() => openEvent(event.id)} depth="subtle" className="overview-event-card">
                      <span className="overview-event-name">{event.name}</span>
                      <span className={`status-chip status-${event.status}`}>{event.collaborationType} · {event.status}</span>
                      <span className="overview-event-meta">{formatEventDate(event.startDate, event.endDate)}</span>
                      <span className="overview-event-partners"><UsersRound size={14} /> {event.participants.length}</span>
                      <ArrowUpRight size={17} className="overview-event-arrow" />
                    </DepthButton>
                  </motion.div>
                )) : <button type="button" className="overview-event-empty" onClick={openCreateEvent}><Plus size={17} /> Add the first collaboration</button>}
              </div>
            </motion.section>

            <motion.div {...appear(0.19)} className="overview-tree-area">
              <DepthButton className="overview-nav overview-nav-tree" glowColor="rgba(37,150,255,.55)" onClick={() => goTo("tree")}>
                <span className="overview-nav-copy"><span className="overview-nav-title">Tree</span><span className="overview-nav-count">{partners.length}</span></span>
              </DepthButton>
            </motion.div>
          </div>
        </div>
      </main>
    </section>
  );
}
