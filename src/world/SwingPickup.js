/*
 * Objeto que flota junto a un colgante y se recoge balanceandose.
 *
 * Va montado sobre un punto de enganche, dentro del arco que barre el
 * ninja al abrirse, para que haya que colgarse de verdad para
 * cogerlo. No se alcanza desde el suelo.
 *
 * La clase es generica: lo que cambia entre un recogible y otro es el
 * dibujo, la ronda en la que aparece y que hace al recogerse. Ahora
 * mismo hay dos, el multiplicador de dano y el corazon de vida.
 */

/*
 * Posicion dentro del arco, en pixeles del dibujo de balanceo.
 *
 * Es la postura de media apertura: el ninja pasa por ahi al abrirse,
 * asi que queda al alcance pero obliga a balancearse.
 */
const ARC_OFFSET_X = 168;
const ARC_OFFSET_Y = 260;

/*
 * Escala del dibujo de balanceo respecto al jugador, y alto de su
 * caja. Con ambos se pasa el punto del arco a coordenadas del mundo.
 */
const GRAPPLE_ART = 1 / 1.82;
const PLAYER_BODY_HEIGHT = 70;

/*
 * Radio de recogida. Generoso a proposito: el jugador pasa por el
 * punto a buena velocidad y fallar por unos pixeles se siente injusto.
 */
const PICKUP_RADIUS = 62;

/*
 * Vaiven del texto, para que se vea que es un objeto y no decoracion.
 */
const FLOAT_AMPLITUDE = 7;
const FLOAT_SPEED = 0.004;

/*
 * Margen al borde de la pantalla.
 *
 * Las fuentes de ganchos publican tambien los que estan algo fuera de
 * cuadro, porque al kusarigama le sirven para engancharse justo al
 * entrar. A un recogible no: si se pega a uno de esos, se dibuja fuera
 * de camara y el jugador no lo ve. Asi que aqui solo valen los que
 * dejan el objeto bien dentro.
 */
const EDGE_MARGIN = 80;


export default class SwingPickup {
    constructor(
        scene,
        configuration = {}
    ) {
        this.scene = scene;

        this.hookSource =
            configuration.hookSource ??
            null;

        this.getPlayerSprite =
            configuration.getPlayerSprite ??
            (() => null);

        this.getRound =
            configuration.getRound ??
            (() => 1);

        /*
         * Ronda a partir de la cual aparece.
         */
        this.availableFromRound =
            Math.max(
                1,
                Number(configuration.availableFromRound) || 1
            );

        this.label =
            configuration.label ?? "?";

        this.color =
            configuration.color ?? "#ffd24a";

        this.fontSize =
            configuration.fontSize ?? "34px";

        /*
         * Si devuelve false, el objeto sigue ahi sin poder cogerse.
         * Lo usa el corazon para no desperdiciarse a vida llena.
         */
        this.canCollect =
            configuration.canCollect ??
            (() => true);

        /*
         * Que pasa al recogerlo. Si devuelve false, no se considera
         * recogido y sigue disponible.
         */
        this.onCollect =
            configuration.onCollect ??
            (() => true);

        /*
         * Si devuelve true, el objeto ya no vuelve a salir.
         */
        this.isSpent =
            configuration.isSpent ??
            (() => false);

        /*
         * Gancho que esta ocupando otro recogible. Se evita, para que
         * los dos no se dibujen uno encima del otro.
         */
        this.avoidHookId =
            configuration.avoidHookId ??
            (() => null);

        /*
         * Orden de preferencia entre los ganchos validos. Solo sirve
         * para repartirlos cuando hay varios libres.
         */
        this.hookPreference =
            Math.max(
                0,
                Math.floor(
                    Number(configuration.hookPreference) || 0
                )
            );

        /*
         * Lado del arco que ocupa: -1 el de la izquierda, +1 el de la
         * derecha. El ninja barre los dos al balancearse, asi que los
         * dos quedan al alcance. Dando un lado a cada recogible, nunca
         * se dibujan uno encima del otro aunque compartan colgante.
         */
        this.arcSide =
            Number(configuration.arcSide) < 0
                ? -1
                : 1;

        this.depth =
            Number.isFinite(
                Number(configuration.depth)
            )
                ? Number(configuration.depth)
                : 20;

        this.text = null;

        /*
         * Gancho al que esta pegado ahora mismo.
         */
        this.hookId = null;

        /*
         * Lado del arco que esta usando ahora mismo. Puede ser el
         * contrario al preferido, si por ese el objeto se saldria de
         * la pantalla.
         */
        this.activeSide = this.arcSide;

        this.elapsed = 0;

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

        this.text?.destroy();

        this.text =
            this.scene.add
                .text(
                    0,
                    0,
                    this.label,
                    {
                        fontFamily: "monospace",
                        fontSize: this.fontSize,
                        color: this.color,
                        stroke: "#000000",
                        strokeThickness: 7
                    }
                )
                .setOrigin(0.5)
                .setDepth(this.depth)
                .setVisible(false);
    }

    // =========================================================
    // Update
    // =========================================================

