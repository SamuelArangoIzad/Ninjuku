/*
 * Estructuras que recorren el escenario como obstáculos.
 *
 * Funcionan igual que la cinta de fondos: avanzan hacia la izquierda a
 * la misma velocidad, y cuando una sale por el borde izquierdo se
 * recicla al final con la siguiente estructura de la secuencia, que se
 * repite en bucle.
 *
 * Cada obstáculo es una pareja:
 *
 *   [ plataforma ][ casa ]
 *
 * Las casas son demasiado altas para saltarlas de una vez, así que
 * delante de cada una aparece una plataforma que sirve de escalón. El
 * recorrido es suelo -> plataforma -> tejado, en dos saltos. Sirve
 * igual para el jugador y para los enemigos, que usan la misma altura
 * de salto.
 *
 * La plataforma va a la izquierda porque es el lado por el que se
 * llega: los obstáculos avanzan hacia el jugador desde la derecha.
 *
 * Cada pieza son dos objetos:
 *
 * - La imagen, que es solo decorativa.
 * - Un rectángulo invisible con cuerpo estático, que es lo que choca.
 *
 * Van separados a propósito. Los PNG tienen márgenes transparentes,
 * remates finos (la aguja de la pagoda) y adornos que no deben
 * bloquear el paso: los pinchos bajo la plataforma de madera quedan
 * fuera de la caja, igual que las motas sueltas que flotan sobre
 * estructure3 y estructure5.
 */

/*
 * Caja sólida de cada pieza, en píxeles de su PNG original.
 *
 * "left" y "right" son la huella horizontal. "top" es la primera fila
 * cuyo ancho opaco alcanza el 25% del máximo, lo que descarta motas y
 * agujas. "bottom" es la primera fila que ya no es sólida: coincide
 * con el alto del dibujo salvo en la plataforma de madera, donde se
 * corta antes para dejar los pinchos fuera.
 *
 * Se pueden recalcular con tools/medir_obstaculos.py.
 */
const SOLID_SHAPES = {
    "obstacle-1": {
        frameWidth: 151,
        frameHeight: 243,
        left: 0,
        right: 148,
        top: 6,
        bottom: 243
    },

    "obstacle-2": {
        frameWidth: 169,
        frameHeight: 200,
        left: 2,
        right: 166,
        top: 4,
        bottom: 200
    },

    "obstacle-3": {
        frameWidth: 231,
        frameHeight: 155,
        left: 1,
        right: 230,
        top: 6,
        bottom: 155
    },

    "obstacle-4": {
        frameWidth: 207,
        frameHeight: 163,
        left: 1,
        right: 205,
        top: 11,
        bottom: 163
    },

    "obstacle-5": {
        frameWidth: 300,
        frameHeight: 189,
        left: 1,
        right: 298,
        top: 5,
        bottom: 189
    },

    "obstacle-6": {
        frameWidth: 179,
        frameHeight: 248,
        left: 1,
        right: 178,
        top: 32,
        bottom: 248
    },

    /*
     * Plataforma de madera. La tabla ocupa hasta la fila 85; de la 86
     * en adelante son los pinchos, que quedan fuera de la caja.
     */
    "platform-low": {
        frameWidth: 159,
        frameHeight: 93,
        left: 1,
        right: 157,
        top: 1,
        bottom: 86
    },

    /*
     * Portón de piedra. Sólido entero, se apoya en el suelo.
     */
    "platform-high": {
        frameWidth: 213,
        frameHeight: 207,
        left: 0,
        right: 212,
        top: 3,
        bottom: 207
    }
};


/*
 * Escala de cada plataforma. Fijadas para que la altura de su
 * superficie quede por debajo de lo que alcanza un salto desde el
 * suelo: 92 px la de madera y 112 px la de piedra.
 */
const PLATFORM_SCALES = {
    "platform-low": 1,
    "platform-high": 0.55
};

/*
 * Orden en que se alternan las plataformas, una por casa.
 */
const PLATFORM_KEYS = [
    "platform-low",
    "platform-high"
];

/*
 * Hueco entre la plataforma y la casa que tiene delante.
 */
const PLATFORM_GAP = 14;

/*
 * Holgura que se exige en cada salto. Un salto que llega justo al
 * píxel es injugable.
 */
