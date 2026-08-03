import HealthBar
    from "../ui/HealthBar.js";


export default class HealthBarSystem {
    constructor(
        scene,
        player,
        configuration = {}
    ) {
        this.scene =
            scene ?? null;

        this.player =
            player ?? null;

        // =====================================================
        // Configuración
        // =====================================================

        this.playerBarWidth =
            Math.max(
                1,
                Number(
                    configuration.playerWidth
                ) || 170
            );

        this.playerBarHeight =
            Math.max(
                1,
                Number(
                    configuration.playerHeight
                ) || 16
            );

        this.enemyBarWidth =
            Math.max(
                1,
                Number(
                    configuration.enemyWidth
                ) || 70
            );

        this.enemyBarHeight =
            Math.max(
                1,
                Number(
                    configuration.enemyHeight
                ) || 8
            );

        this.enemyBarVerticalOffset =
            Math.max(
                0,
                Number(
                    configuration.enemyVerticalOffset
                ) || 10
            );

        /*
         * Margen alrededor de la cámara.
         *
         * Evita ocultar una barra inmediatamente cuando
         * el enemigo toca el borde de la pantalla.
         */
        this.cameraMargin =
            Math.max(
                0,
                Number(
                    configuration.cameraMargin
                ) || 40
            );

        // =====================================================
        // Barra del jugador
        // =====================================================

        this.playerBar =
            null;

        this.playerUnsubscribe =
            null;

        // =====================================================
        // Barras enemigas
        // =====================================================

        /*
         * enemy -> {
         *     bar,
         *     health,
         *     unsubscribe,
         *     healthVisible,
         *     cameraVisible
         * }
         */
        this.enemyEntries =
            new Map();

        /*
         * Arreglo reutilizable para evitar modificar el Map
         * mientras se está recorriendo.
         */
        this.pendingRemovals = [];

        // =====================================================
        // Estado
        // =====================================================

        this.isDestroyed =
            false;

        this.createPlayerBar();
        this.subscribeToPlayerHealth();
    }

    // =========================================================
    // Jugador
    // =========================================================

    createPlayerBar() {
        if (
            this.isDestroyed ||
            !this.scene ||
            this.playerBar
        ) {
            return false;
        }

        this.playerBar =
            new HealthBar(
                this.scene,
                {
                    x:
                        24,

                    y:
                        24,

                    width:
                        this.playerBarWidth,

                    height:
                        this.playerBarHeight,

                    fixedToCamera:
                        true,

                    depth:
                        3000,

                    visible:
                        true
                }
            );

        this.updatePlayerPercentage();

        return true;
    }

    subscribeToPlayerHealth() {
        if (this.isDestroyed) {
            return false;
        }

        this.playerUnsubscribe
            ?.();

        this.playerUnsubscribe =
            null;

        const health =
            this.player
                ?.getHealthComponent?.();

        if (!health) {
            return false;
        }

        this.playerUnsubscribe =
            health.subscribe(
                ({
                    percentage
                }) => {
                    if (
                        this.isDestroyed ||
                        !this.playerBar
                    ) {
                        return;
                    }

                    this.playerBar
                        .setPercentage(
                            percentage
                        );
                }
            );

        this.playerBar
            ?.setPercentage(
                health.getPercentage()
            );

        return true;
    }

    updatePlayerPercentage() {
        if (
            this.isDestroyed ||
            !this.playerBar
        ) {
            return false;
        }

        const health =
            this.player
                ?.getHealthComponent?.();

        if (!health) {
            return false;
        }

        this.playerBar.setPercentage(
            health.getPercentage()
        );

        return true;
    }

    // =========================================================
    // Enemigos
    // =========================================================

