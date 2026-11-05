import test from 'node:test';
import assert from 'node:assert/strict';
import { notePosition, normalizedPosition } from '../src/lib/note-position.ts';

test('notes stay inside a smaller screen without changing shared coordinates', () => {
  assert.deepEqual(notePosition(.5,.5,1000,800), {left:376,top:288,horizontal:752,vertical:576});
  assert.deepEqual(notePosition(1,1,200,100), {left:0,top:0,horizontal:0,vertical:0});
});
test('drag coordinates clamp to board edges and normalize safely', () => {
  assert.deepEqual(normalizedPosition(-20,800,752,576), {x:0,y:1});
  assert.deepEqual(normalizedPosition(20,30,0,0), {x:0,y:0});
  assert.deepEqual(normalizedPosition(376,288,752,576), {x:.5,y:.5});
});
