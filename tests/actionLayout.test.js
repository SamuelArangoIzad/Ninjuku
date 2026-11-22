import test from 'node:test';
import assert from 'node:assert/strict';
import { computeActionLayout } from '../src/input/actionLayout.js';

for (const [width, height] of [[780,360],[915,412],[932,430],[1180,820]]) {
    test(`cruz táctil equilibrada y dentro de ${width}x${height}`, () => {
        const p = computeActionLayout(width,height);
        assert.equal(p.triangle.x,p.cross.x);
        assert.equal(p.square.y,p.circle.y);
        assert.equal(p.triangle.y < p.square.y, true);
        assert.equal(p.cross.y > p.square.y, true);
        assert.equal(p.square.x < p.triangle.x, true);
        assert.equal(p.circle.x > p.triangle.x, true);
        for (const pos of Object.values(p)) {
            assert.ok(pos.x >= 21 && pos.x <= width-21);
            assert.ok(pos.y >= 21 && pos.y <= height-21);
        }
    });
}
