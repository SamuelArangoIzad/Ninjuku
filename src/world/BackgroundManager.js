export default class BackgroundManager {
    constructor(
        scene,
        configuration = {}
    ) {
        this.scene =
            scene ?? null;

        // =====================================================
        // Texturas
        // =====================================================

        /*
         * Ahora se recibe una secuencia de fondos.
         *
         * Ejemplo:
         *
         * background-0
         * background-1
         * background-2
         * ...
         */
        this.textureKeys =
            Array.isArray(
                configuration.textureKeys
            ) &&
            configuration.textureKeys.length > 0
                ? configuration.textureKeys
                : [
                    configuration.textureKey ??
                    "background"
                ];

        /*
         * Índice de la siguiente textura que debe entrar.
         */
        this.nextTextureIndex =
            0;

        // =====================================================
        // Configuración visual
        // =====================================================

        this.speed =
            Number.isFinite(
                Number(configuration.speed)
            )
                ? Math.max(
                    0,
                    Number(configuration.speed)
                )
                : 35;

        this.depth =
            Number.isFinite(
                Number(configuration.depth)
            )
                ? Number(configuration.depth)
                : -100;

        // =====================================================
        // Fondos activos
        // =====================================================

        /*
         * Se mantienen dos fondos:
         *
         * [ fondo actual ][ siguiente fondo ]
         *
         * Cuando el primero sale por la izquierda,
         * se reutiliza y recibe la siguiente textura.
         */
        this.backgrounds =
            [];

        this.isDestroyed =
            false;
    }

    // =========================================================
    // Creación
    // =========================================================

    create() {
        if (
            this.isDestroyed ||
            !this.scene
        ) {
            return false;
        }

        this.destroyImages();

        if (
            !this.validateTextures()
        ) {
            return false;
        }

        const screenHeight =
            Math.max(
                1,
                this.scene.scale.height
            );

        const centerY =
            screenHeight / 2;

        /*
         * Reiniciamos la secuencia.
         */
        this.nextTextureIndex =
            0;

        /*
         * Primer fondo.
         */
        const firstTexture =
            this.getNextTextureKey();

        const first =
            this.createImage(
                0,
                centerY,
                firstTexture
            );

        /*
         * Segundo fondo inmediatamente después
         * del primero.
         */
        const secondTexture =
            this.getNextTextureKey();

        const second =
            this.createImage(
                first.displayWidth,
                centerY,
                secondTexture
            );

        if (
            !first ||
            !second
        ) {
            this.destroyImages();

            return false;
        }

        this.backgrounds = [
            first,
            second
        ];

        return true;
    }

    // =========================================================
    // Validación de texturas
    // =========================================================

    validateTextures() {
        if (
            !this.scene?.textures ||
            this.textureKeys.length === 0
        ) {
            return false;
        }

        for (
            const textureKey
            of this.textureKeys
        ) {
            const texture =
                this.scene.textures.get(
                    textureKey
                );

            if (
                !texture ||
                texture.key ===
                    "__MISSING"
            ) {
                console.error(
                    `[BackgroundManager] ` +
                    `No existe la textura: ` +
                    `${textureKey}`
                );

                return false;
            }
        }

        return true;
    }

    // =========================================================
    // Secuencia de texturas
    // =========================================================

    getNextTextureKey() {
        if (
            this.textureKeys.length === 0
        ) {
            return null;
        }

        const textureKey =
            this.textureKeys[
                this.nextTextureIndex
            ];

        this.nextTextureIndex =
            (
                this.nextTextureIndex +
                1
            ) %
            this.textureKeys.length;

        return textureKey;
    }

    // =========================================================
    // Creación de imagen
    // =========================================================

    createImage(
        x,
        y,
        textureKey
    ) {
        if (
            !textureKey ||
            !this.scene
        ) {
            return null;
        }

        const image =
            this.scene.add.image(
                x,
                y,
                textureKey
            );

        image
            .setOrigin(
                0,
                0.5
            )
            .setDepth(
                this.depth
            )
            .setScrollFactor(
                0
            );

        this.scaleBackground(
            image
        );

        return image;
    }

    // =========================================================
    // Escala responsive
    // =========================================================

    scaleBackground(image) {
        if (
            !image ||
            !this.scene
        ) {
            return false;
        }

        const texture =
            this.scene.textures.get(
                image.texture.key
            );

        if (
            !texture ||
            texture.key ===
                "__MISSING"
        ) {
            return false;
        }

        const source =
            texture.getSourceImage();

        if (
            !source?.width ||
            !source?.height
        ) {
            return false;
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
         * Cover:
         * cada imagen cubre toda la altura o anchura
         * necesaria sin dejar espacios.
         */
        const scale =
            Math.max(
                screenWidth /
                    source.width,

                screenHeight /
                    source.height
            );

        image.setScale(
            scale
        );

        return true;
    }

    // =========================================================
    // Cambio de textura
    // =========================================================

    assignNextTexture(background) {
        if (
            !background ||
            this.isDestroyed
        ) {
            return false;
        }

        const textureKey =
            this.getNextTextureKey();

        if (!textureKey) {
            return false;
        }

        background.setTexture(
            textureKey
        );

        this.scaleBackground(
            background
        );

        return true;
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
         * Evita saltos enormes cuando el navegador
         * estuvo suspendido.
         */
        const clampedDelta =
            Math.min(
                Math.max(
                    0,
                    safeDelta
                ),
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
        ] =
            this.backgrounds;

        first.x -=
            movement;

        second.x -=
            movement;

        /*
         * Si alguno salió completamente de la pantalla,
         * pasa al final y recibe el siguiente fondo
         * de la secuencia.
         */
        this.repositionIfOutside(
            first,
            second
        );

        this.repositionIfOutside(
            second,
            first
        );
    }

    // =========================================================
    // Reposicionamiento
    // =========================================================

    repositionIfOutside(
        background,
        otherBackground
    ) {
        if (
            !background ||
            !otherBackground
        ) {
            return false;
        }

        /*
         * Mientras todavía tenga una parte visible,
         * no hacemos nada.
         */
        if (
            background.x +
            background.displayWidth >
            0
        ) {
            return false;
        }

        /*
         * Se reutiliza la imagen que salió.
         *
         * Primero cambiamos su textura por la siguiente:
         *
         * fondo
         * → fondo1
         * → fondo2
         * → ...
         *
         * Después la colocamos justo después
         * del fondo que sigue visible.
         */
        this.assignNextTexture(
            background
        );

        background.x =
            otherBackground.x +
            otherBackground.displayWidth;

        return true;
    }

    // =========================================================
    // Resize
    // =========================================================

    resize() {
        if (
            this.isDestroyed ||
            !this.scene
        ) {
            return false;
        }

        /*
         * Conservamos la secuencia desde el inicio
         * para evitar posiciones incorrectas cuando
         * cambian las dimensiones.
         */
        return this.create();
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
            return false;
        }

        this.speed =
            Math.max(
                0,
                validSpeed
            );

        return true;
    }

    getSpeed() {
        return this.speed;
    }

    setTextureKeys(textureKeys) {
        if (
            this.isDestroyed ||
            !Array.isArray(
                textureKeys
            ) ||
            textureKeys.length === 0
        ) {
            return false;
        }

        this.textureKeys =
            [
                ...textureKeys
            ];

        this.nextTextureIndex =
            0;

        return true;
    }

    getTextureKeys() {
        return [
            ...this.textureKeys
        ];
    }

    // =========================================================
    // Destrucción de imágenes
    // =========================================================

    destroyImages() {
        for (
            const background
            of this.backgrounds
        ) {
            background?.destroy();
        }

        this.backgrounds =
            [];
    }

    // =========================================================
    // Destrucción definitiva
    // =========================================================

    destroy() {
        if (
            this.isDestroyed
        ) {
            return;
        }

        this.isDestroyed =
            true;

        this.destroyImages();

        this.textureKeys =
            [];

        this.nextTextureIndex =
            0;

        this.scene =
            null;
    }
}