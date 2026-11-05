# Next-agent handoff — additive V2 on V1

## Status and boundaries

The user explicitly stopped implementation and requested this handoff. Do not resume implementation until the user asks. All feature work is uncommitted; nothing has been pushed or deployed. All subagents have completed. A localhost dev server and read-only checks from the interrupted tool call may still be running; inspect before starting duplicate processes.

V1 baseline: `e1b9a92` (`fix search`). The earlier broad V2 rewrite was rejected and restored. The user wants small additions ON TOP of V1, preserving its identity, spacing, windows, buttons, and animation. Do not reintroduce the abandoned shared page shell, native dialog replacement, generic tables, or alternate storage system.

Read `C:/Users/Calvyn/Downloads/CLAUDE.md`, repository AGENTS.md, and relevant installed Next.js documentation before editing. Follow the Agent Skills incremental workflow, Ponytail simplicity, and ECC verification guidance. The user permits subagents; isolate write ownership. Do not commit, push, deploy, or silently run live database migrations.

## Database constraints — essential

- `src/lib/database.ts` is BYTE-FOR-BYTE identical to V1; verified again while preparing this handoff. Git may still show it modified because of stat/line-ending metadata, but content comparison against `git show HEAD:src/lib/database.ts` returns exact equality.
- `src/lib/sync-client.ts` also matches V1 exactly.
- Preserve connection variables, URL precedence, Supabase pooler, SSL behavior, pool settings, and existing localStorage keys/defaults/migrations. Do not replace V1 storage or add an alternate database connection.
- Latest user authorization permits shared notes, archiving, and collaboration enhancements as long as database connections do not change. Small additive API/store extensions now support these features; original persisted-store configurations remain.
- Local GET `/api/data` currently returns503 with diagnostic `missing-connection-string`. This is the existing V1 connection configuration, NOT a reason to change its code, invent credentials, or substitute another store.
- New `/api/workspace` also currently returns503 because no local connection string is available. If a connection exists but the new table does not, the endpoint returns empty arrays with `setupRequired:true`.
- `db/migrations/003_shared_workspace.sql` prepares ONE new table, `public.workspace_items`, for notes/officers, using the existing connection. It is unapplied. It enables RLS with no public policies. Review/backup and obtain explicit authorization before applying it to a live database; do not silently execute it as part of QA.
- Do not run real writes or destructive delete tests against the existing configured database. Use mocked/isolated test data with an explicitly approved test database.

## Features already implemented

### Small, verified V1 additions from the previous completed turn
- Clickable organization headings and single-field name/acronym/branch/contact/email sorting in both directions, natural numeric sorting, blank values last, stable ID ties.
- CSV/XLSX export for selected, filtered, or all organizations. ExcelJS loads on demand; IDs/phones stay text, headers are frozen/filterable. Export only; no CSV import.
- Contact shortcuts in the existing profile sidebar; deduplicated email copying.
- Back to Tree button in Branches.
- Missing branch-color fallback fixed for the opaque Tree tab.
- V1 centered popups, row/container dimensions, button component, hover effects, expanding category tabs, and smoke remain the baseline.

### Current turn: implemented but persistence/browser integration not fully verified
- Home collaboration-list region is now a THIRD DepthButton matching Branches and Tree. Existing Home frame/grid is retained. Add collaboration shortcut remains available in the statistics cell.
- New `CollaborationsView` follows V1 Brand/header/file-sheet/grid-row layout with search, filters, sorting, archived view, restore, and duplication.
- Existing EventDrawer outer centered spring aside remains; its content adds officer selection, per-participant progress/notes, and task checklists with optional officer/due date/done state.
- OfficerManager uses a centered V1-style spring popup. OfficerSelect is shared with notes. No authentication or notifications.
- Shared Home notes: title/text/color/officer; pointer and keyboard movement; normalized shared coordinates; archive/restore/list/show-hide; centered popup; dirty-close/unload guards and locked fields while saving.
- WorkspaceSync polls the new workspace endpoint every5s and on focus/visibility, separately from the ORIGINAL V1 data synchronization.
- Organization/collaboration archiving adds JSON `archivedAt`, retaining rows and joins. Existing permanent-delete controls remain; do not trigger them during tests. Directory archived filters and archive/restore actions are additive.
- Existing collaboration JSON now retains participant status/notes and tasks/officer while the original participant/committee join tables remain authoritative.
- Note/officer writes have captured-version conflicts. Original organization/collaboration storage architecture has NOT been replaced with a new versioned repository.

## Current animation implementation

`SpatialCanvas.tsx` separates requested `view` from `displayedView`:
1. Start the original1.12s smoky overlay and mark the page inert/busy.
2. At420ms, switch the displayed page while smoke covers it.
3. New page uses V1 blur/scale entrance; no AnimatePresence exit delay holding up the swap.
4. At1120ms, clear busy/overlay.
5. Returning Home retains the original5s background settling effect.

Timer cleanup prevents stale transitions. The last tiny change adds `lastMotionPreference` so changing reduced-motion preference during a transition cannot leave the page stuck. That final guard was added AFTER the last completed full verification batch; rerun checks.