    addEnemy(enemy) {
        if (
            this.isDestroyed ||
            !this.scene ||
            !enemy ||
            this.enemyEntries.has(
                enemy
            )
        ) {
            return false;
        }

        const health =
            enemy
                .getHealthComponent?.();

        if (!health) {
            console.warn(
                "[HealthBarSystem] " +
                "El enemigo no expone HealthComponent."
            );

            return false;
        }

        const currentHealth =
            health.getCurrentHealth();

        const maximumHealth =
            health.getMaximumHealth();

        const healthVisible =
            this.shouldShowEnemyHealthBar(
                currentHealth,
                maximumHealth
            );

        const bar =
            new HealthBar(
                this.scene,
                {
                    width:
                        this.enemyBarWidth,

                    height:
                        this.enemyBarHeight,

                    fixedToCamera:
                        false,

                    depth:
                        1500,

                    visible:
                        false,

                    percentage:
                        health.getPercentage()
                }
            );

        const entry = {
            bar,
            health,
            unsubscribe:
                null,
            healthVisible,
            cameraVisible:
                false
        };

        entry.unsubscribe =
            health.subscribe(
                ({
                    currentHealth:
                        nextCurrentHealth,

                    maximumHealth:
                        nextMaximumHealth,

                    percentage
                }) => {
                    if (
                        this.isDestroyed ||
                        !entry.bar
                    ) {
                        return;
                    }

                    entry.bar.setPercentage(
                        percentage
                    );

                    entry.healthVisible =
                        this.shouldShowEnemyHealthBar(
                            nextCurrentHealth,
                            nextMaximumHealth
                        );

                    this.applyEnemyBarVisibility(
                        entry
                    );
                }
            );

        this.enemyEntries.set(
            enemy,
            entry
        );

        /*
         * Se calcula inmediatamente la posición para que la barra
         * esté preparada antes de recibir el primer golpe.
         */
        this.updateEnemyEntry(
            enemy,
            entry
        );

        return true;
    }

    removeEnemy(enemy) {
        if (
            this.isDestroyed ||
            !enemy
        ) {
            return false;
        }

        const entry =
            this.enemyEntries.get(
                enemy
            );

        if (!entry) {
            return false;
        }

        entry.unsubscribe
            ?.();

        entry.unsubscribe =
            null;

        entry.bar
            ?.destroy();

        entry.bar =
            null;

        entry.health =
            null;

        this.enemyEntries.delete(
            enemy
        );

        return true;
    }

    shouldShowEnemyHealthBar(
        currentHealth,
        maximumHealth
    ) {
        const current =
            Number(currentHealth) || 0;

        const maximum =
            Math.max(
                1,
                Number(maximumHealth) || 1
            );

        /*
         * Solo aparece después del primer daño y desaparece
         * cuando el enemigo muere.
         */
        return (
            current > 0 &&
            current < maximum
        );
    }

    // =========================================================
    // Update
    // =========================================================

    update() {
        if (
            this.isDestroyed ||
            this.enemyEntries.size === 0
        ) {
            return;
        }

        this.pendingRemovals.length =
            0;

        for (
            const [
                enemy,
                entry
            ]
            of this.enemyEntries
        ) {
            const sprite =
                enemy?.getSprite?.();

            if (
                !sprite?.active ||
                !enemy?.isAlive?.()
            ) {
                this.pendingRemovals.push(
                    enemy
                );

                continue;
            }

            this.updateEnemyEntry(
                enemy,
                entry
            );
        }

        /*
         * Las eliminaciones se ejecutan después del recorrido.
         */
        for (
            const enemy
            of this.pendingRemovals
        ) {
            this.removeEnemy(
                enemy
            );
        }

        this.pendingRemovals.length =
            0;
    }

    updateEnemyEntry(
        enemy,
        entry
    ) {
        const sprite =
            enemy?.getSprite?.();

        const bar =
            entry?.bar;

        if (
            !sprite?.active ||
            !bar
        ) {
            return;
        }

        entry.cameraVisible =
            this.isSpriteInsideCamera(
                sprite
            );

        this.applyEnemyBarVisibility(
            entry
        );

        /*
         * Una barra oculta no necesita actualizar posición.
         *
         * Cuando vuelva a hacerse visible, se posicionará en
         * este mismo frame antes de renderizarse.
         */
        if (
            !entry.healthVisible ||
            !entry.cameraVisible
        ) {
            return;
        }

        this.updateEnemyBarPosition(
            sprite,
            bar
        );
    }

