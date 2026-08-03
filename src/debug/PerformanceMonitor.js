export default class PerformanceMonitor {
    constructor(
        scene,
        configuration = {}
    ) {
        this.scene = scene;

        this.enemyManager =
            configuration.enemyManager ??
            null;

        this.visible =
            configuration.visible ??
            true;

        this.updateInterval =
            Math.max(
                100,
                Number(
                    configuration.updateInterval
                ) || 500
            );

        this.nextUpdateTime = 0;

        this.textObject = null;
        this.isDestroyed = false;

        this.createText();
    }

    // =========================================================
    // Creación
    // =========================================================

    createText() {
        if (
            this.isDestroyed ||
            !this.scene
        ) {
            return;
        }

        this.textObject =
            this.scene.add.text(
                12,
                70,
                "",
                {
                    fontFamily:
                        "monospace",

                    fontSize:
                        "14px",

                    color:
                        "#ffffff",

                    stroke:
                        "#000000",

                    strokeThickness:
                        3,

                    backgroundColor:
                        "rgba(0, 0, 0, 0.45)",

                    padding: {
                        x: 8,
                        y: 6
                    }
                }
            );

        this.textObject
            .setDepth(10000)
            .setScrollFactor(0)
            .setVisible(
                this.visible
            );
    }

    // =========================================================
    // Update
    // =========================================================

    update(time, delta) {
        if (
            this.isDestroyed ||
            !this.visible ||
            !this.textObject
        ) {
            return;
        }

        const currentTime =
            Number.isFinite(time)
                ? time
                : this.scene?.time?.now ?? 0;

        /*
         * No actualiza el texto en cada frame.
         * Solo recalcula métricas cada cierto intervalo.
         */
        if (
            currentTime <
            this.nextUpdateTime
        ) {
            return;
        }

        this.nextUpdateTime =
            currentTime +
            this.updateInterval;

        this.refresh(
            delta
        );
    }

    refresh(delta) {
        const fps =
            this.getFPS();

        const frameTime =
            this.getFrameTime(
                delta
            );

        const totalEnemies =
            this.enemyManager
                ?.getEnemyCount?.() ??
            0;

        const aliveEnemies =
            this.enemyManager
                ?.getAliveEnemyCount?.() ??
            0;

        const activeEnemies =
            this.enemyManager
                ?.getVisibleEnemies?.()
                ?.length ??
            0;

        const physicsBodies =
            this.getPhysicsBodyCount();

        const memory =
            this.getMemoryUsage();

        const lines = [
            `FPS: ${fps}`,
            `Frame: ${frameTime} ms`,
            `Enemies: ${totalEnemies}`,
            `Alive: ${aliveEnemies}`,
            `Active AI: ${activeEnemies}`,
            `Bodies: ${physicsBodies}`
        ];

        if (memory !== null) {
            lines.push(
                `Memory: ${memory} MB`
            );
        }

        this.textObject.setText(
            lines
        );
    }

    // =========================================================
    // Métricas
    // =========================================================

    getFPS() {
        const fps =
            this.scene
                ?.game
                ?.loop
                ?.actualFps;

        if (!Number.isFinite(fps)) {
            return 0;
        }

        return Math.round(
            fps
        );
    }

    getFrameTime(delta) {
        const value =
            Number(delta);

        if (!Number.isFinite(value)) {
            return "0.00";
        }

        return value.toFixed(2);
    }

    getPhysicsBodyCount() {
        const bodies =
            this.scene
                ?.physics
                ?.world
                ?.bodies
                ?.entries;

        if (Array.isArray(bodies)) {
            return bodies.length;
        }

        return 0;
    }

    getMemoryUsage() {
        /*
         * performance.memory solo existe en algunos
         * navegadores basados en Chromium.
         */
        const usedMemory =
            globalThis
                ?.performance
                ?.memory
                ?.usedJSHeapSize;

        if (!Number.isFinite(usedMemory)) {
            return null;
        }

        return (
            usedMemory /
            1024 /
            1024
        ).toFixed(1);
    }

    // =========================================================
    // Visibilidad
    // =========================================================

    setVisible(visible) {
        this.visible =
            Boolean(visible);

        this.textObject
            ?.setVisible(
                this.visible
            );
    }

    toggle() {
        this.setVisible(
            !this.visible
        );
    }

    // =========================================================
    // Dependencias
    // =========================================================

    setEnemyManager(
        enemyManager
    ) {
        this.enemyManager =
            enemyManager ??
            null;
    }

    // =========================================================
    // Responsive
    // =========================================================

    handleResize() {
        if (!this.textObject) {
            return;
        }

        this.textObject.setPosition(
            12,
            70
        );
    }

    // =========================================================
    // Destrucción
    // =========================================================

    destroy() {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed = true;

        this.textObject?.destroy();
        this.textObject = null;

        this.enemyManager = null;
        this.scene = null;
    }
}