Browser observation BEFORE interruption: at100ms Home was still visible and inert; after the covered swap Branches appeared; after completion busy was false. No real data writes were used.

## Verification already completed

-20 Node builtin tests passed across sorting, exports, contact helpers, collaboration duplication/Manila dates, note positions, workspace validation/version conflicts, and connection identity.
- Full TypeScript and full ESLint passed before the last small reduced-motion guard.
- Local production build passed before that final guard.
- Browser confirmed three Home DepthButtons: Branches, Collaborations, Tree, and shared-note controls.
- Note editor center offset was exactly[0,0]; officer dropdown present.
- Previous completed turn confirmed original profile editor center[0,0], export menu, and heading sorting.
- No note/officer SQL persistence, archive/restore SQL behavior, or cross-device note syncing has been tested against a working database.
- Final tool call was INTERRUPTED. It attempted to navigate Home -> Collaborations -> Add collaboration and measure centering/tasks/officer fields, then rerun connection checks/TypeScript/lint. Treat its outcome as UNKNOWN; inspect UI/processes and rerun. Do not claim those checks passed.

## What to do next — in order

1. **Inventory only first.** Read git diff/status and this handoff. Confirm database.ts and original sync-client still exactly match V1. Check current localhost3000 and any active lint/typecheck sessions. Do not reset user work or copy the old V2 backup wholesale.
2. **Rerun local checks.** `node --test tests/*.test.mjs`; `node node_modules/typescript/bin/tsc --noEmit --incremental false`; `npm run lint`; `npm run build` only if subsequent code changes justify it. Builtin Node tests may emit MODULE_TYPELESS_PACKAGE_JSON warnings; do not change the app's module configuration just to silence them.
3. **Finish read-only browser integration.** Test all navigation directions, especially Tree -> Branches -> Back to Tree and Home -> Collaborations. Verify smoke covers before content switches, no premature frame, no double-click glitches, no permanently inert screen, and reduced motion. Check mouse, keyboard, touch, and rapid repeated navigation.
4. **Check layout against V1.** Preserve existing dimensions, padding, row density, typography, leaf buttons, hover/glow, and active-tab enlargement. Check Home's new third button at desktop and mobile. Fix only concrete regressions, without redesigning neighboring screens.
5. **Verify centered windows.** Open organization, collaboration, officer, note, and export controls. Compare center offsets and viewport bounds. Test tasks/participants inside the existing collaboration editor. Test Escape, dirty-close/unload warnings, busy save protection, and scroll containment. Avoid saving live test records.
6. **Resolve persistence verification with user involvement.** Report the missing LOCAL connection string and unapplied migration. Ask the user to provide/use the intended existing configuration or an approved test environment; do not change database connections or silently apply live SQL. Once approved, validate the additive migration on a backup/test database first.
7. **Test actual shared data.** With an approved test DB, use two browser contexts to verify note edits/moves/officer tags, captured-version409s, officer renames preserving references, archive/restore preserving relationships, task state and participant notes surviving polling/reload. Check all older V1 fields and browser persistence remain intact. Clean up only clearly identified test records.
8. **Audit potential remaining edge cases.** Check new workspace refresh error clears on successful recovery without stale polls overwriting writes; review concurrent note writes and archive metadata; verify duplication excludes archived references where appropriate. These are review targets, not permission for unrelated refactors.
9. **Final narrow review.** Recheck connection-file hashes and retained V1 persistence settings. Rerun only checks affected by new edits. Report tested facts, blocked verification, and exact remaining setup. Leave changes local unless the user explicitly authorizes shipping.

## Important files and artifacts

- Existing storage extensions: `src/app/api/data/route.ts`, `src/store/event-store.ts`, `src/store/partner-store.ts`.
- New shared persistence: `src/app/api/workspace/route.ts`, `src/lib/workspace-data.ts`, `src/lib/workspace-validation.ts`, `src/store/workspace-store.ts`.
- New UI: `src/components/SharedNotes.tsx`, `src/components/shared-notes/*`, `src/components/OfficerManager.tsx`, `src/components/views/CollaborationsView.tsx`, `src/components/WorkspaceSync.tsx`.
- Original windows/styles remain in `PartnerDrawer.tsx`, `EventDrawer.tsx`, original `globals.css` plus small additions.
- `.local/connection-before-shared-features.sha256` is the current protected-connection baseline.
- `.local/pre-v2-globals.css` preserves the user's pre-existing search animation timing.
- `.local/midsprout-v2.json` and `.local/collaboration-qa.mjs` belong to the ABANDONED first rewrite. They are NOT active storage. Do not import that JSON or run the stale QA script against current endpoints.
- Abandoned rewrite backup: `C:/Users/Calvyn/.codex/visualizations/2026/11/04/01a1a7a2-0726-7101-b401-af5f33422ca9/v2-before-v1-restore-1793854048645`. Its old plan is historical context ONLY; its replacement-shell/storage decisions were rejected.

## Still deferred

Gmail, passcode/login, document uploads/links, and CSV import. Do not add these while finishing the currently authorized features.
