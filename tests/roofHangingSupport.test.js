import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getRoofHangingSupportGeometry } from "../src/world/roofHangingSupportGeometry.js";

test("el soporte del enemigo de tejado se ancla al borde de la casa", () => {
    const g = getRoofHangingSupportGeometry({
        hookTopX: 100, hookTopY: 30, roofLeftX: 290, roofSurfaceY: 380, scale: 0.6
    });
    assert.ok(g.postX > 190 && g.postX < 200);
    assert.equal(g.postBottom, 350);
    assert.ok(g.beamLeft < 0);
});

test("la geometría del soporte escala sin alterar posiciones de enganche", () => {
    const g = getRoofHangingSupportGeometry({
        hookTopX: 80, hookTopY: 10, roofLeftX: 270, roofSurfaceY: 350, scale: 0.5
    });
    assert.equal(g.postBottom, 340);
    assert.ok(g.thickness >= 5);
});

test("cada plataforma del gestor de tejados crea, muestra, oculta y destruye su soporte", () => {
    const code = readFileSync(new URL("../src/world/RoofEnemyManager.js", import.meta.url), "utf8");
    for (const s of ["new RoofHangingSupportVisual", "enemy.propSupport?.update(", "enemy.propSupport?.hide()", "enemy.propSupport?.destroy()"]){
        assert.ok(code.includes(s), `Falta: ${s}`);
    }
});
