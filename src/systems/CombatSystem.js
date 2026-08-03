import Phaser from "phaser";


export default class CombatSystem {
    constructor(
        scene,
        player,
        enemies = [],
        configuration = {}
    ) {
        this.scene =
            scene ?? null;

        this.player =
            player ?? null;

        /*
         * Se conserva la referencia administrada por EnemyManager.
         *
         * EnemyManager utiliza splice() y no reemplaza el arreglo,
         * por lo que CombatSystem siempre observa la colección
         * actualizada.
         */
        this.enemies =
            Array.isArray(enemies)
                ? enemies
                : [];

        // =====================================================
        // Ataques del jugador
        // =====================================================

        this.lastPlayerAttackId =
            -1;

        /*
         * Un enemigo solo puede recibir daño una vez durante
         * el mismo ataque del jugador.
         */
        this.playerHitEnemies =
            new Set();

        // =====================================================
        // Ataques enemigos
        // =====================================================

        /*
         * enemy -> último attackId procesado.
         */
        this.processedEnemyAttacks =
            new Map();

        // =====================================================
        // Configuración
        // =====================================================

        /*
         * Margen usado por la comprobación preliminar.
         *
         * Permite descartar enemigos muy alejados antes de
         * calcular una intersección completa.
         */
        this.playerBroadPhaseMargin =
            Math.max(
                0,
                Number(
                    configuration
                        .playerBroadPhaseMargin
                ) || 40
            );

        this.enemyBroadPhaseMargin =
            Math.max(
                0,
                Number(
                    configuration
                        .enemyBroadPhaseMargin
                ) || 40
            );

        // =====================================================
        // Objetos reutilizables
        // =====================================================

        /*
         * Se reutilizan para evitar crear un Rectangle por cada
         * enemigo y por cada frame.
         */
        this.playerBodyBounds =
            new Phaser.Geom.Rectangle();

        this.enemyBodyBounds =
            new Phaser.Geom.Rectangle();

        // =====================================================
        // Depuración
        // =====================================================

        this.showDebug =
            Boolean(
                configuration.showDebug
            );

        this.playerDebugGraphic =
            null;

        this.enemyDebugGraphic =
            null;

        if (this.showDebug) {
            this.createDebugGraphics();
        }

        // =====================================================
        // Estado
        // =====================================================

        this.isDestroyed =
            false;
    }

    // =========================================================
    // Creación de depuración
    // =========================================================

    createDebugGraphics() {
        if (
            this.isDestroyed ||
            !this.scene
        ) {
            return;
        }

        this.playerDebugGraphic =
            this.scene.add
                .graphics()
                .setDepth(
                    10000
                );

        this.enemyDebugGraphic =
            this.scene.add
                .graphics()
                .setDepth(
                    10000
                );
    }

    // =========================================================
    // Update
    // =========================================================

    update() {
        if (
            this.isDestroyed ||
            !this.scene ||
            !this.player
        ) {
            return;
        }

        /*
         * Los gráficos se limpian una sola vez por frame.
         *
         * La versión anterior limpiaba el gráfico cada vez que
         * dibujaba un rectángulo enemigo, por lo que solamente
         * quedaba visible el último.
         */
        if (this.showDebug) {
            this.playerDebugGraphic
                ?.clear();

            this.enemyDebugGraphic
                ?.clear();
        }

        this.processPlayerAttack();
        this.processEnemyAttacks();
    }

    // =========================================================
    // Jugador contra enemigos
    // =========================================================

