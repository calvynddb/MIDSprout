import { test } from 'node:test';
import assert from 'node:assert/strict';
import { todayInManila, isOverdue, duplicateCollaboration } from '../src/lib/collaboration-features.ts';
test('due dates use Manila calendar days', () => {
  assert.equal(todayInManila(new Date('2026-11-04T18:00:00Z')), '2026-11-05');
  assert.equal(isOverdue('2026-11-04', false, '2026-11-05'), true);
  assert.equal(isOverdue('2026-11-04', true, '2026-11-05'), false);
  assert.equal(isOverdue('', false, '2026-11-05'), false);
});
test('duplication keeps setup but resets dates and progress without modifying source', () => {
  const original={id:'e1',name:'Event',description:'Details',collaborationType:'Joint',committees:['PR'],officerId:'o1',status:'confirmed',startDate:'2026-01-01',endDate:'2026-01-02',startTime:'10:00',endTime:'12:00',location:'Campus',archivedAt:'2026-01-03',participants:[{partnerId:'p1',status:'confirmed',notes:'Response'}],tasks:[{id:'t1',title:'Prepare',officerId:'o1',dueDate:'2026-01-01',done:true}]};
  const copy=duplicateCollaboration(original);
  assert.notEqual(copy.id,original.id); assert.equal(copy.status,'planning'); assert.equal(copy.startDate,''); assert.equal(copy.archivedAt,null);
  assert.deepEqual(copy.participants,[{partnerId:'p1',status:'planned',notes:''}]); assert.equal(copy.tasks[0].done,false); assert.equal(copy.tasks[0].dueDate,''); assert.notEqual(copy.tasks[0].id,'t1'); assert.equal(copy.officerId,'o1');
  copy.committees.push('New'); assert.deepEqual(original.committees,['PR']); assert.equal(original.tasks[0].done,true);
});
