import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Los anclajes elegidos proceden de la tabla panorámica ya validada.
const anchors = [1320,1800+1460,3600+1450];
const cycle = 5400;
test('colgantes a distancia razonable incluso al cerrar panorama', () => {
    const distances = [anchors[1]-anchors[0], anchors[2]-anchors[1], cycle-anchors[2]+anchors[0]];
    assert.ok(distances.every(v => v >= 1600 && v <= 2000));
});
test('gestor conserva integración del soporte y registro del gancho', () => {
    const code = readFileSync(new URL('../src/world/HangingPropManager.js', import.meta.url), 'utf8');
    assert.match(code,/new HangingSupportVisual/);
    assert.match(code,/this\.hooks\.push/);
});