    processPlayerAttack() {
        if (
            !this.player
                ?.isAttackActive?.()
        ) {
            return;
        }

        const attackId =
            this.player
                .getAttackId?.();

        if (
            !Number.isFinite(
                attackId
            )
        ) {
            return;
        }

        /*
         * Cuando empieza un nuevo ataque se permite volver
         * a golpear enemigos afectados por ataques anteriores.
         */
        if (
            attackId !==
            this.lastPlayerAttackId
        ) {
            this.lastPlayerAttackId =
                attackId;

            this.playerHitEnemies
                .clear();
        }

        const attackBounds =
            this.player
                .getAttackBounds?.();

        if (!attackBounds) {
            return;
        }

        this.drawDebugRectangle(
            this.playerDebugGraphic,
            attackBounds,
            0x00ff00
        );

        const playerSprite =
            this.player
                .getSprite?.();

        const attackerX =
            playerSprite?.x;

        /*
         * Límites ampliados para la comprobación preliminar.
         */
        const broadPhaseLeft =
            attackBounds.x -
            this.playerBroadPhaseMargin;

        const broadPhaseRight =
            attackBounds.right +
            this.playerBroadPhaseMargin;

        for (const enemy of this.enemies) {
            if (
                !enemy?.isAlive?.() ||
                this.playerHitEnemies.has(
                    enemy
                )
            ) {
                continue;
            }

            const enemySprite =
                enemy.getSprite?.();

            if (
                !enemySprite?.active ||
                !enemySprite.body
            ) {
                continue;
            }

            /*
             * Broad phase:
             *
             * compara primero solamente el eje X. Es más barato
             * que obtener límites completos y comprobar cuatro
             * lados para enemigos evidentemente alejados.
             */
            const enemyCenterX =
                enemySprite.x;

            const enemyHalfWidth =
                enemySprite.body.width *
                0.5;

            if (
                enemyCenterX +
                    enemyHalfWidth <
                    broadPhaseLeft ||
                enemyCenterX -
                    enemyHalfWidth >
                    broadPhaseRight
            ) {
                continue;
            }

            this.readBodyBounds(
                enemySprite,
                this.enemyBodyBounds
            );

            if (
                !this.intersects(
                    attackBounds,
                    this.enemyBodyBounds
                )
            ) {
                continue;
            }

            const applied =
                enemy.takeDamage?.(
                    1,
                    attackerX
                );

            if (applied) {
                this.playerHitEnemies.add(
                    enemy
                );
            }
        }
    }

    // =========================================================
    // Enemigos contra jugador
    // =========================================================

    processEnemyAttacks() {
        const playerSprite =
            this.player
                ?.getSprite?.();

        if (
            !playerSprite?.active ||
            !playerSprite.body ||
            this.player.hasDied?.()
        ) {
            return;
        }

        /*
         * Se calculan los límites del jugador una sola vez
         * para todos los enemigos del frame.
         */
        this.readBodyBounds(
            playerSprite,
            this.playerBodyBounds
        );

        const playerCenterX =
            playerSprite.x;

        for (const enemy of this.enemies) {
            if (
                !enemy?.isAlive?.() ||
                !enemy
                    .isAttackingPlayer?.()
            ) {
                continue;
            }

            const enemySprite =
                enemy.getSprite?.();

            if (!enemySprite?.active) {
                continue;
            }

            /*
             * Broad phase:
             *
             * un enemigo muy alejado horizontalmente no puede
             * alcanzar al jugador durante este frame.
             */
            const approximateRange =
                (
                    enemy
                        .getAttackRange?.() ??
                    115
                ) +
                this.enemyBroadPhaseMargin;

            if (
                Math.abs(
                    enemySprite.x -
                    playerCenterX
                ) >
                approximateRange
            ) {
                continue;
            }

            const attackId =
                enemy.getAttackId?.();

            if (
                !Number.isFinite(
                    attackId
                )
            ) {
                continue;
            }

            /*
             * Si este ataque ya fue procesado, no necesitamos
             * volver a obtener sus límites.
             */
            if (
                this.processedEnemyAttacks
                    .get(enemy) ===
                attackId
            ) {
                continue;
            }

            const attackBounds =
                enemy.getAttackBounds?.();

            if (!attackBounds) {
                continue;
            }

            this.drawDebugRectangle(
                this.enemyDebugGraphic,
                attackBounds,
                0xff0000
            );

            if (
                !this.intersects(
                    attackBounds,
                    this.playerBodyBounds
                )
            ) {
                continue;
            }

            const attackDamage =
                enemy
                    .getAttackDamage?.() ??
                enemy.attackDamage ??
                1;

            const applied =
                this.player
                    .takeDamage?.(
                        attackDamage,
                        enemySprite.x
                    );

            /*
             * Se registra el ataque aunque takeDamage() no
             * devuelva explícitamente true.
             *
             * Solamente false indica que no se aplicó.
             */
            if (applied !== false) {
                this.processedEnemyAttacks
                    .set(
                        enemy,
                        attackId
                    );
            }
        }
    }

