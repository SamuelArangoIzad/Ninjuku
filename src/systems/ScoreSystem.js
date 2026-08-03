import GameEvents
    from "../constants/GameEvents.js";

import ScoreHUD
    from "../ui/ScoreHUD.js";


export default class ScoreSystem {
    constructor(scene) {
        this.scene =
            scene ?? null;

        this.score =
            0;

        this.isDestroyed =
            false;

        this.hud =
            new ScoreHUD(
                scene
            );

        this.handleEnemyKilled =
            this.handleEnemyKilled.bind(
                this
            );

        this.scene?.events?.on(
            GameEvents.ENEMY_KILLED,
            this.handleEnemyKilled
        );

        this.updateHUD(
            false
        );
    }

    // =========================================================
    // Eventos
    // =========================================================

    handleEnemyKilled(data = {}) {
        if (this.isDestroyed) {
            return;
        }

        const points =
            Math.max(
                0,
                Math.floor(
                    Number(
                        data.points
                    ) || 0
                )
            );

        if (points <= 0) {
            return;
        }

        this.addScore(
            points
        );
    }

    // =========================================================
    // Puntuación
    // =========================================================

    addScore(points) {
        if (this.isDestroyed) {
            return false;
        }

        const validPoints =
            Math.max(
                0,
                Math.floor(
                    Number(points) || 0
                )
            );

        if (validPoints <= 0) {
            return false;
        }

        this.score +=
            validPoints;

        this.updateHUD(
            true
        );

        this.scene?.events?.emit(
            GameEvents.SCORE_CHANGED,
            {
                score:
                    this.score,

                addedPoints:
                    validPoints
            }
        );

        return true;
    }

    setScore(
        score,
        animate = false
    ) {
        if (this.isDestroyed) {
            return false;
        }

        const nextScore =
            Math.max(
                0,
                Math.floor(
                    Number(score) || 0
                )
            );

        if (
            nextScore ===
            this.score
        ) {
            return false;
        }

        const difference =
            nextScore -
            this.score;

        this.score =
            nextScore;

        this.updateHUD(
            animate
        );

        this.scene?.events?.emit(
            GameEvents.SCORE_CHANGED,
            {
                score:
                    this.score,

                addedPoints:
                    difference
            }
        );

        return true;
    }

    reset() {
        if (this.isDestroyed) {
            return false;
        }

        this.score =
            0;

        this.updateHUD(
            false
        );

        this.scene?.events?.emit(
            GameEvents.SCORE_CHANGED,
            {
                score:
                    0,

                addedPoints:
                    0
            }
        );

        return true;
    }

    // =========================================================
    // HUD
    // =========================================================

    updateHUD(animate = false) {
        if (
            this.isDestroyed ||
            !this.hud
        ) {
            return;
        }

        this.hud.setScore(
            this.score,
            animate
        );
    }

    handleResize(gameSize) {
        if (
            this.isDestroyed ||
            !gameSize
        ) {
            return;
        }

        this.hud?.handleResize(
            gameSize
        );
    }

    setVisible(visible) {
        if (this.isDestroyed) {
            return;
        }

        this.hud?.setVisible(
            visible
        );
    }

    // =========================================================
    // Consultas
    // =========================================================

    getScore() {
        return this.score;
    }

    getHUD() {
        return this.hud;
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

        if (this.scene) {
            this.scene.events.off(
                GameEvents.ENEMY_KILLED,
                this.handleEnemyKilled
            );
        }

        this.hud?.destroy();

        this.hud =
            null;

        this.handleEnemyKilled =
            null;

        this.scene =
            null;
    }
}