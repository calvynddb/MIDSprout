import { NextResponse } from "next/server";
import { ensureDatabaseSchema, getDatabasePool } from "@/lib/database";
import type { Partnership, PartnershipEvent } from "@/types/partnership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DataSnapshot = {
  partners: Partnership[];
  events: PartnershipEvent[];
  collaborationTypes: string[];
  committeeOptions: string[];
  empty: boolean;
  revision: string;
};

function getDatabaseDiagnostic(error: unknown) {
  const failure = error as { code?: unknown; message?: unknown };
  const code = typeof failure?.code === "string" ? failure.code : "unknown";
  const message = typeof failure?.message === "string" ? failure.message.toLowerCase() : "";
  if (message.includes("missing supabase postgresql connection string")) {
    return { code: "missing-connection-string", hint: "Confirm MIDSPROUTDATA_POSTGRES_URL is present in this Vercel environment." };
  }
  if (message.includes("must contain a postgresql connection url")) {
    return { code: "invalid-connection-string", hint: "Use the PostgreSQL pooler URL, not the Supabase HTTPS project URL." };
  }
  if (code === "28P01" || code === "P1000") {
    return { code: "database-authentication-failed", hint: "Update the Vercel connection URL with the current Supabase database password, then redeploy." };
  }
  if (code === "3D000") return { code: "database-not-found", hint: "Check that the connection URL ends with the correct database name, usually postgres." };
  if (code === "42501") return { code: "database-permission-denied", hint: "The database role cannot create or access the MIDSprout tables." };
  if (["ENOTFOUND", "EAI_AGAIN", "ETIMEDOUT", "ECONNREFUSED", "ECONNRESET"].includes(code)) {
    return { code: "database-network-error", hint: "Check that the URL uses Supabase's Transaction Pooler and that the database is active." };
  }
  if (code.startsWith("42")) return { code: "database-schema-error", hint: "A database table or schema operation failed. Check the Supabase database logs." };
  return { code: code === "unknown" ? "database-setup-failed" : `postgres-${code}`, hint: "Check the Supabase database logs for the failed request." };
}

async function readSnapshot(): Promise<DataSnapshot> {
  const pool = getDatabasePool();
  const [partners, collaborations, participants, committees, options, counts] = await Promise.all([
    pool.query<{ record: Partnership }>("select record from public.organizations order by id"),
    pool.query<{ id: string; record: PartnershipEvent }>("select id, record from public.collaborations order by id"),
    pool.query<{ collaboration_id: string; organization_id: string }>("select collaboration_id, organization_id from public.collaboration_participants"),
    pool.query<{ collaboration_id: string; committee: string }>("select collaboration_id, committee from public.collaboration_committees"),
    pool.query<{ kind: string; value: string }>("select kind, value from public.directory_options order by value"),
    pool.query<{ count: string; revision: string | null }>("select (select count(*) from public.organizations) + (select count(*) from public.collaborations) as count, (select max(updated_at) from (select updated_at from public.organizations union all select updated_at from public.collaborations union all select updated_at from public.directory_options) as updates) as revision"),
  ]);
  const peopleByCollaboration = new Map<string, string[]>();
  participants.rows.forEach(({ collaboration_id, organization_id }) => peopleByCollaboration.set(collaboration_id, [...(peopleByCollaboration.get(collaboration_id) ?? []), organization_id]));
  const committeesByCollaboration = new Map<string, string[]>();
  committees.rows.forEach(({ collaboration_id, committee }) => committeesByCollaboration.set(collaboration_id, [...(committeesByCollaboration.get(collaboration_id) ?? []), committee]));
  const collaborationTypes = options.rows.filter((option) => option.kind === "collaboration_type").map((option) => option.value);
  const committeeOptions = options.rows.filter((option) => option.kind === "committee").map((option) => option.value);
  return {
    partners: partners.rows.map((row) => row.record),
    events: collaborations.rows.map(({ id, record }) => ({
      ...record,
      id,
      committees: committeesByCollaboration.get(id) ?? record.committees ?? [],
      participants: (peopleByCollaboration.get(id) ?? record.participants?.map((item) => item.partnerId) ?? []).map((partnerId) => ({ partnerId })),
    })),
    collaborationTypes,
    committeeOptions,
    empty: Number(counts.rows[0]?.count ?? 0) === 0,
    revision: counts.rows[0]?.revision ?? "empty",
  };
}

async function savePartner(partner: Partnership) {
  const pool = getDatabasePool();
  await pool.query("insert into public.organizations(id, record, updated_at) values($1, $2::jsonb, now()) on conflict(id) do update set record=excluded.record, updated_at=now()", [partner.id, JSON.stringify(partner)]);
}

