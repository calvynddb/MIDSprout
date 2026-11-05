"use client";

import { ArrowDownUp, Search } from "lucide-react";
import type { PartnerSort } from "@/lib/partner-sorting";

export { orderPartners, type PartnerSort } from "@/lib/partner-sorting";

export function PartnerDirectoryControls({
  query,
  onQueryChange,
  sort,
  onSortChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  sort: PartnerSort;
  onSortChange: (value: PartnerSort) => void;
}) {
  return (
    <div className="partner-directory-controls">
      <label className="directory-search" aria-label="Search organizations">
        <Search size={17} aria-hidden="true" />
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search organizations" />
      </label>
      <label className="directory-sort" aria-label="Sort organizations">
        <ArrowDownUp size={15} aria-hidden="true" />
        <select value={sort} onChange={(event) => onSortChange(event.target.value as PartnerSort)}>
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="email-asc">Email A–Z</option>
          <option value="email-desc">Email Z–A</option>
          <option value="contact-asc">Contact A–Z</option>
          <option value="contact-desc">Contact Z–A</option>
          <option value="branch-asc">Branch A–Z</option>
          <option value="branch-desc">Branch Z–A</option>
          <option value="acronym-asc">Acronym A–Z</option>
          <option value="acronym-desc">Acronym Z–A</option>
        </select>
      </label>
    </div>
  );
}
