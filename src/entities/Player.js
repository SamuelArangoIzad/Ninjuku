import Phaser from "phaser";

import AnimationController
    from "./AnimationController.js";

import HealthComponent
    from "../components/HealthComponent.js";


export default class Player {
    constructor(scene, x, y) {
        this.scene = scene;

        // =====================================================
        // Movimiento
        // =====================================================

        this.walkSpeed = 250;
        this.runSpeed = 400;
        this.jumpForce = -600;
        this.maximumFallSpeed = 1000;

        // =====================================================
        // Vida
        // =====================================================

        this.health =
            new HealthComponent(
                5,
                {
                    onDeath: () => {
                        this.die();
                    }
                }
            );

        this.invulnerabilityDuration = 700;
        this.isInvulnerable = false;
        this.invulnerabilityTimer = null;

        // =====================================================
        // Estado
        // =====================================================

        this.state = "IDLE";
        this.facingDirection = 1;

        this.isRunning = false;
        this.isAttacking = false;
        this.isHurt = false;
        this.isDead = false;

        // =====================================================
        // Ataque
        // =====================================================

        this.attackId = 0;
        this.attackActive = false;

        this.attackRange = 105;
        this.attackHeight = 72;

        this.attackEnableTimer = null;
        this.attackDisableTimer = null;

        // =====================================================
        // Escala
        // =====================================================

        this.normalScale =
            this.calculateResponsiveScale();

        this.attackScale =
            this.normalScale * 0.8;

        // =====================================================
        // Sprite
        // =====================================================

        this.body =
            scene.physics.add.sprite(
                x,
                y,
                "ninja-idle",
                0
            );

        this.body
            .setOrigin(0.5, 1)
            .setScale(this.normalScale)
            .setDepth(10)
            .setCollideWorldBounds(true);

        this.configureNormalPhysicsBody();

        this.body.body.setMaxVelocity(
            this.runSpeed,
            this.maximumFallSpeed
        );

        this.animations =
            new AnimationController(
                this.body
            );

        this.registerAnimationEvents();
        this.animations.playIdle();
    }

    // =========================================================
    // Escala
    // =========================================================

    calculateResponsiveScale() {
        const shortestSide =
            Math.min(
                this.scene.scale.width,
                this.scene.scale.height
            );

        if (shortestSide <= 430) {
            return 0.65;
        }

        if (shortestSide <= 600) {
            return 0.75;
        }

        if (shortestSide <= 800) {
            return 0.85;
        }

        return 0.95;
    }

    updateResponsiveScale() {
        this.normalScale =
            this.calculateResponsiveScale();

        this.attackScale =
            this.normalScale * 0.8;

        this.body?.setScale(
            this.isAttacking
                ? this.attackScale
                : this.normalScale
        );
    }

    // =========================================================
    // Física
    // =========================================================

    configureNormalPhysicsBody() {
        if (!this.body?.body) {
            return;
        }

        this.body.body.setSize(
            42,
            70,
            false
        );

        this.body.body.setOffset(
            43,
            52
        );
    }

    configureAttackPhysicsBody() {
        if (!this.body?.body) {
            return;
        }

        this.body.body.setSize(
            42,
            70,
            false
        );

        this.body.body.setOffset(
            139,
            84
        );
    }

    // =========================================================
    // Eventos
    // =========================================================

    registerAnimationEvents() {
        this.body.on(
            "animationcomplete-ninja-attack-animation",
            this.finishAttack,
            this
        );

        this.body.on(
            "animationcomplete-ninja-hurt-animation",
            this.finishHurt,
            this
        );

        this.body.on(
            "animationcomplete-ninja-death-animation",
            () => {
                this.body?.anims.pause();
            }
        );
    }

    // =========================================================
    // Update
    // =========================================================

    update(controls) {
        if (
            !this.body?.active ||
            this.isDead
        ) {
            return;
        }

        this.handleAttack(controls);

        if (
            !this.isHurt &&
            !this.isAttacking
        ) {
            this.handleHorizontalMovement(
                controls
            );

            this.handleJump(
                controls
            );
        } else {
            this.body.body.setVelocityX(0);
        }

        this.updateState();
        this.updateAnimation();
    }

