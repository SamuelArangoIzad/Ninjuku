export default class EnemyMovement {
    constructor(enemy) {
        this.enemy =
            enemy ?? null;

        this.isDestroyed =
            false;
    }

    // =========================================================
    // Estado
    // =========================================================

    changeState(
        nextState,
        force = false
    ) {
        if (
            this.isDestroyed ||
            !this.enemy ||
            typeof nextState !==
                "string"
        ) {
            return false;
        }

        if (
            !force &&
            this.enemy.state ===
                nextState
        ) {
            return false;
        }

        this.enemy.state =
            nextState;

        const animations =
            this.enemy.animations;

        switch (nextState) {
            case "IDLE":
                animations
                    ?.playIdle?.();
                break;

            case "WALK":
                animations
                    ?.playWalk?.();
                break;

            default:
                break;
        }

        return true;
    }

    // =========================================================
    // Movimiento
    // =========================================================

    setIdle() {
        const sprite =
            this.enemy
                ?.getSprite?.();

        if (
            this.isDestroyed ||
            !sprite?.body
        ) {
            return false;
        }

        if (
            sprite.body.velocity.x !==
            0
        ) {
            sprite.body.setVelocityX(
                0
            );
        }

        if (
            this.enemy.isDead ||
            this.enemy.isHurt ||
            this.enemy.isAttacking
        ) {
            return false;
        }

        this.changeState(
            "IDLE"
        );

        return true;
    }

    setWalking(direction) {
        if (
            this.isDestroyed ||
            !this.enemy
        ) {
            return false;
        }

        if (
            direction !== -1 &&
            direction !== 1
        ) {
            this.setIdle();

            return false;
        }

        const sprite =
            this.enemy
                .getSprite?.();

        if (!sprite?.body) {
            return false;
        }

        this.setFacingDirection(
            direction
        );

        const velocityX =
            direction *
            this.enemy
                .getMoveSpeed();

        if (
            sprite.body.velocity.x !==
            velocityX
        ) {
            sprite.body.setVelocityX(
                velocityX
            );
        }

        this.changeState(
            "WALK"
        );

        return true;
    }

    stop() {
        const sprite =
            this.enemy
                ?.getSprite?.();

        if (
            this.isDestroyed ||
            !sprite?.body
        ) {
            return false;
        }

        sprite.body.setVelocityX(
            0
        );

        return true;
    }

    stopAllMovement() {
        const sprite =
            this.enemy
                ?.getSprite?.();

        if (
            this.isDestroyed ||
            !sprite?.body
        ) {
            return false;
        }

        sprite.body.setVelocity(
            0,
            0
        );

        return true;
    }

    // =========================================================
    // Orientación
    // =========================================================

    setFacingDirection(direction) {
        if (
            this.isDestroyed ||
            !this.enemy ||
            (
                direction !== -1 &&
                direction !== 1
            )
        ) {
            return false;
        }

        if (
            this.enemy
                .facingDirection ===
            direction
        ) {
            return false;
        }

        this.enemy.facingDirection =
            direction;

        this.enemy
            .getSprite?.()
            ?.setFlipX(
                direction < 0
            );

        return true;
    }

    getFacingDirection() {
        return (
            this.enemy
                ?.facingDirection ??
            1
        );
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

        const sprite =
            this.enemy
                .getSprite?.();

        const facingDirection =
            configuration
                .facingDirection ===
            1
                ? 1
                : -1;

        this.enemy.facingDirection =
            facingDirection;

        if (sprite) {
            sprite.setFlipX(
                facingDirection <
                    0
            );

            if (sprite.body) {
                sprite.body.setVelocity(
                    0,
                    0
                );

                sprite.body.setAcceleration(
                    0,
                    0
                );
            }
        }

        this.enemy.state =
            configuration.state ??
            "IDLE";

        this.enemy.animations
            ?.reset?.();

        this.enemy.animations
            ?.playIdle?.();

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

        this.enemy =
            null;
    }
}