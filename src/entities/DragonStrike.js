/*
 * Ayuda del dragon.
 *
 * Se activa al recoger el icono del dragon balanceandose, igual que
 * el x2 y el corazon. A partir de ahi la jugada va sola: el dragon
 * entra por la izquierda, cruza toda la pantalla y sale por la
 * derecha, y a su paso va matando a los enemigos que se encuentra.
 *
 * Mientras cruza, va levantando una onda expansiva de polvo a ras de
 * suelo, a la altura en la que pisan los enemigos, no a la altura a
 * la que vuela el dragon.
 *
 * Los enemigos no se borran a mano: se les hace dano suficiente para
 * tumbarlos, para que pasen por la misma muerte de siempre. Asi se
 * reproduce su animacion, suman puntos y la ronda los cuenta como
 * eliminados, sin ningun camino especial que mantener aparte.
 */

/*
 * Reparto de los 70 dibujos del dragon entre las carpetas. Las siete
 * filas no son siete animaciones distintas: son una sola, en orden.
 * Se acerca pequeno (fila 1), vuela entero (filas 2 a 5), se aleja
 * (fila 6) y desaparece (fila 7).
 */
export const DRAGON_ROWS = [12, 11, 11, 11, 11, 13, 1];

const DRAGON_KEY = "dragon-pass";

export const DUST_FRAMES = 17;

const DUST_KEY = "dragon-dust";

/*
 * Lo que tarda el dragon en cruzar, en milisegundos. El ritmo de los
 * dibujos se calcula a partir de aqui para que el ultimo coincida
 * con la salida por la derecha.
 *
 * Con los 2300 de antes el dragon cruzaba de un plumazo y no daba
 * tiempo a verlo. Alargarlo tiene ademas el efecto de bajar el ritmo
 * de los dibujos a unos 18 por segundo, que es la banda en la que se
 * mueve el resto del juego (de 8 a 22): a 30 el dragon iba mas fino
 * que cualquier otra cosa en pantalla y desentonaba.
 */
export const CROSS_TIME = 4000;

/*
 * Margen por fuera de la pantalla por el que entra y sale, en
 * proporcion al ancho. Asi no aparece ni se corta de golpe.
 */
const OFFSCREEN = 0.35;

/*
 * Altura de vuelo sobre el suelo, en proporcion al alto de pantalla.
 * Pasa por encima de las cabezas de los enemigos.
 */
const FLIGHT_HEIGHT = 0.30;

/*
 * Tamano del dragon respecto al dibujo original. El dibujo entero
 * mide unos 195 px de ancho, que en pantalla se queda en nada.
 */
const DRAGON_SCALE = 2.4;

/*
 * Separacion entre dos polvaredas seguidas, en proporcion al ancho
 * de pantalla. Mas juntas se solapan en una mancha; mas separadas se
 * ven como estallidos sueltos en vez de una onda.
 */
const DUST_SPACING = 0.17;

const DUST_SCALE = 1.15;

/*
 * El polvo sale un poco antes que la cabeza del dragon: la onda va
 * por delante, como si la levantara el morro al llegar.
 */
const DUST_LEAD = 0.05;

/*
 * Dano con el que se tumba a un enemigo. Muy por encima de la vida
 * de cualquiera de los tres tipos.
 */
const LETHAL = 9999;


export default class DragonStrike {
    constructor(
        scene,
        configuration = {}
    ) {
        this.scene = scene;

        this.ground =
            configuration.ground ?? null;

        this.getEnemies =
            configuration.getEnemies ??
            (() => []);

        this.depth =
            Number.isFinite(
                Number(configuration.depth)
            )
                ? Number(configuration.depth)
                : 30;

        this.dustDepth =
            Number.isFinite(
                Number(configuration.dustDepth)
            )
                ? Number(configuration.dustDepth)
                : 9;

        /*
         * Aviso de cada muerte, por si la escena quiere reaccionar.
         */
        this.onEnemyKilled =
            configuration.onEnemyKilled ??
            (() => {});

        this.dragon = null;

        this.dustPool = [];

        this.running = false;

        this.elapsed = 0;

        /*
         * Hasta donde ha barrido ya la cabeza del dragon. Todo lo que
         * queda por detras esta muerto.
         */
        this.front = 0;

        /*
         * Siguiente punto del recorrido donde toca levantar polvo.
         */
        this.nextDustX = 0;

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

        this.createAnimations();

        this.dragon =
            this.scene.add
                .sprite(0, 0, this.firstDragonFrame())
                .setOrigin(0.5)
                .setDepth(this.depth)
                .setVisible(false);
    }

