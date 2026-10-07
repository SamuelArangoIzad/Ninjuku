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
         * Distancia maxima a la que se puede enganchar una plataforma.
         * Tiene que dar margen para balancearse sin chocar con nada.
         */
        this.maxDistance =
            Number(configuration.maxDistance) ||
            620;

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

        this.visual = null;

        /*
         * Posicion del gancho en el mundo. Se refresca cada
         * fotograma porque la plataforma viaja con el fondo.
         */
        this.hook = null;

        this.hookId = null;

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
            this.updateLaunching(sprite);

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
        const hook =
            this.hangingPropManager
                ?.findNearestHook?.(
                    sprite.x,
                    sprite.body.bottom,
                    {
                        maxDistance:
                            this.maxDistance,

                        minHeight:
                            this.minHeight
                    }
                );

        if (
            !hook ||
            !this.isHookOnScreen(hook)
        ) {
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

        this.showLaunch(sprite, hook);

        return true;
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

        this.visual.once(
            "animationcomplete",
            () => {
                if (this.state === LAUNCHING) {
                    this.state = HOOKED;
                }
            }
        );
    }

    updateLaunching(sprite) {
        /*
         * Durante el lanzamiento el ninja sigue en el suelo: el dibujo
         * se queda donde está y solo sale la cadena.
         */
        this.visual.setPosition(
            sprite.x,
            sprite.body.bottom
        );
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
        if (
            !this.shurikenSystem ||
            this.swingProgress === 0
        ) {
            return;
        }

        if (!controls?.attack?.()) {
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

        this.scene = null;
        this.player = null;
        this.hangingPropManager = null;
    }
}
