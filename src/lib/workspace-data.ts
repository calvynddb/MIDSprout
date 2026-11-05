import { getDatabasePool } from "@/lib/database";
import type { Officer, StickyNote } from "@/types/partnership";
import { expectedVersion, nextWorkspaceRecord, workspaceId, workspaceRecord, WorkspaceError, type WorkspaceKind, type WorkspaceSnapshot } from "./workspace-validation";

export async function ensureWorkspaceSchema() {
  await getDatabasePool().query(`
    create table if not exists public.workspace_items (
      kind text not null check (kind in ('note','officer')),
      id text not null,
      record jsonb not null,
      updated_at timestamptz not null default now(),
      primary key (kind,id)
    );
    alter table public.workspace_items enable row level security;
  `);
}

export async function readWorkspace(): Promise<WorkspaceSnapshot> {
  try {
    const result = await getDatabasePool().query<{ kind: WorkspaceKind; record: StickyNote | Officer }>("select kind, record from public.workspace_items order by id");
    return { notes: result.rows.filter((row) => row.kind === "note").map((row) => row.record as StickyNote), officers: result.rows.filter((row) => row.kind === "officer").map((row) => row.record as Officer), setupRequired: false };
  } catch (error) {
    if ((error as { code?: string }).code === "42P01") return { notes: [], officers: [], setupRequired: true };
    throw error;
  }
}

export async function writeWorkspace(input: unknown): Promise<WorkspaceSnapshot> {
  if (!input || typeof input !== "object") throw new WorkspaceError("Invalid workspace operation.");
  const body = input as Record<string, unknown>;
  const kind = body.action === "upsert-note" ? "note" : body.action === "upsert-officer" ? "officer" : body.kind;
  if (kind !== "note" && kind !== "officer") throw new WorkspaceError("Invalid workspace record kind.");
  const upsert = body.action === "upsert-note" || body.action === "upsert-officer";
  if (!upsert && body.action !== "archive" && body.action !== "restore") throw new WorkspaceError("Invalid workspace operation.");
  const record = upsert ? workspaceRecord(kind, kind === "note" ? body.note : body.officer) : undefined;
  const id = record?.id ?? workspaceId(body.id);
  const version = expectedVersion(body.expectedVersion ?? (kind === "note" ? (body.note as StickyNote)?.version : (body.officer as Officer)?.version) ?? 0);
  const client = await getDatabasePool().connect();
  try {
    await client.query("begin");
    if (kind === "officer") await client.query("select pg_advisory_xact_lock(hashtext('workspace:officer-roster'))");
    await client.query("select pg_advisory_xact_lock(hashtext($1))", [`workspace:${kind}:${id}`]);
    const current = await client.query<{ record: StickyNote | Officer }>("select record from public.workspace_items where kind=$1 and id=$2 for update", [kind, id]);
    const previous = current.rows[0]?.record;
    if (!upsert && !previous) throw new WorkspaceError("This workspace record no longer exists.", 404);
    const next = nextWorkspaceRecord(record ?? previous!, previous, version);
    if (!upsert) next.archivedAt = body.action === "archive" ? new Date().toISOString() : null;
    if (kind === "note" && (next as StickyNote).officerId) {
      const officer = await client.query<{ record: Officer }>("select record from public.workspace_items where kind='officer' and id=$1", [(next as StickyNote).officerId]);
      if (!officer.rows[0] || (officer.rows[0].record.archivedAt && (previous as StickyNote | undefined)?.officerId !== (next as StickyNote).officerId)) throw new WorkspaceError("Choose an active officer.");
    }
    if (kind === "officer" && !next.archivedAt) {
      const duplicate = await client.query("select id from public.workspace_items where kind='officer' and id<>$1 and record->>'archivedAt' is null and lower(trim(record->>'name'))=lower($2)", [id, (next as Officer).name]);
      if (duplicate.rowCount) throw new WorkspaceError("An active officer already has this name.");
    }
    await client.query("insert into public.workspace_items(kind,id,record,updated_at) values($1,$2,$3::jsonb,now()) on conflict(kind,id) do update set record=excluded.record,updated_at=now()", [kind, id, JSON.stringify(next)]);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    if ((error as { code?: string }).code === "42P01") throw new WorkspaceError("Shared notes need the workspace setup SQL applied first.", 503);
    throw error;
  } finally { client.release(); }
  return readWorkspace();
}
