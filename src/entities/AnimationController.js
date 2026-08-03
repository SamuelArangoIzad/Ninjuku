export default class AnimationController {
    // =========================================================
    // Constantes
    // =========================================================

    static ANIMATIONS = Object.freeze({
        IDLE: "ninja-idle-animation",
        WALK: "ninja-walk-animation",
        RUN: "ninja-run-animation",
        JUMP: "ninja-jump-animation",
        FALL: "ninja-fall-animation",
        ATTACK: "ninja-attack-animation",
        HURT: "ninja-hurt-animation",
        DEATH: "ninja-death-animation"
    });

    static SPRITESHEET_CONFIGURATIONS =
        Object.freeze([
            Object.freeze({
                key:
                    AnimationController
                        .ANIMATIONS
                        .IDLE,

                texture:
                    "ninja-idle",

                start:
                    0,

                end:
                    3,

                frameRate:
                    5,

                repeat:
                    -1
            }),

            Object.freeze({
                key:
                    AnimationController
                        .ANIMATIONS
                        .WALK,

                texture:
                    "ninja-walk",

                start:
                    0,

                end:
                    5,

                frameRate:
                    10,

                repeat:
                    -1
            }),

            Object.freeze({
                key:
                    AnimationController
                        .ANIMATIONS
                        .RUN,

                texture:
                    "ninja-run",

                start:
                    1,

                end:
                    5,

                frameRate:
                    12,

                repeat:
                    -1
            }),

            Object.freeze({
                key:
                    AnimationController
                        .ANIMATIONS
                        .JUMP,

                texture:
                    "ninja-jump",

                start:
                    0,

                end:
                    3,

                frameRate:
                    8,

                repeat:
                    0
            }),

            Object.freeze({
                key:
                    AnimationController
                        .ANIMATIONS
                        .FALL,

                texture:
                    "ninja-fall",

                start:
                    0,

                end:
                    1,

                frameRate:
                    5,

                repeat:
                    -1
            }),

            Object.freeze({
                key:
                    AnimationController
                        .ANIMATIONS
                        .HURT,

                texture:
                    "ninja-hurt",

                start:
                    0,

                end:
                    2,

                frameRate:
                    8,

                repeat:
                    0
            }),

            Object.freeze({
                key:
                    AnimationController
                        .ANIMATIONS
                        .DEATH,

                texture:
                    "ninja-death",

                start:
                    0,

                end:
                    5,

                frameRate:
                    7,

                repeat:
                    0
            })
        ]);

    // =========================================================
    // Registro global de animaciones
    // =========================================================

    static createAnimations(scene) {
        if (
            !AnimationController
                .isValidScene(scene)
        ) {
            console.error(
                "[AnimationController] " +
                "La escena no posee administradores " +
                "de animaciones o texturas."
            );

            return false;
        }

        const spritesheetsCreated =
            AnimationController
                .createSpritesheetAnimations(
                    scene
                );

        const attackCreated =
            AnimationController
                .createAttackAnimation(
                    scene
                );

        return (
            spritesheetsCreated &&
            attackCreated
        );
    }

    static isValidScene(scene) {
        return Boolean(
            scene?.anims &&
            scene?.textures
        );
    }

    static createSpritesheetAnimations(
        scene
    ) {
        if (
            !AnimationController
                .isValidScene(scene)
        ) {
            return false;
        }

        let allCreated =
            true;

        for (
            const configuration
            of AnimationController
                .SPRITESHEET_CONFIGURATIONS
        ) {
            const created =
                AnimationController
                    .createSpritesheetAnimation(
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

    static createSpritesheetAnimation(
        scene,
        configuration
    ) {
        const {
            key,
            texture,
            start,
            end,
            frameRate,
            repeat
        } = configuration;

        /*
         * Las animaciones pertenecen al AnimationManager global.
         * No deben volver a registrarse al reiniciar una escena.
         */
        if (scene.anims.exists(key)) {
            return true;
        }

        if (
            !scene.textures.exists(
                texture
            )
        ) {
            console.error(
                "[AnimationController] " +
                `No existe la textura: ${texture}`
            );

            return false;
        }

        const frames =
            scene.anims
                .generateFrameNumbers(
                    texture,
                    {
                        start,
                        end
                    }
                );

        if (
            !Array.isArray(frames) ||
            frames.length === 0
        ) {
            console.error(
                "[AnimationController] " +
                `No se generaron frames para: ${key}`
            );

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
                "[AnimationController] " +
                `No se pudo crear: ${key}`
            );

            return false;
        }

        return true;
    }

    static createAttackAnimation(scene) {
        if (
            !AnimationController
                .isValidScene(scene)
        ) {
            return false;
        }

        const animationKey =
            AnimationController
                .ANIMATIONS
                .ATTACK;

        if (
            scene.anims.exists(
                animationKey
            )
        ) {
            return true;
        }

        const frames = [];

        for (
            let index = 0;
            index < 7;
            index += 1
        ) {
            const frameNumber =
                String(index).padStart(
                    2,
                    "0"
                );

            const textureKey =
                `ninja-attack-${frameNumber}`;

            if (
                !scene.textures.exists(
                    textureKey
                )
            ) {
                console.error(
                    "[AnimationController] " +
                    `No existe la textura: ${textureKey}`
                );

                return false;
            }

            frames.push({
                key:
                    textureKey
            });
        }

        const animation =
            scene.anims.create({
                key:
                    animationKey,

                frames,

                frameRate:
                    12,

                repeat:
                    0,

                skipMissedFrames:
                    true
            });

        if (!animation) {
            console.error(
                "[AnimationController] " +
                `No se pudo crear: ${animationKey}`
            );

            return false;
        }

        return true;
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
                "[AnimationController] " +
                `La animación no existe: ${animationKey}`
            );

            return false;
        }

        const activeAnimationKey =
            this.getCurrentAnimation();

        /*
         * Las animaciones continuas no se reinician.
         *
         * Se consulta la animación real de Phaser, no solamente
         * la caché local currentAnimation.
         */
        if (
            !forceRestart &&
            activeAnimationKey ===
                animationKey
        ) {
            this.currentAnimation =
                animationKey;

            /*
             * Si está pausada o detenida, se reanuda sin imponer
             * un reinicio cuando Phaser lo permite.
             */
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
            AnimationController
                .ANIMATIONS
                .IDLE
        );
    }

    playWalk() {
        return this.play(
            AnimationController
                .ANIMATIONS
                .WALK
        );
    }

    playRun() {
        return this.play(
            AnimationController
                .ANIMATIONS
                .RUN
        );
    }

    playJump() {
        return this.play(
            AnimationController
                .ANIMATIONS
                .JUMP
        );
    }

    playFall() {
        return this.play(
            AnimationController
                .ANIMATIONS
                .FALL
        );
    }

    playAttack() {
        return this.play(
            AnimationController
                .ANIMATIONS
                .ATTACK,

            true
        );
    }

    playHurt() {
        return this.play(
            AnimationController
                .ANIMATIONS
                .HURT,

            true
        );
    }

    playDeath() {
        return this.play(
            AnimationController
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
        ) {
            return false;
        }

        if (
            !this.sprite.anims
                .isPlaying
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
         * No se eliminan las animaciones globales.
         * Únicamente se libera la referencia al sprite.
         */
        this.sprite =
            null;

        this.currentAnimation =
            null;
    }
}