    handleHorizontalMovement(controls) {
        const left = controls.left();
        const right = controls.right();

        const moving =
            left || right;

        this.isRunning =
            controls.run() &&
            moving;

        const speed =
            this.isRunning
                ? this.runSpeed
                : this.walkSpeed;

        if (
            left &&
            !right
        ) {
            this.body.body.setVelocityX(
                -speed
            );

            this.setFacingDirection(-1);
            return;
        }

        if (
            right &&
            !left
        ) {
            this.body.body.setVelocityX(
                speed
            );

            this.setFacingDirection(1);
            return;
        }

        this.body.body.setVelocityX(0);
        this.isRunning = false;
    }

    handleJump(controls) {
        if (
            controls.jump() &&
            this.isOnGround()
        ) {
            this.body.body.setVelocityY(
                this.jumpForce
            );
        }
    }

    // =========================================================
    // Ataque
    // =========================================================

    handleAttack(controls) {
        if (
            !controls.attack() ||
            this.isAttacking ||
            this.isHurt ||
            this.isDead
        ) {
            return;
        }

        this.startAttack();
    }

    startAttack() {
        this.clearAttackTimers();

        this.isAttacking = true;
        this.attackActive = false;

        this.attackId += 1;
        this.state = "ATTACK";

        this.body.body.setVelocityX(0);

        this.body
            .setScale(this.attackScale)
            .setOrigin(0.5, 1);

        this.configureAttackPhysicsBody();

        this.animations.playAttack();

        this.attackEnableTimer =
            this.scene.time.delayedCall(
                130,
                () => {
                    if (
                        this.isAttacking &&
                        !this.isDead
                    ) {
                        this.attackActive = true;
                    }
                }
            );

        this.attackDisableTimer =
            this.scene.time.delayedCall(
                340,
                () => {
                    this.attackActive = false;
                }
            );
    }

    finishAttack() {
        if (
            !this.body ||
            this.isDead
        ) {
            return;
        }

        this.clearAttackTimers();

        this.isAttacking = false;
        this.attackActive = false;

        this.restoreNormalAppearance();

        this.animations.reset();
        this.animations.playIdle();
    }

    restoreNormalAppearance() {
        this.body
            .setScale(this.normalScale)
            .setOrigin(0.5, 1);

        this.configureNormalPhysicsBody();
    }

    clearAttackTimers() {
        this.attackEnableTimer
            ?.remove(false);

        this.attackDisableTimer
            ?.remove(false);

        this.attackEnableTimer = null;
        this.attackDisableTimer = null;
    }

    isAttackActive() {
        return (
            this.isAttacking &&
            this.attackActive &&
            !this.isDead
        );
    }

    getAttackId() {
        return this.attackId;
    }

    getAttackBounds() {
        if (
            !this.isAttackActive() ||
            !this.body?.active
        ) {
            return null;
        }

        const x =
            this.facingDirection > 0
                ? this.body.x + 20
                : this.body.x -
                    this.attackRange -
                    20;

        const y =
            this.body.y -
            this.attackHeight -
            5;

        return new Phaser.Geom.Rectangle(
            x,
            y,
            this.attackRange,
            this.attackHeight
        );
    }

    // =========================================================
    // Daño
    // =========================================================

    takeDamage(
        amount = 1,
        attackerX = null
    ) {
        if (
            this.isDead ||
            this.isHurt ||
            this.isInvulnerable
        ) {
            return false;
        }

        const applied =
            this.health.takeDamage(
                amount
            );

        if (!applied) {
            return false;
        }

        if (!this.health.hasDied()) {
            this.startHurt(
                attackerX
            );
        }

        return true;
    }

