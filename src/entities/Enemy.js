import EnemyAnimationController
    from "./EnemyAnimationController.js";

import EnemyMovement
    from "./EnemyMovement.js";

import EnemyCombat
    from "./EnemyCombat.js";

import HealthComponent
    from "../components/HealthComponent.js";

import SoldierAI
    from "../ai/SoldierAI.js";


export default class Enemy {
    constructor(
        scene,
        x,
        y,
        target,
        configuration = {}
    ) {
        this.scene =
            scene ?? null;

        this.target =
            target ?? null;

        // =====================================================
        // Ciclo de vida
        // =====================================================

        /*
         * isActive:
         * el enemigo está actualmente participando en el juego.
         *
         * isDestroyed:
         * la instancia fue eliminada definitivamente y ya no
         * puede regresar desde el pool.
         */
        this.isActive =
            true;

        this.isDestroyed =
            false;

        // =====================================================
        // Configuración
        // =====================================================

        this.moveSpeed = 70;
        this.attackDamage = 1;
        this.maximumHealth = 3;
        this.scoreValue = 100;

        this.detectionRange = 700;
        this.attackRange = 115;
        this.attackCooldown = 1300;

        this.attackHitboxWidth = 125;
        this.attackHitboxHeight = 58;
        this.attackHitboxOffset = 15;

        this.deathScaleMultiplier =
            0.82;

        this.decisionInterval = 120;
        this.activeAreaMargin = 350;
        this.entryPadding = 50;

        this.resetConfiguration(
            configuration
        );

        // =====================================================
        // Estado
        // =====================================================

        this.state =
            "IDLE";

        this.facingDirection =
            -1;

        this.isAttacking =
            false;

        this.isAttackActive =
            false;

        this.isHurt =
            false;

        this.isDead =
            false;

        this.attackId =
            0;

        this.lastAttackTime =
            -Infinity;

        this.scoreWasAwarded =
            false;

        // =====================================================
        // Vida
        // =====================================================

        this.health =
            new HealthComponent(
                this.maximumHealth,
                {
                    onDeath: () => {
                        this.die();
                    }
                }
            );

        // =====================================================
        // Escala
        // =====================================================

        this.spriteScale =
            this.calculateResponsiveScale();

        this.deathScale =
            this.spriteScale *
            this.deathScaleMultiplier;

        // =====================================================
        // Sprite
        // =====================================================

        this.sprite =
            scene.physics.add.sprite(
                x,
                y,
                "soldier-idle-00"
            );

        this.sprite
            .setOrigin(
                0.5,
                1
            )
            .setScale(
                this.spriteScale
            )
            .setDepth(
                9
            )
            .setAlpha(
                1
            )
            .setActive(
                true
            )
            .setVisible(
                true
            )
            .setCollideWorldBounds(
                false
            );

        this.configurePhysicsBody();

        this.configureActivePhysics();

        // =====================================================
        // Controladores
        // =====================================================

        this.animations =
            new EnemyAnimationController(
                this.sprite
            );

        this.movement =
            new EnemyMovement(
                this
            );

        this.combat =
            new EnemyCombat(
                this
            );

        this.ai =
            new SoldierAI(
                this,
                {
                    decisionInterval:
                        this.decisionInterval,

                    activeAreaMargin:
                        this.activeAreaMargin,

                    entryPadding:
                        this.entryPadding
                }
            );

        this.registerAnimationEvents();

        this.movement.reset({
            facingDirection:
                -1,

            state:
                "IDLE"
        });
    }

    // =========================================================
    // Normalización
    // =========================================================

    normalizeNumber(
        value,
        fallback,
        minimum = -Infinity
    ) {
        const parsedValue =
            Number(value);

        if (
            !Number.isFinite(
                parsedValue
            )
        ) {
            return fallback;
        }

        return Math.max(
            minimum,
            parsedValue
        );
    }