const JUMP_MARGIN = 20;

/*
 * Margen vertical para considerar que un cuerpo está apoyado sobre la
 * superficie de una pieza.
 */
const RIDER_TOLERANCE = 6;

/*
 * Holgura sobre la antelación mínima con la que salta un enemigo.
 */
const ENEMY_JUMP_SAFETY = 1.15;

/*
 * Antelación mínima, para que un enemigo muy lento salte igualmente
 * al llegar pegado al escalón.
 */
const ENEMY_MIN_LOOKAHEAD = 12;

/*
 * Altura mínima que debe tener un escalón para que valga la pena
 * saltarlo. Evita que los enemigos salten contra nada.
 */
const ENEMY_MIN_STEP = 10;


export default class ObstacleManager {
    constructor(
        scene,
        configuration = {}
    ) {
        this.scene = scene;

        this.ground =
            configuration.ground ??
            null;

        /*
         * Misma velocidad que el fondo, para que las estructuras
         * parezcan clavadas en el paisaje y no flotando sobre él.
         */
        this.speed =
            Number.isFinite(
                Number(configuration.speed)
            )
                ? Math.max(
                    0,
                    Number(configuration.speed)
                )
                : 35;

        /*
         * Por delante del fondo (-100) y por detrás de los enemigos
         * (9) y del jugador (10), que deben verse siempre encima.
         */
        this.depth =
            Number.isFinite(
                Number(configuration.depth)
            )
                ? Number(configuration.depth)
                : 4;

        /*
         * Escala de las casas.
         *
         * A 0.95 miden entre 142 y 225 px de alto, tamaño de casa de
         * verdad comparado con el ninja y con las casas del fondo. Es
         * una escala fija, no responsiva: la altura del salto tampoco
         * cambia con la pantalla, y el juego debe sentirse igual en
         * todos los dispositivos.
         */
        this.scale =
            Number(configuration.scale) ||
            0.95;

        /*
         * Altura que alcanza un salto, en píxeles.
         *
         * Sale de la física del juego: con fuerza de salto 600 y
         * gravedad 1200, la altura es 600^2 / (2 * 1200) = 150. De
         * aquí depende qué plataforma se elige para cada casa.
         */
        this.jumpHeight =
            Number(configuration.jumpHeight) ||
            150;

        /*
         * Separación entre parejas consecutivas.
         */
        this.spacing =
            Math.max(
                200,
                Number(configuration.spacing) ||
                760
            );

        this.sequence =
            Array.isArray(configuration.sequence) &&
            configuration.sequence.length > 0
                ? configuration.sequence.slice()
                : Object.keys(SOLID_SHAPES).filter(
                    (key) =>
                        key.startsWith("obstacle-")
                );

        this.horizontalExtension =
            Math.max(
                0,
                Number(
                    configuration.horizontalExtension
                ) || 700
            );

        this.enemyJumpForce =
            Number(
                configuration.enemyJumpForce
            ) || -600;

        /*
         * Gravedad del mundo. Con ella y con la fuerza de salto se
         * calcula cuándo debe saltar un enemigo.
         */
        this.gravity =
            Number(configuration.gravity) ||
            Number(
                scene?.physics?.world
                    ?.gravity?.y
            ) ||
            1200;

        this.getPlayerSprite =
            configuration.getPlayerSprite ??
            (() => null);

        this.getEnemySprites =
            configuration.getEnemySprites ??
            (() => []);

        this.obstacles = [];

        /*
         * Contador para dar identidad estable a cada pareja. Otros
         * sistemas montan cosas encima de una casa concreta (enemigos,
         * puntos de enganche) y necesitan saber si sigue siendo la
         * misma o ya se reciclo y ahora es otra.
         */
        this.obstacleSerial = 0;

        this.sequenceIndex = 0;

        this.groundY = 0;

        /*
         * Colisionadores vivos, indexados por sprite, para poder
         * añadirlos y quitarlos según aparecen y mueren enemigos.
         */
        this.colliders = new Map();

        this.isDestroyed = false;
    }

    // =========================================================
    // Geometría de una pieza
    // =========================================================

