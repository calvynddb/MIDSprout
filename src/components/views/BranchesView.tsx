"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Archive, ArrowLeft, ClipboardList, FolderOpen, Home, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { OrganizationExport } from "@/components/OrganizationExport";
import { PartnerTable } from "@/components/PartnerTable";
import { DirectorySelectionActions } from "@/components/DirectorySelectionActions";
import { orderPartners, PartnerDirectoryControls, type PartnerSort } from "@/components/PartnerDirectoryControls";
import { deduplicatedEmails } from "@/lib/contact-shortcuts";
import { Brand } from "@/components/Brand";
import { LeafButton } from "@/components/ui/leaf-button";
import { cn } from "@/lib/utils";
import { useCanvasStore } from "@/store/canvas-store";
import { usePartnerStore } from "@/store/partner-store";
import { PARTNER_CATEGORIES, type PartnerCategory } from "@/types/partnership";

const PURPOSES: Record<PartnerCategory, string> = {
  "Student Councils": "Executive councils and college student councils.",
  Societies: "Recognized college societies and student organizations.",
  COO: "Campus-wide Council of Organizations members.",
  Publications: "Student publications and editorial groups.",
  "MSU-IIT Offices": "The workbook tab repeats society and publication rows; no distinct office records were listed.",
  "DOST Organizations": "DOST-SEI scholars’ associations from across the Philippines.",
  "External Organizations": "Local government units, community groups, and external academic organizations.",
};

export function BranchesView() {
  const allPartners = usePartnerStore((s) => s.partners);
  const [showArchived, setShowArchived] = useState(false);
  const partners = useMemo(() => allPartners.filter((partner) => Boolean(partner.archivedAt) === showArchived), [allPartners, showArchived]);
  const goTo = useCanvasStore((s) => s.goTo);
  const activeCategory = useCanvasStore((s) => s.activeCategory);
  const setActiveCategory = useCanvasStore((s) => s.setActiveCategory);
  const openCreateDrawer = useCanvasStore((s) => s.openCreateDrawer);
  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<PartnerSort>("name-asc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const category: PartnerCategory = activeCategory ?? PARTNER_CATEGORIES[0];

  useEffect(() => {
    if (!activeCategory) {
      setActiveCategory(PARTNER_CATEGORIES[0]);
    }
  }, [activeCategory, setActiveCategory]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const branchPartners = partners.filter((partner) => partner.category === category && (!normalized || [partner.organizationName, partner.acronym, partner.primaryContact, partner.email].some((value) => value.toLocaleLowerCase().includes(normalized))));
    return orderPartners(branchPartners, sort);
  }, [partners, category, query, sort]);
  const selectedVisible = filtered.filter((partner) => selectedIds.includes(partner.id));
  const selectVisible = (selected: boolean) => {
    const visibleIds = new Set(filtered.map((partner) => partner.id));
    setSelectedIds((current) => selected
      ? [...new Set([...current, ...visibleIds])]
      : current.filter((id) => !visibleIds.has(id)));
  };

  const copyEmails = async () => {
    const emails = deduplicatedEmails(filtered);
    await navigator.clipboard.writeText(emails);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="database-view database-viewport flex h-screen w-screen items-center justify-center overflow-y-auto px-4 pt-5 pb-[clamp(40px,5vh,64px)] sm:px-8">
      <div className="flex h-full min-h-0 w-full max-w-[1760px] flex-col">
        <Brand compact />
<header className="mb-3 mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="database-title font-semibold text-slate-800">Branches</h2>
          </div>
          <div className="flex items-center gap-2">
            <LeafButton variant="outline" onClick={() => goTo("tree")}><ArrowLeft size={16} /> Back to Tree</LeafButton>
            <LeafButton variant="outline" onClick={() => goTo("root")}>
              <Home size={16} />
              Back to Root
            </LeafButton>
          </div>
        </header>
        <nav className="folder-tabs branch-folder-tabs" aria-label="Partnership branches">
          {PARTNER_CATEGORIES.map((item, index) => (
          <button key={item} type="button" onClick={() => setActiveCategory(item)} data-branch-tone={index}
              className={cn("folder-tab-top", item === category && "folder-tab-active")}>
              <span className="branch-tab-label">{item}</span>
            </button>
          ))}
        </nav>
        <div className="file-sheet flex min-h-0 flex-1 flex-col" data-branch-tone={PARTNER_CATEGORIES.indexOf(category)}>
          <div className="directory-sheet-heading branch-sheet-heading mb-4 flex flex-wrap items-center gap-3 border-b border-slate-100 pb-4">
            <span className="tile-icon"><FolderOpen size={18} /></span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-800">{category}</h3>
                <span className="count-chip">{filtered.length} records</span>
              </div>
              <p className="text-sm text-slate-500">{PURPOSES[category]}</p>
            </div>
            <div className="branch-sheet-actions ml-auto flex flex-wrap items-center justify-end gap-3"><LeafButton variant="outline" aria-label={showArchived ? "Show active organizations" : "Show archived organizations"} title={showArchived ? "Show active organizations" : "Show archived organizations"} aria-pressed={showArchived} onClick={() => { setShowArchived(!showArchived); setSelectedIds([]); }}><Archive size={16} /></LeafButton>
            <PartnerDirectoryControls query={query} onQueryChange={setQuery} sort={sort} onSortChange={setSort} />
            <OrganizationExport all={orderPartners(allPartners.filter((partner) => !partner.archivedAt), sort)} visible={filtered} selected={selectedVisible} />
            <LeafButton variant="primary" onClick={() => openCreateDrawer(category)}>
              <Plus size={16} /> Add organization
            </LeafButton>
            <LeafButton variant="glass" onClick={copyEmails}>
              <ClipboardList size={16} />
              {copied ? "Copied" : "Copy all emails"}
            </LeafButton></div>
          </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={category}
            initial={reduceMotion ? false : { opacity: 0, x: 14, filter: "blur(2px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -14, filter: "blur(2px)" }}
            transition={{ duration: reduceMotion ? 0 : 0.22 }}
            className="flex min-h-0 flex-1 flex-col overflow-auto"
          >
            {selectedVisible.length > 0 && <DirectorySelectionActions selected={selectedVisible} onDeleted={(ids) => setSelectedIds((current) => current.filter((id) => !ids.includes(id)))} />}
            <PartnerTable sort={sort} onSortChange={setSort} partners={filtered} selectedIds={selectedIds} onSelectionChange={(id, selected) => setSelectedIds((current) => selected ? [...new Set([...current, id])] : current.filter((item) => item !== id))} onSelectAll={selectVisible} emptyMessage={query ? "No organizations match your search." : "No organizations in this branch yet."} />
          </motion.div>
        </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