    applyEnemyBarVisibility(entry) {
        if (!entry?.bar) {
            return;
        }

        const shouldBeVisible =
            Boolean(
                entry.healthVisible &&
                entry.cameraVisible
            );

        entry.bar.setVisible(
            shouldBeVisible
        );
    }

    // =========================================================
    // Cámara
    // =========================================================

    isSpriteInsideCamera(sprite) {
        const camera =
            this.scene
                ?.cameras
                ?.main;

        if (
            !camera ||
            !sprite?.active
        ) {
            return false;
        }

        const left =
            camera.scrollX -
            this.cameraMargin;

        const top =
            camera.scrollY -
            this.cameraMargin;

        const right =
            camera.scrollX +
            camera.width +
            this.cameraMargin;

        const bottom =
            camera.scrollY +
            camera.height +
            this.cameraMargin;

        /*
         * Se usa el área visual aproximada del sprite y no
         * solamente su punto central.
         */
        const halfWidth =
            sprite.displayWidth *
            0.5;

        const spriteLeft =
            sprite.x -
            halfWidth;

        const spriteRight =
            sprite.x +
            halfWidth;

        const spriteTop =
            sprite.y -
            sprite.displayHeight;

        const spriteBottom =
            sprite.y;

        return (
            spriteRight >= left &&
            spriteLeft <= right &&
            spriteBottom >= top &&
            spriteTop <= bottom
        );
    }

    // =========================================================
    // Posición
    // =========================================================

    updateEnemyBarPosition(
        sprite,
        bar
    ) {
        if (
            !sprite?.active ||
            !bar
        ) {
            return;
        }

        const x =
            sprite.x -
            this.enemyBarWidth / 2;

        const y =
            sprite.y -
            sprite.displayHeight -
            this.enemyBarVerticalOffset;

        /*
         * HealthBar evita internamente aplicar nuevamente la
         * misma posición.
         */
        bar.setPosition(
            x,
            y
        );
    }

    // =========================================================
    // Responsive
    // =========================================================

    handleResize() {
        if (this.isDestroyed) {
            return;
        }

        /*
         * La barra está fijada a la cámara; solo conserva
         * su margen superior izquierdo.
         */
        this.playerBar
            ?.setPosition(
                24,
                24
            );

        /*
         * Fuerza una comprobación de cámara en el próximo
         * update, sin recrear ninguna barra.
         */
        for (
            const entry
            of this.enemyEntries.values()
        ) {
            entry.cameraVisible =
                false;

            entry.bar
                ?.setVisible(
                    false
                );
        }
    }

    // =========================================================
    // Consultas
    // =========================================================

    getEnemyBarCount() {
        return this.enemyEntries.size;
    }

    getVisibleEnemyBarCount() {
        let count = 0;

        for (
            const entry
            of this.enemyEntries.values()
        ) {
            if (
                entry.healthVisible &&
                entry.cameraVisible
            ) {
                count += 1;
            }
        }

        return count;
    }

    getPlayerBar() {
        return this.playerBar;
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

        this.playerUnsubscribe
            ?.();

        this.playerUnsubscribe =
            null;

        this.playerBar
            ?.destroy();

        this.playerBar =
            null;

        for (
            const entry
            of this.enemyEntries.values()
        ) {
            entry.unsubscribe
                ?.();

            entry.unsubscribe =
                null;

            entry.bar
                ?.destroy();

            entry.bar =
                null;

            entry.health =
                null;
        }

        this.enemyEntries.clear();

        this.pendingRemovals.length =
            0;

        this.player =
            null;

        this.scene =
            null;
    }
}