    /*
     * Altura de la superficie de una pieza sobre el suelo, es decir
     * a qué altura se queda quien se sube encima.
     */
    static surfaceHeightOf(key, scale) {
        const shape = SOLID_SHAPES[key];

        if (!shape) {
            return 0;
        }

        return (
            shape.frameHeight -
            shape.top
        ) * scale;
    }

    /*
     * Elige la plataforma que acompaña a una casa.
     *
     * Se alternan para que aparezcan las dos, pero la decisión se
     * comprueba: la plataforma tiene que ser alcanzable desde el suelo
     * y tiene que dejar el tejado al alcance desde ella. Si la
     * preferida no cumple, se prueban las demás. Así, si algún día se
     * cambia la escala de las casas, la elección se ajusta sola en vez
     * de dejar una casa imposible de subir.
     */
    resolvePlatformFor(houseKey, order) {
        const houseHeight =
            ObstacleManager.surfaceHeightOf(
                houseKey,
                this.scale
            );

        const limit =
            this.jumpHeight -
            JUMP_MARGIN;

        const preferred =
            PLATFORM_KEYS[
                order % PLATFORM_KEYS.length
            ];

        const ordered = [
            preferred,

            ...PLATFORM_KEYS.filter(
                (key) => key !== preferred
            )
        ];

        for (const key of ordered) {
            const height =
                ObstacleManager.surfaceHeightOf(
                    key,
                    PLATFORM_SCALES[key]
                );

            const reachable =
                height <= limit;

            const roofReachable =
                (houseHeight - height) <= limit;

            if (reachable && roofReachable) {
                return key;
            }
        }

        console.warn(
            "[ObstacleManager] " +
            `Ninguna plataforma deja "${houseKey}" al alcance ` +
            `(la casa mide ${Math.round(houseHeight)} px y el salto ` +
            `llega a ${this.jumpHeight} px). Se usa la más alta.`
        );

        return PLATFORM_KEYS[
            PLATFORM_KEYS.length - 1
        ];
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

        this.destroyColliders();
        this.destroyObstacles();

        const available =
            this.sequence.filter(
                (key) =>
                    this.isTextureUsable(key)
            );

        if (
            available.length === 0 ||
            !PLATFORM_KEYS.every(
                (key) =>
                    this.isTextureUsable(key)
            )
        ) {
            console.error(
                "[ObstacleManager] " +
                "Faltan texturas de obstáculo o de plataforma."
            );

            return;
        }

        if (
            available.length <
            this.sequence.length
        ) {
            console.warn(
                "[ObstacleManager] " +
                "Se omiten estructuras no cargadas. " +
                "Se usarán: " +
                available.join(", ")
            );
        }

        this.sequence = available;

        this.sequenceIndex = 0;

        this.groundY =
            this.resolveGroundY();

        const screenWidth =
            Math.max(
                1,
                this.scene.scale.width
            );

        /*
         * Hacen falta las que caben entre los dos extremos del mundo
         * más una de margen a cada lado.
         */
        const total =
            Math.ceil(
                (
                    screenWidth +
                    (this.horizontalExtension * 2)
                ) /
                this.spacing
            ) + 2;

        /*
         * La primera arranca fuera de la vista por la derecha, para
         * que la partida no empiece con el jugador pegado a una
         * estructura.
         */
        let x =
            screenWidth +
            (this.spacing * 0.5);

        for (
            let index = 0;
            index < total;
            index += 1
        ) {
            const obstacle =
                this.createObstacle();

            obstacle.x = x;

            this.applyNextPair(obstacle);

            this.obstacles.push(obstacle);

            x += this.spacing;
        }
    }

    isTextureUsable(key) {
        if (!SOLID_SHAPES[key]) {
            console.warn(
                "[ObstacleManager] " +
                "Sin caja de colisión definida para: " +
                key
            );

            return false;
        }

        const texture =
            this.scene.textures.get(key);

        return Boolean(
            texture &&
            texture.key !== "__MISSING"
        );
    }

