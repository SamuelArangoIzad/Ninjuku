import Phaser from "phaser";

import GameSettings
    from "../config/GameSettings.js";


export default class WaveManager {
    constructor(
        scene,
        configuration = {}
    ) {
        this.scene =
            scene;

        this.enemyManager =
            configuration.enemyManager ??
            null;

        const settings =
            GameSettings.waves ??
            {};

        // =====================================================
        // Configuración general
        // =====================================================

        this.enabled =
            configuration.enabled ??
            settings.enabled ??
            true;

        this.initialDelay =
            this.getNonNegativeNumber(
                configuration.initialDelay ??
                    settings.initialDelay,
                1200
            );

        this.delayBetweenWaves =
            this.getNonNegativeNumber(
                configuration.delayBetweenWaves ??
                    settings.delayBetweenWaves,
                2200
            );

        this.spawnInterval =
            Math.max(
                100,
                this.getNumber(
                    configuration.spawnInterval ??
                        settings.spawnInterval,
                    850
                )
            );

        this.initialEnemyCount =
            Math.max(
                1,
                Math.floor(
                    this.getNumber(
                        configuration.initialEnemyCount ??
                            settings.initialEnemyCount,
                        2
                    )
                )
            );

        this.enemyIncrement =
            Math.max(
                0,
                Math.floor(
                    this.getNumber(
                        configuration.enemyIncrement ??
                            settings.enemyIncrement,
                        1
                    )
                )
            );

        this.maximumEnemiesPerWave =
            Math.max(
                1,
                Math.floor(
                    this.getNumber(
                        configuration.maximumEnemiesPerWave ??
                            settings.maximumEnemiesPerWave,
                        8
                    )
                )
            );

        this.maximumWaves =
            Math.max(
                0,
                Math.floor(
                    this.getNumber(
                        configuration.maximumWaves ??
                            settings.maximumWaves,
                        0
                    )
                )
            );

        this.spawnOutsideDistance =
            Math.max(
                0,
                this.getNumber(
                    configuration.spawnOutsideDistance ??
                        settings.spawnOutsideDistance,
                    35
                )
            );

        this.spawnVariation =
            Math.max(
                0,
                this.getNumber(
                    configuration.spawnVariation ??
                        settings.spawnVariation,
                    25
                )
            );

        // =====================================================
        // Dificultad
        // =====================================================

        this.healthIncreaseEveryWaves =
            Math.max(
                1,
                Math.floor(
                    this.getNumber(
                        configuration.healthIncreaseEveryWaves ??
                            settings.healthIncreaseEveryWaves,
                        3
                    )
                )
            );

        this.healthIncreaseAmount =
            Math.max(
                0,
                Math.floor(
                    this.getNumber(
                        configuration.healthIncreaseAmount ??
                            settings.healthIncreaseAmount,
                        1
                    )
                )
            );

        this.speedIncreasePerWave =
            Math.max(
                0,
                this.getNumber(
                    configuration.speedIncreasePerWave ??
                        settings.speedIncreasePerWave,
                    2
                )
            );

        this.maximumSpeedBonus =
            Math.max(
                0,
                this.getNumber(
                    configuration.maximumSpeedBonus ??
                        settings.maximumSpeedBonus,
                    35
                )
            );

        // =====================================================
        // Configuración Samurai
        // =====================================================

        /*
         * Primera oleada en la que puede aparecer.
         */
        this.samuraiStartsAtWave =
            Math.max(
                1,
                Math.floor(
                    this.getNumber(
                        configuration.samuraiStartsAtWave ??
                            settings.samuraiStartsAtWave,
                        2
                    )
                )
            );

        /*
         * Probabilidad inicial:
         * 0.25 = 25 %
         */
        this.samuraiBaseChance =
            Phaser.Math.Clamp(
                this.getNumber(
                    configuration.samuraiBaseChance ??
                        settings.samuraiBaseChance,
                    0.25
                ),
                0,
                1
            );

        /*
         * Aumento de probabilidad por oleada.
         */
        this.samuraiChanceIncrease =
            Phaser.Math.Clamp(
                this.getNumber(
                    configuration.samuraiChanceIncrease ??
                        settings.samuraiChanceIncrease,
                    0.10
                ),
                0,
                1
            );

        /*
         * Nunca exceder este porcentaje.
         */
        this.maximumSamuraiChance =
            Phaser.Math.Clamp(
                this.getNumber(
                    configuration.maximumSamuraiChance ??
                        settings.maximumSamuraiChance,
                    0.65
                ),
                0,
                1
            );

        // =====================================================
        // Estado
        // =====================================================

        this.currentWave =
            0;

        this.totalEnemiesInCurrentWave =
            0;

        this.pendingSpawns =
            0;

        /*
         * Momento en que empezo la tanda de apariciones. Lo usa el
         * vigilante que desbloquea una generacion colgada.
         */
        this.spawningStartedAt =
            null;

        /*
         * Holgura que se da al vigilante por encima de lo que deberia
         * tardar la tanda, para no desbloquear de mas.
         */
        this.spawnWatchdogMargin =
            Math.max(
                1000,
                this.getNonNegativeNumber(
                    configuration.spawnWatchdogMargin,
                    4000
                )
            );

        /*
         * Avisos para la interfaz: entra una ronda, o se acaban.
         */
        this.onWaveStart =
            configuration.onWaveStart ??
            null;

        this.onAllWavesFinished =
            configuration.onAllWavesFinished ??
            null;

        /*
         * Cantidad de enemigos por ronda, en orden.
         *
         * Se da explicita en vez de con una formula para poder
         * ajustar la curva de dificultad a mano, que es lo que acaba
         * haciendo falta al probar el juego.
         */
        this.enemiesPerWave =
            Array.isArray(configuration.enemiesPerWave)
                ? configuration.enemiesPerWave.slice()
                : null;

        this.isRunning =
            false;

        this.isSpawning =
            false;

        this.waitingForNextWave =
            false;

        this.hasFinished =
            false;

        this.isDestroyed =
            false;

        // =====================================================
        // Temporizadores
        // =====================================================

        this.spawnTimers =
            new Set();

        this.nextWaveTimer =
            null;
    }

