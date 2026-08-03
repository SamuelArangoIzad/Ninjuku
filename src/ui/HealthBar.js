import Phaser from "phaser";


export default class HealthBar {
    constructor(
        scene,
        configuration = {}
    ) {
        this.scene =
            scene ?? null;

        this.width =
            Math.max(
                1,
                Number(
                    configuration.width
                ) || 120
            );

        this.height =
            Math.max(
                1,
                Number(
                    configuration.height
                ) || 12
            );

        this.borderSize =
            Phaser.Math.Clamp(
                Number(
                    configuration.borderSize
                ) || 2,
                0,
                Math.min(
                    this.width,
                    this.height
                ) / 2
            );

        this.depth =
            Number(
                configuration.depth
            ) || 2000;

        this.fixedToCamera =
            Boolean(
                configuration.fixedToCamera
            );

        this.visible =
            configuration.visible ??
            true;

        this.percentage = -1;

        this.lastX = null;
        this.lastY = null;

        this.isDestroyed =
            false;

        this.container =
            scene.add.container(
                Number(
                    configuration.x
                ) || 0,
                Number(
                    configuration.y
                ) || 0
            );

        this.container.setDepth(
            this.depth
        );

        if (this.fixedToCamera) {
            this.container.setScrollFactor(
                0
            );
        }

        this.background = null;
        this.fill = null;

        this.createGraphics();

        this.setPercentage(
            configuration.percentage ??
            1
        );

        this.setVisible(
            this.visible,
            true
        );
    }

    // =========================================================
    // Creación
    // =========================================================

    createGraphics() {
        if (
            this.isDestroyed ||
            !this.scene ||
            !this.container
        ) {
            return;
        }

        this.background =
            this.scene.add.rectangle(
                0,
                0,
                this.width,
                this.height,
                0x111111,
                0.85
            );

        this.background
            .setOrigin(
                0,
                0.5
            )
            .setStrokeStyle(
                this.borderSize,
                0xffffff,
                0.9
            );

        this.fill =
            this.scene.add.rectangle(
                this.borderSize,
                0,
                this.getMaximumFillWidth(),
                this.getFillHeight(),
                0xffffff,
                1
            );

        this.fill.setOrigin(
            0,
            0.5
        );

        this.container.add([
            this.background,
            this.fill
        ]);
    }

    // =========================================================
    // Dimensiones
    // =========================================================

    getMaximumFillWidth() {
        return Math.max(
            0,
            this.width -
            this.borderSize * 2
        );
    }

    getFillHeight() {
        return Math.max(
            0,
            this.height -
            this.borderSize * 2
        );
    }

    // =========================================================
    // Porcentaje
    // =========================================================

    setPercentage(value) {
        if (
            this.isDestroyed ||
            !this.fill
        ) {
            return this;
        }

        const nextPercentage =
            Phaser.Math.Clamp(
                Number(value) || 0,
                0,
                1
            );

        /*
         * Evita escribir displayWidth en cada frame cuando
         * la vida no ha cambiado.
         */
        if (
            Math.abs(
                nextPercentage -
                this.percentage
            ) < 0.0001
        ) {
            return this;
        }

        this.percentage =
            nextPercentage;

        this.fill.displayWidth =
            this.getMaximumFillWidth() *
            this.percentage;

        return this;
    }

    getPercentage() {
        return this.percentage;
    }

    // =========================================================
    // Posición
    // =========================================================

    setPosition(x, y) {
        if (
            this.isDestroyed ||
            !this.container
        ) {
            return this;
        }

        const nextX =
            Math.round(
                Number(x) || 0
            );

        const nextY =
            Math.round(
                Number(y) || 0
            );

        /*
         * Las barras enemigas suelen conservar la misma posición
         * durante varios frames cuando la entidad está quieta.
         */
        if (
            this.lastX === nextX &&
            this.lastY === nextY
        ) {
            return this;
        }

        this.lastX =
            nextX;

        this.lastY =
            nextY;

        this.container.setPosition(
            nextX,
            nextY
        );

        return this;
    }

    getPosition() {
        return {
            x:
                this.lastX ??
                this.container?.x ??
                0,

            y:
                this.lastY ??
                this.container?.y ??
                0
        };
    }

    // =========================================================
    // Visibilidad
    // =========================================================

    setVisible(
        visible,
        force = false
    ) {
        if (
            this.isDestroyed ||
            !this.container
        ) {
            return this;
        }

        const nextVisible =
            Boolean(visible);

        if (
            !force &&
            this.visible ===
                nextVisible
        ) {
            return this;
        }

        this.visible =
            nextVisible;

        this.container.setVisible(
            nextVisible
        );

        return this;
    }

    isVisible() {
        return this.visible;
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
         * true destruye también background y fill porque
         * pertenecen al container.
         */
        this.container
            ?.destroy(
                true
            );

        this.container =
            null;

        this.background =
            null;

        this.fill =
            null;

        this.scene =
            null;

        this.lastX =
            null;

        this.lastY =
            null;
    }
}