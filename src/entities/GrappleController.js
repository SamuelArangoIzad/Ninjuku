/*
 * Kusarigama: engancharse a las plataformas colgadas de las ramas,
 * balancearse y soltarse.
 *
 * Ciclo completo, todo con la misma tecla H:
 *
 *   SUELO -> (H) LANZANDO -> ENGANCHADO -> (H) CAYENDO -> SUELO
 *
 * Mientras esta enganchado, A y D balancean. La postura no la decide
 * una simulacion: la decide el dibujo. Las dos animaciones de balanceo
 * son un pendulo ya dibujado, asi que el estado es un unico numero,
 * "swingProgress", que recorre esta linea sin cortes:
 *
 *   -8 ................ 0 ................ +9
 *   derecha 9 ... derecha 1 | izquierda 1 ... izquierda 10
 *
 * El cero es la vertical. En negativo se dibuja con la hoja derecha y
 * en positivo con la izquierda, y cruzar el cero cambia de hoja solo.
 * Es importante que el eje sea continuo: con un hueco entre los dos
 * frames verticales, el balanceo se queda atascado en el centro y no
 * puede pasar de un lado al otro.
 * Mantener A avanza hacia la izquierda; si se venia del lado derecho,
 * primero se desanda ese lado hasta el centro y despues se empieza el
 * izquierdo, que es justo lo que se pidio. Con D, al reves.
 *
 * El dibujo va en un sprite aparte y el del jugador se oculta. Asi no
 * hay que pelearse con su origen, su escala ni su caja de colision,
 * que estan pensados para los frames de 128x128. El cuerpo fisico del
 * jugador si se mueve, colocandolo en los pies del dibujo, para que al
 * soltarse caiga desde donde de verdad esta.
 */

/*
 * Hojas generadas con tools/preparar_animaciones.py a partir de los
 * PNG sueltos, que venian cada uno con un tamano distinto.
 *
 * "origin" es el punto de registro dentro del frame:
 *
 *   balanceo     la bola del extremo de la cadena, que es de donde
 *                cuelga el ninja. Es el punto fijo del pendulo.
 *   lanzamiento  los pies, que no se mueven del suelo.
 *   aterrizaje   los pies.
 *
 * "feetOffsets" es el vector del punto de registro a los pies en cada
 * frame. Con el, el cuerpo fisico sigue al dibujo.
 */
const SHEETS = {
    launch: {
        key: "kusarigama-launch",
        frames: 11,
        frameWidth: 142,
        frameHeight: 303,
        originX: 0.249,
        originY: 0.967,
        frameRate: 22,
        artScale: 1 / 1.19
    },

    land: {
        key: "kusarigama-land",
        frames: 7,
        frameWidth: 173,
        frameHeight: 141,
        originX: 0.4835,
        originY: 0.9291,
        frameRate: 14,
        artScale: 1 / 1.19
    },

    swingLeft: {
        key: "kusarigama-swing-left",
        frames: 10,
        frameWidth: 294,
        frameHeight: 336,
        originX: 0.9361,
        originY: 0.0306,
        artScale: 1 / 1.82,
        feetOffsets: [
            [-63.9, 317.0],
            [-93.1, 317.1],
            [-106.1, 301.8],
            [-126.6, 280.1],
            [-168.0, 260.2],
            [-155.8, 245.2],
            [-175.5, 227.8],
            [-124.9, 211.2],
            [-139.1, 203.4],
            [-112.5, 188.6]
        ]
    },

    swingRight: {
        key: "kusarigama-swing-right",
        frames: 9,
        frameWidth: 320,
        frameHeight: 333,
        originX: 0.231,
        originY: 0.0308,
        artScale: 1 / 1.82,
        feetOffsets: [
            [20.2, 314.1],
            [46.1, 312.0],
            [78.6, 305.2],
            [125.8, 285.2],
            [153.2, 273.1],
            [201.6, 268.0],
            [222.9, 266.0],
            [200.7, 262.6],
            [197.6, 284.1]
        ]
    }
};