    // =========================================================
    // Utilidades
    // =========================================================

    getNumber(
        value,
        fallback
    ) {
        const parsed =
            Number(value);

        return Number.isFinite(
            parsed
        )
            ? parsed
            : fallback;
    }

    getNonNegativeNumber(
        value,
        fallback
    ) {
        return Math.max(
            0,
            this.getNumber(
                value,
                fallback
            )
        );
    }

    // =========================================================
    // Inicio / detención
    // =========================================================

    start() {
        if (
            this.isDestroyed ||
            this.isRunning ||
            !this.enabled ||
            !this.scene ||
            !this.enemyManager
        ) {
            return false;
        }

        this.isRunning =
            true;

        this.hasFinished =
            false;

        this.scheduleNextWave(
            this.initialDelay
        );

        return true;
    }

    stop() {
        if (
            this.isDestroyed ||
            !this.isRunning
        ) {
            return;
        }

        this.isRunning =
            false;

        this.isSpawning =
            false;

        this.waitingForNextWave =
            false;

        this.clearTimers();
    }

    restart() {
        if (this.isDestroyed) {
            return false;
        }

        this.stop();

        this.currentWave =
            0;

        this.totalEnemiesInCurrentWave =
            0;

        this.pendingSpawns =
            0;

        this.hasFinished =
            false;

        return this.start();
    }

    // =========================================================
    // Update
    // =========================================================

    update() {
        if (
            this.isDestroyed ||
            !this.isRunning ||
            this.hasFinished
        ) {
            return;
        }

        this.releaseStuckSpawning();

        if (
            this.isSpawning ||
            this.waitingForNextWave
        ) {
            return;
        }

        const aliveEnemies =
            this.enemyManager
                ?.getAliveEnemyCount?.() ??
            0;

        if (
            this.currentWave > 0 &&
            this.pendingSpawns === 0 &&
            aliveEnemies === 0
        ) {
            if (
                this.hasReachedMaximumWaves()
            ) {
                this.finish();

                return;
            }

            this.scheduleNextWave(
                this.delayBetweenWaves
            );
        }
    }

    /*
     * Red de seguridad contra una generacion colgada.
     *
     * Si isSpawning se queda en true, no vuelve a empezar ninguna
     * oleada y la partida se queda sin enemigos. Aqui se comprueba
     * que no lleve mas tiempo del que puede durar razonablemente una
     * tanda de apariciones, y si lo lleva se desbloquea.
     */
    releaseStuckSpawning() {
        if (!this.isSpawning) {
            this.spawningStartedAt = null;

            return;
        }

        const now =
            this.scene?.time?.now ?? 0;

        if (this.spawningStartedAt === null) {
            this.spawningStartedAt = now;

            return;
        }

        const limit =
            (
                this.totalEnemiesInCurrentWave *
                this.spawnInterval
            ) +
            this.spawnWatchdogMargin;

        if (now - this.spawningStartedAt < limit) {
            return;
        }

        console.warn(
            "[WaveManager] " +
            "La generacion de la oleada " +
            this.currentWave +
            " se quedo colgada. Se desbloquea."
        );

        this.pendingSpawns = 0;
        this.isSpawning = false;
        this.spawningStartedAt = null;
    }

