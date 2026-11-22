import Phaser from "phaser";
import { HUD_LABELS } from "./japaneseLabels.js";

/** Marcador fijo a cámara, inspirado en una tablilla japonesa lacada. */
export default class ScoreHUD {
    constructor(scene, configuration = {}) {
        this.scene = scene;
        this.marginRight = Math.max(10, Number(configuration.marginRight) || 22);
        this.marginTop = Math.max(65, Number(configuration.marginTop) || 76);
        this.maximumDigits = Math.max(1, Math.floor(Number(configuration.maximumDigits) || 6));
        this.currentScore = -1;
        this.lastWidth = null;
        this.isDestroyed = false;
        this.visible = true;
        this.panelWidth = 190;
        this.panelHeight = 60;
        this.container = scene.add.container(0, 0).setDepth(5000).setScrollFactor(0);
        this.panel = scene.add.graphics();
        this.titleText = scene.add.text(-this.panelWidth + 18, 9, HUD_LABELS.score, {
            fontFamily: '"Noto Sans CJK JP", "Yu Gothic", "Hiragino Kaku Gothic ProN", sans-serif', fontSize: "12px", fontStyle: "bold",
            color: "#efc98a", stroke: "#1b1012", strokeThickness: 2
        });
        this.valueText = scene.add.text(-15, 28, "0".repeat(this.maximumDigits), {
            fontFamily: "monospace", fontSize: "23px", fontStyle: "bold",
            color: "#fff0ce", stroke: "#32181a", strokeThickness: 3
        }).setOrigin(1, 0);
        this.container.add([this.panel, this.titleText, this.valueText]);
        this.drawPanel();
        this.setScore(configuration.initialScore ?? 0, false);
        this.handleResize(scene.scale.gameSize);
    }

    drawPanel() {
        const g = this.panel;
        const w = this.panelWidth;
        const h = this.panelHeight;
        g.clear();
        // Panel translúcido para preservar el escenario, con bordes tipo madera lacada.
        g.fillStyle(0x24171b, 0.82).fillRoundedRect(-w, 0, w, h, 4);
        g.lineStyle(2, 0x9c452f, 1).strokeRoundedRect(-w, 0, w, h, 4);
        g.lineStyle(1, 0xd5a66d, 0.9).strokeRoundedRect(-w + 3, 3, w - 6, h - 6, 2);
        g.fillStyle(0xa93530, 0.85).fillRect(-w + 9, 8, 3, h - 16);
        g.lineStyle(1, 0xd5a66d, 0.72).lineBetween(-w + 17, 26, -12, 26);
        for (const x of [-w + 6, -6]) {
            for (const y of [6, h - 6]) {
                g.fillStyle(0xf0c586, 1).fillCircle(x, y, 1.5);
            }
        }
    }

    setScore(score, animate = true) {
        if (this.isDestroyed || !this.valueText) return false;
        const safe = Math.max(0, Math.floor(Number(score) || 0));
        if (safe === this.currentScore) return false;
        this.currentScore = safe;
        this.valueText.setText(String(safe).padStart(this.maximumDigits, "0"));
        if (animate) this.playScoreEffect();
        return true;
    }

    playScoreEffect() {
        if (this.isDestroyed || !this.scene || !this.valueText) return;
        this.scene.tweens.killTweensOf(this.valueText);
        this.valueText.setScale(1.08);
        this.scene.tweens.add({ targets: this.valueText, scaleX: 1, scaleY: 1,
            duration: 125, ease: "Quad.Out" });
    }

    getScore() { return Math.max(0, this.currentScore); }

    handleResize(gameSize) {
        if (this.isDestroyed || !gameSize || !this.container) return;
        const width = Math.max(1, Number(gameSize.width || 1));
        const height = Math.max(1, Number(gameSize.height || 1));
        const scale = Phaser.Math.Clamp(Math.min(width / 1120, height / 580), 0.58, 1);
        const right = Math.max(12, Math.round(width * 0.017));
        // El botón Cuenta / Monedas es HTML independiente y ocupa la esquina superior.
        // Mantener el marcador debajo, a una distancia basada en altura.
        const top = Math.max(51, Math.round(height * 0.14));
        this.container.setScale(scale);
        this.container.setPosition(width - right, top);
        this.lastWidth = width;
    }

    setVisible(visible) {
        if (this.isDestroyed || !this.container) return;
        this.visible = Boolean(visible);
        this.container.setVisible(this.visible);
    }

    destroy() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        this.scene?.tweens?.killTweensOf(this.valueText);
        this.container?.destroy(true);
        this.container = null;
        this.titleText = null;
        this.valueText = null;
        this.scene = null;
    }
}
