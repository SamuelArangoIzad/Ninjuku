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

import ObstacleManager
    from "../world/ObstacleManager.js";

import HangingPropManager
    from "../world/HangingPropManager.js";

import GrappleController
    from "../entities/GrappleController.js";

import ShurikenSystem
    from "../entities/ShurikenSystem.js";

import RoofEnemyManager
    from "../world/RoofEnemyManager.js";

import HookRegistry
    from "../world/HookRegistry.js";

import { isOutOfCamera }
    from "../systems/CameraBounds.js";

import CombatSystem
    from "../systems/CombatSystem.js";

import EntityUIManager
    from "../managers/EntityUIManager.js";

import ScoreSystem
    from "../systems/ScoreSystem.js";

import PerformanceMonitor
    from "../debug/PerformanceMonitor.js";


/*
 * Orden en el que se van encadenando los fondos. Al llegar al final
 * vuelve a empezar por el primero.
 */
const BACKGROUND_KEYS = [
    "background-1",
    "background-2",
    "background-3",
    "background-4",
    "background-5",
    "background-6",
    "background-7",
    "background-8"
];


/*
 * Orden en el que se van encadenando las estructuras que hacen de
 * obstaculo. Igual que los fondos, la secuencia se repite en bucle.
 * Se alternan bajas y altas para que el ritmo de saltos varie.
 */
