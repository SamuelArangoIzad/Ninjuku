import Phaser from "phaser";

import AnimationController
    from "../entities/AnimationController.js";

import EnemyAnimationController
    from "../entities/EnemyAnimationController.js";

import Player
    from "../entities/Player.js";

import Controls
    from "../input/Controls.js";

import BackgroundManager
    from "../world/BackgroundManager.js";

import EnemyManager
    from "../managers/EnemyManager.js";

import WaveManager
    from "../managers/WaveManager.js";

import Ground
    from "../world/Ground.js";

import CombatSystem
    from "../systems/CombatSystem.js";

import EntityUIManager
    from "../managers/EntityUIManager.js";

import ScoreSystem
    from "../systems/ScoreSystem.js";

import PerformanceMonitor
    from "../debug/PerformanceMonitor.js";


export default class GameScene extends Phaser.Scene {
    constructor() {
        super({
            key: "GameScene"
        });

        // =====================================================
        // Fondo
        // =====================================================

        this.backgroundManager =
            null;

        // =====================================================
        // Jugador y controles
        // =====================================================

        this.player =
            null;

        this.controls =
            null;

        // =====================================================
        // Suelo
        // =====================================================

        this.ground =
            null;

        this.playerGroundCollider =
            null;

        // =====================================================
        // Administradores y sistemas
        // =====================================================

        this.enemyManager =
            null;

        this.waveManager =
            null;

        this.combatSystem =
            null;

        this.entityUIManager =
            null;

        this.scoreSystem =
            null;

        this.performanceMonitor =
            null;

        // =====================================================
        // Dimensiones
        // =====================================================

        this.currentWidth =
            1;

        this.currentHeight =
            1;

        /*
         * El suelo y los enemigos se extienden fuera del área
         * visible. El mundo físico debe cubrir la misma región.
         */
        this.worldHorizontalExtension =
            700;

        // =====================================================
        // Game Over
        // =====================================================

        this.gameOverTriggered =
            false;

        this.gameOverTimer =
            null;

        /*
         * Tiempo concedido para que termine la animación
         * de muerte antes de abrir GameOverScene.
         */
        this.gameOverDelay =
            1200;

        // =====================================================
        // Estado
        // =====================================================

        this.isShuttingDown =
            false;

        this.isHandlingResize =
            false;
    }

    // =========================================================
    // Preload
    // =========================================================

    preload() {
        this.loadBackgroundAssets();
        this.loadPlayerAssets();
        this.loadEnemyAssets();
    }

    // =========================================================
    // Recursos del fondo
    // =========================================================

    loadBackgroundAssets() {
        this.load.image(
            "background",
            "/assets/backgrounds/fondo.png"
        );
    }

    // =========================================================
    // Recursos del jugador
    // =========================================================

    loadPlayerAssets() {
        this.load.spritesheet(
            "ninja-idle",
            "/assets/player/ninja_idle.png",
            {
                frameWidth:
                    128,

                frameHeight:
                    128
            }
        );

        this.load.spritesheet(
            "ninja-walk",
            "/assets/player/ninja_walk.png",
            {
                frameWidth:
                    128,

                frameHeight:
                    128
            }
        );

        this.load.spritesheet(
            "ninja-run",
            "/assets/player/ninja_run.png",
            {
                frameWidth:
                    128,

                frameHeight:
                    128
            }
        );

        this.load.spritesheet(
            "ninja-jump",
            "/assets/player/ninja_jump.png",
            {
                frameWidth:
                    128,

                frameHeight:
                    128
            }
        );

        this.load.spritesheet(
            "ninja-fall",
            "/assets/player/ninja_fall.png",
            {
                frameWidth:
                    128,

                frameHeight:
                    128
            }
        );

        /*
         * El ataque utiliza imágenes independientes.
         */
        for (
            let index = 0;
            index < 7;
            index += 1
        ) {
            const number =
                String(index).padStart(
                    2,
                    "0"
                );

            this.load.image(
                `ninja-attack-${number}`,
                `/assets/player/attack/attack_${number}.png`
            );
        }

        this.load.spritesheet(
            "ninja-hurt",
            "/assets/player/ninja_hurt.png",
            {
                frameWidth:
                    128,

                frameHeight:
                    128
            }
        );

        this.load.spritesheet(
            "ninja-death",
            "/assets/player/ninja_death.png",
            {
                frameWidth:
                    128,

                frameHeight:
                    128
            }
        );
    }