    createPiece() {
        const image =
            this.scene.add
                .image(
                    0,
                    0,
                    this.sequence[0]
                )
                .setOrigin(0.5, 1)
                .setDepth(this.depth);

        /*
         * El cuerpo va en un rectángulo aparte, invisible, porque la
         * caja sólida no coincide con el recuadro de la imagen.
         *
         * Ni la imagen ni el rectángulo fijan scrollFactor: los dos
         * viven en coordenadas del mundo, que es donde ocurre la
         * física. Si algún día la cámara se mueve, dibujo y colisión
         * seguirán coincidiendo.
         */
        const collider =
            this.scene.add.rectangle(
                0,
                0,
                1,
                1,
                0x000000,
                0
            );

        collider.setOrigin(0.5, 1);

        this.scene.physics.add.existing(
            collider,
            true
        );

        return {
            image,
            collider,
            key: this.sequence[0],
            scale: 1,
            boxWidth: 1,
            boxHeight: 1,
            boxLeft: 0,
            boxRight: 0,
            surfaceY: 0,
            imageOffsetX: 0
        };
    }

    createObstacle() {
        const obstacle = {
            platform: this.createPiece(),
            house: this.createPiece(),
            x: 0,
            width: 0,
            serial: this.obstacleSerial
        };

        this.obstacleSerial += 1;

        return obstacle;
    }

    /*
     * Parejas vivas, en orden de izquierda a derecha.
     */
    getObstacles() {
        return this.obstacles;
    }

    /*
     * Asigna a la pareja la siguiente casa de la secuencia y la
     * plataforma que le corresponde, y recalcula su geometría.
     */
    applyNextPair(obstacle) {
        const order = this.sequenceIndex;

        /*
         * Al reciclarse deja de ser la misma pareja, aunque reutilice
         * los mismos objetos.
         */
        obstacle.serial = this.obstacleSerial;

        this.obstacleSerial += 1;

        const houseKey =
            this.sequence[
                order % this.sequence.length
            ];

        this.sequenceIndex += 1;

        const platformKey =
            this.resolvePlatformFor(
                houseKey,
                order
            );

        this.applyPieceTexture(
            obstacle.platform,
            platformKey,
            PLATFORM_SCALES[platformKey]
        );

        this.applyPieceTexture(
            obstacle.house,
            houseKey,
            this.scale
        );

        obstacle.width =
            obstacle.platform.boxWidth +
            PLATFORM_GAP +
            obstacle.house.boxWidth;

        this.positionObstacle(obstacle);
    }

    applyPieceTexture(piece, key, scale) {
        const shape = SOLID_SHAPES[key];

        piece.key = key;
        piece.scale = scale;

        piece.image.setTexture(key);
        piece.image.setScale(scale);

        piece.boxWidth =
            Math.max(
                1,
                (
                    shape.right -
                    shape.left +
                    1
                ) * scale
            );

        piece.boxHeight =
            Math.max(
                1,
                (
                    shape.bottom -
                    shape.top
                ) * scale
            );

        /*
         * Distancia entre el centro de la imagen y el centro de la
         * caja: la parte sólida no tiene por qué estar centrada en el
         * dibujo.
         */
        piece.imageOffsetX =
            (
                (shape.frameWidth / 2) -
                (
                    (
                        shape.left +
                        shape.right
                    ) / 2
                )
            ) * scale;

        /*
         * Distancia entre la base de la imagen y la base de la caja.
         * En la plataforma de madera vale lo que miden los pinchos,
         * que cuelgan por debajo de la parte sólida.
         */
        piece.boxBottomOffset =
            (
                shape.frameHeight -
                shape.bottom
            ) * scale;

        piece.collider.setSize(
            piece.boxWidth,
            piece.boxHeight
        );

        piece.collider.setDisplaySize(
            piece.boxWidth,
            piece.boxHeight
        );
    }

    /*
     * Coloca la pareja tomando obstacle.x como borde izquierdo de la
     * plataforma. La casa va justo detrás, separada por el hueco.
     */
    positionObstacle(obstacle) {
        this.positionPiece(
            obstacle.platform,
            obstacle.x
        );

        this.positionPiece(
            obstacle.house,

            obstacle.x +
            obstacle.platform.boxWidth +
            PLATFORM_GAP
        );
    }

