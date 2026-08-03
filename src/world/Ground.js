import Phaser from "phaser";


export default class Ground {
    constructor(
        scene,
        configuration = {}
    ) {
        this.scene = scene;

        /*
         * Altura física del suelo.
         */
        this.height =
            Math.max(
                1,
                Number(
                    configuration.height
                ) || 24
            );

        /*
         * Separación respecto al borde inferior.
         */
        this.bottomMargin =
            Math.max(
                0,
                Number(
                    configuration.bottomMargin
                ) || 0
            );

        /*
         * Extensión física fuera de la pantalla.
         *
         * Evita que los enemigos que entran desde la derecha
         * choquen contra el costado vertical de la plataforma.
         */
        this.horizontalExtension =
            Math.max(
                200,
                Number(
                    configuration.horizontalExtension
                ) || 600
            );

        this.platform = null;

        this.isDestroyed = false;

        this.create();
    }

    // =========================================================
    // Creación
    // =========================================================

    create() {
        if (
            this.isDestroyed ||
            !this.scene
        ) {
            return;
        }

        const screenWidth =
            Math.max(
                1,
                this.scene.scale.width
            );

        const screenHeight =
            Math.max(
                1,
                this.scene.scale.height
            );

        const groundY =
            screenHeight -
            this.bottomMargin;

        /*
         * El suelo comienza antes del borde izquierdo y termina
         * después del borde derecho.
         */
        const platformX =
            -this.horizontalExtension;

        const platformWidth =
            screenWidth +
            (
                this.horizontalExtension *
                2
            );

        this.platform =
            this.scene.add.rectangle(
                platformX,
                groundY,
                platformWidth,
                this.height,
                0x000000,
                0
            );

        /*
         * Origin X = 0:
         * platformX representa el borde izquierdo.
         *
         * Origin Y = 1:
         * groundY representa la base inferior del terreno.
         */
        this.platform.setOrigin(
            0,
            1
        );

        this.platform.setDepth(
            5
        );

        this.scene.physics.add.existing(
            this.platform,
            true
        );

        this.refreshPhysicsBody();
    }

    // =========================================================
    // Física
    // =========================================================

    refreshPhysicsBody() {
        if (!this.platform?.body) {
            return;
        }

        this.platform.body
            .updateFromGameObject();
    }

    // =========================================================
    // Resize
    // =========================================================

    resize() {
        if (
            this.isDestroyed ||
            !this.platform ||
            !this.scene
        ) {
            return;
        }

        const screenWidth =
            Math.max(
                1,
                this.scene.scale.width
            );

        const screenHeight =
            Math.max(
                1,
                this.scene.scale.height
            );

        const groundY =
            screenHeight -
            this.bottomMargin;

        const platformX =
            -this.horizontalExtension;

        const platformWidth =
            screenWidth +
            (
                this.horizontalExtension *
                2
            );

        this.platform.setPosition(
            platformX,
            groundY
        );

        this.platform.setSize(
            platformWidth,
            this.height
        );

        this.platform.setDisplaySize(
            platformWidth,
            this.height
        );

        this.refreshPhysicsBody();
    }

    // =========================================================
    // Consultas
    // =========================================================

    getSurfaceY() {
        if (!this.platform) {
            return (
                this.scene?.scale?.height ??
                0
            );
        }

        /*
         * Como originY es 1, la superficie superior está
         * una altura completa por encima de platform.y.
         */
        return (
            this.platform.y -
            this.height
        );
    }

    getTop() {
        return this.getSurfaceY();
    }

    getHeight() {
        return this.height;
    }

    getHorizontalExtension() {
        return this.horizontalExtension;
    }

    // =========================================================
    // Destrucción
    // =========================================================

    destroy() {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed = true;

        this.platform?.destroy();
        this.platform = null;

        this.scene = null;
    }
}