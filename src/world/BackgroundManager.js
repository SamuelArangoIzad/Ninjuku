export default class BackgroundManager {
    constructor(
        scene,
        configuration = {}
    ) {
        this.scene = scene;

        this.textureKey =
            configuration.textureKey ??
            "background";

        this.speed =
            configuration.speed ??
            35;

        this.depth =
            configuration.depth ??
            -100;

        this.backgrounds = [];

        this.backgroundWidth = 0;
        this.backgroundScale = 1;

        this.isDestroyed = false;
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

        this.destroyImages();

        const texture =
            this.scene.textures.get(
                this.textureKey
            );

        if (
            !texture ||
            texture.key ===
                "__MISSING"
        ) {
            console.error(
                `[BackgroundManager] ` +
                `No existe la textura: ` +
                `${this.textureKey}`
            );

            return;
        }

        const source =
            texture.getSourceImage();

        if (
            !source ||
            !source.width ||
            !source.height
        ) {
            console.error(
                "[BackgroundManager] " +
                "La textura no tiene dimensiones válidas."
            );

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

        /*
         * Comportamiento tipo cover:
         * el fondo cubre toda la pantalla sin pilares.
         */
        this.backgroundScale =
            Math.max(
                screenWidth /
                    source.width,

                screenHeight /
                    source.height
            );

        this.backgroundWidth =
            source.width *
            this.backgroundScale;

        const centerY =
            screenHeight / 2;

        const first =
            this.createImage(
                0,
                centerY
            );

        const second =
            this.createImage(
                this.backgroundWidth,
                centerY
            );

        this.backgrounds = [
            first,
            second
        ];
    }

    createImage(x, y) {
        return this.scene.add
            .image(
                x,
                y,
                this.textureKey
            )
            .setOrigin(
                0,
                0.5
            )
            .setScale(
                this.backgroundScale
            )
            .setDepth(
                this.depth
            )
            .setScrollFactor(0);
    }

    // =========================================================
    // Update
    // =========================================================

    update(delta) {
        if (
            this.isDestroyed ||
            this.backgrounds.length !== 2
        ) {
            return;
        }

        const safeDelta =
            Number.isFinite(delta)
                ? delta
                : 0;

        /*
         * Se limita el delta para evitar saltos enormes cuando
         * la pestaña vuelve después de estar suspendida.
         */
        const clampedDelta =
            Math.min(
                safeDelta,
                100
            );

        const movement =
            this.speed *
            (
                clampedDelta /
                1000
            );

        const [
            first,
            second
        ] = this.backgrounds;

        first.x -= movement;
        second.x -= movement;

        this.repositionIfOutside(
            first,
            second
        );

        this.repositionIfOutside(
            second,
            first
        );
    }

    repositionIfOutside(
        background,
        otherBackground
    ) {
        if (
            background.x +
                this.backgroundWidth >
            0
        ) {
            return;
        }

        background.x =
            otherBackground.x +
            this.backgroundWidth;
    }

    // =========================================================
    // Resize
    // =========================================================

    resize() {
        if (
            this.isDestroyed ||
            !this.scene
        ) {
            return;
        }

        /*
         * El resize no necesita lógica duplicada.
         * Se vuelven a calcular escala y posiciones.
         */
        this.create();
    }

    // =========================================================
    // Configuración
    // =========================================================

    setSpeed(speed) {
        const validSpeed =
            Number(speed);

        if (
            !Number.isFinite(
                validSpeed
            )
        ) {
            return;
        }

        this.speed =
            Math.max(
                0,
                validSpeed
            );
    }

    getSpeed() {
        return this.speed;
    }

    // =========================================================
    // Destrucción
    // =========================================================

    destroyImages() {
        for (
            const background
            of this.backgrounds
        ) {
            background?.destroy();
        }

        this.backgrounds = [];
    }

    destroy() {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed = true;

        this.destroyImages();

        this.backgroundWidth = 0;
        this.backgroundScale = 1;

        this.scene = null;
    }
}