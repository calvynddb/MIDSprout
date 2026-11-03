"use client";

import { ClipboardList, FolderOpen, Home, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Brand } from "@/components/Brand";
import { orderPartners, PartnerDirectoryControls, type PartnerSort } from "@/components/PartnerDirectoryControls";
import { PartnerTable } from "@/components/PartnerTable";
import { LeafButton } from "@/components/ui/leaf-button";
import { useCanvasStore } from "@/store/canvas-store";
import { usePartnerStore } from "@/store/partner-store";

export function TreeView() {
  const partners = usePartnerStore((s) => s.partners);
  const goTo = useCanvasStore((s) => s.goTo);
  const openCreateDrawer = useCanvasStore((s) => s.openCreateDrawer);
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<PartnerSort>("name-asc");
  const visiblePartners = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return orderPartners(partners.filter((partner) => !normalized || [partner.organizationName, partner.acronym, partner.category, partner.primaryContact, partner.email].some((value) => value.toLocaleLowerCase().includes(normalized))), sort);
  }, [partners, query, sort]);
  const copyEmails = async () => {
    const emails = partners.map((p) => p.email).filter(Boolean).join("; ");
    await navigator.clipboard.writeText(emails);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="database-view database-viewport flex h-screen w-screen items-center justify-center overflow-y-auto px-4 pt-5 pb-[clamp(40px,5vh,64px)] sm:px-8">
      <div className="flex h-full min-h-0 w-full max-w-[1760px] flex-col">
        <Brand compact />
        <header className="mb-3 mt-3 flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="database-title font-semibold text-slate-800">All organizations</h2></div>
          <div className="flex items-center gap-2"><LeafButton variant="primary" onClick={() => openCreateDrawer()}><Plus size={16} /> Add organization</LeafButton><LeafButton variant="glass" onClick={copyEmails}><ClipboardList size={16} />{copied ? "Copied" : "Copy All Emails"}</LeafButton><LeafButton variant="outline" onClick={() => goTo("root")}><Home size={16} /> Workspace</LeafButton></div>
        </header>
        <nav className="folder-tabs" aria-label="Workspace sections"><span className="folder-tab-top folder-tab-active"><FolderOpen size={14} /> Organizations</span><button onClick={() => goTo("branches")} className="folder-tab-top"><FolderOpen size={14} /> Branches</button></nav>
        <div className="file-sheet min-h-0 flex-1 overflow-hidden"><div className="mb-4 flex flex-wrap items-center gap-3 border-b border-sky-200 pb-4"><span className="tile-icon"><FolderOpen size={19} /></span><span className="count-chip">{visiblePartners.length} records</span><PartnerDirectoryControls query={query} onQueryChange={setQuery} sort={sort} onSortChange={setSort} /></div><PartnerTable partners={visiblePartners} emptyMessage={query ? "No organizations match your search." : "No organizations have been added yet."} /></div>
      </div>
    </section>
  );
}
