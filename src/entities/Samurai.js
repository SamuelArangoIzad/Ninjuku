import Enemy
    from "./Enemy.js";

import EnemyAnimationController
    from "./EnemyAnimationController.js";

import SamuraiAI
    from "../ai/SamuraiAI.js";


export class Samurai extends Enemy {
    constructor(
        scene,
        x,
        y,
        target,
        configuration = {}
    ) {
        super(
            scene,
            x,
            y,
            target,
            {
                ...configuration,

                enemyType:
                    "samurai",

                moveSpeed:
                    configuration.moveSpeed ??
                    105,

                maximumHealth:
                    configuration.maximumHealth ??
                    5,

                attackDamage:
                    configuration.attackDamage ??
                    2,

                scoreValue:
                    configuration.scoreValue ??
                    175,

                detectionRange:
                    configuration.detectionRange ??
                    1200,

                attackRange:
                    configuration.attackRange ??
                    105,

                attackCooldown:
                    configuration.attackCooldown ??
                    1500,

                attackHitboxWidth:
                    configuration.attackHitboxWidth ??
                    145,

                attackHitboxHeight:
                    configuration.attackHitboxHeight ??
                    65,

                attackHitboxOffset:
                    configuration.attackHitboxOffset ??
                    20,

                decisionInterval:
                    configuration.decisionInterval ??
                    100,

                activeAreaMargin:
                    configuration.activeAreaMargin ??
                    350,

                entryPadding:
                    configuration.entryPadding ??
                    55,

                deathScaleMultiplier:
                    configuration.deathScaleMultiplier ??
                    0.82
            }
        );

        // =====================================================
        // Identidad
        // =====================================================

        this.enemyType =
            "samurai";

        this.type =
            "samurai";

        // =====================================================
        // AnimationController
        // =====================================================

        /*
         * Enemy construye por defecto el controlador Soldier.
         * Se sustituye por uno configurado específicamente
         * para Samurai.
         */
        this.animations
            ?.destroy?.();

        this.animations =
            new EnemyAnimationController(
                this.sprite,
                "samurai"
            );

        // =====================================================
        // IA
        // =====================================================

        /*
         * Enemy también crea SoldierAI inicialmente.
         */
        this.ai
            ?.destroy?.();

        this.ai =
            new SamuraiAI(
                this,
                {
                    decisionInterval:
                        this.decisionInterval,

                    activeAreaMargin:
                        this.activeAreaMargin,

                    entryPadding:
                        this.entryPadding,

                    spawnSide:
                        this.spawnSide
                }
            );

        // =====================================================
        // Textura inicial
        // =====================================================

        this.sprite
            ?.setTexture(
                "samurai-idle-01"
            );

        this.configurePhysicsBody();

        this.movement?.reset({
            facingDirection:
                this.facingDirection,

            state:
                "IDLE"
        });

        this.setFacingDirection(
            this.facingDirection
        );

        this.animations
            ?.playIdle?.();
    }

    // =========================================================
    // Pooling
    // =========================================================

    activate(
        x,
        y,
        target,
        configuration = {}
    ) {
        const activated =
            super.activate(
                x,
                y,
                target,
                {
                    ...configuration,

                    enemyType:
                        "samurai",

                    moveSpeed:
                        configuration.moveSpeed ??
                        105,

                    maximumHealth:
                        configuration.maximumHealth ??
                        5,

                    attackDamage:
                        configuration.attackDamage ??
                        2,

                    scoreValue:
                        configuration.scoreValue ??
                        175,

                    detectionRange:
                        configuration.detectionRange ??
                        1200,

                    attackRange:
                        configuration.attackRange ??
                        105,

                    attackCooldown:
                        configuration.attackCooldown ??
                        1500,

                    attackHitboxWidth:
                        configuration.attackHitboxWidth ??
                        145,

                    attackHitboxHeight:
                        configuration.attackHitboxHeight ??
                        65,

                    attackHitboxOffset:
                        configuration.attackHitboxOffset ??
                        20,

                    decisionInterval:
                        configuration.decisionInterval ??
                        100,

                    activeAreaMargin:
                        configuration.activeAreaMargin ??
                        350,

                    entryPadding:
                        configuration.entryPadding ??
                        55,

                    deathScaleMultiplier:
                        configuration.deathScaleMultiplier ??
                        0.82
                }
            );

        if (!activated) {
            return false;
        }

        this.enemyType =
            "samurai";

        this.type =
            "samurai";

        this.animations
            ?.setEnemyType?.(
                "samurai"
            );

        /*
         * Enemy.activate() utiliza soldier-idle-00 como textura
         * provisional. La sustituimos inmediatamente.
         */
        this.sprite
            ?.setTexture(
                "samurai-idle-01"
            );

        this.ai?.reset({
            decisionInterval:
                this.decisionInterval,

            activeAreaMargin:
                this.activeAreaMargin,

            entryPadding:
                this.entryPadding,

            spawnSide:
                this.spawnSide,

            mode:
                "ENTERING"
        });

        this.configurePhysicsBody();

        this.animations
            ?.reset?.();

        this.animations
            ?.playIdle?.();

        return true;
    }

    // =========================================================
    // Física
    // =========================================================

 configurePhysicsBody() {
    const body =
        this.sprite?.body;

    if (!body) {
        return false;
    }

    /*
     * Todos los frames Samurai están normalizados
     * a un lienzo de 219 × 164.
     *
     * El body representa únicamente el torso/piernas,
     * no la espada ni el espacio transparente.
     */
    body.setSize(
        52,
        86,
        false
    );

    /*
     * Centrado horizontal:
     *
     * (219 - 52) / 2 = 83.5
     *
     * Alineado a la parte inferior:
     *
     * 164 - 86 = 78
     */
    body.setOffset(
        83.5,
        78
    );

    return true;
}

    // =========================================================
    // Eventos
    // =========================================================

    registerAnimationEvents() {
        if (!this.sprite) {
            return;
        }

        this.sprite.on(
            "animationcomplete-samurai-attack-animation",
            this.finishAttack,
            this
        );

        this.sprite.on(
            "animationcomplete-samurai-hurt-animation",
            this.finishHurt,
            this
        );

        this.sprite.on(
            "animationcomplete-samurai-death-animation",
            this.finishDeath,
            this
        );
    }

    // =========================================================
    // Identidad
    // =========================================================

    getEnemyType() {
        return "samurai";
    }
}