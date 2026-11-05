import type { PartnershipEvent } from "../types/partnership";

export function todayInManila(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function isOverdue(dueDate: string, done: boolean, today = todayInManila()) { return Boolean(dueDate && !done && dueDate < today); }
export function duplicateCollaboration(event: PartnershipEvent): PartnershipEvent {
  return { ...structuredClone(event), id: `collaboration-${crypto.randomUUID()}`, name: `${event.name} (copy)`, archivedAt: null, status: "planning", startDate: "", endDate: "", startTime: "", endTime: "", participants: event.participants.map(({ partnerId }) => ({ partnerId, status: "planned", notes: "" })), tasks: (event.tasks ?? []).map((task) => ({ ...task, id: `task-${crypto.randomUUID()}`, dueDate: "", done: false })) };
}