    // =========================================================
    // Recursos del enemigo
    // =========================================================

    loadEnemyAssets() {
        this.loadEnemySequence(
            "soldier-idle",
            "soldier_idle",
            6
        );

        this.loadEnemySequence(
            "soldier-walk",
            "soldier_walk",
            8
        );

        this.loadEnemySequence(
            "soldier-attack",
            "soldier_attack",
            7
        );

        this.loadEnemySequence(
            "soldier-hurt",
            "soldier_hurt",
            4
        );

        this.loadEnemySequence(
            "soldier-death",
            "soldier_death",
            6
        );
    }

    loadEnemySequence(
        texturePrefix,
        directoryName,
        frameCount
    ) {
        for (
            let index = 0;
            index < frameCount;
            index += 1
        ) {
            const number =
                String(index).padStart(
                    2,
                    "0"
                );

            this.load.image(
                `${texturePrefix}-${number}`,
                `/assets/enemies/soldier/frames/${directoryName}/frame_${number}.png`
            );
        }
    }

    // =========================================================
    // Create
    // =========================================================

    create() {
        this.isShuttingDown =
            false;

        this.isHandlingResize =
            false;

        this.gameOverTriggered =
            false;

        this.gameOverTimer =
            null;

        /*
         * Phaser.Scale.RESIZE ya estableció scale.width y
         * scale.height antes de ejecutar create().
         */
        this.updateStoredDimensions(
            this.scale.width,
            this.scale.height
        );

        this.configureWorld();

        // =====================================================
        // Fondo
        // =====================================================

        this.backgroundManager =
            new BackgroundManager(
                this,
                {
                    textureKey:
                        "background",

                    speed:
                        35,

                    depth:
                        -100
                }
            );

        this.backgroundManager.create();

        // =====================================================
        // Animaciones
        // =====================================================

        AnimationController
            .createAnimations(
                this
            );

        EnemyAnimationController
            .createAnimations(
                this
            );

        // =====================================================
        // Suelo
        // =====================================================

        this.ground =
            new Ground(
                this,
                {
                    horizontalExtension:
                        this.worldHorizontalExtension
                }
            );

        const groundY =
            this.getGroundSurfaceY();

        // =====================================================
        // Jugador
        // =====================================================

        this.player =
            new Player(
                this,
                this.getInitialPlayerX(),
                groundY - 5
            );

        this.controls =
            new Controls(
                this
            );

        this.createPlayerGroundCollider();

        // =====================================================
        // EnemyManager
        // =====================================================

        this.enemyManager =
            new EnemyManager(
                this,
                {
                    player:
                        this.player,

                    ground:
                        this.ground,

                    cullingEnabled:
                        true,

                    activeAreaMargin:
                        350
                }
            );

        // =====================================================
        // Sistemas
        // =====================================================

        this.combatSystem =
            new CombatSystem(
                this,
                this.player,
                this.enemyManager.getEnemies()
            );

        this.entityUIManager =
            new EntityUIManager(
                this,
                {
                    player:
                        this.player
                }
            );

        this.scoreSystem =
            new ScoreSystem(
                this
            );

        this.performanceMonitor =
            new PerformanceMonitor(
                this,
                {
                    enemyManager:
                        this.enemyManager,

                    visible:
                        true,

                    updateInterval:
                        500
                }
            );

        this.enemyManager.setSystems({
            combatSystem:
                this.combatSystem,

            healthBarSystem:
                this.entityUIManager
        });

        // =====================================================
        // Oleadas
        // =====================================================

        this.waveManager =
            new WaveManager(
                this,
                {
                    enemyManager:
                        this.enemyManager
                }
            );

        const wavesStarted =
            this.waveManager.start();

        // =====================================================
        // Eventos
        // =====================================================

        this.scale.on(
            Phaser.Scale.Events.RESIZE,
            this.handleResize,
            this
        );

        this.events.once(
            Phaser.Scenes.Events.SHUTDOWN,
            this.shutdown,
            this
        );

        console.log(
            "[GameScene] Escena creada:",
            {
                width:
                    this.currentWidth,

                height:
                    this.currentHeight,

                canvasWidth:
                    this.game.canvas.width,

                canvasHeight:
                    this.game.canvas.height,

                cameraWidth:
                    this.cameras.main.width,

                cameraHeight:
                    this.cameras.main.height,

                wavesStarted
            }
        );
    }

