import test from "node:test";
import assert from "node:assert/strict";
import { getHangingSupportGeometry } from "../src/world/hangingSupportGeometry.js";

test("el brazo superior sostiene la argolla, no el tablón", () => {
    const g = getHangingSupportGeometry(100, 388, 0.5);
    assert.equal(g.ringX, 0);
    assert.ok(g.beamY < 0);
    assert.ok(g.beamY + 13 >= 0);
    assert.equal(g.postX, 132);
    assert.equal(g.deckY, 129);
});
test("la base del poste coincide con el suelo según la escala", () => {
    const y = 110, floor = 388, scale = 0.6;
    const g = getHangingSupportGeometry(y, floor, scale);
    assert.ok(Math.abs(y + g.height * g.scale - floor) < 1);
});
