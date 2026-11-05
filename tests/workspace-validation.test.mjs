import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { workspaceId, workspaceRecord, expectedVersion, nextWorkspaceRecord } from '../src/lib/workspace-validation.ts';
const note = { id:'note-1',title:'Team reminder',body:'A note',color:'blue',officerId:null,x:.25,y:.75,zIndex:3 };
test('notes validate and trim content without copying unknown fields',()=>{
  assert.deepEqual(workspaceRecord('note',{...note,title:' Team reminder ',version:100,extra:'drop'}),note);
  assert.throws(()=>workspaceRecord('note',{...note,x:NaN}));
  assert.throws(()=>workspaceRecord('note',{...note,y:1.01}));
  assert.throws(()=>workspaceRecord('note',{...note,color:'red'}));
  assert.throws(()=>workspaceRecord('note',{...note,title:' ',body:''}));
  assert.throws(()=>workspaceRecord('note',{...note,zIndex:-1}));
});
test('officer names and record identifiers are bounded',()=>{
  assert.deepEqual(workspaceRecord('officer',{id:'officer-1',name:' Ana '}),{id:'officer-1',name:'Ana'});
  assert.throws(()=>workspaceRecord('officer',{id:'officer-1',name:''}));
  assert.throws(()=>workspaceId('../outside'));
  assert.throws(()=>workspaceRecord('note',{...note,body:'a'.repeat(4001)}));
});
test('captured versions reject stale saves and preserve archive metadata',()=>{
  assert.equal(expectedVersion(0),0);
  assert.throws(()=>expectedVersion(-1));
  const previous={...note,version:2,archivedAt:'2026-11-05T00:00:00.000Z'};
  assert.throws(()=>nextWorkspaceRecord(note,previous,1),e=>e.status===409);
  assert.deepEqual(nextWorkspaceRecord({...note,title:'Changed'},previous,2),{...note,title:'Changed',version:3,archivedAt:previous.archivedAt});
  assert.equal(nextWorkspaceRecord(note,undefined,0).version,1);
});
test('database connection configuration remains byte-for-byte V1',()=>{
  const baseline=execFileSync('git',['show','HEAD:src/lib/database.ts']);
  assert.ok(fs.readFileSync('src/lib/database.ts').equals(baseline));
});