    normalizeInteger(
        value,
        fallback,
        minimum = 0
    ) {
        return Math.floor(
            this.normalizeNumber(
                value,
                fallback,
                minimum
            )
        );
    }

    // =========================================================
    // Configuración reutilizable
    // =========================================================

    resetConfiguration(
        configuration = {}
    ) {
        if (this.isDestroyed) {
            return false;
        }

        this.moveSpeed =
            this.normalizeNumber(
                configuration.moveSpeed,
                this.moveSpeed ?? 70,
                0
            );

        this.attackDamage =
            this.normalizeNumber(
                configuration.attackDamage,
                this.attackDamage ?? 1,
                0
            );

        this.maximumHealth =
            this.normalizeInteger(
                configuration.maximumHealth,
                this.maximumHealth ?? 3,
                1
            );

        this.scoreValue =
            this.normalizeInteger(
                configuration.scoreValue,
                this.scoreValue ?? 100,
                0
            );

        this.detectionRange =
            this.normalizeNumber(
                configuration.detectionRange,
                this.detectionRange ?? 700,
                0
            );

        this.attackRange =
            this.normalizeNumber(
                configuration.attackRange,
                this.attackRange ?? 115,
                0
            );

        this.attackCooldown =
            this.normalizeNumber(
                configuration.attackCooldown,
                this.attackCooldown ?? 1300,
                0
            );

        this.attackHitboxWidth =
            this.normalizeNumber(
                configuration.attackHitboxWidth,
                this.attackHitboxWidth ?? 125,
                1
            );

        this.attackHitboxHeight =
            this.normalizeNumber(
                configuration.attackHitboxHeight,
                this.attackHitboxHeight ?? 58,
                1
            );

        this.attackHitboxOffset =
            this.normalizeNumber(
                configuration.attackHitboxOffset,
                this.attackHitboxOffset ?? 15,
                0
            );

        this.deathScaleMultiplier =
            this.normalizeNumber(
                configuration.deathScaleMultiplier,
                this.deathScaleMultiplier ?? 0.82,
                0.01
            );

        this.decisionInterval =
            this.normalizeNumber(
                configuration.decisionInterval,
                this.decisionInterval ?? 120,
                50
            );

        this.activeAreaMargin =
            this.normalizeNumber(
                configuration.activeAreaMargin,
                this.activeAreaMargin ?? 350,
                0
            );

        this.entryPadding =
            this.normalizeNumber(
                configuration.entryPadding,
                this.entryPadding ?? 50,
                10
            );

        return true;
    }

    // =========================================================
    // Activación para pooling
    // =========================================================