/*
 * Cada animacion viene dibujada a su propio tamano, asi que cada hoja
 * lleva su "artScale". Medido de cabeza a botas contra ninja_idle con
 * tools/preparar_animaciones.py:
 *
 *   lanzamiento   1.10 - 1.15x   ->  1 / 1.19
 *   aterrizaje    0.94 - 1.00x   ->  1 / 1.19
 *   balanceo      1.76 - 1.90x   ->  1 / 1.82
 *
 * Aplicar una sola escala a las cuatro era el fallo: con 1/1.19 el
 * balanceo salia un 53% mas grande que el resto.
 *
 * Los dos balanceos comparten valor a proposito, aunque midan algo
 * distinto entre si. Si cada uno llevara el suyo, el ninja pegaria un
 * salto de tamano justo al cruzar la vertical, que es donde se cambia
 * de una hoja a la otra.
 */

/*
 * Velocidad del balanceo, en frames por segundo.
 */
const SWING_RATE = 16;

/*
 * Impulso al soltarse, en pixeles por segundo.
 *
 * Sale disparado hacia el lado al que se estaba balanceando. La
 * velocidad crece con lo abierto que este el balanceo: soltarse casi
 * en vertical apenas empuja, soltarse en el extremo da el maximo.
 *
 * El maximo se queda por debajo de la carrera del jugador (400) para
 * que sea una ventaja de movimiento, no un teleporte.
 */
/*
 * Tiempo minimo entre shuriken, en milisegundos.
 */
/*
 * Alcance del kusarigama, en fraccion del alto de la pantalla.
 *
 * No es un circulo, es una elipse: hacia arriba se llega lejos y de
 * lado mucho menos. Tirar la cadena en alto es creible; que a uno lo
 * arrastren media pantalla de costado, no.
 *
 * Antes era un radio fijo de 620 px, y eso daba dos problemas. Medido
 * sobre el juego, dejaba agarrar colgantes a 860 px de lado, que es lo
 * que se veia como un salto imposible. Y al ser fijo, en un movil de
 * 360 px de alto valia casi dos pantallas enteras, mientras que en
 * escritorio apenas daba: el mismo numero significaba cosas muy
 * distintas segun el tamano. En proporcion al alto, el alcance se
 * siente igual en todas partes.
 */
const REACH_SIDE_RATIO = 0.45;
const REACH_UP_RATIO = 0.85;

/*
 * Parte de la animacion de lanzamiento que el ninja pasa todavia en
 * el suelo, tirando la cadena. El resto la emplea en subir.
 *
 * Sin esto el ninja se quedaba plantado toda la animacion y aparecia
 * colgado de golpe al acabar: los colgantes estan entre 344 y 535 px
 * por encima de sus pies, asi que el salto era de hasta 422 px de una
 * sola vez. Ahora se le ve recorrer esa distancia.
 */
const LAUNCH_HOLD = 0.45;

/*
 * Ritmo de la subida, en pixeles por segundo.
 *
 * Antes la subida se repartia dentro de la animacion de lanzamiento,
 * que dura 500 ms, asi que los 350 px tipicos se recorrian a mas de
 * 1200 px/s: tan rapido que seguia pareciendo un salto. Ahora la
 * subida tiene su propio tiempo, calculado por distancia, y el estado
 * no pasa a colgado hasta que termina de verdad.
 */
const ASCENT_SPEED = 600;

/*
 * Topes para que un tramo corto no se sienta perezoso ni uno largo se
 * haga eterno.
 */
const ASCENT_MIN_TIME = 420;
const ASCENT_MAX_TIME = 950;

/*
 * Lineas de aire que acompanan la subida.
 *
 * Se dibujan a los dos costados de la silueta, nunca encima, y bajan
 * mientras el ninja sube: son el rastro del aire que deja atras.
 */