    // =========================================================
    // Límites físicos reutilizables
    // =========================================================

    readBodyBounds(
        sprite,
        outputRectangle
    ) {
        if (
            !sprite ||
            !outputRectangle
        ) {
            return null;
        }

        const body =
            sprite.body;

        if (
            body &&
            body.enable !== false
        ) {
            outputRectangle.setTo(
                body.x,
                body.y,
                body.width,
                body.height
            );

            return outputRectangle;
        }

        /*
         * Este camino solo debería utilizarse en entidades sin
         * cuerpo activo.
         */
        const bounds =
            sprite.getBounds?.();

        if (!bounds) {
            outputRectangle.setTo(
                0,
                0,
                0,
                0
            );

            return outputRectangle;
        }

        outputRectangle.setTo(
            bounds.x,
            bounds.y,
            bounds.width,
            bounds.height
        );

        return outputRectangle;
    }

    // =========================================================
    // Colisión sin asignaciones
    // =========================================================

    intersects(
        first,
        second
    ) {
        if (
            !first ||
            !second
        ) {
            return false;
        }

        /*
         * Se evita Phaser.Geom.Intersects.RectangleToRectangle()
         * para mantener el cálculo explícito y sin objetos
         * temporales adicionales.
         */
        return !(
            first.right <=
                second.left ||
            first.left >=
                second.right ||
            first.bottom <=
                second.top ||
            first.top >=
                second.bottom
        );
    }

    // =========================================================
    // Registro y eliminación de enemigos
    // =========================================================

    removeEnemy(enemy) {
        if (
            this.isDestroyed ||
            !enemy
        ) {
            return false;
        }

        this.playerHitEnemies
            .delete(
                enemy
            );

        this.processedEnemyAttacks
            .delete(
                enemy
            );

        return true;
    }

    clearAttackTracking() {
        this.lastPlayerAttackId =
            -1;

        this.playerHitEnemies
            .clear();

        this.processedEnemyAttacks
            .clear();
    }

    // =========================================================
    // Depuración
    // =========================================================

    drawDebugRectangle(
        graphic,
        rectangle,
        color
    ) {
        if (
            !this.showDebug ||
            !graphic ||
            !rectangle
        ) {
            return;
        }

        /*
         * No se limpia aquí. El gráfico se limpia una vez al
         * principio de update().
         */
        graphic.lineStyle(
            2,
            color,
            1
        );

        graphic.strokeRect(
            rectangle.x,
            rectangle.y,
            rectangle.width,
            rectangle.height
        );
    }

    setDebugVisible(visible) {
        if (this.isDestroyed) {
            return;
        }

        const nextVisible =
            Boolean(visible);

        if (
            this.showDebug ===
            nextVisible
        ) {
            return;
        }

        this.showDebug =
            nextVisible;

        if (
            this.showDebug &&
            (
                !this.playerDebugGraphic ||
                !this.enemyDebugGraphic
            )
        ) {
            this.createDebugGraphics();
        }

        this.playerDebugGraphic
            ?.setVisible(
                this.showDebug
            );

        this.enemyDebugGraphic
            ?.setVisible(
                this.showDebug
            );

        if (!this.showDebug) {
            this.playerDebugGraphic
                ?.clear();

            this.enemyDebugGraphic
                ?.clear();
        }
    }

    // =========================================================
    // Consultas
    // =========================================================

    getTrackedEnemyAttackCount() {
        return this.processedEnemyAttacks
            .size;
    }

    getPlayerHitEnemyCount() {
        return this.playerHitEnemies
            .size;
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

        this.clearAttackTracking();

        this.playerDebugGraphic
            ?.destroy();

        this.enemyDebugGraphic
            ?.destroy();

        this.playerDebugGraphic =
            null;

        this.enemyDebugGraphic =
            null;

        this.playerBodyBounds =
            null;

        this.enemyBodyBounds =
            null;

        this.player =
            null;

        /*
         * No se vacía el arreglo original porque pertenece
         * a EnemyManager. Solo se elimina nuestra referencia.
         */
        this.enemies =
            null;

        this.scene =
            null;
    }
}