async function saveCollaboration(event: PartnershipEvent) {
  const pool = getDatabasePool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("insert into public.collaborations(id, record, updated_at) values($1, $2::jsonb, now()) on conflict(id) do update set record=excluded.record, updated_at=now()", [event.id, JSON.stringify({ ...event, committees: [], participants: [] })]);
    await client.query("delete from public.collaboration_participants where collaboration_id=$1", [event.id]);
    await client.query("delete from public.collaboration_committees where collaboration_id=$1", [event.id]);
    for (const participant of event.participants ?? []) {
      await client.query("insert into public.collaboration_participants(collaboration_id, organization_id) values($1,$2) on conflict do nothing", [event.id, participant.partnerId]);
    }
    for (const committee of event.committees ?? []) {
      await client.query("insert into public.collaboration_committees(collaboration_id, committee) values($1,$2) on conflict do nothing", [event.id, committee]);
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function GET() {
  try {
    await ensureDatabaseSchema();
    return NextResponse.json(await readSnapshot(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const diagnostic = getDatabaseDiagnostic(error);
    console.error("MIDSprout database read failed:", diagnostic.code);
    return NextResponse.json({ error: "Could not connect to the MIDSprout database.", diagnostic }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await request.json() as { action?: string; id?: string; partner?: Partnership; event?: PartnershipEvent; kind?: string; value?: string; snapshot?: Pick<DataSnapshot, "partners" | "events" | "collaborationTypes" | "committeeOptions"> };
    if (body.action === "bootstrap" && body.snapshot) {
      const pool = getDatabasePool();
      const client = await pool.connect();
      try {
        await client.query("begin");
        await client.query("select pg_advisory_xact_lock(72194011)");
        const { rows } = await client.query<{ count: string }>("select (select count(*) from public.organizations) + (select count(*) from public.collaborations) as count");
        if (Number(rows[0]?.count ?? 0) === 0) {
          for (const partner of body.snapshot.partners ?? []) await client.query("insert into public.organizations(id, record) values($1,$2::jsonb) on conflict(id) do nothing", [partner.id, JSON.stringify(partner)]);
          for (const option of body.snapshot.collaborationTypes ?? []) await client.query("insert into public.directory_options(kind,value) values('collaboration_type',$1) on conflict do nothing", [option]);
          for (const option of body.snapshot.committeeOptions ?? []) await client.query("insert into public.directory_options(kind,value) values('committee',$1) on conflict do nothing", [option]);
          for (const event of body.snapshot.events ?? []) {
            await client.query("insert into public.collaborations(id,record) values($1,$2::jsonb) on conflict do nothing", [event.id, JSON.stringify({ ...event, committees: [], participants: [] })]);
            for (const participant of event.participants ?? []) await client.query("insert into public.collaboration_participants(collaboration_id,organization_id) values($1,$2) on conflict do nothing", [event.id, participant.partnerId]);
            for (const committee of event.committees ?? []) await client.query("insert into public.collaboration_committees(collaboration_id,committee) values($1,$2) on conflict do nothing", [event.id, committee]);
          }
        }
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        throw error;
      } finally {
        client.release();
      }
      return NextResponse.json(await readSnapshot());
    }
    if (body.action === "upsert-organization" && body.partner?.id) await savePartner(body.partner);
    else if (body.action === "upsert-collaboration" && body.event?.id) await saveCollaboration(body.event);
    else if (body.action === "delete-organization" && body.id) {
      const result = await getDatabasePool().query("delete from public.organizations where id=$1", [body.id]);
      if (!result.rowCount) return NextResponse.json({ error: "Organization was not found." }, { status: 404 });
    } else if (body.action === "delete-collaboration" && body.id) {
      const result = await getDatabasePool().query("delete from public.collaborations where id=$1", [body.id]);
      if (!result.rowCount) return NextResponse.json({ error: "Collaboration was not found." }, { status: 404 });
    } else if (body.action === "add-option" && (body.kind === "collaboration_type" || body.kind === "committee") && body.value?.trim()) {
      await getDatabasePool().query("insert into public.directory_options(kind,value) values($1,$2) on conflict(kind,value) do update set updated_at=now()", [body.kind, body.value.trim()]);
    } else return NextResponse.json({ error: "Invalid database operation." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const diagnostic = getDatabaseDiagnostic(error);
    console.error("MIDSprout database write failed:", diagnostic.code);
    return NextResponse.json({ error: "Could not save to the MIDSprout database.", diagnostic }, { status: 503 });
  }
}
