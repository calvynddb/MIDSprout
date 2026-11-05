"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Archive, ClipboardList, ExternalLink, ImagePlus, Phone, RotateCcw, Save, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { FieldLabel, Input } from "@/components/ui/input";
import { PartnerLogo } from "@/components/PartnerLogo";
import { LeafButton } from "@/components/ui/leaf-button";
import { LEAF_CUT } from "@/lib/utils";
import { contactEmails, contactLinks } from "@/lib/contact-shortcuts";
import { useCanvasStore } from "@/store/canvas-store";
import { useEventStore } from "@/store/event-store";
import { usePartnerStore } from "@/store/partner-store";
import { PARTNER_CATEGORIES, type PartnerCategory, type Partnership } from "@/types/partnership";

const emptyPartner = (category?: PartnerCategory): Partnership => ({
  id: "draft", logoUrl: "", acronym: "", organizationName: "", category: category ?? "External Organizations",
  primaryContact: "", email: "", about: "", phone: "", address: "", contactFacebookLink: "",
  facebookPage: "", collaborationStatus: "", approvalDate: "", officerInContact: "",
  natureOfOrganization: "", officialEmail: "", partnershipEmail: "", organizationHeadName: "",
  organizationHeadDesignation: "", organizationHeadEmail: "", organizationHeadFacebookUrl: "",
  partnershipContactName: "", partnershipContactDesignation: "", partnershipContactNumber: "",
  partnershipContactEmail: "", partnershipContactFacebookUrl: "", organizationFacebookUrl: "",
  instagramUrl: "", xUrl: "", tiktokUrl: "", otherSocialMediaPlatforms: "",
});

const PROFILE_GROUPS = [
  { title: "Organization", fields: [["organizationName", "Full Name of Organization"], ["acronym", "Abbreviated Name of Organization"], ["natureOfOrganization", "Nature of Organization"], ["officialEmail", "Official Email Address of Organization"], ["partnershipEmail", "Partnership Email Address of Organization"]] },
  { title: "Organization head", fields: [["organizationHeadName", "Name of Organization Head"], ["organizationHeadDesignation", "Designation of Organization Head"], ["organizationHeadEmail", "Email Address of Organization Head"], ["organizationHeadFacebookUrl", "Facebook URL of Organization Head"]] },
  { title: "Partnership contact", fields: [["partnershipContactName", "Name of Contact Person for Partnerships"], ["partnershipContactDesignation", "Designation of Contact Person for Partnerships"], ["partnershipContactNumber", "Contact Number of Contact Person for Partnerships"], ["partnershipContactEmail", "Email Address of Contact Person for Partnerships"], ["partnershipContactFacebookUrl", "Facebook URL of Contact Person for Partnerships"]] },
  { title: "Social media", fields: [["organizationFacebookUrl", "Facebook"], ["instagramUrl", "Instagram"], ["xUrl", "X (Formerly Twitter)"], ["tiktokUrl", "Tiktok"], ["otherSocialMediaPlatforms", "Other Social Media Platforms"]] },
] as const;

function normalizePartner(partner: Partnership | null): Partnership {
  const base = emptyPartner();
  if (!partner) return base;
  return {
    ...base,
    ...partner,
    officialEmail: partner.officialEmail || partner.email || "",
    partnershipContactName: partner.partnershipContactName || partner.primaryContact || "",
    partnershipContactNumber: partner.partnershipContactNumber || partner.phone || "",
  };
}

export function PartnerDrawer() {
  const drawerOpen = useCanvasStore((s) => s.drawerOpen);
  const drawerMode = useCanvasStore((s) => s.drawerMode);
  const selectedPartnerId = useCanvasStore((s) => s.selectedPartnerId);
  const initialCategory = useCanvasStore((s) => s.initialPartnerCategory);
  const partners = usePartnerStore((s) => s.partners);
  const selected = partners.find((p) => p.id === selectedPartnerId) ?? null;
  const key = drawerMode === "create" ? `new-organization-${initialCategory ?? "default"}` : selectedPartnerId ?? "organization";
  return <AnimatePresence>{drawerOpen && <PartnerDrawerPanel key={key} selected={selected} selectedPartnerId={selectedPartnerId} drawerMode={drawerMode} initialCategory={initialCategory} />}</AnimatePresence>;
}

