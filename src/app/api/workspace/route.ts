import { NextResponse } from "next/server";
import { ensureWorkspaceSchema, readWorkspace, writeWorkspace } from "@/lib/workspace-data";
import { WorkspaceError } from "@/lib/workspace-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureWorkspaceSchema();
    const result = await readWorkspace();
    if (result.setupRequired) {
      return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    if (code === "42P01") {
      return NextResponse.json({ notes: [], officers: [], setupRequired: true }, { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ error: "Could not load shared notes and officers.", notes: [], officers: [], setupRequired: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  try { await ensureWorkspaceSchema(); return NextResponse.json(await writeWorkspace(await request.json())); }
  catch (error) { return NextResponse.json({ error: error instanceof WorkspaceError ? error.message : "Could not save the shared workspace." }, { status: error instanceof WorkspaceError ? error.status : error instanceof SyntaxError ? 400 : 503 }); }
}
