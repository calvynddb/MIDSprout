import type { Officer, StickyNote } from "../types/partnership";

export type WorkspaceKind = "note" | "officer";
export interface WorkspaceSnapshot { notes: StickyNote[]; officers: Officer[]; setupRequired: boolean }
export class WorkspaceError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}
export function workspaceId(value: unknown): string {
  if (typeof value !== "string" || !/^[\w-]{1,160}$/.test(value)) throw new WorkspaceError("Invalid workspace record ID.");
  return value;
}
function text(value: unknown, maximum: number, label: string): string {
  if (typeof value !== "string" || value.length > maximum) throw new WorkspaceError(`${label} is too long or invalid.`);
  return value.trim();
}
export function workspaceRecord(kind: WorkspaceKind, input: unknown): StickyNote | Officer {
  if (!input || typeof input !== "object") throw new WorkspaceError("Missing workspace record.");
  const record = input as Record<string, unknown>;
  const id = workspaceId(record.id);
  if (kind === "officer") {
    const name = text(record.name, 120, "Officer name");
    if (!name) throw new WorkspaceError("Enter an officer name.");
    return { id, name };
  }
  const title = text(record.title, 120, "Title"), body = text(record.body, 4000, "Note");
  if (!title && !body) throw new WorkspaceError("Write a title or a note.");
  if (!["yellow", "blue", "pink", "green"].includes(String(record.color))) throw new WorkspaceError("Invalid note color.");
  if (![record.x, record.y].every((value) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1)) throw new WorkspaceError("Note position must be inside Home.");
  if (!Number.isInteger(record.zIndex) || Number(record.zIndex) < 0 || Number(record.zIndex) > 1_000_000) throw new WorkspaceError("Invalid note order.");
  const officerId = record.officerId == null ? null : workspaceId(record.officerId);
  return { id, title, body, color: record.color as StickyNote["color"], officerId, x: record.x as number, y: record.y as number, zIndex: record.zIndex as number };
}
export function expectedVersion(value: unknown): number {
  if (!Number.isInteger(value) || Number(value) < 0) throw new WorkspaceError("Refresh the record before saving.");
  return value as number;
}
export function nextWorkspaceRecord(record: StickyNote | Officer, previous: StickyNote | Officer | undefined, version: number) {
  if ((previous?.version ?? 0) !== version) throw new WorkspaceError("This record changed on another device. Refresh and review your changes.", 409);
  return { ...record, archivedAt: previous?.archivedAt ?? null, version: version + 1 };
}
