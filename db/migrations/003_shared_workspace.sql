-- Apply manually to the EXISTING configured PostgreSQL database after review/backup.
-- No connection settings, existing tables or records are changed by this migration.
begin;
create table if not exists public.workspace_items (
  kind text not null check (kind in ('note','officer')),
  id text not null,
  record jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (kind,id)
);
alter table public.workspace_items enable row level security;
comment on table public.workspace_items is 'Shared Home notes and officer roster; accessed through the existing server pool.';
commit;
-- No anonymous/public policies are added. The existing server database role must own
-- this table or have server-only access. Do not put database credentials in the browser.