    // =========================================================
    // Dimensiones
    // =========================================================

    normalizeDimension(
        value,
        fallback = 1
    ) {
        const number =
            Number(value);

        if (
            !Number.isFinite(number) ||
            number <= 0
        ) {
            return fallback;
        }

        return Math.max(
            1,
            Math.round(
                number
            )
        );
    }

    updateStoredDimensions(
        width,
        height
    ) {
        this.currentWidth =
            this.normalizeDimension(
                width,
                this.currentWidth
            );

        this.currentHeight =
            this.normalizeDimension(
                height,
                this.currentHeight
            );
    }

    // =========================================================
    // Mundo y cámara
    // =========================================================

    configureWorld() {
        this.configureCamera(
            this.currentWidth,
            this.currentHeight
        );

        this.configurePhysicsBounds(
            this.currentWidth,
            this.currentHeight
        );
    }

    configureCamera(
        width,
        height
    ) {
        const camera =
            this.cameras?.main;

        if (!camera) {
            return;
        }

        camera.setViewport(
            0,
            0,
            width,
            height
        );

        camera.setScroll(
            0,
            0
        );

        camera.roundPixels =
            true;
    }

    configurePhysicsBounds(
        width,
        height
    ) {
        const extension =
            this.worldHorizontalExtension;

        this.physics.world.setBounds(
            -extension,
            0,
            width +
                extension * 2,
            height
        );
    }

    getInitialPlayerX() {
        return Phaser.Math.Clamp(
            this.currentWidth *
                0.18,
            80,
            150
        );
    }

    getGroundSurfaceY() {
        if (
            typeof this.ground
                ?.getSurfaceY ===
            "function"
        ) {
            return this.ground
                .getSurfaceY();
        }

        if (
            typeof this.ground
                ?.getTop ===
            "function"
        ) {
            return this.ground
                .getTop();
        }

        return (
            this.currentHeight -
            24
        );
    }

    // =========================================================
    // Update
    // =========================================================

    update(time, delta) {
        if (this.isShuttingDown) {
            return;
        }

        this.backgroundManager
            ?.update(
                delta
            );

        const playerIsAlive =
            Boolean(
                this.player &&
                !this.player.hasDied?.()
            );

        /*
         * La transición se solicita una sola vez. El resto de
         * sistemas puede continuar actualizando elementos
         * visuales mientras termina la animación de muerte.
         */
        if (!playerIsAlive) {
            this.handleGameOver();
        }

        if (
            playerIsAlive &&
            this.controls
        ) {
            this.player.update(
                this.controls
            );
        }

        if (playerIsAlive) {
            this.enemyManager
                ?.update(
                    time
                );

            this.combatSystem
                ?.update();
        }

        /*
         * Las posiciones de las barras se actualizan aunque
         * las entidades estén detenidas temporalmente.
         */
        this.entityUIManager
            ?.update();

        this.enemyManager
            ?.removeDestroyedEnemies();

        if (playerIsAlive) {
            this.waveManager
                ?.update();
        } else {
            this.waveManager
                ?.stop();
        }

        this.performanceMonitor
            ?.update(
                time,
                delta
            );
    }

    // =========================================================
    // Game Over
    // =========================================================

