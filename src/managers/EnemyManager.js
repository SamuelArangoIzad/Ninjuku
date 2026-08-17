import Enemy
    from "../entities/Enemy.js";

import GameSettings
    from "../config/GameSettings.js";


export default class EnemyManager {
    constructor(
        scene,
        configuration = {}
    ) {
        this.scene =
            scene ?? null;

        this.player =
            configuration.player ??
            null;

        this.ground =
            configuration.ground ??
            null;

        // =====================================================
        // Colecciones
        // =====================================================

        /*
         * Enemigos activos.
         *
         * CombatSystem conserva esta referencia, por lo que
         * nunca se debe reemplazar este arreglo.
         */
        this.enemies = [];

        /*
         * Enemigos desactivados disponibles para reutilización.
         */
        this.enemyPool = [];

        /*
         * enemy -> collider con el suelo.
         */
        this.groundColliders =
            new Map();

        // =====================================================
        // Sistemas externos
        // =====================================================

        this.combatSystem =
            null;

        this.healthBarSystem =
            null;

        // =====================================================
        // Configuración
        // =====================================================

        const enemySettings =
            GameSettings.enemies ??
            {};

        this.cullingEnabled =
            configuration.cullingEnabled ??
            enemySettings.cullingEnabled ??
            true;

        this.activeAreaMargin =
            this.normalizeNonNegativeNumber(
                configuration.activeAreaMargin ??
                    enemySettings.activeAreaMargin,
                350
            );

        this.maximumPoolSize =
            Math.max(
                0,
                Math.floor(
                    this.normalizeNumber(
                        configuration.maximumPoolSize ??
                            enemySettings.maximumPoolSize,
                        12
                    )
                )
            );

        this.poolingEnabled =
            configuration.poolingEnabled ??
            enemySettings.poolingEnabled ??
            true;

        /*
         * Distancia adicional fuera de la pantalla
         * utilizada para la aparición de enemigos.
         */
        this.spawnOffset =
            this.normalizeNonNegativeNumber(
                configuration.spawnOffset ??
                    enemySettings.spawnOffset,
                35
            );

        // =====================================================
        // Estado
        // =====================================================

        this.isDestroyed =
            false;
    }

    // =========================================================
    // Normalización
    // =========================================================

    normalizeNumber(
        value,
        fallback
    ) {
        const parsedValue =
            Number(value);

        return Number.isFinite(
            parsedValue
        )
            ? parsedValue
            : fallback;
    }

    normalizeNonNegativeNumber(
        value,
        fallback
    ) {
        return Math.max(
            0,
            this.normalizeNumber(
                value,
                fallback
            )
        );
    }

    normalizeSpawnSide(
        side
    ) {
        if (
            side === "LEFT" ||
            side === "left"
        ) {
            return "LEFT";
        }

        if (
            side === "RIGHT" ||
            side === "right"
        ) {
            return "RIGHT";
        }

        return "RIGHT";
    }

    // =========================================================
    // Dependencias
    // =========================================================

    setSystems({
        combatSystem = null,
        healthBarSystem = null
    } = {}) {
        if (this.isDestroyed) {
            return false;
        }

        this.combatSystem =
            combatSystem;

        this.healthBarSystem =
            healthBarSystem;

        return true;
    }

    setGround(ground) {
        if (this.isDestroyed) {
            return false;
        }

        this.ground =
            ground ?? null;

        return true;
    }

    setPlayer(player) {
        if (this.isDestroyed) {
            return false;
        }

        this.player =
            player ?? null;

        return true;
    }

    // =========================================================
    // Aparición
    // =========================================================