    update(delta) {
        if (
            this.isDestroyed ||
            !this.text
        ) {
            return;
        }

        if (!this.shouldBeAvailable()) {
            this.hide();

            return;
        }

        const hook = this.resolveHook();

        if (!hook) {
            this.hide();

            return;
        }

        this.elapsed +=
            Number.isFinite(delta) ? delta : 0;

        this.activeSide =
            this.resolveSide(hook) ||
            this.arcSide;

        const position =
            this.getWorldPosition(hook);

        const bob =
            Math.sin(this.elapsed * FLOAT_SPEED) *
            FLOAT_AMPLITUDE;

        this.text
            .setPosition(
                position.x,
                position.y + bob
            )
            .setVisible(true);

        this.checkPickup(position);
    }

    shouldBeAvailable() {
        if (this.isSpent()) {
            return false;
        }

        const round =
            Math.floor(
                Number(this.getRound()) || 1
            );

        return round >= this.availableFromRound;
    }

    /*
     * Se queda pegado al mismo gancho mientras siga siendo valido, es
     * decir mientras exista y quede dentro de la pantalla. En cuanto
     * se va de cuadro salta a otro, para que el objeto nunca se quede
     * dibujado donde no se ve.
     */
    resolveHook() {
        const actual =
            this.hookId
                ? this.hookSource
                    ?.findHookById?.(this.hookId)
                : null;

        if (
            actual &&
            this.isHookUsable(actual)
        ) {
            return actual;
        }

        const hooks =
            (this.hookSource?.getHooks?.() ?? [])
                .filter(
                    (hook) =>
                        this.isHookUsable(hook)
                );

        if (hooks.length === 0) {
            this.hookId = null;

            return null;
        }

        /*
         * El que ocupa el otro recogible va al final: se usa solo si
         * no queda ninguno libre.
         */
        const ocupado = this.avoidHookId();

        const libres =
            hooks.filter(
                (hook) => hook.id !== ocupado
            );

        const candidatos =
            libres.length > 0
                ? libres
                : hooks;

        const elegido =
            candidatos[
                Math.min(
                    this.hookPreference,
                    candidatos.length - 1
                )
            ];

        this.hookId = elegido?.id ?? null;

        return elegido ?? null;
    }

    /*
     * Un gancho sirve si por alguno de los dos lados del arco el
     * objeto queda holgadamente dentro de la pantalla.
     */
    isHookUsable(hook) {
        return this.resolveSide(hook) !== 0;
    }

    /*
     * Lado del arco por el que este gancho vale, o 0 si no vale por
     * ninguno. Se prueba primero el lado propio; el contrario solo se
     * usa si el colgante no lo esta ocupando el otro recogible, para
     * no dibujar los dos en el mismo punto.
     */
    resolveSide(hook) {
        if (!hook) {
            return 0;
        }

        if (
            this.fitsOnScreen(
                this.getWorldPosition(
                    hook,
                    this.arcSide
                )
            )
        ) {
            return this.arcSide;
        }

        if (hook.id === this.avoidHookId()) {
            return 0;
        }

        if (
            this.fitsOnScreen(
                this.getWorldPosition(
                    hook,
                    -this.arcSide
                )
            )
        ) {
            return -this.arcSide;
        }

        return 0;
    }

    fitsOnScreen(position) {
        const width =
            Number(this.scene?.scale?.width) ||
            1280;

        return (
            position.x > EDGE_MARGIN &&
            position.x < width - EDGE_MARGIN &&
            position.y > EDGE_MARGIN
        );
    }

    /*
     * Punto del arco, en coordenadas del mundo.
     */
    getWorldPosition(hook, side = null) {
        const lado =
            Number(side) || this.activeSide;

        const player = this.getPlayerSprite();

        const scale =
            Number(player?.scaleX) || 0.85;

        const art = scale * GRAPPLE_ART;

        return {
            x:
                hook.x +
                (
                    ARC_OFFSET_X *
                    art *
                    lado
                ),

            y:
                hook.y +
                (ARC_OFFSET_Y * art) -
                (
                    (PLAYER_BODY_HEIGHT / 2) *
                    scale
                )
        };
    }

    checkPickup(position) {
        if (!this.canCollect()) {
            return;
        }

        const player = this.getPlayerSprite();

        const body = player?.body;

        if (
            !player?.active ||
            !body
        ) {
            return;
        }

        const centerX =
            body.left + (body.width / 2);

        const centerY =
            body.top + (body.height / 2);

        const distance =
            Math.hypot(
                centerX - position.x,
                centerY - position.y
            );

        if (distance > PICKUP_RADIUS) {
            return;
        }

        if (this.onCollect() !== false) {
            this.hide();
        }
    }

    hide() {
        this.text?.setVisible(false);
    }

    // =========================================================
    // Consultas
    // =========================================================

    isVisible() {
        return Boolean(this.text?.visible);
    }

    getHookId() {
        return this.hookId;
    }

    // =========================================================
    // Destrucción
    // =========================================================

    destroy() {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed = true;

        this.text?.destroy();
        this.text = null;

        this.scene = null;
        this.hookSource = null;
        this.getPlayerSprite = () => null;
    }
}
