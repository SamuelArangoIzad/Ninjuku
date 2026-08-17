/*
 * Desplaza una secuencia de fondos en bucle infinito.
 *
 * Cada fondo ocupa un "panel". Los paneles avanzan hacia la izquierda
 * y, cuando uno sale de pantalla, se recicla al final de la cinta con
 * la siguiente textura de la secuencia: fondo 1, fondo 2, fondo 1...
 *
 * El problema de encadenar imágenes distintas es que en la unión
 * aparece una línea vertical que corta árboles y tejados. Para
 * evitarla, cada panel solapa al anterior en una franja y entra con
 * un degradado de opacidad de 0 a 1 a lo largo de esa franja, de modo
 * que un fondo se disuelve dentro del siguiente en vez de cortarse.
 *
 * La forma de ese degradado importa mucho. Con una rampa lineal, los
 * dos fondos se quedan mucho rato al 50% y se ven los dos árboles y
 * las dos filas de casas superpuestos: las "sombras extrañas". La
 * curva que se usa aquí (smoothstep aplicado cuatro veces) pasa casi
 * todo el recorrido pegada a 0 o a 1 y cruza el 50% en muy poco
 * espacio, así que la zona de doble imagen es cinco veces más
 * estrecha que con una rampa lineal y aun así no aparece ninguna
 * línea: el salto medido en el punto de cruce queda por debajo del
 * ruido normal de la propia ilustración.
 *
 * El degradado se consigue con la opacidad por vértice de Phaser
 * (setAlpha con cuatro esquinas), que interpola en línea recta. Para
 * dibujar una curva, la franja se trocea en varios tramos y cada uno
 * cubre un segmento recto de la curva. No hace falta modificar ni
 * duplicar ninguna textura: los PNG se usan tal cual, a 1600x900.
 */

/*
 * Número de tramos en que se trocea la franja de mezcla. Con 16 el
 * error frente a la curva real es de 4 niveles sobre 255, invisible.
 */
const FADE_SEGMENTS = 16;
export default class BackgroundManager {
    constructor(
        scene,
        configuration = {}
    ) {
        this.scene = scene;

        /*
         * Secuencia de texturas. Se admite textureKey suelto para no
         * romper llamadas antiguas de un solo fondo.
         */
        this.textureKeys =
            BackgroundManager
                .normalizeTextureKeys(
                    configuration
                );

        this.speed =
            configuration.speed ??
            35;

        this.depth =
            configuration.depth ??
            -100;

        /*
         * Fracción del ancho de un fondo que dura la disolución
         * hacia el siguiente. Cuanto mayor, más gradual entra y sale
         * la mezcla; la curva se encarga de que la zona de doble
         * imagen siga siendo estrecha.
         */
        this.blendRatio =
            BackgroundManager
                .clamp(
                    configuration.blendRatio ??
                    0.48,

                    0.05,
                    0.49
                );

        this.panels = [];

        this.backgroundScale = 1;

        /*
         * Ancho en pantalla de un fondo completo.
         */
        this.tileWidth = 0;

        /*
         * Ancho en pantalla de la franja de disolución.
         */
        this.blendWidth = 0;

        /*
         * Separación entre paneles consecutivos. Es menor que
         * tileWidth justo en blendWidth, que es lo que se solapan.
         */
        this.stepWidth = 0;

        /*
         * Desplazamiento acumulado dentro del paso actual.
         */
        this.scrollOffset = 0;

        /*
         * Índice de la textura que le toca al próximo panel reciclado.
         */
        this.sequenceIndex = 0;

        this.isDestroyed = false;
    }

    static normalizeTextureKeys(
        configuration
    ) {
        const keys =
            Array.isArray(
                configuration.textureKeys
            )
                ? configuration.textureKeys
                : [
                    configuration.textureKey ??
                    "background"
                ];

        const validKeys =
            keys.filter(
                (key) =>
                    typeof key === "string" &&
                    key.length > 0
            );

        return validKeys.length > 0
            ? validKeys
            : ["background"];
    }

    /*
     * Curva de la disolución.
     *
     * smoothstep arranca y termina con pendiente cero. Al encadenarlo
     * cuatro veces, la opacidad se queda pegada a 0 durante la primera
     * mitad de la franja, cruza el 50% de golpe y se pega a 1 en la
     * segunda mitad. Eso es lo que hace que el cambio se vea limpio en
     * vez de dejar medio fondo transparente sobre el otro.
     */
    static fadeCurve(t) {
        let value =
            BackgroundManager.clamp(
                t,
                0,
                1
            );

        for (
            let pass = 0;
            pass < 4;
            pass += 1
        ) {
            value =
                value *
                value *
                (
                    3 -
                    (2 * value)
                );
        }

        return value;
    }

