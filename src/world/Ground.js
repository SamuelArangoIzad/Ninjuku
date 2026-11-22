import Phaser from "phaser";
import { getWalkwayLayout } from "./woodenWalkwayLayout.js";


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
        this.walkway = null;
        this.scrollDistance = 0;
        this.lastBoardOffset = -1;

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
        this.walkway = this.scene.add.graphics().setDepth(5.5).setScrollFactor(0);
        this.drawWalkway();
    }

    // =========================================================
    // Pasarela decorativa: sigue la superficie física sin modificarla
    // =========================================================

    drawWalkway() {
        if (!this.walkway || !this.scene) return;
        const { width, height, surfaceY, boardHeight, boardLength } = getWalkwayLayout(
            this.scene.scale.width, this.scene.scale.height, this.height, this.bottomMargin
        );
        const g = this.walkway;
        const offset = Math.floor(this.scrollDistance) % boardLength;
        g.clear();
        // Silueta oscura de la tarima contra el agua.
        g.fillStyle(0x20191c, 1).fillRect(0, surfaceY - 3, width, boardHeight + 3);
        g.fillStyle(0x6b412f, 1).fillRect(0, surfaceY + 1, width, boardHeight - 1);
        g.fillStyle(0x9f704b, 1).fillRect(0, surfaceY + 1, width, 3);
        g.fillStyle(0x37272a, 1).fillRect(0, surfaceY + 5, width, 2);
        g.fillStyle(0x583526, 1).fillRect(0, surfaceY + boardHeight - 6, width, 5);
        // Tablones repetibles con vetas y uniones alternas.
        let boardIndex = 0;
        for (let x = -boardLength - offset; x < width + boardLength; x += boardLength) {
            const alt = boardIndex++ % 2 === 0;
            g.fillStyle(0x221a1d, 0.95).fillRect(x, surfaceY + 7, 3, Math.max(0, boardHeight - 8));
            g.fillStyle(alt ? 0x87553b : 0x775039, 1).fillRect(x + 5, surfaceY + 9, boardLength - 12, 2);
            g.fillStyle(0x3b2928, 1).fillRect(x + 12, surfaceY + 16, boardLength - 27, 1);
            g.fillStyle(0xb9925e, 0.9).fillRect(x + 8, surfaceY + 9, 2, 2);
            g.fillStyle(0xb9925e, 0.9).fillRect(x + boardLength - 11, surfaceY + 9, 2, 2);
        }
        // Reafirma la cara frontal del puente; no tapa al jugador (depth 10).
        g.fillStyle(0x241a1d, 1).fillRect(0, height - this.bottomMargin - 3, width, 3);
        this.lastBoardOffset = offset;
    }

    update(delta) {
        if (this.isDestroyed || !this.walkway) return;
        this.scrollDistance += Math.min(80, Math.max(0, Number(delta) || 0)) * 0.035;
        const offset = Math.floor(this.scrollDistance) % 66;
        if (offset !== this.lastBoardOffset) this.drawWalkway();
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
        this.drawWalkway();
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
        this.walkway?.destroy();
        this.walkway = null;
        this.walkway = null;
        this.scrollDistance = 0;
        this.lastBoardOffset = -1;

        this.scene = null;
    }
}