const WIND_COUNT = 8;
const WIND_INNER = 0.30;
const WIND_OUTER = 0.95;
const WIND_SPEED = 2.4;
const WIND_ALPHA = 0.5;
const WIND_COLOR = 0xdfefff;

const SHURIKEN_COOLDOWN = 220;

/*
 * Separacion del shuriken respecto al ninja al salir, para que no
 * nazca encima de su propio cuerpo.
 */
const SHURIKEN_OFFSET = 26;

const RELEASE_SPEED_MIN = 110;
const RELEASE_SPEED_MAX = 330;

/*
 * Estados.
 */
const IDLE = "IDLE";
const LAUNCHING = "LAUNCHING";
const HOOKED = "HOOKED";
const FALLING = "FALLING";


export default class GrappleController {
    constructor(
        scene,
        configuration = {}
    ) {
        this.scene = scene;

        this.player =
            configuration.player ??
            null;

        this.hangingPropManager =
            configuration.hangingPropManager ??
            null;

        /*
         * La plataforma tiene que estar por encima del jugador: no se
         * puede uno colgar de algo que esta a su altura.
         */
        this.minHeight =
            Number(configuration.minHeight) ||
            140;

        /*
         * Margen desde los bordes de la pantalla dentro del cual tiene
         * que estar el gancho para poder agarrarlo.
         *
         * El gestor de colgantes mantiene vivos ganchos hasta 400 px
         * fuera del encuadre, y algunos de esos quedan dentro del
         * alcance del kusarigama. Sin este margen, engancharse a uno
         * de ellos te lleva fuera de camara y te mata al instante.
         *
         * 100 px cubren el caso peor: en el extremo del balanceo el
         * cuerpo se separa hasta unos 80 px del gancho.
         */
        this.screenMargin =
            Number(configuration.screenMargin) ||
            100;

        this.depth =
            Number.isFinite(
                Number(configuration.depth)
            )
                ? Number(configuration.depth)
                : 10;

        this.state = IDLE;

        /*
         * Punto de partida de la subida y tiempo transcurrido desde
         * que se lanzo la cadena.
         */
        this.launchFrom = { x: 0, y: 0 };

        this.launchElapsed = 0;

        this.ascentTime = ASCENT_MIN_TIME;

        this.windLines = [];

        this.windGraphics = null;

        this.visual = null;

        /*
         * Posicion del gancho en el mundo. Se refresca cada
         * fotograma porque la plataforma viaja con el fondo.
         */
        this.hook = null;

        this.hookId = null;

        this.energy = configuration.energy ?? null;

        this.shurikenSystem =
            configuration.shurikenSystem ??
            null;

        this.lastShurikenAt = -Infinity;

        /*
         * Recorrido del balanceo, del extremo derecho al izquierdo.
         * El cero es la vertical.
         */
        this.swingProgress = 0;

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

        const missing =
            Object.values(SHEETS)
                .map((sheet) => sheet.key)
                .filter(
                    (key) =>
                        !this.scene.textures.exists(key)
                );

        if (missing.length > 0) {
            console.error(
                "[GrappleController] " +
                "Faltan hojas de animación: " +
                missing.join(", ")
            );

            return;
        }

        this.createAnimations();

        this.visual =
            this.scene.add
                .sprite(
                    0,
                    0,
                    SHEETS.launch.key,
                    0
                )
                .setDepth(this.depth)
                .setVisible(false);

        /*
         * Las lineas de aire van justo detras del ninja: asoman por
         * los costados sin taparle la silueta.
         */
        this.windGraphics =
            this.scene.add
                ?.graphics?.()
                ?.setDepth(this.depth - 1)
                ?.setVisible(false) ?? null;
    }

    createAnimations() {
        for (
            const name
            of ["launch", "land"]
        ) {
            const sheet = SHEETS[name];

            const animationKey =
                sheet.key + "-anim";

            if (
                this.scene.anims.exists(
                    animationKey
                )
            ) {
                continue;
            }

            this.scene.anims.create({
                key: animationKey,

                frames:
                    this.scene.anims
                        .generateFrameNumbers(
                            sheet.key,
                            {
                                start: 0,
                                end: sheet.frames - 1
                            }
                        ),

                frameRate: sheet.frameRate,
                repeat: 0
            });
        }
    }

