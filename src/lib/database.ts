import { Pool } from "pg";

const globalForDatabase = globalThis as typeof globalThis & { midsproutPool?: Pool };

function createPool() {
  const connectionString = process.env.MIDSPROUTDATA_URL ?? process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing MIDSPROUTDATA_URL database connection string.");
  if (!/^postgres(ql)?:\/\//i.test(connectionString)) {
    throw new Error("MIDSPROUTDATA_URL must be a PostgreSQL connection URL from Supabase.");
  }
  return new Pool({ connectionString, max: 4, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 10_000 });
}

export function getDatabasePool() {
  globalForDatabase.midsproutPool ??= createPool();
  return globalForDatabase.midsproutPool;
}

export async function ensureDatabaseSchema() {
  const pool = getDatabasePool();
  await pool.query(`
    create table if not exists public.organizations (
      id text primary key,
      record jsonb not null,
      updated_at timestamptz not null default now()
    );
    create table if not exists public.collaborations (
      id text primary key,
      record jsonb not null,
      updated_at timestamptz not null default now()
    );
    create table if not exists public.collaboration_participants (
      collaboration_id text not null references public.collaborations(id) on delete cascade,
      organization_id text not null references public.organizations(id) on delete cascade,
      primary key (collaboration_id, organization_id)
    );
    create table if not exists public.collaboration_committees (
      collaboration_id text not null references public.collaborations(id) on delete cascade,
      committee text not null,
      primary key (collaboration_id, committee)
    );
    create table if not exists public.directory_options (
      kind text not null check (kind in ('collaboration_type','committee')),
      value text not null,
      updated_at timestamptz not null default now(),
      primary key (kind, value)
    );
    alter table public.directory_options add column if not exists updated_at timestamptz not null default now();
  `);
}

