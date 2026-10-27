/*
 * Objeto colgado de las ramas de cerezo del fondo.
 *
 * No tiene desplazamiento propio. En cada fotograma pregunta al
 * BackgroundManager dónde está cada panel y coloca el objeto sobre los
 * puntos de anclaje de la textura que ese panel tenga puesta en ese
 * momento.
 *
 * Esa es la parte importante del diseño: al derivar la posición del
 * fondo en vez de llevar una cinta paralela, el objeto queda clavado a
 * la rama de la que cuelga. No se desincroniza nunca, y aparece y
 * desaparece exactamente con el fondo que tiene ramas. En los fondos
 * sin cerezo (6 y 7) sencillamente no hay anclajes y no se dibuja
 * ninguno.
 */

/*
 * Puntos de los que cuelga el objeto, en píxeles del PNG del fondo
 * (1600x900). "x" es la columna e "y" es el borde inferior del racimo
 * de flores, que es donde se engancha.
 *
 * Están medidos sobre los propios fondos con tools/medir_ramas.py. Las
 * ramas se reconocen por las flores, no por ser oscuras: los pinos de
 * fondo6 y fondo7 también son oscuros, pero sus copas no tienen flores
 * rosas, así que esos dos fondos salen sin anclajes.
 *
 * Esta tabla es la selección revisada, no la salida cruda de la
 * herramienta: la herramienta propone candidatos y aquí se deja solo
 * lo que se ha visto bien en pantalla. Ahora mismo difiere en que
 * fondo3 podría llevar un segundo anclaje en x=1476, que está
 * pendiente de revisar.
 */
const BRANCH_ANCHORS = {
    "background-1": [
        { x: 267, y: 207 },
        { x: 858, y: 215 }
    ],

    "background-2": [
        { x: 123, y: 132 },
        { x: 661, y: 116 }
    ],

    /*
     * fondo3 se queda con un solo anclaje. El otro sitio con muchas
     * flores (x=260) dejaba el tablon posado justo encima de un
     * templo, tapandolo entero: se midio un 98.7% de tejado debajo de
     * la tabla, frente a menos del 13% en el resto de anclajes.
     */
    "background-3": [
        { x: 910, y: 167 }
    ],

    "background-4": [
        { x: 338, y: 151 }
    ],

    "background-5": [
        { x: 381, y: 205 }
    ],

    /*
     * fondo6 y fondo7 no tienen cerezo: son los dos unicos del ciclo
     * sin rama en flor. Dejarlos vacios abria un tramo de mas de un
     * minuto sin un solo colgante en pantalla, y durante ese tramo el
     * corazon y el x2 no tenian donde ponerse y desaparecian.
     *
     * La plataforma flota, asi que aqui no se cuelga de una rama sino
     * que se posa sobre la linea de arbolado. Las dos de cada fondo
     * van separadas a proposito: pegadas al borde, la de la derecha
     * de fondo6 y la de la izquierda de fondo7 quedaban a 210 px y se
     * solapaban al pasar de un panel al siguiente.
     */
    "background-6": [
        { x: 300, y: 300 },
        { x: 1100, y: 255 }
    ],

    "background-7": [
        { x: 300, y: 330 },
        { x: 1100, y: 265 }
    ],

    "background-8": [
        { x: 1196, y: 224 }
    ]
};


/*
 * Margen a cada lado de la pantalla dentro del cual se mantiene visible
 * el objeto. Evita que aparezca de golpe justo en el borde.
 */
const VISIBILITY_MARGIN = 400;

/*
 * Fila del PNG del objeto (142x167) donde esta el tablon.
 *
 * Es el punto del que se engancha el kusarigama: la bola del extremo
 * de la cadena tiene que quedar sobre la madera, no sobre el gancho
 * que la sujeta a la rama.
 */
const PLANK_ROW = 129;

/*
 * Alto del PNG del objeto, para pasar la fila a fraccion.
 */
const PROP_HEIGHT = 167;


export default class HangingPropManager {
    constructor(
        scene,
        configuration = {}
    ) {
        this.scene = scene;

        this.backgroundManager =
            configuration.backgroundManager ??
            null;

        this.textureKey =
            configuration.textureKey ??
            "hanging-prop";

        /*
         * Por delante del fondo (-100) y por detrás de todo lo demás.
         * Cuelga de una rama pintada en el fondo, así que tiene que
         * verse sobre ella pero nunca tapar al jugador.
         */
        this.depth =
            Number.isFinite(
                Number(configuration.depth)
            )
                ? Number(configuration.depth)
                : -50;

        /*
         * Tamaño relativo al fondo. Se multiplica por la escala del
         * propio fondo, no por una escala fija: el objeto cuelga de un
         * dibujo del fondo y tiene que crecer y encoger con él para
         * seguir pareciendo parte de la misma rama.
         */
        this.scale =
            Number(configuration.scale) ||
            1;

        this.anchors =
            configuration.anchors ??
            BRANCH_ANCHORS;

        /*
         * Reserva de imágenes reutilizables. Nunca se crean ni se
         * destruyen durante la partida: las que sobran se ocultan.
         */
        this.pool = [];

        /*
         * Ganchos visibles ahora mismo, con su posicion en el mundo.
         * Los consulta el kusarigama para engancharse.
         */
        this.hooks = [];

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

        this.destroyPool();

        const texture =
            this.scene.textures.get(
                this.textureKey
            );

        if (
            !texture ||
            texture.key === "__MISSING"
        ) {
            console.error(
                "[HangingPropManager] " +
                "No existe la textura: " +
                this.textureKey
            );

            return;
        }

        this.ensurePool();

        this.update();
    }