    spawnSoldier(
        x,
        y,
        configuration = {}
    ) {
        if (
            this.isDestroyed ||
            !this.scene ||
            !this.player
        ) {
            return null;
        }

        const spawnSide =
            this.normalizeSpawnSide(
                configuration.spawnSide ??
                    configuration.side
            );

        const validX =
            Number.isFinite(x)
                ? x
                : this.getSpawnX(
                    spawnSide
                );

        const validY =
            Number.isFinite(y)
                ? y
                : (
                    this.getGroundSurfaceY() -
                    5
                );

        /*
         * La dirección de entrada se conserva dentro de la
         * configuración para Enemy y SoldierAI.
         */
        const enemyConfiguration = {
            ...configuration,

            spawnSide
        };

        const enemy =
            this.acquireEnemy(
                validX,
                validY,
                enemyConfiguration
            );

        if (!enemy) {
            return null;
        }

        this.enemies.push(
            enemy
        );

        this.healthBarSystem
            ?.addEnemy?.(
                enemy
            );

        this.createGroundCollider(
            enemy
        );

        return enemy;
    }

    getSpawnX(
        spawnSide
    ) {
        const camera =
            this.scene
                ?.cameras
                ?.main;

        const visibleLeft =
            camera?.scrollX ??
            0;

        const visibleRight =
            camera
                ? (
                    camera.scrollX +
                    camera.width
                )
                : (
                    this.scene
                        ?.scale
                        ?.width ??
                    1
                );

        if (
            spawnSide === "LEFT"
        ) {
            return (
                visibleLeft -
                this.spawnOffset
            );
        }

        return (
            visibleRight +
            this.spawnOffset
        );
    }

    acquireEnemy(
        x,
        y,
        configuration = {}
    ) {
        if (
            this.isDestroyed ||
            !this.scene ||
            !this.player
        ) {
            return null;
        }

        let enemy =
            null;

        if (
            this.poolingEnabled &&
            this.enemyPool.length > 0
        ) {
            enemy =
                this.enemyPool.pop();

            const activated =
                enemy?.activate?.(
                    x,
                    y,
                    this.player,
                    configuration
                );

            if (!activated) {
                enemy?.destroy?.();

                enemy =
                    null;
            }
        }

        if (!enemy) {
            enemy =
                this.createEnemy(
                    x,
                    y,
                    configuration
                );
        }

        if (!enemy) {
            return null;
        }

        enemy.setOnDeathFinished?.(
            this.handleEnemyDeathFinished,
            this
        );

        return enemy;
    }

    createEnemy(
        x,
        y,
        configuration = {}
    ) {
        if (
            this.isDestroyed ||
            !this.scene ||
            !this.player
        ) {
            return null;
        }

        const enemy =
            new Enemy(
                this.scene,
                x,
                y,
                this.player,
                configuration
            );

        enemy.setOnDeathFinished?.(
            this.handleEnemyDeathFinished,
            this
        );

        return enemy;
    }

    handleEnemyDeathFinished = (
        enemy
    ) => {
        if (
            this.isDestroyed ||
            !enemy
        ) {
            return;
        }

        this.releaseEnemy(
            enemy
        );
    };

    // =========================================================
    // Liberación y pooling
    // =========================================================

    releaseEnemy(enemy) {
        if (
            this.isDestroyed ||
            !enemy
        ) {
            return false;
        }

        const index =
            this.enemies.indexOf(
                enemy
            );

        if (index < 0) {
            return false;
        }

        this.unregisterEnemy(
            enemy
        );

        this.enemies.splice(
            index,
            1
        );

        if (
            !this.poolingEnabled ||
            this.enemyPool.length >=
                this.maximumPoolSize
        ) {
            enemy.destroy?.();

            return true;
        }

        const deactivated =
            enemy.deactivate?.();

        if (!deactivated) {
            enemy.destroy?.();

            return true;
        }

        if (
            !this.enemyPool.includes(
                enemy
            )
        ) {
            this.enemyPool.push(
                enemy
            );
        }

        return true;
    }

    removeEnemy(
        enemy,
        usePool = true
    ) {
        if (
            this.isDestroyed ||
            !enemy
        ) {
            return false;
        }

        if (usePool) {
            return this.releaseEnemy(
                enemy
            );
        }

        const index =
            this.enemies.indexOf(
                enemy
            );

        if (index < 0) {
            return false;
        }

        this.unregisterEnemy(
            enemy
        );

        this.enemies.splice(
            index,
            1
        );

        enemy.destroy?.();

        return true;
    }

