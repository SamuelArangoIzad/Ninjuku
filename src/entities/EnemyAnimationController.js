export default class EnemyAnimationController {
    // =========================================================
    // Tipos de enemigo
    // =========================================================

    static TYPES = Object.freeze({
        SOLDIER: "soldier",
        SAMURAI: "samurai"
    });

    // =========================================================
    // Animaciones
    // =========================================================

    static ANIMATIONS = Object.freeze({
        soldier: Object.freeze({
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
        }),

        samurai: Object.freeze({
            IDLE:
                "samurai-idle-animation",

            WALK:
                "samurai-walk-animation",

            ATTACK:
                "samurai-attack-animation",

            HURT:
                "samurai-hurt-animation",

            DEATH:
                "samurai-death-animation"
        })
    });

    // =========================================================
    // Configuración de animaciones
    // =========================================================

    static getConfigurations() {
        return [
            // =================================================
            // Soldier
            // =================================================

            {
                enemyType:
                    "soldier",

                animationType:
                    "IDLE",

                key:
                    "soldier-idle-animation",

                texturePrefix:
                    "soldier-idle",

                startFrame:
                    0,

                endFrame:
                    5,

                frameDigits:
                    2,

                frameRate:
                    6,

                repeat:
                    -1
            },

            {
                enemyType:
                    "soldier",

                animationType:
                    "WALK",

                key:
                    "soldier-walk-animation",

                /*
                 * Soldier utiliza actualmente una secuencia
                 * ping-pong.
                 */
                frameOrder: [
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
                ],

                texturePrefix:
                    "soldier-walk",

                frameDigits:
                    2,

                frameRate:
                    12,

                repeat:
                    -1
            },

            {
                enemyType:
                    "soldier",

                animationType:
                    "ATTACK",

                key:
                    "soldier-attack-animation",

                texturePrefix:
                    "soldier-attack",

                startFrame:
                    0,

                endFrame:
                    6,

                frameDigits:
                    2,

                frameRate:
                    12,

                repeat:
                    0
            },

            {
                enemyType:
                    "soldier",

                animationType:
                    "HURT",

                key:
                    "soldier-hurt-animation",

                texturePrefix:
                    "soldier-hurt",

                startFrame:
                    0,

                endFrame:
                    3,

                frameDigits:
                    2,

                frameRate:
                    10,

                repeat:
                    0
            },

            {
                enemyType:
                    "soldier",

                animationType:
                    "DEATH",

                key:
                    "soldier-death-animation",

                texturePrefix:
                    "soldier-death",

                startFrame:
                    0,

                endFrame:
                    5,

                frameDigits:
                    2,

                frameRate:
                    7,

                repeat:
                    0
            },

            // =================================================
            // Samurai
            // =================================================

            {
                enemyType:
                    "samurai",

                animationType:
                    "IDLE",

                key:
                    "samurai-idle-animation",

                texturePrefix:
                    "samurai-idle",

                /*
                 * Tus archivos Samurai empiezan en 1:
                 *
                 * samuIdle1.png
                 * ...
                 * samuIdle7.png
                 */
                startFrame:
                    1,

                endFrame:
                    7,

                frameDigits:
                    2,

                frameRate:
                    8,

                repeat:
                    -1
            },

            {
                enemyType:
                    "samurai",

                animationType:
                    "WALK",

                key:
                    "samurai-walk-animation",

                texturePrefix:
                    "samurai-walk",

                startFrame:
                    1,

                endFrame:
                    8,

                frameDigits:
                    2,

                frameRate:
                    10,

                repeat:
                    -1
            },

            {
                enemyType:
                    "samurai",

                animationType:
                    "ATTACK",

                key:
                    "samurai-attack-animation",

                texturePrefix:
                    "samurai-attack",

                startFrame:
                    1,

                endFrame:
                    7,

                frameDigits:
                    2,

                frameRate:
                    12,

                repeat:
                    0
            },

            {
                enemyType:
                    "samurai",

                animationType:
                    "HURT",

                key:
                    "samurai-hurt-animation",

                texturePrefix:
                    "samurai-hurt",

                startFrame:
                    1,

                endFrame:
                    5,

                frameDigits:
                    2,

                frameRate:
                    12,

                repeat:
                    0
            },

            {
                enemyType:
                    "samurai",

                animationType:
                    "DEATH",

                key:
                    "samurai-death-animation",

                texturePrefix:
                    "samurai-death",

                startFrame:
                    1,

                endFrame:
                    7,

                frameDigits:
                    2,

                frameRate:
                    10,

                repeat:
                    0
            }
        ];
    }

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

        const configurations =
            EnemyAnimationController
                .getConfigurations();

        let allCreated =
            true;

        for (
            const configuration
            of configurations
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
            frameRate,
            repeat
        } = configuration;

        /*
         * Las animaciones Phaser son globales.
         */
        if (
            scene.anims.exists(
                key
            )
        ) {
            return true;
        }

        const frameOrder =
            EnemyAnimationController
                .resolveFrameOrder(
                    configuration
                );

        const frames =
            EnemyAnimationController
                .buildFrames(
                    scene,
                    texturePrefix,
                    frameOrder,
                    configuration
                        .frameDigits ??
                        2
                );

        if (!frames) {
            console.error(
                "[EnemyAnimationController] " +
                `No se pudieron construir los frames: ${key}`
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
                "[EnemyAnimationController] " +
                `No se pudo crear: ${key}`
            );

            return false;
        }

        console.log(
            "[EnemyAnimationController] " +
            `Animación creada: ${key}`
        );

        return true;
    }

    // =========================================================
    // Frames
    // =========================================================

    static resolveFrameOrder(
        configuration
    ) {
        if (
            Array.isArray(
                configuration
                    .frameOrder
            ) &&
            configuration
                .frameOrder
                .length > 0
        ) {
            return configuration
                .frameOrder;
        }

        const start =
            Number(
                configuration
                    .startFrame
            );

        const end =
            Number(
                configuration
                    .endFrame
            );

        if (
            !Number.isFinite(start) ||
            !Number.isFinite(end) ||
            end < start
        ) {
            return [];
        }

        const frames = [];

        for (
            let frame = start;
            frame <= end;
            frame += 1
        ) {
            frames.push(
                frame
            );
        }

        return frames;
    }

    static buildFrames(
        scene,
        texturePrefix,
        frameOrder,
        frameDigits = 2
    ) {
        if (
            !Array.isArray(
                frameOrder
            ) ||
            frameOrder.length === 0
        ) {
            console.error(
                "[EnemyAnimationController] " +
                `Secuencia inválida: ${texturePrefix}`
            );

            return null;
        }

        const frames = [];

        for (
            const index
            of frameOrder
        ) {
            const frameNumber =
                String(index)
                    .padStart(
                        frameDigits,
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

    constructor(
        sprite,
        enemyType = "soldier"
    ) {
        this.sprite =
            sprite ?? null;

        this.enemyType =
            this.normalizeEnemyType(
                enemyType
            );

        this.currentAnimation =
            null;

        this.isDestroyed =
            false;
    }

    // =========================================================
    // Tipo
    // =========================================================

    normalizeEnemyType(type) {
        return (
            String(type)
                .toLowerCase() ===
            "samurai"
        )
            ? "samurai"
            : "soldier";
    }

    setEnemyType(type) {
        if (
            this.isDestroyed
        ) {
            return false;
        }

        const nextType =
            this.normalizeEnemyType(
                type
            );

        if (
            this.enemyType ===
            nextType
        ) {
            return false;
        }

        this.stop();

        this.enemyType =
            nextType;

        this.currentAnimation =
            null;

        return true;
    }

    getEnemyType() {
        return this.enemyType;
    }

    getAnimationKey(
        animationType
    ) {
        return (
            EnemyAnimationController
                .ANIMATIONS
                [this.enemyType]
                ?.[animationType] ??
            null
        );
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
            !this.sprite.anims ||
            !animationKey
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
         * Idle y walk no se reinician continuamente.
         */
        if (
            !forceRestart &&
            activeAnimationKey ===
                animationKey
        ) {
            this.currentAnimation =
                animationKey;

            if (
                !this.sprite
                    .anims
                    .isPlaying
            ) {
                this.sprite
                    .anims
                    .play(
                        animationKey,
                        true
                    );
            }

            return true;
        }

        this.currentAnimation =
            animationKey;

        this.sprite
            .anims
            .play(
                animationKey,
                !forceRestart
            );

        return true;
    }

    animationExists(
        animationKey
    ) {
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
            this.getAnimationKey(
                "IDLE"
            )
        );
    }

    playWalk() {
        return this.play(
            this.getAnimationKey(
                "WALK"
            )
        );
    }

    playAttack() {
        return this.play(
            this.getAnimationKey(
                "ATTACK"
            ),
            true
        );
    }

    playHurt() {
        return this.play(
            this.getAnimationKey(
                "HURT"
            ),
            true
        );
    }

    playDeath() {
        return this.play(
            this.getAnimationKey(
                "DEATH"
            ),
            true
        );
    }

    // =========================================================
    // Consultas
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

    isPlaying(
        animationKey = null
    ) {
        if (
            this.isDestroyed ||
            !this.sprite
                ?.anims
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

        this.sprite
            .anims
            .stop();

        this.currentAnimation =
            null;
    }

    reset() {
        if (
            this.isDestroyed
        ) {
            return false;
        }

        this.currentAnimation =
            null;

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

        this.isDestroyed =
            true;

        this.sprite =
            null;

        this.currentAnimation =
            null;
    }
}