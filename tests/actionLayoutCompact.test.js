import test from 'node:test';
import assert from 'node:assert/strict';
import { computeActionLayout, computeControlMetrics } from '../src/input/actionLayout.js';
for (const [w,h] of [[780,360],[915,412],[932,430]]) {
  test(`cruz compacta, sin superposición en ${w}x${h}`, () => {
    const m=computeControlMetrics(w,h);
    const p=computeActionLayout(w,h);
    assert.ok(m.size<=34);
    assert.ok(m.spacing>=m.size+6 && m.spacing<=47);
    assert.equal(p.circle.x-p.square.x,m.spacing*2);
    assert.equal(p.cross.y-p.triangle.y,m.spacing*2);
  });
}