    unregisterEnemy(enemy) {
        if (!enemy) {
            return;
        }

        this.removeGroundCollider(
            enemy
        );

        this.combatSystem
            ?.removeEnemy?.(
                enemy
            );

        this.healthBarSystem
            ?.removeEnemy?.(
                enemy
            );
    }

    // =========================================================
    // Update
    // =========================================================

    update(time) {
        if (
            this.isDestroyed ||
            !this.scene ||
            this.enemies.length === 0
        ) {
            return;
        }

        for (
            const enemy
            of this.enemies
        ) {
            if (
                !enemy?.isAlive?.()
            ) {
                continue;
            }

            const sprite =
                enemy.getSprite?.();

            if (
                !sprite?.active ||
                !sprite.body
            ) {
                continue;
            }

            const isEntering =
                enemy.ai
                    ?.isEntering?.() ??
                (
                    enemy.ai
                        ?.getMode?.() ===
                    "ENTERING"
                );

            /*
             * ENTERING tiene prioridad sobre culling.
             */
            if (isEntering) {
                this.updateEnteringEnemy(
                    enemy,
                    time
                );

                continue;
            }

            if (
                this.cullingEnabled &&
                !this.isEnemyInsideActiveArea(
                    enemy
                )
            ) {
                this.deactivateEnemyAI(
                    enemy
                );

                continue;
            }

            this.restoreNormalPhysics(
                enemy
            );

            this.activateEnemyAI(
                enemy
            );

            enemy.update?.(
                time
            );
        }
    }

    updateEnteringEnemy(
        enemy,
        time
    ) {
        const sprite =
            enemy?.getSprite?.();

        const camera =
            this.scene
                ?.cameras
                ?.main;

        if (
            !sprite?.active ||
            !sprite.body ||
            !camera
        ) {
            return;
        }

        const spawnSide =
            this.normalizeSpawnSide(
                enemy.spawnSide ??
                    enemy.getSpawnSide?.()
            );

        const visibleLeft =
            camera.scrollX;

        const visibleRight =
            camera.scrollX +
            camera.width;

        const isOutside =
            spawnSide === "LEFT"
                ? (
                    sprite.x <
                    visibleLeft
                )
                : (
                    sprite.x >
                    visibleRight
                );

        if (isOutside) {
            /*
             * Mientras el enemigo está fuera de pantalla:
             *
             * - no cae;
             * - mantiene la altura correcta;
             * - conserva el movimiento horizontal.
             */
            if (
                sprite.body.allowGravity
            ) {
                sprite.body.allowGravity =
                    false;
            }

            if (
                sprite.body.velocity.y !==
                0
            ) {
                sprite.body.setVelocityY(
                    0
                );
            }

            sprite.y =
                this.getGroundSurfaceY() -
                5;
        } else {
            this.restoreNormalPhysics(
                enemy
            );
        }

        enemy.ai
            ?.setEnabled?.(
                true
            );

        enemy.update?.(
            time
        );
    }

    restoreNormalPhysics(enemy) {
        const sprite =
            enemy?.getSprite?.();

        if (!sprite?.body) {
            return false;
        }

        if (
            sprite.body.allowGravity ===
            false
        ) {
            sprite.body.allowGravity =
                true;

            sprite.body.setVelocityY(
                0
            );
        }

        return true;
    }

    // =========================================================
    // Culling
    // =========================================================

    isEnemyInsideActiveArea(enemy) {
        const sprite =
            enemy?.getSprite?.();

        const camera =
            this.scene
                ?.cameras
                ?.main;

        if (
            !sprite?.active ||
            !camera
        ) {
            return false;
        }

        const left =
            camera.scrollX;

        const top =
            camera.scrollY;

        const right =
            left +
            camera.width;

        const bottom =
            top +
            camera.height;

        return (
            sprite.x >=
                left -
                this.activeAreaMargin &&

            sprite.x <=
                right +
                this.activeAreaMargin &&

            sprite.y >=
                top -
                this.activeAreaMargin &&

            sprite.y <=
                bottom +
                this.activeAreaMargin
        );
    }

