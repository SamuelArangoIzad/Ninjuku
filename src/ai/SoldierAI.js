export default class SoldierAI {
    constructor(
        enemy,
        configuration = {}
    ) {
        this.enemy =
            enemy ?? null;

        this.decisionInterval =
            this.normalizeDecisionInterval(
                configuration.decisionInterval,
                120
            );

        this.activeAreaMargin =
            this.normalizeNonNegativeNumber(
                configuration.activeAreaMargin,
                350
            );

        this.entryPadding =
            Math.max(
                10,
                this.normalizeNonNegativeNumber(
                    configuration.entryPadding,
                    55
                )
            );

        this.spawnSide =
            this.normalizeSpawnSide(
                configuration.spawnSide ??
                configuration.side ??
                this.enemy?.getSpawnSide?.()
            );

        /*
         * ENTERING:
         * El enemigo entra desde el lado donde apareció.
         *
         * COMBAT:
         * Persigue y ataca al jugador.
         */
        this.mode =
            "ENTERING";

        this.nextDecisionTime =
            0;

        this.enabled =
            true;

        this.isDestroyed =
            false;
    }

    // =========================================================
    // Utilidades
    // =========================================================

    normalizeDecisionInterval(
        value,
        fallback
    ) {
        const parsedValue =
            Number(value);

        return Math.max(
            50,
            Number.isFinite(
                parsedValue
            )
                ? parsedValue
                : fallback
        );
    }

    normalizeNonNegativeNumber(
        value,
        fallback
    ) {
        const parsedValue =
            Number(value);

        return Math.max(
            0,
            Number.isFinite(
                parsedValue
            )
                ? parsedValue
                : fallback
        );
    }

    normalizeSpawnSide(side) {
        if (
            side === "LEFT" ||
            side === "left"
        ) {
            return "LEFT";
        }

        return "RIGHT";
    }

    getSpawnSide() {
        const enemySide =
            this.enemy
                ?.getSpawnSide?.();

        if (
            enemySide !== undefined &&
            enemySide !== null
        ) {
            this.spawnSide =
                this.normalizeSpawnSide(
                    enemySide
                );
        }

        return this.spawnSide;
    }

    // =========================================================
    // Update
    // =========================================================

    update(time) {
        if (
            this.isDestroyed ||
            !this.enabled ||
            !this.enemy
        ) {
            return;
        }

        if (!this.canThink()) {
            return;
        }

        if (
            this.mode ===
            "ENTERING"
        ) {
            this.updateEntering(
                time
            );

            return;
        }

        const currentTime =
            this.resolveTime(
                time
            );

        if (
            currentTime <
            this.nextDecisionTime
        ) {
            return;
        }

        this.nextDecisionTime =
            currentTime +
            this.decisionInterval;

        this.makeCombatDecision(
            currentTime
        );
    }

    resolveTime(time) {
        if (
            Number.isFinite(
                time
            )
        ) {
            return time;
        }

        return (
            this.enemy
                ?.getScene?.()
                ?.time
                ?.now ??
            0
        );
    }

    canThink() {
        if (
            this.isDestroyed ||
            !this.enabled ||
            !this.enemy?.isAlive?.()
        ) {
            return false;
        }

        if (
            this.enemy
                .isHurtState?.() ||
            this.enemy
                .isAttackingState?.()
        ) {
            return false;
        }

        return true;
    }

    // =========================================================
    // Entrada desde izquierda o derecha
    // =========================================================

    updateEntering(time) {
        const scene =
            this.enemy
                ?.getScene?.();

        const sprite =
            this.enemy
                ?.getSprite?.();

        const camera =
            scene
                ?.cameras
                ?.main;

        if (
            !scene ||
            !sprite?.active ||
            !sprite.body ||
            !camera
        ) {
            return;
        }

        const spawnSide =
            this.getSpawnSide();

        const visibleLeft =
            camera.scrollX;

        const visibleRight =
            camera.scrollX +
            camera.width;

        const responsivePadding =
            Math.min(
                this.entryPadding,
                Math.max(
                    24,
                    camera.width *
                    0.06
                )
            );

        /*
         * Si apareció desde la izquierda,
         * entra hacia la derecha.
         *
         * Si apareció desde la derecha,
         * entra hacia la izquierda.
         */
        if (
            spawnSide ===
            "LEFT"
        ) {
            const entryTargetX =
                visibleLeft +
                responsivePadding;

            if (
                sprite.x <
                entryTargetX
            ) {
                this.enemy
                    ?.setFacingDirection?.(
                        1
                    );

                this.enemy
                    ?.setWalking?.(
                        1
                    );

                return;
            }
        } else {
            const entryTargetX =
                visibleRight -
                responsivePadding;

            if (
                sprite.x >
                entryTargetX
            ) {
                this.enemy
                    ?.setFacingDirection?.(
                        -1
                    );

                this.enemy
                    ?.setWalking?.(
                        -1
                    );

                return;
            }
        }

        /*
         * Ya entró completamente
         * en la zona visible.
         */
        this.enemy
            ?.setIdle?.();

        this.mode =
            "COMBAT";

        this.nextDecisionTime =
            0;

        this.makeCombatDecision(
            this.resolveTime(
                time
            )
        );
    }

    // =========================================================
    // Combate
    // =========================================================

    makeCombatDecision(time) {
        const target =
            this.enemy
                ?.getTarget?.();

        const targetSprite =
            target
                ?.getSprite?.();

        const enemySprite =
            this.enemy
                ?.getSprite?.();

        if (
            !targetSprite?.active ||
            !enemySprite?.active ||
            target?.hasDied?.()
        ) {
            this.enemy
                ?.setIdle?.();

            return;
        }

        const differenceX =
            targetSprite.x -
            enemySprite.x;

        const distance =
            Math.abs(
                differenceX
            );

        const direction =
            Math.sign(
                differenceX
            );

        if (
            direction !== 0
        ) {
            this.enemy
                ?.setFacingDirection?.(
                    direction
                );
        }

        /*
         * Fuera del rango de detección:
         * actualmente el enemigo sigue caminando
         * hacia el jugador.
         */
        if (
            distance >
            this.enemy
                ?.getDetectionRange?.()
        ) {
            this.walkTowardsTarget(
                direction
            );

            return;
        }

        /*
         * Dentro del rango de ataque.
         */
        if (
            distance <=
            this.enemy
                ?.getAttackRange?.()
        ) {
            this.enemy
                ?.setIdle?.();

            this.enemy
                ?.tryAttack?.(
                    time
                );

            return;
        }

        /*
         * Detectó al jugador, pero todavía
         * no está suficientemente cerca.
         */
        this.walkTowardsTarget(
            direction
        );
    }

    walkTowardsTarget(direction) {
        if (
            direction !== -1 &&
            direction !== 1
        ) {
            this.enemy
                ?.setIdle?.();

            return;
        }

        this.enemy
            ?.setWalking?.(
                direction
            );
    }

    // =========================================================
    // Reinicio para pooling
    // =========================================================

    reset(configuration = {}) {
        if (
            this.isDestroyed
        ) {
            return false;
        }

        if (
            configuration
                .decisionInterval !==
            undefined
        ) {
            this.decisionInterval =
                this.normalizeDecisionInterval(
                    configuration
                        .decisionInterval,
                    this.decisionInterval
                );
        }

        if (
            configuration
                .activeAreaMargin !==
            undefined
        ) {
            this.activeAreaMargin =
                this.normalizeNonNegativeNumber(
                    configuration
                        .activeAreaMargin,
                    this.activeAreaMargin
                );
        }

        if (
            configuration
                .entryPadding !==
            undefined
        ) {
            this.entryPadding =
                Math.max(
                    10,
                    this.normalizeNonNegativeNumber(
                        configuration
                            .entryPadding,
                        this.entryPadding
                    )
                );
        }

        this.spawnSide =
            this.normalizeSpawnSide(
                configuration.spawnSide ??
                configuration.side ??
                this.enemy
                    ?.getSpawnSide?.() ??
                this.spawnSide
            );

        this.mode =
            configuration.mode ===
            "COMBAT"
                ? "COMBAT"
                : "ENTERING";

        this.nextDecisionTime =
            0;

        this.enabled =
            true;

        return true;
    }

    // =========================================================
    // Control
    // =========================================================

    setEnabled(enabled) {
        if (
            this.isDestroyed
        ) {
            return false;
        }

        const nextEnabled =
            Boolean(enabled);

        if (
            this.enabled ===
            nextEnabled
        ) {
            return false;
        }

        this.enabled =
            nextEnabled;

        if (
            !this.enabled
        ) {
            this.enemy
                ?.setIdle?.();
        }

        return true;
    }

    setMode(mode) {
        if (
            this.isDestroyed ||
            (
                mode !== "ENTERING" &&
                mode !== "COMBAT"
            )
        ) {
            return false;
        }

        if (
            this.mode === mode
        ) {
            return false;
        }

        this.mode =
            mode;

        this.nextDecisionTime =
            0;

        return true;
    }

    getMode() {
        return this.mode;
    }

    isEntering() {
        return (
            this.mode ===
            "ENTERING"
        );
    }

    resetDecisionTimer() {
        if (
            this.isDestroyed
        ) {
            return;
        }

        this.nextDecisionTime =
            0;
    }

    setDecisionInterval(interval) {
        if (
            this.isDestroyed
        ) {
            return false;
        }

        const value =
            Number(interval);

        if (
            !Number.isFinite(
                value
            )
        ) {
            return false;
        }

        this.decisionInterval =
            Math.max(
                50,
                value
            );

        return true;
    }

    setSpawnSide(side) {
        if (
            this.isDestroyed
        ) {
            return false;
        }

        this.spawnSide =
            this.normalizeSpawnSide(
                side
            );

        return true;
    }

    // =========================================================
    // Destrucción
    // =========================================================

    destroy() {
        if (
            this.isDestroyed
        ) {
            return;
        }

        this.isDestroyed =
            true;

        this.enabled =
            false;

        this.nextDecisionTime =
            0;

        this.enemy =
            null;
    }
}