import { getHangingSupportGeometry } from "./hangingSupportGeometry.js";

/** Soporte portante: el brazo sujeta la argolla superior del colgante. */
export default class HangingSupportVisual {
    constructor(scene, depth) {
        this.graphics = scene.add.graphics().setScrollFactor(0).setDepth(depth).setVisible(false);
        this.lastHeight = -1;
        this.lastScale = -1;
    }

    update(x, y, groundY, scale) {
        const g = this.graphics;
        const geo = getHangingSupportGeometry(y, groundY, scale);
        if (Math.abs(geo.height - this.lastHeight) > 1 || Math.abs(geo.scale - this.lastScale) > 0.001) {
            this.lastHeight = geo.height;
            this.lastScale = geo.scale;
            g.clear();
            const { postX: px, height: h, beamY: by, ringX } = geo;
            const top = by - 11;

            // Poste vertical clavado a la pasarela. Colores acordes al tablón.
            g.fillStyle(0x1d181b, 1).fillRect(px - 11, top, 22, h - top);
            g.fillStyle(0x603d2d, 1).fillRect(px - 8, top + 2, 16, h - top - 3);
            g.fillStyle(0x9b6643, 1).fillRect(px - 7, top + 2, 3, h - top - 5);
            g.fillStyle(0x332321, 1).fillRect(px + 5, top + 3, 3, h - top - 6);
            // Herrajes del poste: sujetos a la madera, sin bandas excesivas.
            for (let bandY = 72; bandY < h - 30; bandY += 110) {
                g.fillStyle(0x282025, 1).fillRect(px - 10, bandY, 20, 4);
                g.fillStyle(0xad895b, 1).fillRect(px - 6, bandY + 1, 3, 2);
            }
            g.fillStyle(0x2b2528, 1).fillRect(px - 14, h - 11, 28, 11);
            g.fillStyle(0xa27a65, 1).fillRect(px - 11, h - 9, 22, 3);

            // Brazo portante AL NIVEL DE LA ARGOLLA. Su extremo queda sobre
            // (0,0), desde el que bajan las cuerdas del tablón del sprite.
            g.fillStyle(0x251a1d, 1).fillRect(ringX - 17, by - 6, px - ringX + 31, 18);
            g.fillStyle(0x724831, 1).fillRect(ringX - 14, by - 4, px - ringX + 25, 12);
            g.fillStyle(0xbd8558, 1).fillRect(ringX - 12, by - 4, px - ringX + 20, 3);
            g.fillStyle(0x34272a, 1).fillRect(ringX - 15, by + 6, px - ringX + 27, 2);

            // Escuadra diagonal bajo el brazo, desde el poste a un punto
            // intermedio, sin tocar la cuerda que sostiene el tablón.
            g.lineStyle(9, 0x251a1c, 1).lineBetween(px - 4, by + 62, px - 62, by + 9);
            g.lineStyle(5, 0x8e5c3b, 1).lineBetween(px - 5, by + 60, px - 63, by + 9);
            g.lineStyle(2, 0xbb895b, 1).lineBetween(px - 7, by + 57, px - 63, by + 10);

            // Abrazadera central y anilla de sujeción. La argolla del sprite
            // se dibuja delante y parece nacer de esta pieza.
            g.fillStyle(0x1c1b20, 1).fillRect(-8, by + 6, 16, 11);
            g.fillStyle(0xc29b60, 1).fillRect(-5, by + 9, 10, 3);
            g.fillStyle(0x2a2225, 1).fillRect(px - 13, by - 10, 27, 7);
            g.fillStyle(0x9c7350, 1).fillRect(px - 9, by - 8, 19, 2);
        }
        g.setPosition(x, y).setScale(geo.scale).setVisible(true);
    }
    hide() { this.graphics.setVisible(false); }
    destroy() { this.graphics.destroy(); }
}
