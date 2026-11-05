import type { Partnership } from "@/types/partnership";

const sortFields = {
  name: "organizationName",
  acronym: "acronym",
  branch: "category",
  email: "email",
  contact: "primaryContact",
} as const;

export type PartnerSortField = keyof typeof sortFields;
export type PartnerSort = `${PartnerSortField}-${"asc" | "desc"}`;

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

export function nextPartnerSort(current: PartnerSort, field: PartnerSortField): PartnerSort {
  return `${field}-${current === `${field}-asc` ? "desc" : "asc"}`;
}

export function orderPartners(partners: Partnership[], sort: PartnerSort) {
  const [key, direction] = sort.split("-") as [PartnerSortField, "asc" | "desc"];
  const field = sortFields[key];
  return [...partners].sort((left, right) => {
    const idOrder = left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
    const a = (left[field] || "").trim();
    const b = (right[field] || "").trim();
    if (!a || !b) return a === b ? idOrder : !a ? 1 : -1;
    const comparison = collator.compare(a, b);
    return (direction === "desc" ? -comparison : comparison) || idOrder;
  });
}
