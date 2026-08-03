import HealthBarSystem
    from "../systems/HealthBarSystem.js";


export default class EntityUIManager {
    constructor(
        scene,
        configuration = {}
    ) {
        this.scene =
            scene ?? null;

        this.player =
            configuration.player ??
            null;

        this.healthBarSystem =
            new HealthBarSystem(
                scene,
                this.player
            );

        this.isDestroyed =
            false;
    }

    // =========================================================
    // Entidades
    // =========================================================

    addEnemy(enemy) {
        if (
            this.isDestroyed ||
            !enemy
        ) {
            return false;
        }

        return (
            this.healthBarSystem
                ?.addEnemy?.(
                    enemy
                ) ??
            false
        );
    }

    removeEnemy(enemy) {
        if (
            this.isDestroyed ||
            !enemy
        ) {
            return false;
        }

        return (
            this.healthBarSystem
                ?.removeEnemy?.(
                    enemy
                ) ??
            false
        );
    }

    // =========================================================
    // Update
    // =========================================================

    update() {
        if (
            this.isDestroyed ||
            !this.healthBarSystem
        ) {
            return;
        }

        this.healthBarSystem.update();
    }

    // =========================================================
    // Responsive
    // =========================================================

    handleResize(gameSize) {
        if (
            this.isDestroyed ||
            !this.healthBarSystem ||
            !gameSize
        ) {
            return;
        }

        this.healthBarSystem.handleResize(
            gameSize
        );
    }

    // =========================================================
    // Consultas
    // =========================================================

    getHealthBarSystem() {
        return this.healthBarSystem;
    }

    // =========================================================
    // Destrucción
    // =========================================================

    destroy() {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed =
            true;

        this.healthBarSystem
            ?.destroy();

        this.healthBarSystem =
            null;

        this.player =
            null;

        this.scene =
            null;
    }
}