    // =========================================================
    // Consultas
    // =========================================================

    isHooked() {
        return this.state === HOOKED;
    }

    isActive() {
        return this.state !== IDLE;
    }

    /*
     * Mientras se balancea no debe caer ni responder a los controles
     * normales: manda esta clase.
     */
    suspendsPlayer() {
        return this.state !== IDLE;
    }

    getPlayerSprite() {
        return (
            this.player?.getSprite?.() ??
            null
        );
    }

    getScale(sheet) {
        const sprite =
            this.getPlayerSprite();

        return (
            (sprite?.scaleX ?? 1) *
            (sheet?.artScale ?? 1)
        );
    }

    // =========================================================
    // Update
    // =========================================================

    update(delta, controls) {
        if (
            this.isDestroyed ||
            !this.visual
        ) {
            return;
        }

        const sprite =
            this.getPlayerSprite();

        if (
            !sprite?.active ||
            !sprite.body ||
            this.player?.hasDied?.()
        ) {
            /*
             * Si muere colgado (por ejemplo al salirse de la camara),
             * se suelta el mando sin animacion de aterrizaje.
             */
            this.forceRelease();

            return;
        }

        const pressed =
            Boolean(controls?.grapple?.());

        // Regeneración fuera de HOOKED y drenaje continuo colgado.
        // Cuando la energía se agota, suelta el agarre inmediatamente.
        const hasEnergy = this.energy?.update(delta, this.state === HOOKED) ?? true;
        if (!hasEnergy && this.state === HOOKED) {
            this.release(sprite, controls);
            return;
        }

        if (this.state === IDLE) {
            if (pressed) {
                this.tryHook(sprite);
            }

            return;
        }

        if (
            this.state === LAUNCHING ||
            this.state === HOOKED
        ) {
            /*
             * La plataforma viaja con el fondo, así que el punto de
             * enganche se vuelve a leer cada fotograma. Si desaparece
             * (el fondo se recicló), se suelta.
             */
            const hook =
                this.hangingPropManager
                    ?.findHookById?.(
                        this.hookId
                    );

            if (!hook) {
                this.release(sprite);

                return;
            }

            this.hook = hook;
        }

        if (this.state === LAUNCHING) {
            this.updateLaunching(sprite, delta);

            return;
        }

        if (this.state === HOOKED) {
            if (pressed) {
                this.release(sprite, controls);

                return;
            }

            this.updateHooked(
                sprite,
                delta,
                controls
            );

            this.updateShuriken(
                sprite,
                controls
            );

            return;
        }

        this.updateFalling(sprite);
    }

    // =========================================================
    // Enganche
    // =========================================================

    tryHook(sprite) {
        if (this.energy && !this.energy.canHook()) return false;
        const hook =
            this.findReachableHook(sprite);

        if (!hook) {
            return false;
        }

        this.hook = hook;
        this.hookId = hook.id;

        this.state = LAUNCHING;

        /*
         * Se arranca colgando en vertical.
         */
        this.swingProgress = 0;

        const body = sprite.body;

        body.setVelocity(0, 0);
        body.allowGravity = false;

        sprite.setVisible(false);

        /*
         * De donde sale y adonde tiene que llegar. La subida se
         * interpola entre estos dos puntos durante el lanzamiento.
         */
        this.launchFrom = {
            x: sprite.x,
            y: sprite.body.bottom
        };

        this.launchElapsed = 0;

        /*
         * La subida dura segun lo que haya que subir, no segun lo que
         * dure el dibujo de lanzamiento.
         */
        const destino = this.getHangPoint();

        const recorrido =
            Math.hypot(
                destino.x - this.launchFrom.x,
                destino.y - this.launchFrom.y
            );

        this.ascentTime =
            Math.min(
                ASCENT_MAX_TIME,
                Math.max(
                    ASCENT_MIN_TIME,
                    (recorrido / ASCENT_SPEED) * 1000
                )
            );

        this.seedWindLines();

        this.showLaunch(sprite, hook);

        return true;
    }

