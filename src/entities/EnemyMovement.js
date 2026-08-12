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
    // Idle
    // =========================================================

    setIdle() {
        const sprite =
            this.enemy
                ?.getSprite?.();

        if (
            this.isDestroyed ||
            !this.enemy ||
            !sprite?.body
        ) {
            return false;
        }

        sprite.body.setVelocityX(
            0
        );

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

    // =========================================================
    // Caminar
    // =========================================================

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
                ?.getSprite?.();

        if (
            !sprite?.body
        ) {
            return false;
        }

        /*
         * IMPORTANTE:
         *
         * La dirección lógica, visual y física
         * deben actualizarse juntas.
         */
        this.setFacingDirection(
            direction
        );

        const speed =
            this.enemy
                ?.getMoveSpeed?.() ??
            0;

        const velocityX =
            direction *
            speed;

        /*
         * direction = -1
         * velocidad hacia la izquierda
         *
         * direction = 1
         * velocidad hacia la derecha
         */
        sprite.body.setVelocityX(
            velocityX
        );

        this.changeState(
            "WALK"
        );

        return true;
    }

    // =========================================================
    // Detener movimiento
    // =========================================================

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

        const sprite =
            this.enemy
                ?.getSprite?.();

        if (!sprite) {
            return false;
        }

        /*
         * Siempre sincronizamos la dirección lógica
         * con la orientación visual.
         *
         * No dependemos de si facingDirection
         * ya tenía el mismo valor.
         */
        this.enemy.facingDirection =
            direction;

        /*
         * Según la configuración actual del proyecto:
         *
         * -1 = mirar izquierda = flipX true
         *  1 = mirar derecha   = flipX false
         */
        sprite.setFlipX(
            direction === -1
        );

        return true;
    }

    getFacingDirection() {
        return (
            this.enemy
                ?.facingDirection ??
            -1
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
                ?.getSprite?.();

        const facingDirection =
            configuration
                .facingDirection === 1
                ? 1
                : -1;

        this.enemy.facingDirection =
            facingDirection;

        if (sprite) {
            /*
             * Sincronizamos inmediatamente
             * la orientación visual.
             */
            sprite.setFlipX(
                facingDirection === -1
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
        if (
            this.isDestroyed
        ) {
            return;
        }

        this.stopAllMovement();

        this.isDestroyed =
            true;

        this.enemy =
            null;
    }
}