    deactivateEnemyAI(enemy) {
        if (
            !enemy?.isAlive?.() ||
            enemy.ai?.isEntering?.()
        ) {
            return false;
        }

        if (
            enemy.isAttackingState?.() ||
            enemy.isHurtState?.()
        ) {
            return false;
        }

        enemy.setIdle?.();

        enemy.ai
            ?.setEnabled?.(
                false
            );

        return true;
    }

    activateEnemyAI(enemy) {
        if (
            !enemy?.isAlive?.()
        ) {
            return false;
        }

        enemy.ai
            ?.setEnabled?.(
                true
            );

        return true;
    }

    // =========================================================
    // Limpieza de entidades inválidas
    // =========================================================

    removeDestroyedEnemies() {
        if (
            this.isDestroyed ||
            this.enemies.length === 0
        ) {
            return;
        }

        for (
            let index =
                this.enemies.length - 1;

            index >= 0;

            index -= 1
        ) {
            const enemy =
                this.enemies[index];

            if (
                enemy &&
                !enemy.isDestroyed &&
                enemy.getSprite?.()?.active
            ) {
                continue;
            }

            this.unregisterEnemy(
                enemy
            );

            this.enemies.splice(
                index,
                1
            );

            if (
                enemy &&
                !enemy.isDestroyed
            ) {
                const deactivated =
                    enemy.deactivate?.();

                if (
                    deactivated &&
                    this.poolingEnabled &&
                    this.enemyPool.length <
                        this.maximumPoolSize
                ) {
                    this.enemyPool.push(
                        enemy
                    );
                } else {
                    enemy.destroy?.();
                }
            }
        }
    }

    // =========================================================
    // Colliders
    // =========================================================

    createGroundCollider(enemy) {
        const sprite =
            enemy?.getSprite?.();

        if (
            this.isDestroyed ||
            !this.scene ||
            !sprite?.active ||
            !sprite.body ||
            !this.ground?.platform
        ) {
            return null;
        }

        this.removeGroundCollider(
            enemy
        );

        const collider =
            this.scene.physics.add.collider(
                sprite,
                this.ground.platform
            );

        this.groundColliders.set(
            enemy,
            collider
        );

        return collider;
    }

    removeGroundCollider(enemy) {
        if (!enemy) {
            return false;
        }

        const collider =
            this.groundColliders.get(
                enemy
            );

        if (!collider) {
            return false;
        }

        collider.destroy?.();

        this.groundColliders.delete(
            enemy
        );

        return true;
    }

    destroyGroundColliders() {
        for (
            const collider
            of this.groundColliders.values()
        ) {
            collider?.destroy?.();
        }

        this.groundColliders.clear();
    }

    rebuildGroundColliders() {
        if (this.isDestroyed) {
            return;
        }

        this.destroyGroundColliders();

        for (
            const enemy
            of this.enemies
        ) {
            if (
                enemy?.isAlive?.() &&
                enemy
                    .getSprite?.()
                    ?.active
            ) {
                this.createGroundCollider(
                    enemy
                );
            }
        }
    }

    // =========================================================
    // Responsive
    // =========================================================

    updateResponsiveScale() {
        if (this.isDestroyed) {
            return;
        }

        for (
            const enemy
            of this.enemies
        ) {
            enemy
                ?.updateResponsiveScale?.();
        }
    }

