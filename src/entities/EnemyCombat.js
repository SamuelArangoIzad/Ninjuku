import Phaser from "phaser";

import GameEvents
    from "../constants/GameEvents.js";


export default class EnemyCombat {
    constructor(enemy) {
        this.enemy =
            enemy ?? null;

        this.attackActivationTimer =
            null;

        this.attackDeactivationTimer =
            null;

        this.deathDelayTimer =
            null;

        this.fadeTween =
            null;

        /*
         * Callback que EnemyManager podrá asignar cuando se
         * implemente el pool.
         */
        this.onDeathFinished =
            null;

        /*
         * Rectángulo reutilizable para evitar asignaciones
         * en cada consulta del hitbox.
         */
        this.attackBounds =
            new Phaser.Geom.Rectangle();

        this.isDestroyed =
            false;
    }

    // =========================================================
    // Ataque
    // =========================================================

    tryAttack(time) {
        const enemy =
            this.enemy;

        if (
            this.isDestroyed ||
            !enemy ||
            enemy.isDead ||
            enemy.isHurt ||
            enemy.isAttacking
        ) {
            return false;
        }

        const scene =
            enemy.getScene?.();

        const currentTime =
            Number.isFinite(time)
                ? time
                : scene
                    ?.time
                    ?.now ?? 0;

        if (
            currentTime -
                enemy.lastAttackTime <
            enemy.getAttackCooldown()
        ) {
            return false;
        }

        return this.startAttack(
            currentTime
        );
    }

    startAttack(time) {
        const enemy =
            this.enemy;

        const sprite =
            enemy
                ?.getSprite?.();

        const scene =
            enemy
                ?.getScene?.();

        if (
            this.isDestroyed ||
            !enemy ||
            !sprite?.active ||
            !sprite.body ||
            !scene
        ) {
            return false;
        }

        this.clearAttackTimers();

        enemy.isAttacking =
            true;

        enemy.isAttackActive =
            false;

        enemy.attackId +=
            1;

        enemy.lastAttackTime =
            Number.isFinite(time)
                ? time
                : scene.time.now;

        enemy.state =
            "ATTACK";

        sprite.body.setVelocityX(
            0
        );

        enemy.animations
            ?.reset?.();

        enemy.animations
            ?.playAttack?.();

        this.attackActivationTimer =
            scene.time.delayedCall(
                210,
                () => {
                    this.attackActivationTimer =
                        null;

                    if (
                        this.isDestroyed ||
                        !this.enemy ||
                        this.enemy.isDead ||
                        !this.enemy
                            .isAttacking
                    ) {
                        return;
                    }

                    this.enemy
                        .isAttackActive =
                        true;
                }
            );

        this.attackDeactivationTimer =
            scene.time.delayedCall(
                430,
                () => {
                    this.attackDeactivationTimer =
                        null;

                    if (
                        this.isDestroyed ||
                        !this.enemy
                    ) {
                        return;
                    }

                    this.enemy
                        .isAttackActive =
                        false;
                }
            );

        return true;
    }

    finishAttack() {
        const enemy =
            this.enemy;

        const sprite =
            enemy
                ?.getSprite?.();

        if (
            this.isDestroyed ||
            !enemy ||
            enemy.isDead ||
            !sprite?.active
        ) {
            return false;
        }

        this.clearAttackTimers();

        enemy.isAttacking =
            false;

        enemy.isAttackActive =
            false;

        enemy.animations
            ?.reset?.();

        enemy.changeState?.(
            "IDLE",
            true
        );

        return true;
    }

    clearAttackTimers() {
        this.attackActivationTimer
            ?.remove(false);

        this.attackDeactivationTimer
            ?.remove(false);

        this.attackActivationTimer =
            null;

        this.attackDeactivationTimer =
            null;
    }

    isAttackingPlayer() {
        return Boolean(
            !this.isDestroyed &&
            this.enemy &&
            this.enemy.isAttacking &&
            this.enemy.isAttackActive &&
            !this.enemy.isDead
        );
    }

