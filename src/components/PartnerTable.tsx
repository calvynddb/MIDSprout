"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PartnerLogo } from "@/components/PartnerLogo";
import { cn, LEAF_CUT } from "@/lib/utils";
import { useCanvasStore } from "@/store/canvas-store";
import type { Partnership } from "@/types/partnership";

export function PartnerTable({
  partners,
  selectedIds,
  onSelectionChange,
  onSelectAll,
  emptyMessage = "No organizations in this branch yet.",
}: {
  partners: Partnership[];
  selectedIds: string[];
  onSelectionChange: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  emptyMessage?: string;
}) {
  const openDrawer = useCanvasStore((s) => s.openDrawer);
  const reduceMotion = useReducedMotion();
  const allSelected = partners.length > 0 && partners.every((partner) => selectedIds.includes(partner.id));

  return (
    <div className={cn(LEAF_CUT, "glass-panel flex min-h-0 flex-1 flex-col overflow-hidden border border-white/70")}>
      <div className="partner-table-scroll min-h-0 flex-1 overflow-auto">
      <div className="partner-table-inner min-w-[1020px]">
      <div className="partner-table-header grid grid-cols-[34px_minmax(0,1fr)] gap-3 border-b border-sky-200 bg-white/75 px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        <label className="flex items-center justify-center" title="Select all visible organizations"><input aria-label="Select all visible organizations" type="checkbox" checked={allSelected} onChange={(event) => onSelectAll(event.target.checked)} className="h-4 w-4 accent-sky-600" /></label>
        <div className="partner-table-main grid grid-cols-[58px_minmax(260px,1.7fr)_minmax(170px,1fr)_minmax(190px,1fr)_minmax(220px,1.2fr)] gap-4"><span>Logo</span><span>Organization</span><span>Branch</span><span>Contact person</span><span>Email</span></div>
      </div>
      <AnimatePresence mode="popLayout">
        <div className="partner-table-rows max-h-[calc(100vh-250px)] overflow-y-auto">
          {partners.length === 0 ? (
            <p className="px-5 py-10 text-sm text-slate-500">
              {emptyMessage}
            </p>
          ) : (
            partners.map((partner, index) => (
              <motion.div
                layout
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.18, delay: reduceMotion ? 0 : Math.min(index * 0.02, 0.2) }}
                key={partner.id}
                className="partner-table-row grid w-full grid-cols-[34px_minmax(0,1fr)] items-center gap-3 border-b border-[#cfe6ff] px-5 py-2"
              >
                <label className="flex h-full items-center justify-center" onClick={(event) => event.stopPropagation()}><input aria-label={`Select ${partner.organizationName}`} type="checkbox" checked={selectedIds.includes(partner.id)} onChange={(event) => onSelectionChange(partner.id, event.target.checked)} className="h-4 w-4 accent-sky-600" /></label>
                <button type="button" onClick={() => openDrawer(partner.id)} className="partner-table-main grid w-full grid-cols-[58px_minmax(260px,1.7fr)_minmax(170px,1fr)_minmax(190px,1fr)_minmax(220px,1.2fr)] items-center gap-4 rounded-lg px-2 py-3 text-left transition hover:bg-sky-50/80">
                  <PartnerLogo acronym={partner.acronym} name={partner.organizationName} logoUrl={partner.logoUrl} />
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-slate-800">{partner.organizationName}</p>
                    <p className="mt-1 truncate text-sm text-slate-500">{partner.acronym}</p>
                  </div>
                  <span data-label="Branch" className="partner-table-detail truncate text-sm text-slate-600">{partner.category}</span>
                  <span data-label="Contact" className="partner-table-detail truncate text-sm text-slate-700">{partner.primaryContact}</span>
                  <span data-label="Email" className="partner-table-detail truncate text-sm text-[#007BFF]">{partner.email}</span>
                </button>
              </motion.div>
            ))
          )}
        </div>
      </AnimatePresence>
      </div>
      </div>
    </div>
  );
}