    /*
     * El colgante mas cercano que de verdad queda al alcance de la
     * cadena: dentro del encuadre, por encima del ninja y dentro de
     * la elipse de alcance.
     */
    findReachableHook(sprite) {
        const hooks =
            this.hangingPropManager
                ?.getHooks?.() ?? [];

        const origenX = sprite.x;
        const origenY = sprite.body.bottom;

        const lado = this.getSideReach();
        const alto = this.getUpReach();

        let mejor = null;
        let mejorDistancia = Infinity;

        for (const hook of hooks) {
            if (!this.isHookOnScreen(hook)) {
                continue;
            }

            const subida = origenY - hook.y;

            if (subida < this.minHeight) {
                continue;
            }

            const dx =
                Math.abs(hook.x - origenX) / lado;

            const dy = subida / alto;

            /*
             * Fuera de la elipse no se llega, por cerca que parezca
             * en linea recta.
             */
            if ((dx * dx) + (dy * dy) > 1) {
                continue;
            }

            const distancia =
                Math.hypot(
                    hook.x - origenX,
                    subida
                );

            if (distancia < mejorDistancia) {
                mejor = hook;
                mejorDistancia = distancia;
            }
        }

        return mejor;
    }

    getSideReach() {
        return (
            Math.max(
                1,
                this.scene?.scale?.height ?? 1
            ) * REACH_SIDE_RATIO
        );
    }

    getUpReach() {
        return (
            Math.max(
                1,
                this.scene?.scale?.height ?? 1
            ) * REACH_UP_RATIO
        );
    }

    /*
     * Donde quedan los pies al colgar en reposo. Es el destino de la
     * subida, y es el mismo punto que usa el balanceo en su fotograma
     * cero, asi que al terminar no hay ningun salto.
     */
    getHangPoint() {
        const sheet = SHEETS.swingLeft;

        const scale = this.getScale(sheet);

        const [offsetX, offsetY] =
            sheet.feetOffsets[0];

        return {
            x: this.hook.x + (offsetX * scale),
            y: this.hook.y + (offsetY * scale)
        };
    }

    /*
     * El gancho tiene que estar bien dentro del encuadre, no solo
     * cerca: agarrarse a uno que asoma por el borde saca al jugador
     * de camara y lo mata nada mas colgarse.
     */
    isHookOnScreen(hook) {
        const screenWidth =
            Math.max(
                1,
                this.scene?.scale?.width ?? 1
            );

        return (
            hook.x >= this.screenMargin &&
            hook.x <= screenWidth - this.screenMargin
        );
    }

    showLaunch(sprite, hook) {
        const sheet = SHEETS.launch;

        /*
         * El arte lanza hacia la derecha. Si la plataforma queda a la
         * izquierda se voltea, y con ella el origen: al reflejar, los
         * pies pasan al lado contrario del frame.
         */
        const flip = hook.x < sprite.x;

        this.visual
            .setTexture(sheet.key, 0)
            .setFlipX(flip)
            .setOrigin(
                flip
                    ? 1 - sheet.originX
                    : sheet.originX,

                sheet.originY
            )
            .setScale(this.getScale(sheet))
            .setPosition(
                sprite.x,
                sprite.body.bottom
            )
            .setVisible(true);

        this.visual.play(
            sheet.key + "-anim",
            true
        );

        /*
         * Antes el fin de esta animacion pasaba a colgado. Ya no: la
         * subida dura lo suyo y es ella la que remata el enganche,
         * asi que el dibujo se queda en su ultimo fotograma mientras
         * el ninja termina de subir.
         */
    }

