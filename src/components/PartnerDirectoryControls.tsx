"use client";

import { ArrowDownUp, Search } from "lucide-react";
import type { Partnership } from "@/types/partnership";

export type PartnerSort = "name-asc" | "name-desc" | "email-asc" | "contact-asc";

export function orderPartners(partners: Partnership[], sort: PartnerSort) {
  const field = sort === "email-asc" ? "email" : sort === "contact-asc" ? "primaryContact" : "organizationName";
  return [...partners].sort((left, right) => {
    const comparison = left[field].localeCompare(right[field], undefined, { sensitivity: "base" });
    return sort === "name-desc" ? -comparison : comparison;
  });
}

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
          <option value="contact-asc">Contact A–Z</option>
        </select>
      </label>
    </div>
  );
}
