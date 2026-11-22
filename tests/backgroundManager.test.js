import test from "node:test";
import assert from "node:assert/strict";
import BackgroundManager from "../src/world/BackgroundManager.js";

function mockScene(width = 915, height = 412) {
    const images = [];
    const scene = {
        scale: { width, height },
        textures: {
            get(key) {
                if (!/^bg-[1-8]$/.test(key)) return {key: "__MISSING"};
                return {key, getSourceImage: () => ({width: 1600, height: 900})};
            }
        },
        add: {
            image() {
                const obj = {x: 0, changes: 0, destroyed: false};
                for (const name of ["setOrigin", "setDepth", "setScrollFactor", "setTexture", "setScale", "setCrop", "setAlpha"]) {
                    obj[name] = () => obj;
                }
                obj.destroy = () => {obj.destroyed = true};
                images.push(obj);
                return obj;
            }
        }
    };
    return {scene,images};
}
const config = {textureKeys: Array.from({length:8},(_,i)=>`bg-${i+1}`), seamlessTiles:true, speed:35};

test("una imagen por panel, sin 16 fragmentos de mezcla", () => {
    const {scene,images} = mockScene();
    const manager = new BackgroundManager(scene,config);
    manager.create();
    assert.equal(images.length,manager.panels.length);
    assert.ok(manager.panels.every(p=>p.segments.length===0));
    manager.destroy();
    assert.ok(images.every(i=>i.destroyed));
});

test("no actualiza la posición en frames sin cambio de píxel", () => {
    const {scene} = mockScene();
    const manager = new BackgroundManager(scene,config);
    manager.create();
    const old = manager.lastRoundedOffset;
    manager.update(1);
    assert.equal(manager.lastRoundedOffset,old);
    manager.update(100);
    assert.notEqual(manager.lastRoundedOffset,old);
});

test("resize mantiene textura y progreso relativo del desplazamiento", () => {
    const {scene} = mockScene();
    const manager = new BackgroundManager(scene,config);
    manager.create();
    manager.update(100000); // el delta está limitado a 100 ms
    manager.scrollOffset = manager.stepWidth * 0.4;
    manager.recycleFirstPanel();
    manager.applyOffset(true);
    const current = manager.getPanelPlacements()[0].key;
    scene.scale.width = 1180;
    scene.scale.height = 820;
    manager.resize();
    assert.equal(manager.getPanelPlacements()[0].key,current);
    assert.ok(Math.abs(manager.scrollOffset/manager.stepWidth - 0.4)<1e-12);
});

test("el ciclo de 8 fondos vuelve a bg-1 sin desorden", () => {
    const {scene} = mockScene();
    const manager = new BackgroundManager(scene,config);
    manager.create();
    const initial = manager.panels[0].textureIndex;
    for(let i=0;i<8;i++) manager.recycleFirstPanel();
    assert.equal(manager.panels[0].textureIndex,initial);
    assert.ok(manager.panels.every(p=>p.serial>=0));
});
