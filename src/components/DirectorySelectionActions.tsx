"use client";

import { useState } from "react";
import { Archive, ClipboardList, RotateCcw, Trash2 } from "lucide-react";
import { LeafButton } from "@/components/ui/leaf-button";
import { usePartnerStore } from "@/store/partner-store";
import { deduplicatedEmails } from "@/lib/contact-shortcuts";
import type { Partnership } from "@/types/partnership";

export function DirectorySelectionActions({
  selected,
  onDeleted,
}: {
  selected: Partnership[];
  onDeleted: (ids: string[]) => void;
}) {
  const deletePartners = usePartnerStore((state) => state.deletePartners);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const copyEmails = async () => {
    const emails = deduplicatedEmails(selected);
    try {
      await navigator.clipboard.writeText(emails);
      setMessage("Selected emails copied.");
    } catch {
      setMessage("Could not copy emails. Check clipboard permissions.");
    }
  };

  const archiveSelected = async () => {
    if (busy) return;
    setBusy(true); setMessage("");
    const completed: string[] = [];
    for (const partner of selected) {
      const store = usePartnerStore.getState();
      const success = await (partner.archivedAt ? store.restorePartner(partner.id) : store.archivePartner(partner.id));
      if (!success) break;
      completed.push(partner.id);
    }
    setBusy(false);
    onDeleted(completed);
    setMessage(completed.length === selected.length ? "Selected records updated. Collaboration links were preserved." : "Some records could not be updated. Please retry the remaining selection.");
  };

  const removeSelected = async () => {
    if (busy || selected.length === 0) return;
    setBusy(true);
    setMessage("");
    const ids = selected.map((partner) => partner.id);
    const deleted = await deletePartners(ids);
    setBusy(false);
    if (deleted) {
      onDeleted(ids);
      setConfirmDelete(false);
      setMessage(`${ids.length} organization${ids.length === 1 ? "" : "s"} deleted.`);
    } else {
      setMessage("Could not delete the selected organizations. Check the database connection and try again.");
    }
  };

  return (
    <div className="directory-selection-toolbar" aria-live="polite">
      <span className="directory-selection-count">{selected.length} selected</span>
      {!confirmDelete ? <>
        <LeafButton variant="outline" disabled={busy} className="directory-selection-action" onClick={() => void archiveSelected()}>{selected.every((partner) => partner.archivedAt) ? <RotateCcw size={15} /> : <Archive size={15} />}{busy ? "Updating…" : selected.every((partner) => partner.archivedAt) ? "Restore selected" : "Archive selected"}</LeafButton>
        <LeafButton variant="glass" className="directory-selection-action" onClick={() => void copyEmails()}><ClipboardList size={15} /> Copy selected emails</LeafButton>
        <LeafButton variant="outline" className="directory-selection-action border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50" onClick={() => { setConfirmDelete(true); setMessage(""); }}><Trash2 size={15} /> Delete selected</LeafButton>
      </> : <div className="directory-selection-confirm" role="alert">
        <span>Delete {selected.length} selected organization{selected.length === 1 ? "" : "s"}? They’ll be unlinked from collaborations.</span>
        <button type="button" className="directory-selection-cancel" disabled={busy} onClick={() => setConfirmDelete(false)}>Cancel</button>
        <button type="button" className="directory-selection-delete" disabled={busy} onClick={() => void removeSelected()}>{busy ? "Deleting…" : "Delete permanently"}</button>
      </div>}
      {message && <span className="directory-selection-message" role="status">{message}</span>}
    </div>
  );
}