    positionPiece(piece, boxLeft) {
        const boxCenter =
            boxLeft +
            (piece.boxWidth / 2);

        piece.boxLeft = boxLeft;

        piece.boxRight =
            boxLeft +
            piece.boxWidth;

        /*
         * La imagen se apoya en el suelo. La caja se levanta lo que
         * midan los adornos que cuelgan por debajo.
         */
        const boxBottomY =
            this.groundY -
            piece.boxBottomOffset;

        piece.surfaceY =
            boxBottomY -
            piece.boxHeight;

        piece.image.setPosition(
            boxCenter + piece.imageOffsetX,
            this.groundY
        );

        piece.collider.setPosition(
            boxCenter,
            boxBottomY
        );

        piece.collider.body
            ?.updateFromGameObject();
    }

    resolveGroundY() {
        if (
            typeof this.ground
                ?.getSurfaceY ===
            "function"
        ) {
            return this.ground
                .getSurfaceY();
        }

        return (
            this.scene?.scale?.height ??
            0
        );
    }

    /*
     * Todas las piezas sólidas, para las consultas de colisión.
     */
    getPieces() {
        const pieces = [];

        for (
            const obstacle
            of this.obstacles
        ) {
            pieces.push(obstacle.platform);
            pieces.push(obstacle.house);
        }

        return pieces;
    }

    // =========================================================
    // Update
    // =========================================================

    update(delta) {
        if (
            this.isDestroyed ||
            this.obstacles.length === 0
        ) {
            return;
        }

        const safeDelta =
            Number.isFinite(delta)
                ? delta
                : 0;

        /*
         * Se limita el delta para evitar saltos enormes cuando la
         * pestaña vuelve después de estar suspendida.
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

        for (
            const obstacle
            of this.obstacles
        ) {
            obstacle.x -= movement;

            this.positionObstacle(obstacle);
        }

        this.recycleOffscreen();

        this.syncColliders();

        this.carryRiders(-movement);

        this.assistEnemyJumps();
    }

    recycleOffscreen() {
        const limit =
            -this.horizontalExtension;

        /*
         * Se comprueba en bucle porque un delta grande podría sacar
         * más de una pareja de golpe.
         */
        for (;;) {
            const first =
                this.obstacles[0];

            if (
                !first ||
                first.house.boxRight >= limit
            ) {
                return;
            }

            const last =
                this.obstacles[
                    this.obstacles.length - 1
                ];

            this.obstacles.shift();

            first.x =
                last.x +
                this.spacing;

            this.applyNextPair(first);

            this.obstacles.push(first);
        }
    }

    // =========================================================
    // Arrastre de quien va encima
    // =========================================================

    carryRiders(deltaX) {
        if (deltaX === 0) {
            return;
        }

        for (
            const sprite
            of this.getRiderSprites()
        ) {
            const body = sprite.body;

            if (
                !body ||
                !body.enable ||
                !body.blocked.down
            ) {
                continue;
            }

            if (!this.findPieceUnder(body)) {
                continue;
            }

            /*
             * Se mueve el cuerpo, no el sprite: Arcade escribe la
             * posición del cuerpo sobre el objeto en su postUpdate,
             * que corre justo después del update de la escena. Así el
             * arrastre no se acumula ni pelea con el control del
             * jugador.
             */
            body.position.x += deltaX;
        }
    }

    findPieceUnder(body) {
        for (const piece of this.getPieces()) {
            const restingOnTop =
                Math.abs(
                    body.bottom -
                    piece.surfaceY
                ) <= RIDER_TOLERANCE;

            const overlapsHorizontally =
                body.right > piece.boxLeft &&
                body.left < piece.boxRight;

            if (
                restingOnTop &&
                overlapsHorizontally
            ) {
                return piece;
            }
        }

        return null;
    }

    // =========================================================
    // Salto de los enemigos
    // =========================================================

    assistEnemyJumps() {
        for (
            const sprite
            of this.getEnemySprites() ?? []
        ) {
            const body = sprite?.body;

            if (
                !body ||
                !body.enable ||
                !body.blocked.down
            ) {
                continue;
            }

            const direction =
                Math.sign(body.velocity.x);

            if (direction === 0) {
                continue;
            }

            if (
                !this.hasStepAhead(
                    body,
                    direction
                )
            ) {
                continue;
            }

            body.velocity.y =
                this.enemyJumpForce;
        }
    }