    // =========================================================
    // Gestión de oleadas
    // =========================================================

    scheduleNextWave(delay) {
        if (
            this.isDestroyed ||
            !this.isRunning ||
            this.waitingForNextWave ||
            !this.scene
        ) {
            return;
        }

        this.waitingForNextWave =
            true;

        this.nextWaveTimer =
            this.scene.time.delayedCall(
                delay,
                () => {
                    this.nextWaveTimer =
                        null;

                    this.waitingForNextWave =
                        false;

                    if (
                        this.isDestroyed ||
                        !this.isRunning
                    ) {
                        return;
                    }

                    this.startNextWave();
                }
            );
    }

    startNextWave() {
        if (
            this.isDestroyed ||
            !this.isRunning ||
            this.isSpawning
        ) {
            return;
        }

        this.currentWave +=
            1;

        this.totalEnemiesInCurrentWave =
            this.calculateEnemyCount(
                this.currentWave
            );

        this.pendingSpawns =
            this.totalEnemiesInCurrentWave;

        this.isSpawning =
            true;

        this.spawningStartedAt =
            this.scene?.time?.now ?? 0;

        this.onWaveStart?.(
            this.currentWave,
            this.totalEnemiesInCurrentWave
        );

        for (
            let index = 0;
            index <
                this.totalEnemiesInCurrentWave;
            index += 1
        ) {
            this.scheduleEnemySpawn(
                index
            );
        }

        console.log(
            `[WaveManager] Oleada ${this.currentWave}: ` +
            `${this.totalEnemiesInCurrentWave} enemigos. ` +
            `Probabilidad Samurai: ` +
            `${Math.round(
                this.getSamuraiChance() *
                100
            )}%`
        );
    }

    calculateEnemyCount(
        waveNumber
    ) {
        if (this.enemiesPerWave) {
            const index =
                Phaser.Math.Clamp(
                    Math.floor(waveNumber) - 1,
                    0,
                    this.enemiesPerWave.length - 1
                );

            return Math.max(
                1,
                Math.floor(
                    this.enemiesPerWave[index]
                )
            );
        }

        const calculated =
            this.initialEnemyCount +
            (
                Math.max(
                    0,
                    waveNumber - 1
                ) *
                this.enemyIncrement
            );

        return Phaser.Math.Clamp(
            calculated,
            1,
            this.maximumEnemiesPerWave
        );
    }

    scheduleEnemySpawn(index) {
        if (
            this.isDestroyed ||
            !this.scene
        ) {
            return;
        }

        const delay =
            index *
            this.spawnInterval;

        let timer =
            null;

        timer =
            this.scene.time.delayedCall(
                delay,
                () => {
                    this.spawnTimers.delete(
                        timer
                    );

                    if (
                        this.isDestroyed ||
                        !this.isRunning
                    ) {
                        return;
                    }

                    /*
                     * El spawn va protegido a proposito.
                     *
                     * Si reventaba, las lineas de abajo no llegaban a
                     * ejecutarse: pendingSpawns se quedaba por encima
                     * de cero e isSpawning en true para siempre, y
                     * update() salia por su primera guarda. Resultado:
                     * tras matar a los enemigos de esa oleada no
                     * volvia a aparecer ninguno nunca mas.
                     *
                     * La contabilidad tiene que avanzar pase lo que
                     * pase; que falle un enemigo es un problema de ese
                     * enemigo, no de la partida entera.
                     */
                    try {
                        this.spawnEnemy();
                    } catch (error) {
                        console.error(
                            "[WaveManager] " +
                            "Fallo al generar un enemigo:",
                            error
                        );
                    }

                    this.pendingSpawns =
                        Math.max(
                            0,
                            this.pendingSpawns -
                                1
                        );

                    if (
                        this.pendingSpawns ===
                        0
                    ) {
                        this.isSpawning =
                            false;
                    }
                }
            );

        this.spawnTimers.add(
            timer
        );
    }

    // =========================================================
    // Selección del tipo
    // =========================================================