    getAttackId() {
        return (
            this.enemy
                ?.attackId ??
            -1
        );
    }

    getAttackBounds() {
        const enemy =
            this.enemy;

        const sprite =
            enemy
                ?.getSprite?.();

        if (
            this.isDestroyed ||
            !enemy ||
            !enemy.isAttackActive ||
            enemy.isDead ||
            !sprite?.active
        ) {
            return null;
        }

        const width =
            enemy
                .getAttackHitboxWidth();

        const height =
            enemy
                .getAttackHitboxHeight();

        const offset =
            enemy
                .getAttackHitboxOffset();

        const x =
            enemy.facingDirection >
            0
                ? sprite.x +
                    offset
                : sprite.x -
                    width -
                    offset;

        const y =
            sprite.y -
            height -
            15;

        this.attackBounds.setTo(
            x,
            y,
            width,
            height
        );

        return this.attackBounds;
    }

    // =========================================================
    // Daño recibido
    // =========================================================

    takeDamage(
        amount = 1,
        attackerX = null
    ) {
        const enemy =
            this.enemy;

        if (
            this.isDestroyed ||
            !enemy ||
            enemy.isDead ||
            enemy.isHurt
        ) {
            return false;
        }

        const applied =
            enemy.health
                ?.takeDamage(
                    amount
                );

        if (!applied) {
            return false;
        }

        /*
         * HealthComponent ejecuta die() mediante su callback
         * cuando la vida llega a cero.
         */
        if (
            !enemy.health
                ?.hasDied()
        ) {
            this.startHurt(
                attackerX
            );
        }

        return true;
    }

    startHurt(attackerX) {
        const enemy =
            this.enemy;

        const sprite =
            enemy
                ?.getSprite?.();

        if (
            this.isDestroyed ||
            !enemy ||
            !sprite?.active ||
            !sprite.body
        ) {
            return false;
        }

        this.clearAttackTimers();

        enemy.isHurt =
            true;

        enemy.isAttacking =
            false;

        enemy.isAttackActive =
            false;

        enemy.state =
            "HURT";

        sprite.body.setVelocityX(
            0
        );

        enemy.animations
            ?.reset?.();

        enemy.animations
            ?.playHurt?.();

        if (
            Number.isFinite(
                attackerX
            )
        ) {
            const direction =
                sprite.x <
                attackerX
                    ? -1
                    : 1;

            sprite.body.setVelocityX(
                direction * 130
            );
        }

        return true;
    }

    finishHurt() {
        const enemy =
            this.enemy;

        const sprite =
            enemy
                ?.getSprite?.();

        if (
            this.isDestroyed ||
            !enemy ||
            enemy.isDead ||
            !sprite?.active
        ) {
            return false;
        }

        enemy.isHurt =
            false;

        sprite.body
            ?.setVelocityX(
                0
            );

        enemy.animations
            ?.reset?.();

        enemy.changeState?.(
            "IDLE",
            true
        );

        return true;
    }

    // =========================================================
    // Muerte
    // =========================================================

    die() {
        const enemy =
            this.enemy;

        const sprite =
            enemy
                ?.getSprite?.();

        if (
            this.isDestroyed ||
            !enemy ||
            enemy.isDead ||
            !sprite?.active
        ) {
            return false;
        }

        this.clearAttackTimers();
        this.clearDeathSequence();

        enemy.isDead =
            true;

        enemy.isHurt =
            false;

        enemy.isAttacking =
            false;

        enemy.isAttackActive =
            false;

        enemy.state =
            "DEAD";

        sprite.body
            ?.setVelocity(
                0,
                0
            );

        if (sprite.body) {
            sprite.body.enable =
                false;

            sprite.body.allowGravity =
                false;
        }

        sprite.setScale(
            enemy.getDeathScale()
        );

        sprite.setOrigin(
            0.5,
            1
        );

        sprite.setAlpha(
            1
        );

        this.awardScore();

        enemy.animations
            ?.reset?.();

        enemy.animations
            ?.playDeath?.();

        return true;
    }