    /*
     * Tiempo que tarda un salto en ganar cierta altura, o null si esa
     * altura no se alcanza ni saltando.
     */
    timeToRise(height) {
        const speed =
            Math.abs(this.enemyJumpForce);

        const discriminant =
            (speed * speed) -
            (2 * this.gravity * height);

        if (discriminant < 0) {
            return null;
        }

        return (
            speed -
            Math.sqrt(discriminant)
        ) / this.gravity;
    }

    /*
     * Decide si toca saltar.
     *
     * La antelación no puede ser un número fijo. Un enemigo rápido
     * recorre mucho terreno mientras sube, así que saltando tarde se
     * estampa contra la pared en vez de subirla; uno lento, saltando
     * pronto, se queda corto y cae antes del escalón. Se calculan las
     * dos condiciones a partir de su velocidad:
     *
     * - Cuánta distancia necesita para haber subido lo suficiente
     *   antes de llegar a la pared.
     * - Desde dónde tiene que saltar para caer hacia el centro de la
     *   superficie, y no pasarse de largo.
     *
     * Se salta en cuanto se cumple la más exigente de las dos.
     */
    hasStepAhead(body, direction) {
        const front =
            direction > 0
                ? body.right
                : body.left;

        const speed =
            Math.abs(body.velocity.x);

        /*
         * Un salto completo dura lo que tarda en subir y volver a
         * bajar a la misma altura.
         */
        const airtime =
            (
                2 *
                Math.abs(this.enemyJumpForce)
            ) / this.gravity;

        for (const piece of this.getPieces()) {
            const step =
                body.bottom -
                piece.surfaceY;

            if (step <= ENEMY_MIN_STEP) {
                continue;
            }

            const rise =
                this.timeToRise(step);

            if (rise === null) {
                continue;
            }

            /*
             * Cara de la pieza que le queda de frente.
             */
            const face =
                direction > 0
                    ? piece.boxLeft
                    : piece.boxRight;

            const gap =
                (face - front) * direction;

            if (gap < 0) {
                continue;
            }

            const clearance =
                speed *
                rise *
                ENEMY_JUMP_SAFETY;

            const landing =
                (speed * airtime) -
                (piece.boxWidth / 2);

            const trigger =
                Math.max(
                    clearance,
                    landing,
                    ENEMY_MIN_LOOKAHEAD
                );

            if (gap <= trigger) {
                return true;
            }
        }

        return false;
    }

    // =========================================================
    // Colisionadores
    // =========================================================

    getRiderSprites() {
        const sprites = [];

        const player =
            this.getPlayerSprite();

        if (player?.active) {
            sprites.push(player);
        }

        for (
            const enemy
            of this.getEnemySprites() ?? []
        ) {
            if (enemy?.active) {
                sprites.push(enemy);
            }
        }

        return sprites;
    }

    /*
     * Los enemigos aparecen y mueren constantemente, así que la lista
     * de colisionadores se mantiene al día comparándola con los
     * sprites vivos. Solo se crean y destruyen los que cambian.
     */
    syncColliders() {
        const current =
            new Set(
                this.getRiderSprites()
            );

        for (
            const [sprite, collider]
            of this.colliders
        ) {
            if (!current.has(sprite)) {
                collider?.destroy?.();

                this.colliders.delete(sprite);
            }
        }

        for (const sprite of current) {
            if (
                this.colliders.has(sprite) ||
                !sprite.body
            ) {
                continue;
            }

            this.colliders.set(
                sprite,

                this.scene.physics.add
                    .collider(
                        sprite,

                        this.getPieces().map(
                            (piece) =>
                                piece.collider
                        )
                    )
            );
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

        this.groundY =
            this.resolveGroundY();

        for (
            const obstacle
            of this.obstacles
        ) {
            this.positionObstacle(obstacle);
        }
    }

    // =========================================================
    // Destrucción
    // =========================================================

    destroyColliders() {
        for (
            const collider
            of this.colliders.values()
        ) {
            collider?.destroy?.();
        }

        this.colliders.clear();
    }

    destroyObstacles() {
        for (const piece of this.getPieces()) {
            piece.image?.destroy();
            piece.collider?.destroy();
        }

        this.obstacles = [];
    }

    destroy() {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed = true;

        this.destroyColliders();
        this.destroyObstacles();

        this.scene = null;
        this.ground = null;
    }
}