    getSamuraiChance() {
        if (
            this.currentWave <
            this.samuraiStartsAtWave
        ) {
            return 0;
        }

        const additionalWaves =
            Math.max(
                0,
                this.currentWave -
                    this.samuraiStartsAtWave
            );

        const chance =
            this.samuraiBaseChance +
            (
                additionalWaves *
                this.samuraiChanceIncrease
            );

        return Phaser.Math.Clamp(
            chance,
            0,
            this.maximumSamuraiChance
        );
    }

    getRandomEnemyType() {
        const chance =
            this.getSamuraiChance();

        if (
            chance > 0 &&
            Math.random() <
                chance
        ) {
            return "samurai";
        }

        return "soldier";
    }

    getRandomSpawnSide() {
        return Math.random() <
            0.5
            ? "LEFT"
            : "RIGHT";
    }

    // =========================================================
    // Aparición
    // =========================================================

    spawnEnemy() {
        if (
            this.isDestroyed ||
            !this.scene ||
            !this.enemyManager
        ) {
            return null;
        }

        const camera =
            this.scene
                .cameras
                ?.main;

        if (!camera) {
            return null;
        }

        const visibleLeft =
            camera.scrollX;

        const visibleRight =
            camera.scrollX +
            camera.width;

        const spawnSide =
            this.getRandomSpawnSide();

        const randomOffset =
            Phaser.Math.Between(
                0,
                Math.floor(
                    this.spawnVariation
                )
            );

        let spawnX;

        if (
            spawnSide === "LEFT"
        ) {
            spawnX =
                visibleLeft -
                this.spawnOutsideDistance -
                randomOffset;
        } else {
            spawnX =
                visibleRight +
                this.spawnOutsideDistance +
                randomOffset;
        }

        const spawnY =
            this.enemyManager
                .getGroundSurfaceY() -
            5;

        const enemyType =
            this.getRandomEnemyType();

        const enemy =
            enemyType === "samurai"
                ? this.spawnSamurai(
                    spawnX,
                    spawnY,
                    spawnSide
                )
                : this.spawnSoldier(
                    spawnX,
                    spawnY,
                    spawnSide
                );

        console.log(
            "[WaveManager] Enemigo generado:",
            {
                enemyType,
                wave:
                    this.currentWave,
                spawnSide,
                spawnX,
                spawnY,
                visibleLeft,
                visibleRight,
                cameraWidth:
                    camera.width,
                scaleWidth:
                    this.scene
                        .scale
                        .width
            }
        );

        return enemy;
    }

    spawnSoldier(
        spawnX,
        spawnY,
        spawnSide
    ) {
        const settings =
            GameSettings.soldier ??
            {};

        return this.enemyManager
            .spawnSoldier(
                spawnX,
                spawnY,
                {
                    enemyType:
                        "soldier",

                    spawnSide,

                    maximumHealth:
                        this.getEnemyHealthForCurrentWave(
                            "soldier"
                        ),

                    moveSpeed:
                        this.getEnemySpeedForCurrentWave(
                            "soldier"
                        ),

                    attackDamage:
                        settings.attackDamage ??
                        1,

                    scoreValue:
                        settings.scoreValue ??
                        100,

                    detectionRange:
                        settings.detectionRange ??
                        1200,

                    attackRange:
                        settings.attackRange ??
                        115,

                    attackCooldown:
                        settings.attackCooldown ??
                        1300,

                    attackHitboxWidth:
                        settings.attackHitboxWidth ??
                        125,

                    attackHitboxHeight:
                        settings.attackHitboxHeight ??
                        58,

                    attackHitboxOffset:
                        settings.attackHitboxOffset ??
                        15,

                    decisionInterval:
                        settings.decisionInterval ??
                        120,

                    activeAreaMargin:
                        settings.activeAreaMargin ??
                        350,

                    entryPadding:
                        settings.entryPadding ??
                        55,

                    deathScaleMultiplier:
                        settings.deathScaleMultiplier ??
                        0.82
                }
            );
    }