    firstDragonFrame() {
        return "dragon-1-1";
    }

    createAnimations() {
        const anims = this.scene?.anims;

        if (!anims) {
            return;
        }

        if (!anims.exists(DRAGON_KEY)) {
            const frames = [];

            for (
                let row = 0;
                row < DRAGON_ROWS.length;
                row += 1
            ) {
                for (
                    let index = 1;
                    index <= DRAGON_ROWS[row];
                    index += 1
                ) {
                    frames.push({
                        key:
                            `dragon-${row + 1}-${index}`
                    });
                }
            }

            anims.create({
                key: DRAGON_KEY,
                frames,

                /*
                 * El ritmo sale del total: los 70 dibujos tienen que
                 * durar justo lo que dura el cruce.
                 */
                frameRate:
                    Math.round(
                        frames.length /
                        (CROSS_TIME / 1000)
                    ),

                repeat: 0
            });
        }

        if (!anims.exists(DUST_KEY)) {
            const frames = [];

            for (
                let index = 1;
                index <= DUST_FRAMES;
                index += 1
            ) {
                frames.push({
                    key: `dragon-dust-${index}`
                });
            }

            anims.create({
                key: DUST_KEY,
                frames,

                /*
                 * El polvo acompaña al dragon: mas lento el, mas
                 * lento se levanta y se posa la polvareda. A este
                 * ritmo cada una dura algo mas de un segundo, asi
                 * que se solapa con la siguiente y la onda se ve
                 * seguida en vez de a estallidos sueltos.
                 */
                frameRate: 16,

                repeat: 0
            });
        }
    }

    // =========================================================
    // Activación
    // =========================================================

    /*
     * Lanza la pasada. Devuelve false si ya habia una en marcha, para
     * que el recogible no se de por usado sin que pase nada.
     */
    trigger() {
        if (
            this.isDestroyed ||
            !this.dragon ||
            this.running
        ) {
            return false;
        }

        const width = this.getWidth();

        this.running = true;

        this.elapsed = 0;

        this.front = this.getStartX();

        this.nextDustX = 0;

        this.dragon
            .setScale(this.getScale())
            .setPosition(
                this.front,
                this.getFlightY()
            )
            .setVisible(true)
            .play(DRAGON_KEY);

        /*
         * La primera polvareda se levanta al borde izquierdo de la
         * pantalla, no donde entra el dragon: lo que ocurre fuera de
         * cuadro no lo ve nadie.
         */
        this.nextDustX = 0;

        void width;

        return true;
    }

    isRunning() {
        return this.running;
    }

    // =========================================================
    // Update
    // =========================================================

    update(delta) {
        if (
            this.isDestroyed ||
            !this.running
        ) {
            return;
        }

        this.elapsed +=
            Number.isFinite(delta) ? delta : 0;

        const progress =
            Math.min(
                1,
                this.elapsed / CROSS_TIME
            );

        const inicio = this.getStartX();

        const fin = this.getEndX();

        this.front =
            inicio +
            ((fin - inicio) * progress);

        this.dragon.setPosition(
            this.front,
            this.getFlightY()
        );

        this.spawnDustUpTo(progress);

        this.killBehindFront();

        this.updateDust();

        if (progress >= 1) {
            this.finish();
        }
    }

