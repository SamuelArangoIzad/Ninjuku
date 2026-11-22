import { getRoofHangingSupportGeometry } from "./roofHangingSupportGeometry.js";

/**
 * Ménsula de madera anclada al borde del tejado para el colgante del
 * enemigo lanzador. No posee cuerpo físico y sigue el desplazamiento de la casa.
 */
export default class RoofHangingSupportVisual {
    constructor(scene, depth) {
        this.graphics = scene.add.graphics()
            .setDepth(depth)
            .setVisible(false);
        // Igual scrollFactor que los sprites de los enemigos de tejado (1).
        this.lastSignature = null;
    }

    update(hookTopX, hookTopY, roofLeftX, roofSurfaceY, scale) {
        const geo = getRoofHangingSupportGeometry({
            hookTopX, hookTopY, roofLeftX, roofSurfaceY, scale
        });
        const g = this.graphics;
        const signature = [geo.postX, geo.postBottom, geo.scale].map(v => Math.round(v * 10)).join(":");
        if (signature !== this.lastSignature) {
            this.lastSignature = signature;
            g.clear();
            const { postX: x, postBottom: bottom, beamY: y, beamLeft: left, thickness: t, scale: s } = geo;
            const top = y - 3 * s;
            const h = Math.max(0, bottom - top);
            const beamHeight = 14 * s;
            const beamWidth = Math.max(t, x - left + t / 2);

            // Pilar que nace de la misma casa, con zapata sobre el tejado.
            g.fillStyle(0x221a20, 1).fillRect(x - t / 2 - 2*s, top, t + 4*s, h);
            g.fillStyle(0x67402d, 1).fillRect(x - t / 2, top + 3*s, t, Math.max(0, h - 4*s));
            g.fillStyle(0xa27650, 1).fillRect(x - t / 2 + 2*s, top + 4*s, Math.max(1, 3*s), Math.max(0, h - 8*s));
            g.fillStyle(0x261d23, 1).fillRect(x - t/2 - 5*s, bottom - 10*s, t + 10*s, 10*s);

            // Viga portante: su extremo coincide con la argolla superior (0,0).
            g.fillStyle(0x231a1e, 1).fillRect(left - 2*s, y - 3*s, beamWidth + 4*s, beamHeight + 4*s);
            g.fillStyle(0x6b432f, 1).fillRect(left, y, beamWidth, beamHeight);
            g.fillStyle(0xb58356, 1).fillRect(left + 2*s, y, Math.max(2,beamWidth - 4*s), 3*s);
            g.fillStyle(0x32232a, 1).fillRect(-5*s, y + beamHeight - 1*s, 10*s, 8*s);
            g.fillStyle(0xc09a68, 1).fillRect(-2*s, y + beamHeight + 1*s, 4*s, 3*s);

            // Refuerzo diagonal bajo el extremo del poste, sin cruzar la argolla.
            const span = Math.min(80*s, Math.max(20*s, x * 0.38));
            g.lineStyle(Math.max(4, 9*s), 0x2b1d21, 1)
                .lineBetween(x - 4*s, y + 64*s, x - span, y + beamHeight);
            g.lineStyle(Math.max(2, 5*s), 0x93613b, 1)
                .lineBetween(x - 4*s, y + 63*s, x - span, y + beamHeight);
        }
        g.setPosition(hookTopX, hookTopY).setVisible(true);
    }

    hide() { this.graphics?.setVisible(false); }
    destroy() { this.graphics?.destroy(); this.graphics = null; }
}