const OBSTACLE_KEYS = [
    "obstacle-3",
    "obstacle-1",
    "obstacle-5",
    "obstacle-2",
    "obstacle-4",
    "obstacle-6"
];


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

        this.obstacleManager =
            null;

        this.hangingPropManager =
            null;

        this.grappleController =
            null;

        this.shurikenSystem =
            null;

        this.enemyShurikenSystem =
            null;

        this.roofEnemyManager =
            null;

        this.hookRegistry =
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
        this.loadObstacleAssets();
        this.loadGrappleAssets();
        this.loadShurikenAssets();
        this.loadPlayerAssets();
        this.loadEnemyAssets();
    }

    // =========================================================
    // Recursos del fondo
    // =========================================================

    loadBackgroundAssets() {
        /*
         * Los fondos se recorren en secuencia. Para añadir el fondo 3
         * basta con cargarlo aquí y sumar su clave a BACKGROUND_KEYS.
         */
        this.load.image(
            "background-1",
            "/assets/backgrounds/fondo.png"
        );

        this.load.image(
            "background-2",
            "/assets/backgrounds/fondo2.png"
        );

        this.load.image(
            "background-3",
            "/assets/backgrounds/fondo3.png"
        );

        this.load.image(
            "background-4",
            "/assets/backgrounds/fondo4.png"
        );

        this.load.image(
            "background-5",
            "/assets/backgrounds/fondo5.png"
        );

        this.load.image(
            "background-6",
            "/assets/backgrounds/fondo6.png"
        );

        this.load.image(
            "background-7",
            "/assets/backgrounds/fondo7.png"
        );

        this.load.image(
            "background-8",
            "/assets/backgrounds/fondo8.png"
        );
    }

    // =========================================================
    // Recursos de los obstaculos
    // =========================================================

    loadObstacleAssets() {
        const folder =
            "/assets/platformsGameplay/" +
            "PlatformSprites/" +
            "row-5-EstructuresToUse";

        for (
            let index = 1;
            index <= 6;
            index += 1
        ) {
            this.load.image(
                `obstacle-${index}`,
                `${folder}/estructure${index}.png`
            );
        }

        /*
         * Plataformas de salto. Sirven de escalon para llegar al
         * tejado de las casas, que son demasiado altas para saltarlas
         * de una sola vez.
         */
        this.load.image(
            "platform-low",
            `${folder}/platformJump.png`
        );

        this.load.image(
            "platform-high",
            `${folder}/platformJump2.png`
        );

        /*
         * Objeto que cuelga de las ramas de cerezo del fondo.
         */
        this.load.image(
            "hanging-prop",
            `${folder}/sprite-5.png`
        );
    }

    // =========================================================
    // Recursos del shuriken
    // =========================================================

    loadShurikenAssets() {
        this.load.spritesheet(
            "shuriken",
            "/assets/player/generated/shuriken.png",
            {
                frameWidth: 94,
                frameHeight: 110
            }
        );

        this.load.spritesheet(
            "soldier-shuriken",
            "/assets/player/generated/soldier-shuriken.png",
            {
                frameWidth: 260,
                frameHeight: 199
            }
        );

        this.load.spritesheet(
            "soldier-shuriken-hurt",
            "/assets/player/generated/soldier-shuriken-hurt.png",
            {
                frameWidth: 136,
                frameHeight: 184
            }
        );

        this.load.spritesheet(
            "soldier-shuriken-death",
            "/assets/player/generated/soldier-shuriken-death.png",
            {
                frameWidth: 209,
                frameHeight: 150
            }
        );
    }

    // =========================================================
    // Recursos del kusarigama
    // =========================================================

    /*
     * Hojas generadas con tools/preparar_animaciones.py a partir de
     * los PNG sueltos, que venian cada uno con un tamano distinto.
     */
    loadGrappleAssets() {
        const folder =
            "/assets/player/generated";

        const sheets = [
            ["kusarigama-launch", 142, 303],
            ["kusarigama-land", 173, 141],
            ["kusarigama-swing-left", 294, 336],
            ["kusarigama-swing-right", 320, 333]
        ];

        for (
            const [key, frameWidth, frameHeight]
            of sheets
        ) {
            this.load.spritesheet(
                key,
                `${folder}/${key}.png`,
                {
                    frameWidth,
                    frameHeight
                }
            );
        }
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

        // =========================================================
    // Recursos de enemigos
    // =========================================================

    loadEnemyAssets() {
        // =====================================================
        // Soldier
        // =====================================================

        this.loadEnemySequence({
            texturePrefix:
                "soldier-idle",

            basePath:
                "/assets/enemies/soldier/frames/soldier_idle",

            filePrefix:
                "frame_",

            fileExtension:
                ".png",

            startIndex:
                0,

            frameCount:
                6,

            padLength:
                2
        });

        this.loadEnemySequence({
            texturePrefix:
                "soldier-walk",

            basePath:
                "/assets/enemies/soldier/frames/soldier_walk",

            filePrefix:
                "frame_",

            fileExtension:
                ".png",

            startIndex:
                0,

            frameCount:
                8,

            padLength:
                2
        });

        this.loadEnemySequence({
            texturePrefix:
                "soldier-attack",

            basePath:
                "/assets/enemies/soldier/frames/soldier_attack",

            filePrefix:
                "frame_",

            fileExtension:
                ".png",

            startIndex:
                0,

            frameCount:
                7,

            padLength:
                2
        });

        this.loadEnemySequence({
            texturePrefix:
                "soldier-hurt",

            basePath:
                "/assets/enemies/soldier/frames/soldier_hurt",

            filePrefix:
                "frame_",

            fileExtension:
                ".png",

            startIndex:
                0,

            frameCount:
                4,

            padLength:
                2
        });

        this.loadEnemySequence({
            texturePrefix:
                "soldier-death",

            basePath:
                "/assets/enemies/soldier/frames/soldier_death",

            filePrefix:
                "frame_",

            fileExtension:
                ".png",

            startIndex:
                0,

            frameCount:
                6,

            padLength:
                2
        });

        // =====================================================
        // Samurai
        // =====================================================

        /*
         * Samurai empieza en 1:
         *
         * samuIdle1.png
         * samuIdle2.png
         * ...
         *
         * Internamente registramos las texturas como:
         *
         * samurai-idle-01
         * samurai-idle-02
         * ...
         */

        this.loadEnemySequence({
            texturePrefix:
                "samurai-idle",

            basePath:
                "/assets/enemies/samurai/frames/samurai_idle",

            filePrefix:
                "samuIdle",

            fileExtension:
                ".png",

            startIndex:
                1,

            frameCount:
                7,

            padLength:
                2,

            padFileNumber:
                false
        });

        this.loadEnemySequence({
            texturePrefix:
                "samurai-walk",

            basePath:
                "/assets/enemies/samurai/frames/samurai_walk",

            filePrefix:
                "samuWalk",

            fileExtension:
                ".png",

            startIndex:
                1,

            frameCount:
                8,

            padLength:
                2,

            padFileNumber:
                false
        });

        this.loadEnemySequence({
            texturePrefix:
                "samurai-attack",

            basePath:
                "/assets/enemies/samurai/frames/samurai_attack",

            filePrefix:
                "samuAttack",

            fileExtension:
                ".png",

            startIndex:
                1,

            frameCount:
                7,

            padLength:
                2,

            padFileNumber:
                false
        });

        this.loadEnemySequence({
            texturePrefix:
                "samurai-hurt",

            basePath:
                "/assets/enemies/samurai/frames/samurai_hurt",

            filePrefix:
                "samuHurt",

            fileExtension:
                ".png",

            startIndex:
                1,

            frameCount:
                5,

            padLength:
                2,

            padFileNumber:
                false
        });

        this.loadEnemySequence({
            texturePrefix:
                "samurai-death",

            basePath:
                "/assets/enemies/samurai/frames/samurai_death",

            filePrefix:
                "samuDeath",

            fileExtension:
                ".png",

            startIndex:
                1,

            frameCount:
                7,

            padLength:
                2,

            padFileNumber:
                false
        });
    }

    loadEnemySequence({
        texturePrefix,
        basePath,
        filePrefix,
        fileExtension = ".png",
        startIndex = 0,
        frameCount = 1,
        padLength = 2,
        padFileNumber = true
    } = {}) {
        if (
            !texturePrefix ||
            !basePath ||
            !filePrefix ||
            frameCount <= 0
        ) {
            console.error(
                "[GameScene] Configuración inválida " +
                "para cargar secuencia enemiga.",
                {
                    texturePrefix,
                    basePath,
                    filePrefix,
                    frameCount
                }
            );

            return false;
        }

        for (
            let offset = 0;
            offset < frameCount;
            offset += 1
        ) {
            const index =
                startIndex +
                offset;

            /*
             * Key interna Phaser.
             *
             * Soldier:
             * soldier-idle-00
             *
             * Samurai:
             * samurai-idle-01
             */
            const textureNumber =
                String(index)
                    .padStart(
                        padLength,
                        "0"
                    );

            /*
             * Nombre físico del archivo.
             *
             * Soldier:
             * frame_00.png
             *
             * Samurai:
             * samuIdle1.png
             */
            const fileNumber =
                padFileNumber
                    ? String(index)
                        .padStart(
                            padLength,
                            "0"
                        )
                    : String(index);

            const textureKey =
                `${texturePrefix}-${textureNumber}`;

            const filePath =
                `${basePath}/` +
                `${filePrefix}` +
                `${fileNumber}` +
                `${fileExtension}`;

            this.load.image(
                textureKey,
                filePath
            );
        }

        return true;
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
                    textureKeys:
                        BACKGROUND_KEYS,

                    speed:
                        35,

                    depth:
                        -100
                }
            );

        this.backgroundManager.create();

        // =====================================================
        // Objeto colgado de las ramas
        // =====================================================

        this.hangingPropManager =
            new HangingPropManager(
                this,
                {
                    backgroundManager:
                        this.backgroundManager,

                    textureKey:
                        "hanging-prop"
                }
            );

        this.hangingPropManager.create();

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
        // Obstaculos
        // =====================================================

        this.obstacleManager =
            new ObstacleManager(
                this,
                {
                    ground:
                        this.ground,

                    sequence:
                        OBSTACLE_KEYS,

                    /*
                     * Misma velocidad que el fondo: las estructuras
                     * deben parecer parte del paisaje.
                     */
                    speed:
                        35,

                    horizontalExtension:
                        this.worldHorizontalExtension,

                    getPlayerSprite:
                        () =>
                            this.player
                                ?.getSprite?.() ??
                            null,

                    getEnemySprites:
                        () =>
                            this.enemyManager
                                ?.getEnemies?.()
                                ?.map(
                                    (enemy) =>
                                        enemy
                                            ?.getSprite?.()
                                )
                                ?.filter(Boolean) ??
                            []
                }
            );

        this.obstacleManager.create();

        // =====================================================
        // Kusarigama
        // =====================================================

        this.shurikenSystem =
            new ShurikenSystem(
                this,
                {
                    getEnemies:
                        () =>
                            this.getAllEnemies()
                }
            );

        this.shurikenSystem.create();

        // =====================================================
        // Enemigos de tejado
        // =====================================================

        /*
         * Sistema aparte para los shuriken enemigos: apunta al
         * jugador en vez de a los enemigos. El envoltorio adapta al
         * jugador a la interfaz que espera ShurikenSystem.
         */
        this.enemyShurikenSystem =
            new ShurikenSystem(
                this,
                {
                    getEnemies:
                        () =>
                            this.getPlayerAsTarget(),

                    speed: 420,
                    depth: 8
                }
            );

        this.enemyShurikenSystem.create();

        this.roofEnemyManager =
            new RoofEnemyManager(
                this,
                {
                    obstacleManager:
                        this.obstacleManager,

                    shurikenSystem:
                        this.enemyShurikenSystem,

                    getPlayerSprite:
                        () =>
                            this.player
                                ?.getSprite?.() ??
                            null
                }
            );

        this.roofEnemyManager.create();

        /*
         * El kusarigama busca entre los dos tipos de enganche: los
         * colgantes de las ramas y los que acompanan a cada enemigo.
         */
        this.hookRegistry =
            new HookRegistry([
                this.hangingPropManager,
                this.roofEnemyManager
            ]);

        this.grappleController =
            new GrappleController(
                this,
                {
                    player:
                        this.player,

                    hangingPropManager:
                        this.hookRegistry,

                    shurikenSystem:
                        this.shurikenSystem
                }
            );

        this.grappleController.create();

        // =====================================================
        // Sistemas
        // =====================================================

        this.combatSystem =
            new CombatSystem(
                this,
                this.player,
                this.enemyManager.getEnemies(),
                {
                    getExtraEnemies:
                        () =>
                            this.roofEnemyManager
                                ?.getEnemies?.() ??
                            []
                }
            );

        this.entityUIManager =
            new EntityUIManager(
                this,
                {
                    player:
                        this.player
                }
            );

        this.roofEnemyManager
            ?.setHealthBarSystem?.(
                this.entityUIManager
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

        /*
         * Va despues del fondo: sus posiciones se derivan de donde han
         * quedado los paneles en este mismo fotograma.
         */
        this.hangingPropManager
            ?.update();

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

        /*
         * El kusarigama va antes: mientras dura el enganche toma el
         * mando y el jugador no debe leer los controles normales.
         */
        this.grappleController
            ?.update(
                delta,
                this.controls
            );

        this.roofEnemyManager
            ?.update(delta, time);

        this.shurikenSystem
            ?.update(delta);

        this.enemyShurikenSystem
            ?.update(delta);

        if (
            playerIsAlive &&
            this.controls &&
            !this.grappleController
                ?.suspendsPlayer?.()
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
         * Va despues del jugador y los enemigos: el arrastre de quien
         * viaja encima de una estructura se aplica sobre las
         * posiciones ya resueltas de este fotograma.
         */
        this.obstacleManager
            ?.update(
                delta
            );

        if (playerIsAlive) {
            this.enforceCameraBounds();
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
    // Enemigos
    // =========================================================

    /*
     * Todos los enemigos, vengan de las oleadas o de los tejados.
     * Lo usan los shuriken del jugador.
     */
    getAllEnemies() {
        const oleadas =
            this.enemyManager
                ?.getEnemies?.() ?? [];

        const tejados =
            this.roofEnemyManager
                ?.getEnemies?.() ?? [];

        if (tejados.length === 0) {
            return oleadas;
        }

        return oleadas.concat(tejados);
    }

    /*
     * El jugador, adaptado a la interfaz que espera ShurikenSystem,
     * para que los shuriken enemigos puedan danarlo.
     */
    getPlayerAsTarget() {
        if (!this.playerAsTarget) {
            this.playerAsTarget = [{
                isAlive:
                    () =>
                        Boolean(this.player) &&
                        !this.player.hasDied?.(),

                getSprite:
                    () =>
                        this.player
                            ?.getSprite?.() ?? null,

                takeDamage:
                    (amount, originX) =>
                        this.player
                            ?.takeDamage?.(
                                amount,
                                originX
                            ) ?? false
            }];
        }

        return this.playerAsTarget;
    }

    // =========================================================
    // Permanencia en camara
    // =========================================================

    /*
     * Mata al jugador si se sale del encuadre.
     *
     * Se usa die() y no takeDamage() a proposito: takeDamage se ignora
     * mientras el jugador es invulnerable (justo despues de un golpe),
     * y salirse de la pantalla tiene que matar siempre.
     */
    enforceCameraBounds() {
        const sprite =
            this.player?.getSprite?.();

        const body = sprite?.body;

        if (
            !sprite?.active ||
            !body ||
            !body.width
        ) {
            return;
        }

        const screenWidth =
            Math.max(1, this.currentWidth);

        if (
            !isOutOfCamera(
                body.left,
                body.right,
                screenWidth
            )
        ) {
            return;
        }

        console.log(
            "[GameScene] El jugador salió de cámara:",
            {
                left: Math.round(body.left),
                right: Math.round(body.right),
                screenWidth
            }
        );

        this.player.die();
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

        this.hangingPropManager
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

        this.obstacleManager
            ?.resize?.();

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

        this.obstacleManager
            ?.resize?.();
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

        this.obstacleManager
            ?.destroy();

        this.obstacleManager =
            null;

        this.grappleController
            ?.destroy();

        this.grappleController =
            null;

        this.shurikenSystem
            ?.destroy();

        this.shurikenSystem =
            null;

        this.enemyShurikenSystem
            ?.destroy();

        this.enemyShurikenSystem =
            null;

        this.roofEnemyManager
            ?.destroy();

        this.roofEnemyManager =
            null;

        this.hookRegistry =
            null;

        this.hangingPropManager
            ?.destroy();

        this.hangingPropManager =
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