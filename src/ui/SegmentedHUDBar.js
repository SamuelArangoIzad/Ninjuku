import Phaser from "phaser";
import { HUD_LABELS } from "./japaneseLabels.js";

/** HUD japonés pixel art, fijo a cámara. No modifica la vida ni la energía. */
export default class SegmentedHUDBar {
    constructor(scene, { x = 28, y = 45, width = 195, height = 17,
        segments = 5, kind = "health", depth = 3000 } = {}) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.segments = Math.max(1, Math.floor(segments));
        this.kind = kind;
        this.isDestroyed = false;
        this.percentage = -1;
        this.layout = { x, y, scale: 1 };
        this.container = scene.add.container(x, y)
            .setScrollFactor(0).setDepth(depth);
        this.graphics = scene.add.graphics();
        this.label = scene.add.text(20, -27,
            kind === "health" ? HUD_LABELS.health : HUD_LABELS.energy, {
                fontFamily: '"Noto Sans CJK JP", "Yu Gothic", "Hiragino Kaku Gothic ProN", sans-serif', fontSize: "12px", fontStyle: "bold",
                color: "#fce5bb", stroke: "#221013", strokeThickness: 3
            }).setOrigin(0, 0);
        this.container.add([this.graphics, this.label]);
        this.setPercentage(1);
        this.handleResize(scene.scale.gameSize);
    }

    setPercentage(value) {
        if (this.isDestroyed) return this;
        const next = Phaser.Math.Clamp(Number(value) || 0, 0, 1);
        // Limitar redibujos de Graphics durante el drenaje continuo.
        if (Math.abs(next - this.percentage) < 0.004 && next !== 0 && next !== 1) return this;
        if (next === this.percentage) return this;
        this.percentage = next;
        this.draw();
        return this;
    }

    draw() {
        const g = this.graphics;
        g.clear();
        const life = this.kind === "health";
        const edge = 0xd8b77e;
        const dark = 0x301d21;
        const base = life ? 0x47242c : 0x213b46;
        const fill = life ? 0xc6373d : 0x29b4d0;
        const shine = life ? 0xff9184 : 0x94ebee;
        const px = life ? ["01100110","11111111","11111111","01111110","00111100","00011000"] :
            ["00011100","00111000","01111000","00111100","00011100","00111000","01100000"];

        // Icono sin panel opaco; relieve píxel a píxel.
        g.fillStyle(0x24171b, 0.95);
        px.forEach((line, row) => [...line].forEach((bit, col) => {
            if (bit === "1") g.fillRect(col * 2 + 1, row * 2 - 8, 2, 2);
        }));
        g.fillStyle(life ? 0xff595e : 0x6adbed, 1);
        px.forEach((line, row) => [...line].forEach((bit, col) => {
            if (bit === "1") g.fillRect(col * 2, row * 2 - 9, 2, 2);
        }));

        const left = 23;
        const length = this.width - left;
        const gap = 3;
        const unit = (length - (this.segments - 1) * gap) / this.segments;
        const top = -this.height / 2;
        // Bastidor abierto, sin caja negra que tape el paisaje.
        g.fillStyle(dark, 0.38).fillRect(left - 4, top - 4, length + 8, this.height + 8);
        g.lineStyle(1, edge, 0.88).strokeRect(left - 4, top - 4, length + 8, this.height + 8);
        g.fillStyle(edge, 1);
        for (const [bx, by] of [[left-5, top-5],[left+length+3, top-5],
            [left-5, top+this.height+3],[left+length+3, top+this.height+3]]) {
            g.fillRect(bx, by, 3, 3);
        }
        const active = this.percentage * this.segments;
        for (let i = 0; i < this.segments; i++) {
            const x = left + (unit + gap) * i;
            g.fillStyle(base, 0.67).fillRect(x, top, unit, this.height);
            const fraction = Phaser.Math.Clamp(active - i, 0, 1);
            if (fraction > 0) {
                const filledWidth = unit * fraction;
                g.fillStyle(fill, 1).fillRect(x, top, filledWidth, this.height);
                g.fillStyle(shine, 0.9).fillRect(x, top, filledWidth, 3);
                g.fillStyle(dark, 0.28).fillRect(x, top + this.height - 3, filledWidth, 3);
            }
        }
    }

    // Escala proporcional a la altura del móvil en modo horizontal.
    // El valor mínimo mantiene la legibilidad en pantallas pequeñas.
    handleResize(gameSize) {
        if (this.isDestroyed || !this.container) return;
        const w = Math.max(1, Number(gameSize?.width || this.scene.scale.width));
        const h = Math.max(1, Number(gameSize?.height || this.scene.scale.height));
        const scale = Phaser.Math.Clamp(Math.min(w / 1120, h / 580), 0.58, 1);
        const x = Math.max(10, Math.round(w * 0.015));
        const y = Math.round(Math.max(26, h * 0.105)) + (this.kind === "energy" ? Math.round(76 * scale) : 0);
        this.layout = { x, y, scale };
        this.container.setScale(scale).setPosition(x, y);
    }

    getPercentage() { return this.percentage; }
    setPosition(x, y) { if (!this.isDestroyed) this.container.setPosition(x, y); return this; }
    setVisible(visible) { if (!this.isDestroyed) this.container.setVisible(visible); return this; }
    destroy() { if (this.isDestroyed) return; this.isDestroyed = true;
        this.container?.destroy(true); this.container = null; this.scene = null; }
}
