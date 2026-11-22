import test from 'node:test';
import assert from 'node:assert/strict';
import { computeActionLayout, computeControlMetrics } from '../src/input/actionLayout.js';

for (const [width,height] of [[780,360],[915,412],[932,430],[1180,820],[667,375]]) {
    test(`control táctil responsive ${width}x${height}`, () => {
        const m=computeControlMetrics(width,height);
        assert.ok(m.size>=28 && m.size<=34);
        assert.ok(m.spacing >= m.size+10);
        const p=computeActionLayout(width,height);
        assert.equal(p.triangle.x,p.cross.x);
        assert.equal(p.square.y,p.circle.y);
        const all=Object.values(p);
        for (const a of all) {
            assert.ok(a.x>=m.size/2 && a.x<=width-m.size/2);
            assert.ok(a.y>=m.size/2 && a.y<=height-m.size/2);
        }
        assert.ok(p.circle.x-p.square.x >= 2*m.spacing-1);
    });
}
