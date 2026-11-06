import type { Officer, Partnership, PartnershipEvent, StickyNote } from "../types/partnership";

export type DataSnapshot = {
  partners: Partnership[];
  events: PartnershipEvent[];
  collaborationTypes: string[];
  committeeOptions: string[];
  notes: StickyNote[];
  officers: Officer[];
  empty: boolean;
  revision: string;
};

export function sameRecords(left: readonly unknown[], right: readonly unknown[]) {
  return left === right || JSON.stringify(left) === JSON.stringify(right);
}