    activate(
        x,
        y,
        target,
        configuration = {}
    ) {
        if (
            this.isDestroyed ||
            !this.scene ||
            !this.sprite
        ) {
            return false;
        }

        this.resetConfiguration(
            configuration
        );

        this.target =
            target ?? this.target;

        // =====================================================
        // Estado
        // =====================================================

        this.isActive =
            true;

        this.state =
            "IDLE";

        this.facingDirection =
            -1;

        this.isAttacking =
            false;

        this.isAttackActive =
            false;

        this.isHurt =
            false;

        this.isDead =
            false;

        this.attackId =
            0;

        this.lastAttackTime =
            -Infinity;

        this.scoreWasAwarded =
            false;

        // =====================================================
        // Escala
        // =====================================================

        this.spriteScale =
            this.calculateResponsiveScale();

        this.deathScale =
            this.spriteScale *
            this.deathScaleMultiplier;

        // =====================================================
        // Salud
        // =====================================================

        /*
         * HealthComponent conserva sus suscriptores y callbacks.
         * Solo se restauran sus valores.
         */
        this.health?.reset(
            this.maximumHealth,
            true
        );

        // =====================================================
        // Sprite y física
        // =====================================================

        const validX =
            Number.isFinite(x)
                ? x
                : 0;

        const validY =
            Number.isFinite(y)
                ? y
                : 0;

        /*
         * enableBody reactiva:
         *
         * - body.enable
         * - sprite.active
         * - sprite.visible
         * - posición del cuerpo y del sprite
         */
        this.sprite.enableBody(
            true,
            validX,
            validY,
            true,
            true
        );

        this.sprite
            .setPosition(
                validX,
                validY
            )
            .setOrigin(
                0.5,
                1
            )
            .setScale(
                this.spriteScale
            )
            .setDepth(
                9
            )
            .setAlpha(
                1
            )
            .setFlipX(
                true
            )
            .setActive(
                true
            )
            .setVisible(
                true
            )
            .setCollideWorldBounds(
                false
            );

        /*
         * Se devuelve a la textura inicial antes de reproducir
         * idle. Evita conservar el último frame de muerte.
         */
        this.sprite.setTexture(
            "soldier-idle-00"
        );

        this.configurePhysicsBody();
        this.configureActivePhysics();

        // =====================================================
        // Controladores
        // =====================================================

        this.combat?.reset({
            lastAttackTime:
                -Infinity
        });

        this.movement?.reset({
            facingDirection:
                -1,

            state:
                "IDLE"
        });

        this.ai?.reset({
            decisionInterval:
                this.decisionInterval,

            activeAreaMargin:
                this.activeAreaMargin,

            entryPadding:
                this.entryPadding,

            mode:
                "ENTERING"
        });

        this.animations?.reset();
        this.animations?.playIdle();

        return true;
    }

    // =========================================================
    // Desactivación para pooling
    // =========================================================

    deactivate() {
        if (
            this.isDestroyed ||
            !this.isActive
        ) {
            return false;
        }

        this.isActive =
            false;

        this.state =
            "INACTIVE";

        // =====================================================
        // Cancelación de estados
        // =====================================================

        /*
         * reset() cancela timers de ataque, secuencia de muerte
         * y tween de desaparición.
         */
        this.combat?.reset();

        this.ai?.setEnabled(
            false
        );

        this.movement
            ?.stopAllMovement?.();

        this.animations
            ?.stop?.();

        // =====================================================
        // Estado lógico
        // =====================================================

        this.isAttacking =
            false;

        this.isAttackActive =
            false;

        this.isHurt =
            false;

        this.isDead =
            false;

        this.attackId =
            0;

        this.lastAttackTime =
            -Infinity;

        this.scoreWasAwarded =
            false;

        // =====================================================
        // Física y visual
        // =====================================================

        if (this.sprite?.body) {
            this.sprite.body.setVelocity(
                0,
                0
            );

            this.sprite.body.setAcceleration(
                0,
                0
            );

            this.sprite.body.allowGravity =
                false;

            this.sprite.body.enable =
                false;
        }

        this.sprite
            ?.setAlpha(
                1
            )
            .setVisible(
                false
            )
            .setActive(
                false
            );

        this.target =
            null;

        return true;
    }

    // =========================================================
    // Configuración física
    // =========================================================

    configureActivePhysics() {
        const body =
            this.sprite?.body;

        if (!body) {
            return false;
        }

        body.enable =
            true;

        body.moves =
            true;

        body.allowGravity =
            true;

        body.setVelocity(
            0,
            0
        );

        body.setAcceleration(
            0,
            0
        );

        body.setMaxVelocity(
            this.moveSpeed,
            1000
        );

        return true;
    }

    configurePhysicsBody() {
        const body =
            this.sprite?.body;

        if (!body) {
            return false;
        }

        /*
         * Los frames enemigos utilizan un lienzo 320 × 160.
         * La caja representa únicamente el cuerpo del soldado.
         */
        body.setSize(
            48,
            82,
            false
        );

        body.setOffset(
            136,
            74
        );

        return true;
    }

    // =========================================================
    // Update
    // =========================================================

