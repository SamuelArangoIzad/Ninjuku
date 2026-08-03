export default class EnemyAnimationController {
    // =========================================================
    // Constantes
    // =========================================================

    static ANIMATIONS = Object.freeze({
        IDLE:
            "soldier-idle-animation",

        WALK:
            "soldier-walk-animation",

        ATTACK:
            "soldier-attack-animation",

        HURT:
            "soldier-hurt-animation",

        DEATH:
            "soldier-death-animation"
    });

    static CONFIGURATIONS =
        Object.freeze([
            Object.freeze({
                key:
                    EnemyAnimationController
                        .ANIMATIONS
                        .IDLE,

                texturePrefix:
                    "soldier-idle",

                frameOrder:
                    Object.freeze([
                        0,
                        1,
                        2,
                        3,
                        4,
                        5
                    ]),

                frameRate:
                    6,

                repeat:
                    -1
            }),

            Object.freeze({
                key:
                    EnemyAnimationController
                        .ANIMATIONS
                        .WALK,

                texturePrefix:
                    "soldier-walk",

                /*
                 * Secuencia ping-pong sin repetir los extremos.
                 */
                frameOrder:
                    Object.freeze([
                        0,
                        1,
                        2,
                        3,
                        4,
                        5,
                        6,
                        7,
                        6,
                        5,
                        4,
                        3,
                        2,
                        1
                    ]),

                frameRate:
                    12,

                repeat:
                    -1
            }),

            Object.freeze({
                key:
                    EnemyAnimationController
                        .ANIMATIONS
                        .ATTACK,

                texturePrefix:
                    "soldier-attack",

                frameOrder:
                    Object.freeze([
                        0,
                        1,
                        2,
                        3,
                        4,
                        5,
                        6
                    ]),

                frameRate:
                    12,

                repeat:
                    0
            }),

            Object.freeze({
                key:
                    EnemyAnimationController
                        .ANIMATIONS
                        .HURT,

                texturePrefix:
                    "soldier-hurt",

                frameOrder:
                    Object.freeze([
                        0,
                        1,
                        2,
                        3
                    ]),

                frameRate:
                    10,

                repeat:
                    0
            }),

            Object.freeze({
                key:
                    EnemyAnimationController
                        .ANIMATIONS
                        .DEATH,

                texturePrefix:
                    "soldier-death",

                frameOrder:
                    Object.freeze([
                        0,
                        1,
                        2,
                        3,
                        4,
                        5
                    ]),

                frameRate:
                    7,

                repeat:
                    0
            })
        ]);

    // =========================================================
    // Registro global
    // =========================================================

    static createAnimations(scene) {
        if (
            !EnemyAnimationController
                .isValidScene(scene)
        ) {
            console.error(
                "[EnemyAnimationController] " +
                "La escena no posee administradores " +
                "de animaciones o texturas."
            );

            return false;
        }

        let allCreated =
            true;

        for (
            const configuration
            of EnemyAnimationController
                .CONFIGURATIONS
        ) {
            const created =
                EnemyAnimationController
                    .createAnimation(
                        scene,
                        configuration
                    );

            if (!created) {
                allCreated =
                    false;
            }
        }

        return allCreated;
    }

    static isValidScene(scene) {
        return Boolean(
            scene?.anims &&
            scene?.textures
        );
    }

    static createAnimation(
        scene,
        configuration
    ) {
        if (
            !EnemyAnimationController
                .isValidScene(scene)
        ) {
            return false;
        }

        const {
            key,
            texturePrefix,
            frameOrder,
            frameRate,
            repeat
        } = configuration;

        /*
         * No se elimina una animación existente.
         *
         * Las animaciones de Phaser son globales. Eliminarlas
         * mientras hay sprites utilizándolas puede provocar
         * reinicios, referencias inválidas y trabajo adicional.
         */
        if (
            scene.anims.exists(
                key
            )
        ) {
            return true;
        }

        const frames =
            EnemyAnimationController
                .buildFrames(
                    scene,
                    texturePrefix,
                    frameOrder
                );

        if (!frames) {
            return false;
        }

        const animation =
            scene.anims.create({
                key,
                frames,
                frameRate,
                repeat,
                skipMissedFrames:
                    true
            });

        if (!animation) {
            console.error(
                "[EnemyAnimationController] " +
                `No se pudo crear: ${key}`
            );

            return false;
        }

        return true;
    }

    static buildFrames(
        scene,
        texturePrefix,
        frameOrder
    ) {
        if (
            !Array.isArray(frameOrder) ||
            frameOrder.length === 0
        ) {
            console.error(
                "[EnemyAnimationController] " +
                `Secuencia inválida: ${texturePrefix}`
            );

            return null;
        }

        const frames = [];

        for (const index of frameOrder) {
            const frameNumber =
                String(index).padStart(
                    2,
                    "0"
                );

            const textureKey =
                `${texturePrefix}-${frameNumber}`;

            if (
                !scene.textures.exists(
                    textureKey
                )
            ) {
                console.error(
                    "[EnemyAnimationController] " +
                    `No existe la textura: ${textureKey}`
                );

                return null;
            }

            frames.push({
                key:
                    textureKey
            });
        }

        return frames;
    }

    // =========================================================
    // Instancia
    // =========================================================

    constructor(sprite) {
        this.sprite =
            sprite ?? null;

        this.currentAnimation =
            null;

        this.isDestroyed =
            false;
    }

    // =========================================================
    // Reproducción
    // =========================================================

    play(
        animationKey,
        forceRestart = false
    ) {
        if (
            this.isDestroyed ||
            !this.sprite?.active ||
            !this.sprite.anims
        ) {
            return false;
        }

        if (
            !this.animationExists(
                animationKey
            )
        ) {
            console.error(
                "[EnemyAnimationController] " +
                `La animación no existe: ${animationKey}`
            );

            return false;
        }

        const activeAnimationKey =
            this.getCurrentAnimation();

        /*
         * Idle y walk no se reinician si ya están seleccionadas.
         */
        if (
            !forceRestart &&
            activeAnimationKey ===
                animationKey
        ) {
            this.currentAnimation =
                animationKey;

            if (
                !this.sprite.anims
                    .isPlaying
            ) {
                this.sprite.anims.play(
                    animationKey,
                    true
                );
            }

            return true;
        }

        this.currentAnimation =
            animationKey;

        /*
         * ignoreIfPlaying es false cuando se necesita reiniciar
         * ataque, daño o muerte desde el primer frame.
         */
        this.sprite.anims.play(
            animationKey,
            !forceRestart
        );

        return true;
    }

    animationExists(animationKey) {
        const animationManager =
            this.sprite
                ?.anims
                ?.animationManager;

        return Boolean(
            animationManager
                ?.exists?.(
                    animationKey
                )
        );
    }

    // =========================================================
    // Métodos semánticos
    // =========================================================

    playIdle() {
        return this.play(
            EnemyAnimationController
                .ANIMATIONS
                .IDLE
        );
    }

    playWalk() {
        return this.play(
            EnemyAnimationController
                .ANIMATIONS
                .WALK
        );
    }

    playAttack() {
        return this.play(
            EnemyAnimationController
                .ANIMATIONS
                .ATTACK,

            true
        );
    }

    playHurt() {
        return this.play(
            EnemyAnimationController
                .ANIMATIONS
                .HURT,

            true
        );
    }

    playDeath() {
        return this.play(
            EnemyAnimationController
                .ANIMATIONS
                .DEATH,

            true
        );
    }

    // =========================================================
    // Consultas y control
    // =========================================================

    getCurrentAnimation() {
        return (
            this.sprite
                ?.anims
                ?.currentAnim
                ?.key ??
            this.currentAnimation
        );
    }

    isPlaying(animationKey = null) {
        if (
            this.isDestroyed ||
            !this.sprite?.anims
                ?.isPlaying
        ) {
            return false;
        }

        if (!animationKey) {
            return true;
        }

        return (
            this.getCurrentAnimation() ===
            animationKey
        );
    }

    stop() {
        if (
            this.isDestroyed ||
            !this.sprite?.anims
        ) {
            return;
        }

        this.sprite.anims.stop();

        this.currentAnimation =
            null;
    }

    reset() {
        this.currentAnimation =
            null;
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

        /*
         * No se llama stop() aquí.
         *
         * Enemy.destroy() destruye inmediatamente el sprite, por
         * lo que detener manualmente su AnimationState produce
         * trabajo innecesario.
         */
        this.sprite =
            null;

        this.currentAnimation =
            null;
    }
}