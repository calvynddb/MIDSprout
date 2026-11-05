import test from 'node:test';
import assert from 'node:assert/strict';
import { notePosition, normalizedPosition, noteScale } from '../src/lib/note-position.ts';

test('notes stay inside a smaller screen without changing shared coordinates', () => {
  assert.deepEqual(notePosition(.5,.5,1000,800), {left:376,top:288,horizontal:752,vertical:576});
  const small = notePosition(1,1,200,100);
  assert.equal(small.left + 248 * noteScale(200,100), 200);
  assert.equal(small.top + 224 * noteScale(200,100), 100);
});
test('drag coordinates clamp to board edges and normalize safely', () => {
  assert.deepEqual(normalizedPosition(-20,800,752,576), {x:0,y:1});
  assert.deepEqual(normalizedPosition(20,30,0,0), {x:0,y:0});
  assert.deepEqual(normalizedPosition(376,288,752,576), {x:.5,y:.5});
});

test('notes shrink proportionately in either constrained dimension', () => {
  assert.equal(noteScale(1000,800), 1);
  assert.equal(noteScale(124,800), .5);
  assert.equal(noteScale(1000,112), .5);
});
