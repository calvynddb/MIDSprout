"use client";

import { Archive, ClipboardList, FolderOpen, Home, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { deduplicatedEmails } from "@/lib/contact-shortcuts";
import { Brand } from "@/components/Brand";
import { DirectorySelectionActions } from "@/components/DirectorySelectionActions";
import { orderPartners, PartnerDirectoryControls, type PartnerSort } from "@/components/PartnerDirectoryControls";
import { OrganizationExport } from "@/components/OrganizationExport";
import { PartnerTable } from "@/components/PartnerTable";
import { LeafButton } from "@/components/ui/leaf-button";
import { useCanvasStore } from "@/store/canvas-store";
import { usePartnerStore } from "@/store/partner-store";

export function TreeView() {
  const allPartners = usePartnerStore((s) => s.partners);
  const [showArchived, setShowArchived] = useState(false);
  const partners = useMemo(() => allPartners.filter((partner) => Boolean(partner.archivedAt) === showArchived), [allPartners, showArchived]);
  const goTo = useCanvasStore((s) => s.goTo);
  const openCreateDrawer = useCanvasStore((s) => s.openCreateDrawer);
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<PartnerSort>("name-asc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const visiblePartners = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return orderPartners(partners.filter((partner) => !normalized || [partner.organizationName, partner.acronym, partner.category, partner.primaryContact, partner.email].some((value) => value.toLocaleLowerCase().includes(normalized))), sort);
  }, [partners, query, sort]);
  const selectedVisible = visiblePartners.filter((partner) => selectedIds.includes(partner.id));
  const selectVisible = (selected: boolean) => {
    const visibleIds = new Set(visiblePartners.map((partner) => partner.id));
    setSelectedIds((current) => selected
      ? [...new Set([...current, ...visibleIds])]
      : current.filter((id) => !visibleIds.has(id)));
  };
  const copyEmails = async () => {
    const emails = deduplicatedEmails(partners);
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
          <div className="flex items-center gap-2"><LeafButton variant="primary" onClick={() => openCreateDrawer()}><Plus size={16} /> Add organization</LeafButton><OrganizationExport all={orderPartners(allPartners.filter((partner) => !partner.archivedAt), sort)} visible={visiblePartners} selected={selectedVisible} /><LeafButton variant="glass" onClick={copyEmails}><ClipboardList size={16} />{copied ? "Copied" : "Copy All Emails"}</LeafButton><LeafButton variant="outline" onClick={() => goTo("root")}><Home size={16} /> Back to Root</LeafButton></div>
        </header>
        <nav className="folder-tabs" aria-label="Workspace sections"><span className="folder-tab-top folder-tab-active"><FolderOpen size={14} /> Organizations</span><button onClick={() => goTo("branches")} className="folder-tab-top"><FolderOpen size={14} /> Branches</button></nav>
        <div className="file-sheet flex min-h-0 flex-1 flex-col overflow-hidden"><div className="directory-sheet-heading mb-4 flex flex-wrap items-center gap-3 border-b border-sky-200 pb-4"><span className="tile-icon"><FolderOpen size={19} /></span><span className="count-chip">{visiblePartners.length} records</span><LeafButton variant="outline" aria-label={showArchived ? "Show active organizations" : "Show archived organizations"} title={showArchived ? "Show active organizations" : "Show archived organizations"} aria-pressed={showArchived} onClick={() => { setShowArchived(!showArchived); setSelectedIds([]); }}><Archive size={16} /></LeafButton><PartnerDirectoryControls query={query} onQueryChange={setQuery} sort={sort} onSortChange={setSort} /></div>{selectedVisible.length > 0 && <DirectorySelectionActions selected={selectedVisible} onDeleted={(ids) => setSelectedIds((current) => current.filter((id) => !ids.includes(id)))} />}<PartnerTable sort={sort} onSortChange={setSort} partners={visiblePartners} selectedIds={selectedIds} onSelectionChange={(id, selected) => setSelectedIds((current) => selected ? [...new Set([...current, id])] : current.filter((item) => item !== id))} onSelectAll={selectVisible} emptyMessage={query ? "No organizations match your search." : "No organizations have been added yet."} /></div>
      </div>
    </section>
  );
}