    startHurt(attackerX) {
        this.clearAttackTimers();
        this.clearInvulnerabilityTimer();

        this.isHurt = true;
        this.isAttacking = false;
        this.attackActive = false;
        this.isInvulnerable = true;
        this.state = "HURT";

        this.body.body.setVelocityX(0);

        this.restoreNormalAppearance();

        if (
            typeof attackerX ===
            "number"
        ) {
            const direction =
                this.body.x <
                attackerX
                    ? -1
                    : 1;

            this.body.body.setVelocityX(
                direction * 180
            );
        }

        this.animations.playHurt();

        this.body.setAlpha(1);

        this.invulnerabilityTimer =
            this.scene.time.delayedCall(
                this.invulnerabilityDuration,
                () => {
                    this.invulnerabilityTimer =
                        null;

                    if (
                        !this.body?.active ||
                        this.isDead
                    ) {
                        return;
                    }

                    this.isInvulnerable = false;
                    this.body.setAlpha(1);
                }
            );
    }

    finishHurt() {
        if (
            this.isDead ||
            !this.body
        ) {
            return;
        }

        this.isHurt = false;
        this.state = "IDLE";

        this.body.body.setVelocityX(0);

        this.animations.reset();
        this.animations.playIdle();
    }

    clearInvulnerabilityTimer() {
        this.invulnerabilityTimer
            ?.remove(false);

        this.invulnerabilityTimer = null;
    }

    // =========================================================
    // Muerte
    // =========================================================

    die() {
        if (
            this.isDead ||
            !this.body
        ) {
            return;
        }

        this.clearAttackTimers();
        this.clearInvulnerabilityTimer();

        this.isDead = true;
        this.isHurt = false;
        this.isAttacking = false;
        this.attackActive = false;
        this.isInvulnerable = false;
        this.state = "DEAD";

        this.body.body.setVelocity(0, 0);
        this.body.body.enable = false;
        this.body.body.allowGravity = false;

        this.body.setAlpha(1);

        this.restoreNormalAppearance();

        this.animations.playDeath();
    }

    hasDied() {
        return (
            this.isDead ||
            this.health?.hasDied()
        );
    }

    // =========================================================
    // Estado y animación
    // =========================================================

    updateState() {
        if (this.isDead) {
            this.state = "DEAD";
            return;
        }

        if (this.isHurt) {
            this.state = "HURT";
            return;
        }

        if (this.isAttacking) {
            this.state = "ATTACK";
            return;
        }

        const velocityX =
            this.body.body.velocity.x;

        const velocityY =
            this.body.body.velocity.y;

        if (!this.isOnGround()) {
            this.state =
                velocityY < 0
                    ? "JUMP"
                    : "FALL";

            return;
        }

        if (Math.abs(velocityX) > 1) {
            this.state =
                this.isRunning
                    ? "RUN"
                    : "WALK";

            return;
        }

        this.state = "IDLE";
    }

    updateAnimation() {
        switch (this.state) {
            case "IDLE":
                this.animations.playIdle();
                break;

            case "WALK":
                this.animations.playWalk();
                break;

            case "RUN":
                this.animations.playRun();
                break;

            case "JUMP":
                this.animations.playJump();
                break;

            case "FALL":
                this.animations.playFall();
                break;

            default:
                break;
        }
    }

    setFacingDirection(direction) {
        if (
            direction !== -1 &&
            direction !== 1
        ) {
            return;
        }

        this.facingDirection = direction;

        this.body.setFlipX(
            direction < 0
        );
    }

    // =========================================================
    // Consultas
    // =========================================================

    isOnGround() {
        return (
            this.body.body.blocked.down ||
            this.body.body.touching.down
        );
    }

    getHealthComponent() {
        return this.health;
    }

    getHealth() {
        return this.health
            ?.getCurrentHealth() ?? 0;
    }

    getMaximumHealth() {
        return this.health
            ?.getMaximumHealth() ?? 1;
    }

    getHealthPercentage() {
        return this.health
            ?.getPercentage() ?? 0;
    }

    getSprite() {
        return this.body;
    }

    // =========================================================
    // Destrucción
    // =========================================================

    destroy() {
        this.clearAttackTimers();
        this.clearInvulnerabilityTimer();

        this.health?.destroy();
        this.health = null;

        this.animations?.destroy();
        this.animations = null;

        if (this.body) {
            this.body.removeAllListeners();
            this.body.destroy();
            this.body = null;
        }

        this.scene = null;
    }
}