    spawnSamurai(
        spawnX,
        spawnY,
        spawnSide
    ) {
        const settings =
            GameSettings.samurai ??
            {};

        return this.enemyManager
            .spawnSamurai(
                spawnX,
                spawnY,
                {
                    enemyType:
                        "samurai",

                    spawnSide,

                    /*
                     * Samurai inicialmente más resistente.
                     */
                    maximumHealth:
                        this.getEnemyHealthForCurrentWave(
                            "samurai"
                        ),

                    /*
                     * Algo más lento que Soldier por defecto.
                     */
                    moveSpeed:
                        this.getEnemySpeedForCurrentWave(
                            "samurai"
                        ),

                    /*
                     * Ataque de katana.
                     */
                    attackDamage:
                        settings.attackDamage ??
                        2,

                    /*
                     * Mayor recompensa.
                     */
                    scoreValue:
                        settings.scoreValue ??
                        175,

                    detectionRange:
                        settings.detectionRange ??
                        1200,

                    /*
                     * Combate cuerpo a cuerpo.
                     */
                    attackRange:
                        settings.attackRange ??
                        105,

                    attackCooldown:
                        settings.attackCooldown ??
                        1500,

                    /*
                     * Katana ligeramente más larga.
                     */
                    attackHitboxWidth:
                        settings.attackHitboxWidth ??
                        145,

                    attackHitboxHeight:
                        settings.attackHitboxHeight ??
                        65,

                    attackHitboxOffset:
                        settings.attackHitboxOffset ??
                        20,

                    decisionInterval:
                        settings.decisionInterval ??
                        100,

                    activeAreaMargin:
                        settings.activeAreaMargin ??
                        350,

                    entryPadding:
                        settings.entryPadding ??
                        55,

                    deathScaleMultiplier:
                        settings.deathScaleMultiplier ??
                        0.82
                }
            );
    }

    // =========================================================
    // Dificultad
    // =========================================================

    getEnemySettings(
        enemyType
    ) {
        if (
            enemyType === "samurai"
        ) {
            return (
                GameSettings.samurai ??
                {}
            );
        }

        return (
            GameSettings.soldier ??
            {}
        );
    }

    getEnemyHealthForCurrentWave(
        enemyType = "soldier"
    ) {
        const settings =
            this.getEnemySettings(
                enemyType
            );

        const fallback =
            enemyType === "samurai"
                ? 5
                : 3;

        const baseHealth =
            settings.maximumHealth ??
            fallback;

        const groups =
            Math.floor(
                Math.max(
                    0,
                    this.currentWave -
                        1
                ) /
                this.healthIncreaseEveryWaves
            );

        return (
            baseHealth +
            groups *
                this.healthIncreaseAmount
        );
    }

    getEnemySpeedForCurrentWave(
        enemyType = "soldier"
    ) {
        const settings =
            this.getEnemySettings(
                enemyType
            );

        const fallback =
            enemyType === "samurai"
                ? 105
                : 120;

        const baseSpeed =
            settings.moveSpeed ??
            fallback;

        const bonus =
            Math.min(
                this.maximumSpeedBonus,
                Math.max(
                    0,
                    this.currentWave -
                        1
                ) *
                    this.speedIncreasePerWave
            );

        return (
            baseSpeed +
            bonus
        );
    }

    // =========================================================
    // Finalización
    // =========================================================

    hasReachedMaximumWaves() {
        return (
            this.maximumWaves > 0 &&
            this.currentWave >=
                this.maximumWaves
        );
    }

    finish() {
        if (
            this.isDestroyed ||
            this.hasFinished
        ) {
            return;
        }

        this.hasFinished =
            true;

        this.isRunning =
            false;

        this.isSpawning =
            false;

        this.waitingForNextWave =
            false;

        this.clearTimers();

        this.onAllWavesFinished?.(
            this.currentWave
        );

        console.log(
            `[WaveManager] Finalizaron ` +
            `${this.currentWave} oleadas.`
        );
    }

    // =========================================================
    // Consultas
    // =========================================================

    getCurrentWave() {
        return this.currentWave;
    }

    getPendingSpawns() {
        return this.pendingSpawns;
    }

    getCurrentWaveEnemyCount() {
        return this
            .totalEnemiesInCurrentWave;
    }

    isWaveActive() {
        const aliveEnemies =
            this.enemyManager
                ?.getAliveEnemyCount?.() ??
            0;

        return (
            this.isSpawning ||
            this.pendingSpawns > 0 ||
            aliveEnemies > 0
        );
    }

    isFinished() {
        return this.hasFinished;
    }

    // =========================================================
    // Temporizadores
    // =========================================================

    clearTimers() {
        this.nextWaveTimer
            ?.remove(false);

        this.nextWaveTimer =
            null;

        for (
            const timer
            of this.spawnTimers
        ) {
            timer?.remove(false);
        }

        this.spawnTimers.clear();

        this.pendingSpawns =
            0;
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

        this.isRunning =
            false;

        this.clearTimers();

        this.enemyManager =
            null;

        this.scene =
            null;
    }
}