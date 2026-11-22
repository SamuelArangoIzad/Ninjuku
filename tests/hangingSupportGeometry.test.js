import test from 'node:test';
import assert from 'node:assert/strict';
import { getHangingSupportGeometry } from '../src/world/hangingSupportGeometry.js';

test('el soporte queda más lejos del punto de enganche', () => {
    const g=getHangingSupportGeometry(75,400,0.5);
    assert.equal(g.postX,132);
    assert.ok(g.postX>94 && g.postX<174);
    assert.equal(g.height,650);
});
test('la altura del poste se recalcula proporcionalmente a escala móvil', () => {
    assert.equal(getHangingSupportGeometry(100,400,1).height,300);
    assert.equal(getHangingSupportGeometry(100,400,0.5).height,600);
});