    /*
     * Ajusta la reserva al peor caso: todos los paneles visibles
     * mostrando a la vez el fondo que más anclajes tiene.
     *
     * Se vuelve a llamar en cada resize porque al agrandar la ventana
     * el fondo crea más paneles, y con una reserva fija se quedarían
     * objetos sin dibujar.
     */
    ensurePool() {
        const maxAnchors =
            Math.max(
                1,
                ...Object.values(this.anchors)
                    .map((list) => list.length)
            );

        const panelCount =
            this.backgroundManager
                ?.getPanelPlacements?.()
                ?.length ?? 0;

        const total =
            Math.max(1, panelCount) *
            maxAnchors;

        while (this.pool.length < total) {
            this.pool.push(
                this.createImage()
            );
        }
    }

    createImage() {
        /*
         * Origen arriba y al centro: el punto que se coloca sobre la
         * rama es el gancho del que cuelga la cadena, que está en la
         * fila 0 del dibujo y centrado (columnas 69 a 74 de 142).
         */
        return this.scene.add
            .image(
                0,
                0,
                this.textureKey
            )
            .setOrigin(0.5, 0)
            .setDepth(this.depth)
            /*
             * Mismo sistema de coordenadas que los paneles del fondo,
             * que tambien van fijados a la camara. La posicion se
             * deriva de la suya, asi que si uno se moviera con la
             * camara y el otro no, el objeto se despegaria de la rama.
             */
            .setScrollFactor(0)
            .setVisible(false);
    }

    // =========================================================
    // Update
    // =========================================================

    update() {
        if (
            this.isDestroyed ||
            !this.backgroundManager
        ) {
            return;
        }

        const placements =
            this.backgroundManager
                .getPanelPlacements?.() ?? [];

        const screenWidth =
            Math.max(
                1,
                this.scene?.scale?.width ?? 1
            );

        let used = 0;

        this.hooks.length = 0;

        for (const placement of placements) {
            const anchors =
                this.anchors[placement.key];

            if (
                !anchors ||
                anchors.length === 0
            ) {
                continue;
            }

            for (const anchor of anchors) {
                const x =
                    placement.x +
                    (anchor.x * placement.scaleX);

                /*
                 * Un panel del fondo mide más que la pantalla, así que
                 * la mayoría de los anclajes caen fuera. Solo se gasta
                 * una imagen en los que se van a ver.
                 */
                if (
                    x < -VISIBILITY_MARGIN ||
                    x > screenWidth + VISIBILITY_MARGIN
                ) {
                    continue;
                }

                const image =
                    this.pool[used];

                if (!image) {
                    continue;
                }

                used += 1;

                image.setPosition(
                    x,

                    placement.topY +
                    (anchor.y * placement.scaleY)
                );

                const scale =
                    placement.scaleY *
                    this.scale;

                image.setScale(scale);

                image.setVisible(true);

                /*
                 * El identificador lleva el serial del panel: si ese
                 * panel se recicla, el gancho deja de existir aunque
                 * otro fondo vuelva a tener un anclaje ahi.
                 */
                this.hooks.push({
                    id:
                        placement.serial +
                        ":" +
                        anchor.x,

                    x: image.x,

                    y:
                        image.y +
                        (PLANK_ROW * scale)
                });
            }
        }

        for (
            let index = used;
            index < this.pool.length;
            index += 1
        ) {
            this.pool[index]
                .setVisible(false);
        }
    }

    // =========================================================
    // Consultas del kusarigama
    // =========================================================

    getHooks() {
        return this.hooks;
    }

    findHookById(id) {
        if (!id) {
            return null;
        }

        return (
            this.hooks.find(
                (hook) => hook.id === id
            ) ?? null
        );
    }

    /*
     * Gancho mas cercano al jugador que ademas este lo bastante alto
     * como para colgarse y balancearse sin rozar el suelo.
     */
    findNearestHook(
        x,
        y,
        options = {}
    ) {
        const maxDistance =
            Number(options.maxDistance) ||
            Infinity;

        const minHeight =
            Number(options.minHeight) || 0;

        let best = null;
        let bestDistance = Infinity;

        for (const hook of this.hooks) {
            if (y - hook.y < minHeight) {
                continue;
            }

            const distance =
                Math.hypot(
                    hook.x - x,
                    hook.y - y
                );

            if (
                distance > maxDistance ||
                distance >= bestDistance
            ) {
                continue;
            }

            best = hook;
            bestDistance = distance;
        }

        return best;
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
         * Las posiciones salen del fondo, que ya se ha recolocado. Con
         * recalcularlas basta, pero antes hay que comprobar que la
         * reserva siga dando para los paneles que haya ahora.
         */
        this.ensurePool();

        this.update();
    }

    // =========================================================
    // Destrucción
    // =========================================================

    destroyPool() {
        for (const image of this.pool) {
            image?.destroy();
        }

        this.pool = [];
    }

    destroy() {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed = true;

        this.destroyPool();

        this.hooks.length = 0;

        this.scene = null;
        this.backgroundManager = null;
    }
}