    handleGameOver() {
        if (
            this.isShuttingDown ||
            this.gameOverTriggered
        ) {
            return false;
        }

        this.gameOverTriggered =
            true;

        /*
         * Se captura ahora. ScoreSystem será destruido durante
         * el shutdown de GameScene.
         */
        const finalScore =
            Math.max(
                0,
                Math.floor(
                    Number(
                        this.scoreSystem
                            ?.getScore?.()
                    ) || 0
                )
            );

        this.waveManager
            ?.stop();

        /*
         * Evita que los enemigos continúen procesando ataques.
         */
        for (
            const enemy
            of this.enemyManager
                ?.getEnemies?.() ??
                []
        ) {
            enemy?.setIdle?.();

            enemy?.ai
                ?.setEnabled?.(
                    false
                );
        }

        /*
         * Oculta los controles táctiles mientras termina
         * la animación de muerte, si Controls lo permite.
         */
        this.controls
            ?.setVisible?.(
                false
            );

        this.gameOverTimer =
            this.time.delayedCall(
                this.gameOverDelay,
                () => {
                    this.gameOverTimer =
                        null;

                    if (
                        this.isShuttingDown ||
                        !this.scene
                    ) {
                        return;
                    }

                    this.scene.start(
                        "GameOverScene",
                        {
                            score:
                                finalScore
                        }
                    );
                }
            );

        return true;
    }

    cancelGameOverTimer() {
        this.gameOverTimer
            ?.remove(false);

        this.gameOverTimer =
            null;
    }

    // =========================================================
    // Collider del jugador
    // =========================================================

    createPlayerGroundCollider() {
        this.playerGroundCollider
            ?.destroy();

        this.playerGroundCollider =
            null;

        const playerSprite =
            this.player
                ?.getSprite?.();

        if (
            !playerSprite?.active ||
            !this.ground?.platform
        ) {
            return;
        }

        this.playerGroundCollider =
            this.physics.add.collider(
                playerSprite,
                this.ground.platform
            );
    }

    // =========================================================
    // Resize
    // =========================================================

    handleResize(gameSize) {
        if (
            this.isShuttingDown ||
            this.isHandlingResize ||
            !gameSize
        ) {
            return;
        }

        const width =
            this.normalizeDimension(
                gameSize.width,
                this.currentWidth
            );

        const height =
            this.normalizeDimension(
                gameSize.height,
                this.currentHeight
            );

        if (
            width ===
                this.currentWidth &&
            height ===
                this.currentHeight
        ) {
            return;
        }

        this.isHandlingResize =
            true;

        try {
            this.applyResize(
                width,
                height
            );
        } finally {
            this.isHandlingResize =
                false;
        }
    }

    applyResize(
        width,
        height
    ) {
        const previousGroundY =
            this.getGroundSurfaceY();

        this.updateStoredDimensions(
            width,
            height
        );

        this.configureCamera(
            width,
            height
        );

        this.configurePhysicsBounds(
            width,
            height
        );

        this.backgroundManager
            ?.resize?.();

        if (
            typeof this.ground
                ?.resize ===
            "function"
        ) {
            this.ground.resize();
        } else {
            this.rebuildGround();
        }

        const currentGroundY =
            this.getGroundSurfaceY();

        this.repositionActorsAfterResize(
            previousGroundY,
            currentGroundY,
            width
        );

        this.player
            ?.updateResponsiveScale?.();

        this.enemyManager
            ?.updateResponsiveScale?.();

        this.refreshPhysicsBodies();

        const resizeData = {
            width,
            height
        };

        this.controls
            ?.handleResize?.(
                resizeData
            );

        this.entityUIManager
            ?.handleResize?.(
                resizeData
            );

        this.scoreSystem
            ?.handleResize?.(
                resizeData
            );

        this.performanceMonitor
            ?.handleResize?.(
                resizeData
            );

        console.log(
            "[GameScene] Resize aplicado:",
            {
                width,
                height,

                canvasWidth:
                    this.game.canvas.width,

                canvasHeight:
                    this.game.canvas.height,

                cameraWidth:
                    this.cameras.main.width,

                cameraHeight:
                    this.cameras.main.height
            }
        );
    }

    // =========================================================
    // Reconstrucción del suelo
    // =========================================================

