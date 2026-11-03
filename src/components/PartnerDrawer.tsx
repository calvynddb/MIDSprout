"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ImagePlus, Save, X } from "lucide-react";
import { useMemo, useState } from "react";
import { FieldLabel, Input } from "@/components/ui/input";
import { PartnerLogo } from "@/components/PartnerLogo";
import { LeafButton } from "@/components/ui/leaf-button";
import { LEAF_CUT } from "@/lib/utils";
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
  const events = useEventStore((s) => s.events);
  const reduceMotion = useReducedMotion();
  const history = useMemo(() => events.flatMap((event) => {
    const participation = event.participants.find((item) => item.partnerId === selectedPartnerId);
    return participation ? [event] : [];
  }), [events, selectedPartnerId]);
  const [form, setForm] = useState<Partnership>(() => drawerMode === "create" ? emptyPartner(initialCategory ?? undefined) : normalizePartner(selected));

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

  return <>
      <motion.button type="button" aria-label="Close profile" className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeDrawer} />
      <motion.aside className={`${LEAF_CUT} fixed left-1/2 top-1/2 z-50 flex h-[min(920px,calc(100vh-28px))] w-[min(1440px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border border-sky-200 bg-white/96 shadow-2xl backdrop-blur-2xl`}
        initial={reduceMotion ? false : { x: "38vw", opacity: 0, scale: .97 }} animate={{ x: 0, opacity: 1, scale: 1 }} exit={reduceMotion ? { opacity: 0 } : { x: "38vw", opacity: 0, scale: .97 }} transition={reduceMotion ? { duration: .08 } : { type: "spring", stiffness: 230, damping: 26 }}>
        <header className="flex items-center justify-between gap-4 border-b border-sky-200 px-6 py-5">
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
            <div className="mb-2 flex items-center justify-between"><h3 className="text-lg font-semibold text-slate-800">Collaboration history</h3><span className="count-chip">{history.length}</span></div>
            {history.length ? <ul className="divide-y divide-sky-100">{history.map((collaboration) => <li key={collaboration.id} className="py-3"><p className="font-semibold text-slate-800">{collaboration.name}</p><p className="mt-1 text-sm text-slate-500">{collaboration.collaborationType} · {collaboration.status} · {collaboration.startDate || "Date TBD"}{collaboration.endDate && collaboration.endDate !== collaboration.startDate ? ` – ${collaboration.endDate}` : ""}{collaboration.startTime ? ` · ${collaboration.startTime}${collaboration.endTime ? `–${collaboration.endTime}` : ""}` : ""}</p><p title="Committees concerned with this collaboration" className="mt-1 text-sm text-slate-600">{collaboration.committees.length ? collaboration.committees.join(" · ") : "No committees set"}</p></li>)}</ul> : <p className="py-3 text-sm text-slate-400">No collaboration history yet.</p>}
          </section>}
        </div>
        <footer className="flex items-center justify-end gap-3 border-t border-sky-200 px-6 py-4"><LeafButton onClick={save}><Save size={16} /> Save profile</LeafButton></footer>
      </motion.aside>
  </>;
}
