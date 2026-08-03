import Phaser from "phaser";

import GameSettings
    from "../config/GameSettings.js";


export default class WaveManager {
    constructor(
        scene,
        configuration = {}
    ) {
        this.scene = scene;

        this.enemyManager =
            configuration.enemyManager ??
            null;

        const settings =
            GameSettings.waves ?? {};

        // =====================================================
        // Configuración
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
        // Estado
        // =====================================================

        this.currentWave = 0;

        this.totalEnemiesInCurrentWave =
            0;

        this.pendingSpawns = 0;

        this.isRunning = false;
        this.isSpawning = false;
        this.waitingForNextWave = false;

        this.hasFinished = false;
        this.isDestroyed = false;

        // =====================================================
        // Temporizadores
        // =====================================================

        this.spawnTimers =
            new Set();

        this.nextWaveTimer = null;
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

        return Number.isFinite(parsed)
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
    // Inicio y detención
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

        this.isRunning = true;
        this.hasFinished = false;

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

        this.isRunning = false;
        this.isSpawning = false;
        this.waitingForNextWave = false;

        this.clearTimers();
    }

    restart() {
        if (this.isDestroyed) {
            return false;
        }

        this.stop();

        this.currentWave = 0;
        this.totalEnemiesInCurrentWave = 0;
        this.pendingSpawns = 0;

        this.hasFinished = false;

        return this.start();
    }

    // =========================================================
    // Update
    // =========================================================

    update() {
        if (
            this.isDestroyed ||
            !this.isRunning ||
            this.hasFinished ||
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

        this.currentWave += 1;

        this.totalEnemiesInCurrentWave =
            this.calculateEnemyCount(
                this.currentWave
            );

        this.pendingSpawns =
            this.totalEnemiesInCurrentWave;

        this.isSpawning = true;

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
            `${this.totalEnemiesInCurrentWave} enemigos.`
        );
    }

    calculateEnemyCount(waveNumber) {
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

        let timer = null;

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

                    this.spawnEnemy();

                    this.pendingSpawns =
                        Math.max(
                            0,
                            this.pendingSpawns - 1
                        );

                    if (
                        this.pendingSpawns === 0
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
        this.scene.cameras?.main;

    if (!camera) {
        return null;
    }

    /*
     * Borde derecho real del área visible.
     *
     * No se usa scene.scale.width porque puede no coincidir
     * temporalmente con el viewport de la cámara al iniciar.
     */
    const visibleRight =
        camera.scrollX +
        camera.width;

    const randomOffset =
        Phaser.Math.Between(
            0,
            Math.floor(
                this.spawnVariation
            )
        );

    const spawnX =
        visibleRight +
        this.spawnOutsideDistance +
        randomOffset;

    const spawnY =
        this.enemyManager
            .getGroundSurfaceY() -
        5;

    const settings =
        GameSettings.soldier ?? {};

    const enemy =
        this.enemyManager.spawnSoldier(
            spawnX,
            spawnY,
            {
                maximumHealth:
                    this.getEnemyHealthForCurrentWave(),

                moveSpeed:
                    this.getEnemySpeedForCurrentWave(),

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

    console.log(
        "[WaveManager] Enemigo generado:",
        {
            spawnX,
            spawnY,
            visibleRight,
            cameraWidth:
                camera.width,
            scaleWidth:
                this.scene.scale.width
        }
    );

    return enemy;
}

    // =========================================================
    // Dificultad
    // =========================================================

    getEnemyHealthForCurrentWave() {
        const baseHealth =
            GameSettings
                .soldier
                ?.maximumHealth ??
            3;

        const groups =
            Math.floor(
                Math.max(
                    0,
                    this.currentWave - 1
                ) /
                this.healthIncreaseEveryWaves
            );

        return (
            baseHealth +
            groups *
            this.healthIncreaseAmount
        );
    }

    getEnemySpeedForCurrentWave() {
        const baseSpeed =
            GameSettings
                .soldier
                ?.moveSpeed ??
            120;

        const bonus =
            Math.min(
                this.maximumSpeedBonus,
                Math.max(
                    0,
                    this.currentWave - 1
                ) *
                this.speedIncreasePerWave
            );

        return baseSpeed + bonus;
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

        this.hasFinished = true;

        this.isRunning = false;
        this.isSpawning = false;
        this.waitingForNextWave = false;

        this.clearTimers();

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
        return this.totalEnemiesInCurrentWave;
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

        this.nextWaveTimer = null;

        for (
            const timer
            of this.spawnTimers
        ) {
            timer?.remove(false);
        }

        this.spawnTimers.clear();

        this.pendingSpawns = 0;
    }

    // =========================================================
    // Destrucción
    // =========================================================

    destroy() {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed = true;
        this.isRunning = false;

        this.clearTimers();

        this.enemyManager = null;
        this.scene = null;
    }
}