    updateLaunching(sprite, delta) {
        /*
         * Se topa el delta igual que en el balanceo. Si el juego da
         * un tiron, o la pestana vuelve de segundo plano, llega un
         * delta enorme y la subida entera se consumiria en un solo
         * fotograma: justo el salto que se queria quitar.
         */
        this.launchElapsed +=
            Math.min(
                Number.isFinite(delta) ? delta : 0,
                100
            );

        const sheet = SHEETS.launch;

        /*
         * El ninja tira la cadena con los pies en el suelo. Ese tramo
         * sigue el ritmo del dibujo de lanzamiento.
         */
        const espera =
            (sheet.frames / sheet.frameRate) *
            1000 *
            LAUNCH_HOLD;

        const tiron =
            this.launchElapsed <= espera
                ? 0
                : Math.min(
                    1,
                    (this.launchElapsed - espera) /
                    this.ascentTime
                );

        /*
         * Suavizado en los dos extremos: arranca despacio al tensarse
         * la cadena, coge velocidad y se posa sin frenazo.
         */
        const avance =
            tiron * tiron * (3 - (2 * tiron));

        const destino = this.getHangPoint();

        const x =
            this.launchFrom.x +
            ((destino.x - this.launchFrom.x) * avance);

        const y =
            this.launchFrom.y +
            ((destino.y - this.launchFrom.y) * avance);

        this.visual.setPosition(x, y);

        /*
         * El cuerpo acompana al dibujo. Si no, al soltarse a mitad de
         * subida caeria desde donde estaba plantado.
         */
        sprite.body.reset(x, y);

        this.drawWindLines(x, y, tiron);

        /*
         * Se pasa a colgado cuando acaba la subida, no cuando acaba
         * el dibujo: el dibujo dura 500 ms y la subida puede durar
         * mas, y rematar antes devolveria el salto seco del final.
         */
        if (tiron >= 1) {
            this.hideWindLines();

            this.state = HOOKED;
        }
    }

    // =========================================================
    // Líneas de aire
    // =========================================================

    /*
     * Reparte las lineas de una subida a otra, para que no salgan
     * siempre iguales. Cada una guarda su costado, su separacion del
     * eje, su largo y el punto del ciclo por el que empieza.
     */
    seedWindLines() {
        this.windLines = [];

        for (
            let index = 0;
            index < WIND_COUNT;
            index += 1
        ) {
            const lado = index % 2 === 0 ? -1 : 1;

            const reparto =
                (index + 1) / (WIND_COUNT + 1);

            this.windLines.push({
                lado,

                /*
                 * Separacion del centro, entre el borde de la
                 * silueta y un poco mas afuera.
                 */
                separacion:
                    WIND_INNER +
                    (
                        (WIND_OUTER - WIND_INNER) *
                        ((index * 0.37) % 1)
                    ),

                largo: 0.18 + (((index * 0.53) % 1) * 0.3),

                fase: reparto
            });
        }
    }

    /*
     * Dibuja el aire que el ninja deja atras al subir. Las lineas
     * bajan mientras el sube, y aparecen y se van con la propia
     * subida para que no asomen ni antes ni despues.
     */
    drawWindLines(x, pies, tiron) {
        const dibujo = this.windGraphics;

        if (!dibujo) {
            return;
        }

        dibujo.clear();

        if (tiron <= 0 || tiron >= 1) {
            dibujo.setVisible(false);

            return;
        }

        const sheet = SHEETS.launch;

        const scale = this.getScale(sheet);

        const alto = sheet.frameHeight * scale;

        const ancho = sheet.frameWidth * scale;

        /*
         * Mas fuerte en mitad del recorrido, que es donde mas corre,
         * y apagandose en los extremos.
         */
        const fuerza =
            Math.sin(tiron * Math.PI);

        dibujo.setVisible(true);

        for (const linea of this.windLines) {
            /*
             * La linea recorre el cuerpo de arriba abajo una y otra
             * vez segun avanza la subida.
             */
            const recorrido =
                (
                    linea.fase +
                    (tiron * WIND_SPEED)
                ) % 1;

            const inicioY =
                pies - alto + (recorrido * alto);

            const finalY =
                inicioY + (linea.largo * alto);

            const lineaX =
                x +
                (
                    linea.lado *
                    linea.separacion *
                    (ancho / 2)
                );

            dibujo.lineStyle(
                Math.max(1, 2 * scale * 1.6),
                WIND_COLOR,
                WIND_ALPHA * fuerza
            );

            dibujo.beginPath();
            dibujo.moveTo(lineaX, inicioY);
            dibujo.lineTo(lineaX, Math.min(finalY, pies));
            dibujo.strokePath();
        }
    }