    rebuildGround() {
        this.playerGroundCollider
            ?.destroy();

        this.playerGroundCollider =
            null;

        this.enemyManager
            ?.destroyGroundColliders?.();

        this.ground
            ?.destroy();

        this.ground =
            new Ground(
                this,
                {
                    horizontalExtension:
                        this.worldHorizontalExtension
                }
            );

        this.createPlayerGroundCollider();

        this.enemyManager
            ?.setGround(
                this.ground
            );

        this.enemyManager
            ?.rebuildGroundColliders?.();
    }

    // =========================================================
    // Reposicionamiento
    // =========================================================

    repositionActorsAfterResize(
        previousGroundY,
        currentGroundY,
        width
    ) {
        if (
            !Number.isFinite(
                previousGroundY
            ) ||
            !Number.isFinite(
                currentGroundY
            ) ||
            !Number.isFinite(
                width
            )
        ) {
            return;
        }

        this.repositionPlayerAfterResize(
            previousGroundY,
            currentGroundY,
            width
        );

        this.enemyManager
            ?.repositionAfterGroundResize?.(
                previousGroundY,
                currentGroundY,
                width
            );
    }

    repositionPlayerAfterResize(
        previousGroundY,
        currentGroundY,
        width
    ) {
        const sprite =
            this.player
                ?.getSprite?.();

        if (!sprite?.active) {
            return;
        }

        const distanceFromGround =
            previousGroundY -
            sprite.y;

        sprite.y =
            currentGroundY -
            distanceFromGround;

        sprite.x =
            Phaser.Math.Clamp(
                sprite.x,
                40,
                Math.max(
                    40,
                    width - 40
                )
            );

        sprite.body
            ?.updateFromGameObject?.();
    }

    // =========================================================
    // Cuerpos físicos
    // =========================================================

    refreshPhysicsBodies() {
        this.refreshPlayerPhysicsBody();
        this.refreshEnemyPhysicsBodies();
    }

    refreshPlayerPhysicsBody() {
        const sprite =
            this.player
                ?.getSprite?.();

        if (!sprite?.body) {
            return;
        }

        sprite.body
            .updateFromGameObject?.();
    }

    refreshEnemyPhysicsBodies() {
        const enemies =
            this.enemyManager
                ?.getEnemies?.() ??
            [];

        for (
            const enemy
            of enemies
        ) {
            const sprite =
                enemy
                    ?.getSprite?.();

            if (!sprite?.body) {
                continue;
            }

            enemy
                ?.configurePhysicsBody?.();

            sprite.body
                .updateFromGameObject?.();
        }
    }

    // =========================================================
    // Shutdown
    // =========================================================

    shutdown() {
        if (this.isShuttingDown) {
            return;
        }

        this.isShuttingDown =
            true;

        this.cancelGameOverTimer();

        this.scale.off(
            Phaser.Scale.Events.RESIZE,
            this.handleResize,
            this
        );

        this.playerGroundCollider
            ?.destroy();

        this.playerGroundCollider =
            null;

        /*
         * El monitor se destruye antes que EnemyManager porque
         * todavía consulta sus métricas.
         */
        this.performanceMonitor
            ?.destroy();

        this.performanceMonitor =
            null;

        this.scoreSystem
            ?.destroy();

        this.scoreSystem =
            null;

        this.entityUIManager
            ?.destroy();

        this.entityUIManager =
            null;

        this.combatSystem
            ?.destroy();

        this.combatSystem =
            null;

        this.controls
            ?.destroy();

        this.controls =
            null;

        /*
         * WaveManager cancela sus temporizadores antes de
         * destruir EnemyManager.
         */
        this.waveManager
            ?.destroy();

        this.waveManager =
            null;

        this.enemyManager
            ?.destroy();

        this.enemyManager =
            null;

        this.player
            ?.destroy();

        this.player =
            null;

        this.ground
            ?.destroy();

        this.ground =
            null;

        this.backgroundManager
            ?.destroy();

        this.backgroundManager =
            null;

        this.currentWidth =
            1;

        this.currentHeight =
            1;

        this.isHandlingResize =
            false;

        this.gameOverTriggered =
            false;
    }
}