    repositionAfterGroundResize(
        previousGroundY,
        currentGroundY,
        width
    ) {
        if (
            this.isDestroyed ||
            !Number.isFinite(
                previousGroundY
            ) ||
            !Number.isFinite(
                currentGroundY
            )
        ) {
            return;
        }

        const camera =
            this.scene
                ?.cameras
                ?.main;

        const visibleLeft =
            camera?.scrollX ??
            0;

        const visibleRight =
            camera
                ? (
                    camera.scrollX +
                    camera.width
                )
                : (
                    Number(width) ||
                    this.scene?.scale?.width ||
                    1
                );

        for (
            const enemy
            of this.enemies
        ) {
            const sprite =
                enemy?.getSprite?.();

            if (!sprite?.active) {
                continue;
            }

            const distanceFromGround =
                previousGroundY -
                sprite.y;

            sprite.y =
                currentGroundY -
                distanceFromGround;

            const spawnSide =
                this.normalizeSpawnSide(
                    enemy.spawnSide ??
                        enemy.getSpawnSide?.()
                );

            if (
                enemy.ai?.isEntering?.()
            ) {
                if (
                    spawnSide === "LEFT"
                ) {
                    const minimumEntryX =
                        visibleLeft -
                        70;

                    sprite.x =
                        Math.max(
                            sprite.x,
                            minimumEntryX
                        );
                } else {
                    const maximumEntryX =
                        visibleRight +
                        70;

                    sprite.x =
                        Math.min(
                            sprite.x,
                            maximumEntryX
                        );
                }

                sprite.y =
                    currentGroundY -
                    5;

                if (sprite.body) {
                    sprite.body.allowGravity =
                        false;

                    sprite.body.setVelocityY(
                        0
                    );
                }
            } else {
                /*
                 * No forzamos a todos los enemigos a quedar
                 * dentro de la pantalla. Pueden perseguir al
                 * jugador desde ambos lados.
                 */
                const minimumX =
                    visibleLeft -
                    this.activeAreaMargin;

                const maximumX =
                    visibleRight +
                    this.activeAreaMargin;

                sprite.x =
                    Math.max(
                        minimumX,
                        Math.min(
                            sprite.x,
                            maximumX
                        )
                    );
            }

            sprite.body
                ?.updateFromGameObject?.();
        }
    }

    // =========================================================
    // Configuración
    // =========================================================

    setCullingEnabled(enabled) {
        if (this.isDestroyed) {
            return false;
        }

        this.cullingEnabled =
            Boolean(enabled);

        return true;
    }

    setActiveAreaMargin(margin) {
        if (this.isDestroyed) {
            return false;
        }

        const value =
            Number(margin);

        if (!Number.isFinite(value)) {
            return false;
        }

        this.activeAreaMargin =
            Math.max(
                0,
                value
            );

        return true;
    }

    setPoolingEnabled(enabled) {
        if (this.isDestroyed) {
            return false;
        }

        this.poolingEnabled =
            Boolean(enabled);

        if (!this.poolingEnabled) {
            this.clearPool();
        }

        return true;
    }

    setMaximumPoolSize(size) {
        if (this.isDestroyed) {
            return false;
        }

        const parsedSize =
            Number(size);

        if (!Number.isFinite(parsedSize)) {
            return false;
        }

        this.maximumPoolSize =
            Math.max(
                0,
                Math.floor(
                    parsedSize
                )
            );

        this.trimPool();

        return true;
    }

    getActiveAreaMargin() {
        return this.activeAreaMargin;
    }

    // =========================================================
    // Pool
    // =========================================================

    trimPool() {
        while (
            this.enemyPool.length >
            this.maximumPoolSize
        ) {
            const enemy =
                this.enemyPool.pop();

            enemy?.destroy?.();
        }
    }

    clearPool() {
        for (
            const enemy
            of this.enemyPool
        ) {
            enemy?.destroy?.();
        }

        this.enemyPool.length =
            0;
    }