    hideWindLines() {
        this.windGraphics?.clear();
        this.windGraphics?.setVisible(false);
    }

    // =========================================================
    // Balanceo
    // =========================================================

    updateHooked(sprite, delta, controls) {
        const left =
            Boolean(controls?.left?.());

        const right =
            Boolean(controls?.right?.());

        const step =
            SWING_RATE *
            (
                Math.min(delta, 100) /
                1000
            );

        /*
         * Un único eje. Hacia la izquierda el índice sube, hacia la
         * derecha baja, y al cruzar el centro se cambia de animación
         * solo. Eso reproduce el ida y vuelta pedido: si se venía del
         * lado derecho, primero se desanda hasta el centro.
         */
        let target = this.swingProgress;

        if (left && !right) {
            target += step;
        } else if (right && !left) {
            target -= step;
        } else if (target > 0) {
            /*
             * Sin pulsar nada vuelve poco a poco a la vertical.
             */
            target = Math.max(0, target - step);
        } else {
            target = Math.min(0, target + step);
        }

        this.swingProgress =
            Math.min(
                SHEETS.swingLeft.frames - 1,

                Math.max(
                    -(SHEETS.swingRight.frames - 1),
                    target
                )
            );

        this.applySwingFrame(sprite);
    }

    applySwingFrame(sprite) {
        const toLeft = this.swingProgress >= 0;

        const sheet =
            toLeft
                ? SHEETS.swingLeft
                : SHEETS.swingRight;

        const frame =
            Math.min(
                sheet.frames - 1,

                Math.max(
                    0,
                    Math.round(
                        Math.abs(this.swingProgress)
                    )
                )
            );

        const scale = this.getScale(sheet);

        this.visual
            .setTexture(sheet.key, frame)
            .setFlipX(false)
            .setOrigin(
                sheet.originX,
                sheet.originY
            )
            .setScale(scale)
            .setPosition(
                this.hook.x,
                this.hook.y
            )
            .setVisible(true);

        /*
         * El cuerpo físico va a los pies del dibujo, no al centro del
         * gancho: al soltarse tiene que caer desde donde de verdad
         * está el ninja.
         */
        const [offsetX, offsetY] =
            sheet.feetOffsets[frame];

        sprite.body.reset(
            this.hook.x + (offsetX * scale),
            this.hook.y + (offsetY * scale)
        );
    }

    // =========================================================
    // Shuriken
    // =========================================================

    /*
     * Solo se puede lanzar yendo hacia un lado. Colgando en vertical
     * no hay direccion que dar al tiro, asi que la tecla no hace nada.
     *
     * Sale a la altura del torso del ninja y vuela en horizontal a esa
     * misma altura, asi que cuanto mas abierto este el balanceo mas
     * alto pasa: apuntar es elegir desde donde lanzar.
     */
    updateShuriken(sprite, controls) {
        // Consumir la pulsación incluso en posición vertical para que
        // no quede un lanzamiento pendiente al iniciar el balanceo.
        const requested = Boolean(
            controls?.shuriken?.() || controls?.attack?.()
        );
        if (!requested || !this.shurikenSystem || this.swingProgress === 0) {
            return;
        }

        const now =
            this.scene?.time?.now ?? 0;

        if (
            now - this.lastShurikenAt <
            SHURIKEN_COOLDOWN
        ) {
            return;
        }

        /*
         * Positivo es el lado izquierdo del balanceo, asi que el tiro
         * sale en sentido contrario al signo.
         */
        const direction =
            this.swingProgress > 0
                ? -1
                : 1;

        const body = sprite.body;

        const launched =
            this.shurikenSystem.throwFrom(
                sprite.x +
                (direction * SHURIKEN_OFFSET),

                body.top +
                (body.height / 2),

                direction
            );

        if (launched) {
            this.lastShurikenAt = now;
        }
    }

