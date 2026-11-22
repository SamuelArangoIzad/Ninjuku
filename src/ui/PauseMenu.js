import Phaser from "phaser";
import BackgroundMusic from "../systems/BackgroundMusic.js";

/** Pantalla de pausa dentro de la misma escena. Evita timers de escena extra. */
export default class PauseMenu {
    constructor(scene, { onExit = () => {} } = {}) {
        this.scene = scene;
        this.onExit = onExit;
        this.isOpen = false;
        this.container = scene.add.container(0, 0).setDepth(14000).setScrollFactor(0);
        this.cover = scene.add.rectangle(0, 0, 1, 1, 0x100d12, 0.72).setOrigin(0).setInteractive();
        this.panel = scene.add.graphics();
        this.header = scene.add.text(0, 0, '一時停止 · PAUSA', {
            fontFamily: 'sans-serif', fontSize: '19px', color: '#f3d6a4',
            stroke: '#211419', strokeThickness: 3, fontStyle: 'bold'
        }).setOrigin(0.5);
        this.buttons = [
            this.makeButton('▶  REANUDAR', () => this.close()),
            this.makeButton('', () => this.toggleAudio()),
            this.makeButton('↩  SALIR', () => this.exit())
        ];
        this.gear = scene.add.text(0, 0, '⚙', {
            fontFamily: 'Arial, sans-serif', fontSize: '25px', color: '#ffdfad',
            stroke: '#311d1e', strokeThickness: 3
        }).setOrigin(0.5).setDepth(13000).setScrollFactor(0).setInteractive({ useHandCursor: true });
        this.gear.on('pointerdown', () => this.isOpen ? this.close() : this.open());
        this.container.add([this.cover, this.panel, this.header, ...this.buttons.map(b => b.text)]);
        this.container.setVisible(false);
        this.key = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.onEscape = () => { if (this.isOpen) this.close(); else this.open(); };
        this.key?.on('down', this.onEscape);
        this.handleResize(scene.scale.gameSize);
    }
    makeButton(label, action) {
        const text = this.scene.add.text(0, 0, label, {
            fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#ffe4b8',
            backgroundColor: '#56352d', padding: { x: 18, y: 10 },
            stroke: '#231518', strokeThickness: 2
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        text.on('pointerover', () => text.setBackgroundColor('#81513b'));
        text.on('pointerout', () => text.setBackgroundColor('#56352d'));
        text.on('pointerdown', action);
        return { text };
    }
    updateAudioLabel() {
        this.buttons[1].text.setText(BackgroundMusic.isMuted() ? '♪  MÚSICA: NO' : '♫  MÚSICA: SÍ');
    }
    open() {
        if (this.isOpen || this.scene.isShuttingDown || this.scene.gameOverTriggered) return;
        this.isOpen = true;
        this.updateAudioLabel();
        this.container.setVisible(true);
        this.scene.physics.world.pause();
        this.scene.time.paused = true;
        this.scene.tweens.pauseAll();
        this.scene.controls?.resetTouchState?.();
        this.scene.controls?.setVisible?.(false);
    }
    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.container.setVisible(false);
        this.scene.physics.world.resume();
        this.scene.time.paused = false;
        this.scene.tweens.resumeAll();
        this.scene.controls?.setVisible?.(true);
    }
    toggleAudio() {
        BackgroundMusic.toggleMuted(this.scene);
        this.updateAudioLabel();
    }
    exit() {
        this.close();
        this.onExit();
    }
    handleResize(gameSize) {
        const w = Number(gameSize?.width ?? this.scene.scale.width);
        const h = Number(gameSize?.height ?? this.scene.scale.height);
        const scale = Phaser.Math.Clamp(Math.min(w / 900, h / 450), 0.66, 1);
        this.cover.setSize(w, h);
        this.panel.clear().fillStyle(0x27171c, 0.97).fillRoundedRect(-150, -128, 300, 260, 8)
            .lineStyle(3, 0xbb8856, 1).strokeRoundedRect(-150, -128, 300, 260, 8)
            .lineStyle(1, 0x8f3e34, 1).strokeRoundedRect(-144, -122, 288, 248, 5);
        this.panel.setPosition(w / 2, h / 2).setScale(scale);
        this.header.setPosition(w / 2, h / 2 - 95 * scale).setScale(scale);
        this.buttons.forEach((button, i) => button.text.setPosition(w / 2, h / 2 + (-33 + i * 68) * scale).setScale(scale));
        // HUD score está bajo el botón Cuenta/Monedas, a la derecha.
        this.gear.setPosition(Math.max(30, w - Math.max(160, Math.round(w * 0.16))), Math.max(74, h * 0.14 + 17));
        this.gear.setScale(Phaser.Math.Clamp(h / 550, 0.7, 1));
    }
    destroy() {
        if (this.isOpen) this.close();
        this.key?.off('down', this.onEscape);
        this.gear?.destroy();
        this.container?.destroy(true);
    }
}
