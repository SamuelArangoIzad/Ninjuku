import test from 'node:test';
import assert from 'node:assert/strict';
import { getRoofPropPlacement } from '../src/world/roofPropPlacement.js';

test('en móvil la argolla no se sale por arriba del encuadre', () => {
    const p = getRoofPropPlacement({roofLeft:650,roofY:180,hookDrop:110,propScale:.572,screenWidth:915,screenHeight:412});
    assert.ok(p.topY >= 53);
    assert.ok(p.gap >= 130 && p.gap < 150);
    assert.equal(p.hookY, p.topY + 129*.572);
});
test('también evita colgantes fuera de encuadre en 780×360', () => {
    const p = getRoofPropPlacement({roofLeft:340,roofY:160,hookDrop:115,propScale:.49,screenWidth:780,screenHeight:360});
    assert.ok(p.topY >= 46);
    assert.equal(p.x, 210);
});
test('en escritorio conserva la separación máxima original', () => {
    const p = getRoofPropPlacement({roofLeft:900,roofY:360,hookDrop:140,propScale:1,screenWidth:1920,screenHeight:1080});
    assert.equal(p.gap, 190);
});
test('rechaza escalas imposibles sin contaminar la escena', () => {
    assert.throws(() => getRoofPropPlacement({roofLeft:1,roofY:2,hookDrop:3,propScale:0,screenWidth:900,screenHeight:400}), TypeError);
});