    // =========================================================
    // Soltarse y aterrizar
    // =========================================================

    /*
     * Direccion del impulso al soltarse.
     *
     * Manda la tecla que se este pulsando en ese momento, que es lo
     * que el jugador tiene en la mano. Si no hay ninguna, se usa el
     * lado hacia el que quedo abierto el balanceo.
     *
     * Progreso positivo es el lado izquierdo, asi que el impulso va
     * en sentido contrario al signo.
     */
    getReleaseDirection(controls) {
        if (controls?.left?.()) {
            return -1;
        }

        if (controls?.right?.()) {
            return 1;
        }

        if (this.swingProgress > 0) {
            return -1;
        }

        if (this.swingProgress < 0) {
            return 1;
        }

        return 0;
    }

    getReleaseSpeed() {
        const limit =
            this.swingProgress >= 0
                ? SHEETS.swingLeft.frames - 1
                : SHEETS.swingRight.frames - 1;

        const openness =
            limit > 0
                ? Math.min(
                    1,
                    Math.abs(this.swingProgress) / limit
                )
                : 0;

        return (
            RELEASE_SPEED_MIN +
            (
                (RELEASE_SPEED_MAX - RELEASE_SPEED_MIN) *
                openness
            )
        );
    }

    release(sprite, controls) {
        const sheet = SHEETS.land;

        const direction =
            this.getReleaseDirection(controls);

        const speed = this.getReleaseSpeed();

        this.state = FALLING;
        this.hook = null;
        this.hookId = null;

        this.hideWindLines();

        const body = sprite.body;

        body.allowGravity = true;

        /*
         * El impulso sobrevive a la caida porque durante el aterrizaje
         * el jugador sigue suspendido y nadie le reescribe la
         * velocidad.
         */
        body.setVelocity(
            direction * speed,
            0
        );

        this.visual
            .setTexture(sheet.key, 0)
            .setFlipX(false)
            .setOrigin(
                sheet.originX,
                sheet.originY
            )
            .setScale(this.getScale(sheet))
            .setVisible(true);

        this.visual.play(
            sheet.key + "-anim",
            true
        );
    }

    updateFalling(sprite) {
        this.visual.setPosition(
            sprite.x,
            sprite.body.bottom
        );

        const onGround =
            sprite.body.blocked.down ||
            sprite.body.touching.down;

        const finished =
            !this.visual.anims.isPlaying;

        /*
         * Se vuelve al control normal cuando ha tocado suelo y la
         * animación ha terminado. Si cae desde muy alto, el último
         * frame se queda hasta que aterriza.
         */
        if (onGround && finished) {
            this.finish(sprite);
        }
    }

    finish(sprite) {
        this.state = IDLE;

        this.visual.setVisible(false);

        sprite.setVisible(true);

        sprite.body.allowGravity = true;
    }

    forceRelease() {
        this.state = IDLE;
        this.hook = null;
        this.hookId = null;

        this.visual?.setVisible(false);

        const sprite =
            this.getPlayerSprite();

        if (sprite) {
            sprite.setVisible(true);

            if (sprite.body) {
                sprite.body.allowGravity = true;
            }
        }
    }

    // =========================================================
    // Destrucción
    // =========================================================

    destroy() {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed = true;

        this.visual?.destroy();
        this.visual = null;

        this.windGraphics?.destroy();
        this.windGraphics = null;

        this.scene = null;
        this.player = null;
        this.hangingPropManager = null;
    }
}
