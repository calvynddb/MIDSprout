"use client";

import { Search } from "lucide-react";
import type { PartnerSort } from "@/lib/partner-sorting";

export { orderPartners, type PartnerSort } from "@/lib/partner-sorting";

export function PartnerDirectoryControls({
  query,
  onQueryChange,
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

    </div>
  );
}