    prewarmPool(
        amount,
        configuration = {}
    ) {
        if (
            this.isDestroyed ||
            !this.scene ||
            !this.player ||
            !this.poolingEnabled
        ) {
            return 0;
        }

        const requestedAmount =
            Math.min(
                this.maximumPoolSize,
                Math.max(
                    0,
                    Math.floor(
                        Number(amount) ||
                        0
                    )
                )
            );

        let created =
            0;

        while (
            this.enemyPool.length <
            requestedAmount
        ) {
            const enemy =
                this.createEnemy(
                    -1000,
                    -1000,
                    configuration
                );

            if (!enemy) {
                break;
            }

            const deactivated =
                enemy.deactivate?.();

            if (!deactivated) {
                enemy.destroy?.();

                break;
            }

            this.enemyPool.push(
                enemy
            );

            created +=
                1;
        }

        return created;
    }

    // =========================================================
    // Consultas
    // =========================================================

    getVisibleLeft() {
        const camera =
            this.scene
                ?.cameras
                ?.main;

        return (
            camera?.scrollX ??
            0
        );
    }

    getVisibleRight() {
        const camera =
            this.scene
                ?.cameras
                ?.main;

        if (camera) {
            return (
                camera.scrollX +
                camera.width
            );
        }

        return (
            this.scene
                ?.scale
                ?.width ??
            1
        );
    }

    getGroundSurfaceY() {
        if (
            typeof this.ground
                ?.getSurfaceY ===
            "function"
        ) {
            return this.ground
                .getSurfaceY();
        }

        if (
            typeof this.ground
                ?.getTop ===
            "function"
        ) {
            return this.ground
                .getTop();
        }

        return (
            this.scene
                ?.scale
                ?.height ??
            24
        ) - 24;
    }

    getEnemies() {
        return this.enemies;
    }

    getAliveEnemies() {
        return this.enemies.filter(
            (enemy) =>
                enemy?.isAlive?.()
        );
    }

    getVisibleEnemies() {
        return this.enemies.filter(
            (enemy) =>
                enemy?.isAlive?.() &&
                this.isEnemyInsideActiveArea(
                    enemy
                )
        );
    }

    getEnemyCount() {
        return this.enemies.length;
    }

    getAliveEnemyCount() {
        let count =
            0;

        for (
            const enemy
            of this.enemies
        ) {
            if (enemy?.isAlive?.()) {
                count +=
                    1;
            }
        }

        return count;
    }

    getPoolSize() {
        return this.enemyPool.length;
    }

    getTotalManagedEnemyCount() {
        return (
            this.enemies.length +
            this.enemyPool.length
        );
    }

    // =========================================================
    // Limpieza
    // =========================================================

    clearActiveEnemies(
        destroyPermanently = true
    ) {
        this.destroyGroundColliders();

        for (
            const enemy
            of this.enemies
        ) {
            this.combatSystem
                ?.removeEnemy?.(
                    enemy
                );

            this.healthBarSystem
                ?.removeEnemy?.(
                    enemy
                );

            if (destroyPermanently) {
                enemy?.destroy?.();
            } else {
                const deactivated =
                    enemy?.deactivate?.();

                if (
                    deactivated &&
                    this.poolingEnabled &&
                    this.enemyPool.length <
                        this.maximumPoolSize
                ) {
                    this.enemyPool.push(
                        enemy
                    );
                } else {
                    enemy?.destroy?.();
                }
            }
        }

        this.enemies.length =
            0;
    }

    clear() {
        if (this.isDestroyed) {
            return;
        }

        this.clearActiveEnemies(
            true
        );

        this.clearPool();
    }

    destroy() {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed =
            true;

        this.destroyGroundColliders();

        for (
            const enemy
            of this.enemies
        ) {
            this.combatSystem
                ?.removeEnemy?.(
                    enemy
                );

            this.healthBarSystem
                ?.removeEnemy?.(
                    enemy
                );

            enemy?.destroy?.();
        }

        this.enemies.length =
            0;

        for (
            const enemy
            of this.enemyPool
        ) {
            enemy?.destroy?.();
        }

        this.enemyPool.length =
            0;

        this.combatSystem =
            null;

        this.healthBarSystem =
            null;

        this.player =
            null;

        this.ground =
            null;

        this.scene =
            null;
    }
}