    static clamp(
        value,
        minimum,
        maximum
    ) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return minimum;
        }

        return Math.min(
            maximum,
            Math.max(
                minimum,
                number
            )
        );
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

        this.destroyPanels();

        const availableKeys =
            this.textureKeys.filter(
                (key) =>
                    this.getTextureSize(key) !==
                    null
            );

        if (availableKeys.length === 0) {
            console.error(
                "[BackgroundManager] " +
                "Ninguna de las texturas indicadas existe: " +
                this.textureKeys.join(", ")
            );

            return;
        }

        if (
            availableKeys.length <
            this.textureKeys.length
        ) {
            console.warn(
                "[BackgroundManager] " +
                "Se omiten texturas inexistentes. " +
                "Se usarán: " +
                availableKeys.join(", ")
            );
        }

        this.textureKeys = availableKeys;

        const reference =
            this.getTextureSize(
                this.textureKeys[0]
            );

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
         *
         * Se calcula sobre el tamaño original del PNG (1600x900),
         * que es lo que fija el encuadre: la altura a la que queda
         * el balcón por el que camina el ninja depende de esto.
         */
        this.backgroundScale =
            Math.max(
                screenWidth /
                    reference.width,

                screenHeight /
                    reference.height
            );

        /*
         * Se redondea hacia abajo a propósito: así los paneles se
         * solapan una fracción de píxel en vez de dejar hueco. Un
         * solape sub-píxel es invisible; un hueco se ve como una
         * línea vertical.
         */
        this.tileWidth =
            Math.max(
                1,
                Math.floor(
                    reference.width *
                    this.backgroundScale
                )
            );

        this.blendWidth =
            Math.max(
                1,
                Math.floor(
                    this.tileWidth *
                    this.blendRatio
                )
            );

        this.stepWidth =
            Math.max(
                1,
                this.tileWidth -
                this.blendWidth
            );

        this.scrollOffset =
            this.scrollOffset %
            this.stepWidth;

        this.sequenceIndex = 0;

        /*
         * Hacen falta los paneles que cubren la pantalla más dos de
         * margen: uno saliendo por la izquierda y otro entrando por
         * la derecha.
         */
        const panelCount =
            Math.ceil(
                screenWidth /
                this.stepWidth
            ) + 2;

        const centerY =
            Math.round(
                screenHeight / 2
            );

        for (
            let index = 0;
            index < panelCount;
            index += 1
        ) {
            this.panels.push(
                this.createPanel(
                    centerY
                )
            );
        }

        this.applyOffset();
    }

    getTextureSize(key) {
        const texture =
            this.scene.textures.get(key);

        if (
            !texture ||
            texture.key === "__MISSING"
        ) {
            return null;
        }

        const source =
            texture.getSourceImage();

        if (
            !source ||
            !source.width ||
            !source.height
        ) {
            return null;
        }

        return {
            width: source.width,
            height: source.height
        };
    }

    createPanel(centerY) {
        const textureIndex =
            this.sequenceIndex %
            this.textureKeys.length;

        this.sequenceIndex += 1;

        /*
         * Cada panel se compone de:
         *
         * - "body", que dibuja el fondo entero salvo la franja
         *   izquierda, totalmente opaco.
         *
         * - "segments", los trozos de la franja izquierda. Cada uno
         *   cubre un tramo de la curva de disolución, con su opacidad
         *   inicial y final. Juntos forman el degradado curvo que
         *   funde este fondo sobre el anterior.
         *
         * El recorte de Phaser no reubica la imagen: la parte visible
         * se dibuja donde estaría dentro de la imagen completa, así
         * que todos comparten la misma x y encajan solos.
         */
        const body =
            this.createImage(centerY);

        const segments = [];

        for (
            let index = 0;
            index < FADE_SEGMENTS;
            index += 1
        ) {
            segments.push(
                this.createImage(centerY)
            );
        }

        const panel = {
            body,
            segments,
            textureIndex,
            centerY
        };

        this.applyPanelTexture(panel);

        return panel;
    }

    createImage(centerY) {
        return this.scene.add
            .image(
                0,
                centerY,
                this.textureKeys[0]
            )
            .setOrigin(
                0,
                0.5
            )
            .setDepth(
                this.depth
            )
            .setScrollFactor(0);
    }

    applyPanelTexture(panel) {
        const key =
            this.textureKeys[
                panel.textureIndex
            ];

        const size =
            this.getTextureSize(key);

        if (!size) {
            return;
        }

        /*
         * La escala se deriva del ancho en pantalla, no del tamaño
         * del PNG, para que un fondo exportado con algún píxel de
         * diferencia siga ocupando exactamente lo mismo que el resto
         * y la cinta no se descuadre.
         */
        const scaleX =
            this.tileWidth /
            size.width;

        const scaleY =
            this.backgroundScale;

        /*
         * El recorte se expresa en píxeles de la textura original,
         * por eso la franja de mezcla se mide sobre el ancho del PNG.
         */
        const blendSource =
            Math.max(
                FADE_SEGMENTS,
                Math.min(
                    size.width - 1,
                    Math.round(
                        size.width *
                        this.blendRatio
                    )
                )
            );

        panel.body.setTexture(key);

        panel.body.setScale(
            scaleX,
            scaleY
        );

        /*
         * El cuerpo empieza un píxel antes de donde acaba la franja.
         * Ese solape mínimo garantiza que nunca quede una rendija
         * entre ambos; como en ese punto la franja ya es opaca y
         * muestra el mismo dibujo, no se nota.
         */
        const bodyStart =
            Math.max(
                0,
                blendSource - 1
            );

        panel.body.setCrop(
            bodyStart,
            0,
            size.width - bodyStart,
            size.height
        );

        panel.body.setAlpha(1);

        for (
            let index = 0;
            index < panel.segments.length;
            index += 1
        ) {
            const segment =
                panel.segments[index];

            const from =
                Math.round(
                    blendSource *
                    (
                        index /
                        FADE_SEGMENTS
                    )
                );

            const to =
                Math.round(
                    blendSource *
                    (
                        (index + 1) /
                        FADE_SEGMENTS
                    )
                );

            segment.setTexture(key);

            segment.setScale(
                scaleX,
                scaleY
            );

            segment.setCrop(
                from,
                0,
                Math.max(1, to - from),
                size.height
            );

            /*
             * Opacidad de las esquinas izquierda y derecha del tramo,
             * tomadas de la curva. Como el borde derecho de un tramo
             * y el izquierdo del siguiente comparten valor, el
             * degradado sale continuo de un extremo al otro.
             */
            const alphaLeft =
                BackgroundManager.fadeCurve(
                    index /
                    FADE_SEGMENTS
                );

            const alphaRight =
                BackgroundManager.fadeCurve(
                    (index + 1) /
                    FADE_SEGMENTS
                );

            segment.setAlpha(
                alphaLeft,
                alphaRight,
                alphaLeft,
                alphaRight
            );
        }
    }

    // =========================================================
    // Update
    // =========================================================

    update(delta) {
        if (
            this.isDestroyed ||
            this.panels.length === 0 ||
            this.stepWidth <= 0
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

        this.scrollOffset += movement;

        while (
            this.scrollOffset >=
            this.stepWidth
        ) {
            this.scrollOffset -=
                this.stepWidth;

            this.recycleFirstPanel();
        }

        this.applyOffset();
    }

    recycleFirstPanel() {
        const panel =
            this.panels.shift();

        this.panels.push(panel);

        panel.textureIndex =
            this.sequenceIndex %
            this.textureKeys.length;

        this.sequenceIndex += 1;

        this.applyPanelTexture(panel);

        /*
         * El panel que entra debe dibujarse por encima del anterior,
         * porque su franja degradada es la que lo tapa. Todos
         * comparten depth, así que el orden lo decide la posición en
         * la lista de visualización.
         */
        this.scene.children
            .bringToTop(panel.body);

        for (
            const segment
            of panel.segments
        ) {
            this.scene.children
                .bringToTop(segment);
        }
    }

    applyOffset() {
        const roundedOffset =
            Math.round(
                this.scrollOffset
            );

        /*
         * El primer panel arranca desplazado un blendWidth hacia la
         * izquierda para que su propia franja degradada quede siempre
         * fuera de pantalla: si se viera, el fondo se desvanecería
         * contra el vacío en el borde izquierdo.
         */
        const baseX =
            -this.blendWidth -
            roundedOffset;

        for (
            let index = 0;
            index < this.panels.length;
            index += 1
        ) {
            const panel =
                this.panels[index];

            const x =
                baseX +
                (
                    index *
                    this.stepWidth
                );

            panel.body.x = x;

            for (
                const segment
                of panel.segments
            ) {
                segment.x = x;
            }
        }
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

    destroyPanels() {
        for (
            const panel
            of this.panels
        ) {
            panel.body?.destroy();

            for (
                const segment
                of panel.segments ?? []
            ) {
                segment?.destroy();
            }
        }

        this.panels = [];
    }

    destroy() {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed = true;

        this.destroyPanels();

        this.backgroundScale = 1;
        this.tileWidth = 0;
        this.blendWidth = 0;
        this.stepWidth = 0;
        this.scrollOffset = 0;
        this.sequenceIndex = 0;

        this.scene = null;
    }
}
