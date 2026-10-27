import Enemy
    from "../entities/Enemy.js";

import { Samurai }
    from "../entities/Samurai.js";

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
         * Todos los enemigos activos:
         *
         * - soldier
         * - samurai
         *
         * CombatSystem conserva la referencia a este arreglo,
         * por lo que NUNCA debe reemplazarse.
         */
        this.enemies = [];

        /*
         * Pool compartido.
         *
         * Cada enemigo tiene enemyType para impedir que un
         * Soldier sea reutilizado como Samurai o viceversa.
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

        /*
         * Cuanto puede estar un enemigo fuera del area activa antes
         * de retirarlo, en milisegundos.
         *
         * Hace falta porque descartarlo solo le apaga la IA: se queda
         * congelado pero SIGUE CONTANDO COMO VIVO. Si uno se pierde
         * fuera de la pantalla (empujado por una casa, por ejemplo),
         * la oleada no puede darse por terminada y la partida se
         * queda bloqueada en esa ronda para siempre.
         */
        /*
         * Enemigos extraviados que hay que retirar. No se liberan
         * dentro del recorrido: releaseEnemy hace splice sobre el
         * mismo arreglo que se esta iterando con for...of, y eso se
         * saltaria al siguiente de la lista.
         */
        this.pendingStrayRemovals = [];

        /*
         * Cuanto puede tardar un enemigo en terminar de entrar antes
         * de darlo por perdido, en milisegundos.
         *
         * Una entrada normal son 115 px a 70-155 px/s: menos de dos
         * segundos. Seis da margen de sobra y solo salta cuando de
         * verdad se ha quedado atascado.
         */
        this.enteringTimeout =
            Math.max(
                1000,
                Number(
                    configuration.enteringTimeout
                ) || 6000
            );

        this.strayTimeout =
            Math.max(
                500,
                Number(
                    configuration.strayTimeout
                ) || 3000
            );

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

    normalizeEnemyType(
        type
    ) {
        const normalized =
            String(
                type ?? "soldier"
            ).toLowerCase();

        if (
            normalized === "samurai"
        ) {
            return "samurai";
        }

        return "soldier";
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
    // Aparición genérica
    // =========================================================

    spawnEnemy(
        enemyType,
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

        const normalizedType =
            this.normalizeEnemyType(
                enemyType
            );

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

        const enemyConfiguration = {
            ...configuration,

            enemyType:
                normalizedType,

            spawnSide
        };

        const enemy =
            this.acquireEnemy(
                normalizedType,
                validX,
                validY,
                enemyConfiguration
            );

        if (!enemy) {
            return null;
        }

        /*
         * Marcador persistente requerido por el pool.
         */
        enemy.enemyType =
            normalizedType;

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

    // =========================================================
    // Soldier
    // =========================================================

    spawnSoldier(
        x,
        y,
        configuration = {}
    ) {
        return this.spawnEnemy(
            "soldier",
            x,
            y,
            configuration
        );
    }

    // =========================================================
    // Samurai
    // =========================================================

    spawnSamurai(
        x,
        y,
        configuration = {}
    ) {
        return this.spawnEnemy(
            "samurai",
            x,
            y,
            configuration
        );
    }

    // =========================================================
    // Posición de aparición
    // =========================================================

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

    // =========================================================
    // Pool
    // =========================================================

    findPooledEnemyIndex(
        enemyType
    ) {
        const normalizedType =
            this.normalizeEnemyType(
                enemyType
            );

        for (
            let index =
                this.enemyPool.length - 1;

            index >= 0;

            index -= 1
        ) {
            const enemy =
                this.enemyPool[index];

            if (
                this.normalizeEnemyType(
                    enemy?.enemyType
                ) ===
                normalizedType
            ) {
                return index;
            }
        }

        return -1;
    }

    acquireEnemy(
        enemyType,
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

        const normalizedType =
            this.normalizeEnemyType(
                enemyType
            );

        let enemy =
            null;

        if (
            this.poolingEnabled &&
            this.enemyPool.length > 0
        ) {
            const poolIndex =
                this.findPooledEnemyIndex(
                    normalizedType
                );

            if (
                poolIndex >= 0
            ) {
                enemy =
                    this.enemyPool.splice(
                        poolIndex,
                        1
                    )[0];

                const activated =
                    enemy?.activate?.(
                        x,
                        y,
                        this.player,
                        {
                            ...configuration,

                            enemyType:
                                normalizedType
                        }
                    );

                if (!activated) {
                    enemy?.destroy?.();

                    enemy =
                        null;
                }
            }
        }

        if (!enemy) {
            enemy =
                this.createEnemy(
                    normalizedType,
                    x,
                    y,
                    configuration
                );
        }

        if (!enemy) {
            return null;
        }

        enemy.enemyType =
            normalizedType;

        enemy.setOnDeathFinished?.(
            this.handleEnemyDeathFinished,
            this
        );

        return enemy;
    }

    createEnemy(
        enemyType,
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

        const normalizedType =
            this.normalizeEnemyType(
                enemyType
            );

        let enemy =
            null;

        if (
            normalizedType ===
            "samurai"
        ) {
            enemy =
                new Samurai(
                    this.scene,
                    x,
                    y,
                    this.player,
                    {
                        ...configuration,

                        enemyType:
                            "samurai"
                    }
                );
        } else {
            enemy =
                new Enemy(
                    this.scene,
                    x,
                    y,
                    this.player,
                    {
                        ...configuration,

                        enemyType:
                            "soldier"
                    }
                );
        }

        enemy.enemyType =
            normalizedType;

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
    // Liberación
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

        if (
            index < 0
        ) {
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

        if (
            index < 0
        ) {
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
             * La entrada tiene prioridad sobre el culling.
             */
            if (isEntering) {
                this.handleStuckEntry(
                    enemy,
                    time
                );

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

                this.handleStrayEnemy(
                    enemy,
                    time
                );

                continue;
            }

            /*
             * Ha vuelto al area y ya entro: se olvidan los dos
             * contadores de atasco.
             */
            enemy.outsideSince =
                null;

            enemy.enteringSince =
                null;

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

        this.releaseStrayEnemies();
    }

    /*
     * Retira los extraviados ya fuera del recorrido, cuando modificar
     * el arreglo es seguro.
     */
    queueStrayRemoval(enemy) {
        if (
            !this.pendingStrayRemovals
                .includes(enemy)
        ) {
            this.pendingStrayRemovals
                .push(enemy);
        }
    }

    releaseStrayEnemies() {
        if (
            this.pendingStrayRemovals.length === 0
        ) {
            return;
        }

        for (
            const enemy
            of this.pendingStrayRemovals
        ) {
            this.releaseEnemy(enemy);
        }

        this.pendingStrayRemovals.length = 0;
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
             * Fuera de la pantalla no choca con nada.
             *
             * Si no, una casa que pase por el borde le corta el paso
             * y no entra jamas. Y no puede saltarla: entrando tiene
             * la gravedad apagada y la "y" fijada, asi que su cuerpo
             * nunca esta apoyado y el salto asistido de los
             * obstaculos no se dispara. Se quedaba empotrado, vivo y
             * exento del descarte por distancia, bloqueando el fin de
             * la ronda para siempre.
             */
            if (sprite.body.checkCollision) {
                sprite.body.checkCollision.none =
                    true;
            }

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
            /*
             * Ya asoma dentro: restoreNormalPhysics le devuelve la
             * gravedad y las colisiones.
             */
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

        /*
         * Mientras entra desde fuera se le desactivan las colisiones
         * para que nada le corte el paso. Se devuelven aqui, que es
         * por donde pasa todo enemigo que ya esta en juego: si solo
         * se restauraran en la rama de entrada, uno que terminase de
         * entrar estando aun fuera se quedaria atravesando el
         * escenario y el suelo para siempre.
         */
        if (
            sprite.body.checkCollision &&
            sprite.body.checkCollision.none
        ) {
            sprite.body.checkCollision.none =
                false;
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

    /*
     * Retira a un enemigo que lleva demasiado tiempo fuera del area
     * activa.
     *
     * Un enemigo perdido fuera de pantalla no puede alcanzar al
     * jugador ni ser alcanzado, pero seguia contando como vivo y
     * bloqueaba el fin de la oleada. Se le da un margen por si vuelve
     * a entrar y, si no, se libera como si se hubiera retirado del
     * combate: sin animacion de muerte y sin puntuar.
     */
    /*
     * Red de seguridad para una entrada que no termina.
     *
     * La entrada tiene prioridad sobre el descarte por distancia, asi
     * que un enemigo atascado entrando no lo retira nadie y mantiene
     * la ronda abierta indefinidamente.
     */
    handleStuckEntry(enemy, time) {
        if (!enemy?.isAlive?.()) {
            return false;
        }

        const now =
            Number.isFinite(time)
                ? time
                : (this.scene?.time?.now ?? 0);

        if (!enemy.enteringSince) {
            enemy.enteringSince = now;

            return false;
        }

        if (
            now - enemy.enteringSince <
            this.enteringTimeout
        ) {
            return false;
        }

        console.warn(
            "[EnemyManager] " +
            "Enemigo atascado entrando: se retira " +
            "para no bloquear la ronda."
        );

        enemy.enteringSince = null;

        this.queueStrayRemoval(enemy);

        return true;
    }

    handleStrayEnemy(enemy, time) {
        if (!enemy?.isAlive?.()) {
            return false;
        }

        const now =
            Number.isFinite(time)
                ? time
                : (this.scene?.time?.now ?? 0);

        if (!enemy.outsideSince) {
            enemy.outsideSince = now;

            return false;
        }

        if (
            now - enemy.outsideSince <
            this.strayTimeout
        ) {
            return false;
        }

        console.warn(
            "[EnemyManager] " +
            "Enemigo perdido fuera de pantalla: se retira " +
            "para no bloquear la oleada."
        );

        enemy.outsideSince = null;

        this.queueStrayRemoval(enemy);

        return true;
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

        const enemyType =
            this.normalizeEnemyType(
                configuration.enemyType ??
                    "soldier"
            );

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

        let existingTypeCount =
            this.enemyPool.filter(
                (enemy) =>
                    this.normalizeEnemyType(
                        enemy?.enemyType
                    ) ===
                    enemyType
            ).length;

        let created =
            0;

        while (
            existingTypeCount <
                requestedAmount &&
            this.enemyPool.length <
                this.maximumPoolSize
        ) {
            const enemy =
                this.createEnemy(
                    enemyType,
                    -1000,
                    -1000,
                    {
                        ...configuration,

                        enemyType
                    }
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

            existingTypeCount +=
                1;

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

    getEnemiesByType(
        enemyType
    ) {
        const normalizedType =
            this.normalizeEnemyType(
                enemyType
            );

        return this.enemies.filter(
            (enemy) =>
                this.normalizeEnemyType(
                    enemy?.enemyType
                ) ===
                normalizedType
        );
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
            if (
                enemy?.isAlive?.()
            ) {
                count +=
                    1;
            }
        }

        return count;
    }

    getPoolSize() {
        return this.enemyPool.length;
    }

    getPoolSizeByType(
        enemyType
    ) {
        const normalizedType =
            this.normalizeEnemyType(
                enemyType
            );

        return this.enemyPool.filter(
            (enemy) =>
                this.normalizeEnemyType(
                    enemy?.enemyType
                ) ===
                normalizedType
        ).length;
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