    update(time) {
        if (
            this.isDestroyed ||
            !this.isActive ||
            !this.sprite?.active ||
            this.isDead
        ) {
            return;
        }

        if (
            this.isHurt ||
            this.isAttacking
        ) {
            this.movement
                ?.stop();

            return;
        }

        this.ai
            ?.update(
                time
            );
    }

    // =========================================================
    // Escala
    // =========================================================

    calculateResponsiveScale() {
        if (
            !this.scene?.scale
        ) {
            return 0.85;
        }

        const shortestSide =
            Math.min(
                this.scene.scale.width,
                this.scene.scale.height
            );

        if (shortestSide <= 430) {
            return 0.55;
        }

        if (shortestSide <= 600) {
            return 0.65;
        }

        if (shortestSide <= 800) {
            return 0.75;
        }

        return 0.85;
    }

    updateResponsiveScale() {
        if (
            this.isDestroyed ||
            !this.isActive ||
            !this.sprite?.active
        ) {
            return false;
        }

        const nextScale =
            this.calculateResponsiveScale();

        if (
            nextScale ===
                this.spriteScale &&
            !this.isDead
        ) {
            return false;
        }

        this.spriteScale =
            nextScale;

        this.deathScale =
            this.spriteScale *
            this.deathScaleMultiplier;

        this.sprite.setScale(
            this.isDead
                ? this.deathScale
                : this.spriteScale
        );

        this.configurePhysicsBody();

        return true;
    }

    getDeathScale() {
        return this.deathScale;
    }

    // =========================================================
    // Eventos de animación
    // =========================================================

    registerAnimationEvents() {
        if (!this.sprite) {
            return;
        }

        this.sprite.on(
            "animationcomplete-soldier-attack-animation",
            this.finishAttack,
            this
        );

        this.sprite.on(
            "animationcomplete-soldier-hurt-animation",
            this.finishHurt,
            this
        );

        this.sprite.on(
            "animationcomplete-soldier-death-animation",
            this.finishDeath,
            this
        );
    }

    // =========================================================
    // Callback de devolución al pool
    // =========================================================

    setOnDeathFinished(callback) {
        if (
            this.isDestroyed ||
            !this.combat
        ) {
            return false;
        }

        return this.combat
            .setOnDeathFinished(
                callback
            );
    }

    // =========================================================
    // Delegación de movimiento
    // =========================================================

    changeState(
        nextState,
        force = false
    ) {
        if (
            this.isDestroyed ||
            !this.isActive
        ) {
            return false;
        }

        return (
            this.movement
                ?.changeState(
                    nextState,
                    force
                ) ??
            false
        );
    }

    setIdle() {
        if (
            this.isDestroyed ||
            !this.isActive
        ) {
            return false;
        }

        return (
            this.movement
                ?.setIdle() ??
            false
        );
    }

    setWalking(direction) {
        if (
            this.isDestroyed ||
            !this.isActive
        ) {
            return false;
        }

        return (
            this.movement
                ?.setWalking(
                    direction
                ) ??
            false
        );
    }

    setFacingDirection(direction) {
        if (
            this.isDestroyed ||
            !this.isActive
        ) {
            return false;
        }

        return (
            this.movement
                ?.setFacingDirection(
                    direction
                ) ??
            false
        );
    }

    // =========================================================
    // Delegación de combate
    // =========================================================

    tryAttack(time) {
        if (
            this.isDestroyed ||
            !this.isActive
        ) {
            return false;
        }

        return (
            this.combat
                ?.tryAttack(
                    time
                ) ??
            false
        );
    }

    finishAttack() {
        if (
            this.isDestroyed ||
            !this.isActive
        ) {
            return false;
        }

        return (
            this.combat
                ?.finishAttack() ??
            false
        );
    }

    isAttackingPlayer() {
        if (
            this.isDestroyed ||
            !this.isActive
        ) {
            return false;
        }

        return (
            this.combat
                ?.isAttackingPlayer() ??
            false
        );
    }

    getAttackId() {
        return (
            this.combat
                ?.getAttackId() ??
            -1
        );
    }

