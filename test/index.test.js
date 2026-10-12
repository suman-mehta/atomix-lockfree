import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createQueue } from '../src/index.js';

describe('LockFreeQueue', () => {
  test('enqueue and dequeue maintain order', () => {
    const q = createQueue({ capacity: 8 });
    for (let i = 0; i < 5; i++) {
      assert.equal(q.enqueue(i), true);
    }
    assert.equal(q.size(), 5);
    for (let i = 0; i < 5; i++) {
      const v = q.dequeue();
      assert.equal(v, i);
    }
    assert.equal(q.size(), 0);
    assert.equal(q.dequeue(), undefined);
  });

  test('full queue returns false on enqueue', () => {
    const q = createQueue({ capacity: 4 });
    for (let i = 0; i < 4; i++) {
      assert.equal(q.enqueue(i), true);
    }
    assert.equal(q.enqueue(99), false);
  });
});
