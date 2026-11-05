import { NextResponse } from "next/server";
import { readWorkspace, writeWorkspace } from "@/lib/workspace-data";
import { WorkspaceError } from "@/lib/workspace-validation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return NextResponse.json(await readWorkspace(), { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ error: "Could not load shared notes and officers." }, { status: 503 }); }
}
export async function POST(request: Request) {
  try { return NextResponse.json(await writeWorkspace(await request.json())); }
  catch (error) { return NextResponse.json({ error: error instanceof WorkspaceError ? error.message : "Could not save the shared workspace." }, { status: error instanceof WorkspaceError ? error.status : error instanceof SyntaxError ? 400 : 503 }); }
}