    getAttackBounds() {
        if (
            this.isDestroyed ||
            !this.isActive
        ) {
            return null;
        }

        return (
            this.combat
                ?.getAttackBounds() ??
            null
        );
    }

    takeDamage(
        amount = 1,
        attackerX = null
    ) {
        if (
            this.isDestroyed ||
            !this.isActive
        ) {
            return false;
        }

        return (
            this.combat
                ?.takeDamage(
                    amount,
                    attackerX
                ) ??
            false
        );
    }

    finishHurt() {
        if (
            this.isDestroyed ||
            !this.isActive
        ) {
            return false;
        }

        return (
            this.combat
                ?.finishHurt() ??
            false
        );
    }

    die() {
        if (
            this.isDestroyed ||
            !this.isActive
        ) {
            return false;
        }

        return (
            this.combat
                ?.die() ??
            false
        );
    }

    finishDeath() {
        if (
            this.isDestroyed ||
            !this.isActive
        ) {
            return false;
        }

        return (
            this.combat
                ?.finishDeath() ??
            false
        );
    }

    // =========================================================
    // Estados consultables
    // =========================================================

    isAlive() {
        return (
            this.isActive &&
            !this.isDead &&
            !this.isDestroyed &&
            Boolean(
                this.sprite?.active
            ) &&
            Boolean(
                this.health?.isAlive?.()
            )
        );
    }

    isAvailableForPool() {
        return (
            !this.isDestroyed &&
            !this.isActive
        );
    }

    isHurtState() {
        return (
            this.isActive &&
            !this.isDestroyed &&
            this.isHurt
        );
    }

    isAttackingState() {
        return (
            this.isActive &&
            !this.isDestroyed &&
            this.isAttacking
        );
    }

    // =========================================================
    // Getters de configuración
    // =========================================================

    getMoveSpeed() {
        return this.moveSpeed;
    }

    getAttackDamage() {
        return this.attackDamage;
    }

    getDetectionRange() {
        return this.detectionRange;
    }

    getAttackRange() {
        return this.attackRange;
    }

    getAttackCooldown() {
        return this.attackCooldown;
    }

    getAttackHitboxWidth() {
        return this.attackHitboxWidth;
    }

    getAttackHitboxHeight() {
        return this.attackHitboxHeight;
    }

    getAttackHitboxOffset() {
        return this.attackHitboxOffset;
    }

    getScoreValue() {
        return this.scoreValue;
    }

    // =========================================================
    // Getters generales
    // =========================================================

    getHealthComponent() {
        return this.health;
    }

    getHealth() {
        return (
            this.health
                ?.getCurrentHealth() ??
            0
        );
    }

    getMaximumHealth() {
        return (
            this.health
                ?.getMaximumHealth() ??
            1
        );
    }

    getHealthPercentage() {
        return (
            this.health
                ?.getPercentage() ??
            0
        );
    }

    getSprite() {
        return this.sprite;
    }

    getState() {
        return this.state;
    }

    getScene() {
        return this.scene;
    }

    getTarget() {
        return this.target;
    }

    getAnimationController() {
        return this.animations;
    }

    // =========================================================
    // Destrucción definitiva
    // =========================================================

    destroy() {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed =
            true;

        this.isActive =
            false;

        /*
         * Primero se destruyen los componentes que todavía
         * conservan referencias a la entidad.
         */
        this.ai
            ?.destroy();

        this.ai =
            null;

        this.combat
            ?.destroy();

        this.combat =
            null;

        this.movement
            ?.destroy();

        this.movement =
            null;

        this.animations
            ?.destroy();

        this.animations =
            null;

        this.health
            ?.destroy();

        this.health =
            null;

        if (this.sprite) {
            this.sprite.removeAllListeners();
            this.sprite.destroy();
            this.sprite = null;
        }

        this.target =
            null;

        this.scene =
            null;
    }
}