function PartnerDrawerPanel({ selected, selectedPartnerId, drawerMode, initialCategory }: { selected: Partnership | null; selectedPartnerId: string | null; drawerMode: "edit" | "create"; initialCategory: PartnerCategory | null }) {
  const closeDrawer = useCanvasStore((s) => s.closeDrawer);
  const upsertPartner = usePartnerStore((s) => s.upsertPartner);
  const deletePartner = usePartnerStore((s) => s.deletePartner);
  const events = useEventStore((s) => s.events);
  const reduceMotion = useReducedMotion();
  const history = useMemo(() => events.flatMap((event) => {
    const participation = event.participants.find((item) => item.partnerId === selectedPartnerId);
    return participation ? [event] : [];
  }), [events, selectedPartnerId]);
  const [form, setForm] = useState<Partnership>(() => drawerMode === "create" ? emptyPartner(initialCategory ?? undefined) : normalizePartner(selected));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [emailRole, setEmailRole] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const emails = contactEmails(form);
  const selectedEmail = emails.find((email) => email.role === emailRole) ?? emails[0];
  const phone = (form.partnershipContactNumber || form.phone || "").trim();
  const links = contactLinks(form);
  const copyContact = async (value: string, label: string) => {
    if (!value) return;
    try { await navigator.clipboard.writeText(value); setContactMessage(`${label} copied.`); }
    catch { setContactMessage("Could not copy. Check your browser's clipboard permission."); }
  };

  const patch = <K extends keyof Partnership>(key: K, value: Partnership[K]) => setForm((current) => ({ ...current, [key]: value }));
  const uploadLogo = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const image = await createImageBitmap(file);
      const scale = Math.min(1, 360 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
      image.close();
      patch("logoUrl", canvas.toDataURL("image/webp", .84));
    } catch {
      const reader = new FileReader();
      reader.onload = () => { if (typeof reader.result === "string") patch("logoUrl", reader.result); };
      reader.readAsDataURL(file);
    }
  };
  const save = () => {
    const partner = {
      ...form,
      id: form.id === "draft" ? `p-${crypto.randomUUID()}` : form.id,
      officialEmail: form.officialEmail || form.email,
      partnershipContactName: form.partnershipContactName || form.primaryContact,
      partnershipContactNumber: form.partnershipContactNumber || form.phone,
      email: form.officialEmail || form.partnershipEmail || form.partnershipContactEmail || form.email,
      primaryContact: form.partnershipContactName || form.primaryContact,
      phone: form.partnershipContactNumber || form.phone,
    };
    upsertPartner(partner);
    closeDrawer();
  };
  const archiveOrRestore = async () => {
    if (!selectedPartnerId || deleting) return;
    setDeleting(true); setDeleteError("");
    const store = usePartnerStore.getState();
    const success = await (selected?.archivedAt ? store.restorePartner(selectedPartnerId) : store.archivePartner(selectedPartnerId));
    setDeleting(false);
    if (success) closeDrawer();
    else setDeleteError(usePartnerStore.getState().lastError ?? "Could not update this organization.");
  };
  const removePartner = async () => {
    if (!selectedPartnerId || deleting) return;
    setDeleting(true);
    setDeleteError("");
    const deleted = await deletePartner(selectedPartnerId);
    setDeleting(false);
    if (deleted) closeDrawer();
    else setDeleteError("Could not delete this organization. Check your database connection and try again.");
  };

  return <>
      <motion.button type="button" aria-label="Close profile" className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeDrawer} />
      <motion.aside className={`${LEAF_CUT} profile-drawer fixed left-1/2 top-1/2 z-50 flex h-[min(920px,calc(100dvh-28px))] w-[min(1440px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border border-sky-200 bg-white/96 shadow-2xl backdrop-blur-2xl`}
        initial={reduceMotion ? false : { x: "38vw", opacity: 0, scale: .97 }} animate={{ x: 0, opacity: 1, scale: 1 }} exit={reduceMotion ? { opacity: 0 } : { x: "38vw", opacity: 0, scale: .97 }} transition={reduceMotion ? { duration: .08 } : { type: "spring", stiffness: 230, damping: 26 }}>
        <header className="profile-drawer-header flex shrink-0 items-center justify-between gap-4 border-b border-sky-200 px-6 py-5">
          <div><p className="eyebrow">{drawerMode === "create" ? "New organization" : "Organization profile"}</p><h2 className="mt-1 text-2xl font-semibold text-slate-800">{form.organizationName || "New record"}</h2></div>
          <button type="button" onClick={closeDrawer} aria-label="Close profile" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button>
        </header>

        <div className={`grid min-h-0 flex-1 gap-6 overflow-y-auto p-5 lg:p-7 ${drawerMode === "create" ? "grid-cols-1" : "lg:grid-cols-[minmax(0,1.7fr)_minmax(300px,.8fr)]"}`}>
          <section className="profile-edit-fields grid content-start gap-x-4 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="col-span-full flex items-center gap-3"><PartnerLogo acronym={form.acronym} name={form.organizationName || "Organization"} logoUrl={form.logoUrl} size="sm" /><label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"><ImagePlus size={16} />{form.logoUrl ? "Change logo" : "Add logo"}<input type="file" accept="image/*" className="sr-only" onChange={(e) => { void uploadLogo(e.target.files?.[0]); e.currentTarget.value = ""; }} /></label>{form.logoUrl && <button type="button" onClick={() => patch("logoUrl", "")} className="text-sm text-slate-500 hover:text-rose-600">Remove</button>}</div>
            <div className="col-span-full"><FieldLabel>Branch</FieldLabel><select className="form-select max-w-sm" value={form.category} onChange={(e) => patch("category", e.target.value as PartnerCategory)}>{PARTNER_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></div>
            {PROFILE_GROUPS.map((group) => <div key={group.title} className="contents">
              <h3 className="col-span-full border-b border-sky-100 pb-1 pt-2 text-xs font-bold uppercase tracking-[.12em] text-sky-700">{group.title}</h3>
              {group.fields.map(([key, label]) => <div key={key}><FieldLabel>{label}</FieldLabel><Input type={label.toLowerCase().includes("email") ? "email" : "text"} value={form[key]} onChange={(e) => patch(key, e.target.value)} /></div>)}
            </div>)}
          </section>

          {drawerMode !== "create" && <section className="min-w-0 lg:border-l lg:border-sky-200 lg:pl-6">
            <div className="mb-6">
              <h3 className="mb-3 text-lg font-semibold text-slate-800">Quick contacts</h3>
              <label htmlFor="profile-contact-email" className="mb-1 block text-xs text-slate-500">Email address to copy</label>
              <select id="profile-contact-email" className="form-select" value={selectedEmail?.role ?? ""} disabled={!emails.length} onChange={(event) => setEmailRole(event.target.value)}>
                {!emails.length && <option value="">No email address saved</option>}
                {emails.map((email) => <option key={email.role} value={email.role}>{email.label}: {email.value}</option>)}
              </select>
              <div className="mt-2 flex flex-wrap gap-2">
                <LeafButton variant="outline" className="px-3 py-2 text-xs" disabled={!selectedEmail} onClick={() => void copyContact(selectedEmail?.value ?? "", "Email address")}><ClipboardList size={14} />Copy email</LeafButton>
                <LeafButton variant="outline" className="px-3 py-2 text-xs" disabled={!phone} onClick={() => void copyContact(phone, "Phone number")}><Phone size={14} />Copy phone</LeafButton>
              </div>
              {links.length > 0 && <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2">{links.map((link) => <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-sky-700 hover:underline"><ExternalLink size={12} />{link.label}</a>)}</div>}
              {contactMessage && <p className="mt-2 text-xs text-slate-600" role="status">{contactMessage}</p>}
            </div>
            <div className="mb-2 flex items-center justify-between"><h3 className="text-lg font-semibold text-slate-800">Collaboration history</h3><span className="count-chip">{history.length}</span></div>
            {history.length ? <ul className="divide-y divide-sky-100">{history.map((collaboration) => <li key={collaboration.id} className="py-3"><p className="font-semibold text-slate-800">{collaboration.name}</p><p className="mt-1 text-sm text-slate-500">{collaboration.collaborationType} · {collaboration.status} · {collaboration.startDate || "Date TBD"}{collaboration.endDate && collaboration.endDate !== collaboration.startDate ? ` – ${collaboration.endDate}` : ""}{collaboration.startTime ? ` · ${collaboration.startTime}${collaboration.endTime ? `–${collaboration.endTime}` : ""}` : ""}</p><p title="Committees concerned with this collaboration" className="mt-1 text-sm text-slate-600">{collaboration.committees.length ? collaboration.committees.join(" · ") : "No committees set"}</p></li>)}</ul> : <p className="py-3 text-sm text-slate-400">No collaboration history yet.</p>}
          </section>}
        </div>
        <footer className="drawer-footer flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-sky-200 px-6 py-4">
          {drawerMode === "edit" && <div className="flex flex-wrap items-center gap-2">
            <LeafButton variant="outline" disabled={deleting} onClick={() => void archiveOrRestore()}>{selected?.archivedAt ? <RotateCcw size={16} /> : <Archive size={16} />}{selected?.archivedAt ? "Restore organization" : "Archive organization"}</LeafButton>
            {!confirmDelete ? <LeafButton variant="outline" className="border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50" onClick={() => { setConfirmDelete(true); setDeleteError(""); }}><Trash2 size={16} /> Delete organization</LeafButton> : <div className="flex flex-wrap items-center gap-2" role="alert">
              <span className="mr-1 text-sm font-medium text-rose-800">Permanently delete this organization and unlink it from collaborations?</span>
              <LeafButton variant="ghost" className="px-3 py-2 text-slate-600" disabled={deleting} onClick={() => { setConfirmDelete(false); setDeleteError(""); }}>Cancel</LeafButton>
              <LeafButton className="bg-rose-600 px-3 py-2 text-white hover:bg-rose-700" disabled={deleting} onClick={() => void removePartner()}>{deleting ? "Deleting…" : "Delete permanently"}</LeafButton>
            </div>}
            {deleteError && <span role="status" className="text-sm text-rose-700">{deleteError}</span>}
          </div>}
          <LeafButton onClick={save}><Save size={16} /> Save profile</LeafButton>
        </footer>
      </motion.aside>
  </>;
}
