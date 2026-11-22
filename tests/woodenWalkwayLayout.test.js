import test from "node:test";
import assert from "node:assert/strict";
import { getWalkwayLayout } from "../src/world/woodenWalkwayLayout.js";

test("la madera comienza justo en la superficie física del suelo", () => {
    assert.deepEqual(getWalkwayLayout(915, 412, 24), {
        width: 915, height: 412, surfaceY: 388, boardHeight: 24, boardLength: 66
    });
});
test("el suelo mantiene alineación en móviles compactos", () => {
    assert.equal(getWalkwayLayout(780, 360, 24).surfaceY, 336);
});
test("los márgenes inferiores no alteran las dimensiones originales", () => {
    assert.equal(getWalkwayLayout(915, 412, 24, 10).surfaceY, 378);
});