    /*
     * Va sembrando polvaredas segun avanza, no todas de golpe: cada
     * una arranca cuando el dragon llega a su sitio, y asi la onda
     * recorre el suelo detras de el.
     */
    spawnDustUpTo(progress) {
        const width = this.getWidth();

        const adelanto = width * DUST_LEAD;

        const limite = this.front + adelanto;

        const salida = width;

        while (
            this.nextDustX <= limite &&
            this.nextDustX <= salida
        ) {
            this.spawnDust(this.nextDustX);

            this.nextDustX +=
                width * DUST_SPACING;
        }

        /*
         * Al terminar el recorrido no quedan mas por sembrar.
         */
        if (progress >= 1) {
            this.nextDustX = Infinity;
        }
    }

    spawnDust(x) {
        const sprite = this.takeDust();

        if (!sprite) {
            return;
        }

        sprite
            .setScale(
                this.getScale() * DUST_SCALE
            )
            .setPosition(
                x,
                this.getGroundY()
            )
            .setVisible(true)
            .play(DUST_KEY);
    }

    takeDust() {
        for (const sprite of this.dustPool) {
            if (!sprite.visible) {
                return sprite;
            }
        }

        const sprite =
            this.scene?.add
                ?.sprite(0, 0, "dragon-dust-1")
                ?.setOrigin(0.5, 0.88)
                ?.setDepth(this.dustDepth)
                ?.setVisible(false);

        if (sprite) {
            this.dustPool.push(sprite);
        }

        return sprite ?? null;
    }

    updateDust() {
        for (const sprite of this.dustPool) {
            if (
                sprite.visible &&
                !sprite.anims?.isPlaying
            ) {
                sprite.setVisible(false);
            }
        }
    }

    /*
     * Mata a todo enemigo que la cabeza del dragon ya haya rebasado.
     * Se hace por dano, no borrandolo, para que siga el camino de
     * muerte normal: animacion, puntos y recuento de la ronda.
     */
    killBehindFront() {
        const enemies = this.getEnemies() ?? [];

        for (const enemy of enemies) {
            if (!enemy?.isAlive?.()) {
                continue;
            }

            const sprite = enemy.getSprite?.();

            if (!sprite) {
                continue;
            }

            if (sprite.x > this.front) {
                continue;
            }

            enemy.takeDamage?.(LETHAL);

            this.onEnemyKilled(enemy);
        }
    }

    finish() {
        this.running = false;

        this.dragon?.setVisible(false);

        this.dragon?.stop?.();
    }

    // =========================================================
    // Geometría
    // =========================================================

    getWidth() {
        return (
            Number(this.scene?.scale?.width) ||
            1280
        );
    }

    getHeight() {
        return (
            Number(this.scene?.scale?.height) ||
            720
        );
    }

    getStartX() {
        return -(this.getWidth() * OFFSCREEN);
    }

    getEndX() {
        return (
            this.getWidth() *
            (1 + OFFSCREEN)
        );
    }

    getGroundY() {
        const suelo =
            this.ground?.getSurfaceY?.();

        return Number.isFinite(Number(suelo))
            ? Number(suelo)
            : this.getHeight() - 24;
    }

    getFlightY() {
        return (
            this.getGroundY() -
            (this.getHeight() * FLIGHT_HEIGHT)
        );
    }

    /*
     * Mismo criterio que el resto de personajes: el dibujo encoge en
     * pantallas pequenas para que no se coma el escenario.
     */
    getScale() {
        const shortest =
            Math.min(
                this.getWidth(),
                this.getHeight()
            );

        let responsive = 0.85;

        if (shortest <= 430) {
            responsive = 0.55;
        } else if (shortest <= 600) {
            responsive = 0.65;
        } else if (shortest <= 800) {
            responsive = 0.75;
        }

        return responsive * DRAGON_SCALE;
    }

    // =========================================================
    // Destrucción
    // =========================================================

    destroy() {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed = true;

        this.running = false;

        this.dragon?.destroy();
        this.dragon = null;

        for (const sprite of this.dustPool) {
            sprite.destroy();
        }

        this.dustPool = [];

        this.scene = null;
        this.ground = null;
        this.getEnemies = () => [];
    }
}
