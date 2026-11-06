import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { onceSuccessful } from '../src/lib/once-successful.ts';
import { sameRecords } from '../src/lib/data-snapshot.ts';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const snapshot = {
  partners: [], events: [], collaborationTypes: [], committeeOptions: [],
  notes: [{ id: 'note-1', title: 'Reminder', version: 1 }],
  officers: [{ id: 'officer-1', name: 'Ana', version: 1 }],
  empty: false, revision: 'unchanged-directory-revision',
};
const response = (body, ok = true) => ({ ok, json: async () => structuredClone(body) });
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

function workspaceStore(fetch) {
  const output = ts.transpileModule(fs.readFileSync('src/store/workspace-store.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'fetch', output)(
    (name) => name === '@/lib/data-snapshot' ? { sameRecords } : require(name),
    module, module.exports, fetch,
  );
  return module.exports.useWorkspaceStore;
}

test('schema setup shares concurrent work and retains successful setup', async () => {
  const pending = deferred();
  let calls = 0;
  const ensure = onceSuccessful(async () => { calls++; await pending.promise; });
  const first = ensure();
  assert.equal(first, ensure());
  pending.resolve();
  await first;
  await ensure();
  assert.equal(calls, 1);
});

test('failed setup is retried instead of caching its rejection', async () => {
  let calls = 0;
  const ensure = onceSuccessful(async () => { if (++calls === 1) throw new Error('temporary failure'); });
  await assert.rejects(ensure(), /temporary failure/);
  await ensure();
  assert.equal(calls, 2);
});

test('unchanged polls retain note and officer array references', async () => {
  let calls = 0;
  const store = workspaceStore(async () => { calls++; return response(snapshot); });
  await store.getState().refresh();
  const first = store.getState();
  await store.getState().refresh();
  assert.equal(store.getState().notes, first.notes);
  assert.equal(store.getState().officers, first.officers);
  assert.equal(calls, 2, 'each completed refresh fetches current data without response caching');
});

test('workspace changes and removals refresh even when directory revision is unchanged', async () => {
  let next = snapshot;
  const store = workspaceStore(async () => response(next));
  await store.getState().refresh();
  const first = store.getState();
  next = { ...snapshot, notes: [{ ...snapshot.notes[0], title: 'Changed', version: 2 }] };
  await store.getState().refresh();
  assert.equal(store.getState().notes[0].title, 'Changed');
  assert.equal(store.getState().officers, first.officers);
  next = { ...next, officers: [] };
  await store.getState().refresh();
  assert.deepEqual(store.getState().officers, []);
});

test('a read started before a workspace save cannot overwrite the saved result', async () => {
  const pending = deferred();
  const saved = { ...snapshot, notes: [{ ...snapshot.notes[0], title: 'Saved', version: 2 }] };
  const store = workspaceStore(async (_url, options) => options.method === 'POST' ? response(saved) : pending.promise);
  const refreshing = store.getState().refresh();
  assert.equal(await store.getState().upsertNote(saved.notes[0]), true);
  pending.resolve(response(snapshot));
  assert.equal(await refreshing, null);
  assert.equal(store.getState().notes[0].title, 'Saved');
});

test('overlapping refreshes do not duplicate GETs and failed reads can recover', async () => {
  const pending = deferred();
  let calls = 0;
  const store = workspaceStore(async () => { calls++; return calls === 1 ? pending.promise : response(snapshot); });
  const first = store.getState().refresh();
  assert.equal(await store.getState().refresh(), null);
  assert.equal(calls, 1);
  pending.resolve(response({ error: 'temporary failure' }, false));
  assert.equal(await first, null);
  assert.equal(store.getState().error, 'temporary failure');
  await store.getState().refresh();
  assert.equal(store.getState().error, null);
  assert.equal(calls, 2);
});