    finishDeath() {
        const enemy =
            this.enemy;

        const sprite =
            enemy
                ?.getSprite?.();

        const scene =
            enemy
                ?.getScene?.();

        if (
            this.isDestroyed ||
            !enemy ||
            !sprite?.active ||
            !scene
        ) {
            return false;
        }

        this.clearDeathSequence();

        this.deathDelayTimer =
            scene.time.delayedCall(
                600,
                () => {
                    this.deathDelayTimer =
                        null;

                    const currentEnemy =
                        this.enemy;

                    const currentSprite =
                        currentEnemy
                            ?.getSprite?.();

                    if (
                        this.isDestroyed ||
                        !currentEnemy ||
                        !currentSprite
                            ?.active
                    ) {
                        return;
                    }

                    this.fadeTween =
                        scene.tweens.add({
                            targets:
                                currentSprite,

                            alpha:
                                0,

                            duration:
                                400,

                            ease:
                                "Linear",

                            onComplete:
                                () => {
                                    this.fadeTween =
                                        null;

                                    if (
                                        this.isDestroyed ||
                                        !this.enemy
                                    ) {
                                        return;
                                    }

                                    /*
                                     * Durante el pooling, esta
                                     * función devolverá el enemigo
                                     * al EnemyManager.
                                     *
                                     * Hasta implementar el pool,
                                     * se conserva destroy() como
                                     * comportamiento alternativo.
                                     */
                                    if (
                                        typeof this
                                            .onDeathFinished ===
                                        "function"
                                    ) {
                                        this.onDeathFinished(
                                            this.enemy
                                        );
                                    } else {
                                        this.enemy
                                            .destroy?.();
                                    }
                                }
                        });
                }
            );

        return true;
    }

    clearDeathSequence() {
        this.deathDelayTimer
            ?.remove(false);

        this.deathDelayTimer =
            null;

        if (
            this.fadeTween &&
            this.enemy
                ?.getScene?.()
                ?.tweens
        ) {
            this.enemy
                .getScene()
                .tweens
                .remove(
                    this.fadeTween
                );
        }

        this.fadeTween =
            null;
    }

    // =========================================================
    // Puntuación
    // =========================================================

    awardScore() {
        const enemy =
            this.enemy;

        const scene =
            enemy
                ?.getScene?.();

        if (
            !enemy ||
            enemy.scoreWasAwarded ||
            !scene
        ) {
            return false;
        }

        enemy.scoreWasAwarded =
            true;

        scene.events.emit(
            GameEvents.ENEMY_KILLED,
            {
                enemy,

                points:
                    enemy
                        .getScoreValue()
            }
        );

        return true;
    }

    // =========================================================
    // Reinicio para pooling
    // =========================================================

    reset(configuration = {}) {
        if (
            this.isDestroyed ||
            !this.enemy
        ) {
            return false;
        }

        this.clearAttackTimers();
        this.clearDeathSequence();

        this.enemy.isAttacking =
            false;

        this.enemy.isAttackActive =
            false;

        this.enemy.isHurt =
            false;

        this.enemy.isDead =
            false;

        this.enemy.attackId =
            0;

        this.enemy.lastAttackTime =
            Number.isFinite(
                configuration
                    .lastAttackTime
            )
                ? configuration
                    .lastAttackTime
                : -Infinity;

        this.enemy.scoreWasAwarded =
            false;

        this.attackBounds.setTo(
            0,
            0,
            0,
            0
        );

        return true;
    }

    setOnDeathFinished(callback) {
        if (this.isDestroyed) {
            return false;
        }

        this.onDeathFinished =
            typeof callback ===
                "function"
                ? callback
                : null;

        return true;
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

        this.clearAttackTimers();
        this.clearDeathSequence();

        this.onDeathFinished =
            null;

        this.attackBounds =
            null;

        this.enemy =
            null;
    }
}