/*
 * Multiplicador de dano, acumulable.
 *
 * Hay dos recogibles de x2 repartidos por la partida, uno en la ronda
 * 3 y otro en la 5. Cada uno que se recoge dobla el dano otra vez:
 * con uno se va a x2 y con los dos a x4. Al jugador que se salto el
 * primero, el segundo le deja en x2 a secas, porque es el unico que
 * lleva.
 *
 * Guarda cuantos lleva recogidos y lo muestra arriba a la izquierda,
 * junto a la barra de vida, siempre en el mismo sitio: el letrero
 * pasa de "x2" a "x4" ahi mismo. Lo consultan todas las fuentes de
 * dano del jugador (golpe cuerpo a cuerpo y shuriken) y el marcador.
 *
 * El estado vive en la escena, no en el modulo. Eso es intencionado:
 * al morir, GameScene se reinicia y el multiplicador se pierde con
 * ella, que es justo lo que se pide. Si fuera una variable de modulo
 * sobreviviria entre partidas.
 */

/*
 * Posicion del indicador: a la derecha de la barra de vida del
 * jugador, que mide 170x16 y arranca en el margen superior izquierdo.
 */
const MARGIN_X = 16;
const BAR_WIDTH = 170;
const GAP = 18;
const LABEL_Y = 24;

/*
 * Por encima de la accion, como el letrero de ronda.
 */
const DEPTH = 1000;

/*
 * Aspecto segun cuantos se lleven. El x4 no es el x2 con otro numero:
 * cambia de color y de tamano, para que de un vistazo se vea que es
 * otra cosa y no haya que leer la cifra en mitad de la pelea.
 */
const STACK_STYLES = [
    null,

    {
        color: "#ffd24a",
        fontSize: "28px"
    },

    {
        color: "#ff3b6b",
        fontSize: "36px"
    }
];


export default class DamageBoost {
    constructor(
        scene,
        configuration = {}
    ) {
        this.scene = scene;

        /*
         * Lo que dobla cada recogible.
         */
        this.multiplier =
            Math.max(
                1,
                Number(configuration.multiplier) || 2
            );

        /*
         * Cuantos se pueden acumular. Son dos: el de la ronda 3 y el
         * de la 5.
         */
        this.maximumStacks =
            Math.max(
                1,
                Math.floor(
                    Number(configuration.maximumStacks)
                ) || (STACK_STYLES.length - 1)
            );

        this.depth =
            Number.isFinite(
                Number(configuration.depth)
            )
                ? Number(configuration.depth)
                : DEPTH;

        /*
         * Cuantos lleva recogidos: 0, 1 o 2.
         */
        this.stacks = 0;

        this.label = null;

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

        this.label?.destroy();

        this.label =
            this.scene.add
                .text(
                    0,
                    0,
                    `x${this.multiplier}`,
                    {
                        fontFamily: "monospace",
                        fontSize: "28px",
                        color: "#ffd24a",
                        stroke: "#000000",
                        strokeThickness: 6
                    }
                )
                .setOrigin(0, 0.5)
                .setDepth(this.depth)
                .setScrollFactor(0)
                .setVisible(false);

        this.reposition();
    }

    reposition() {
        this.label?.setPosition(
            MARGIN_X + BAR_WIDTH + GAP,
            LABEL_Y
        );
    }

    // =========================================================
    // Estado
    // =========================================================

    isActive() {
        return this.stacks > 0;
    }

    getStacks() {
        return this.stacks;
    }

    isAtMaximum() {
        return this.stacks >= this.maximumStacks;
    }

    /*
     * Factor por el que hay que multiplicar el dano y la puntuacion.
     * Cada recogible dobla: 1 sin ninguno, 2 con uno, 4 con los dos.
     */
    getMultiplier() {
        return Math.pow(
            this.multiplier,
            this.stacks
        );
    }

    /*
     * Suma un recogible. Devuelve false si ya estaban todos, para que
     * el recogible no se de por usado sin que pase nada.
     */
    activate() {
        if (
            this.isDestroyed ||
            this.isAtMaximum()
        ) {
            return false;
        }

        this.stacks += 1;

        this.applyStyle();

        this.label?.setVisible(true);

        /*
         * Un golpe de escala al recogerlo, para que se note el salto
         * y no pase desapercibido en mitad de la accion. Al pasar de
         * x2 a x4 es lo que avisa de que el numero ha cambiado.
         */
        if (this.label && this.scene?.tweens) {
            this.label.setScale(1.8);

            this.scene.tweens.add({
                targets: this.label,
                scale: 1,
                duration: 260,
                ease: "Back.easeOut"
            });
        }

        return true;
    }

    /*
     * Pone el letrero al dia: la cifra, y el color y el tamano que le
     * tocan a ese nivel.
     */
    applyStyle() {
        if (!this.label) {
            return;
        }

        this.label.setText(
            `x${this.getMultiplier()}`
        );

        const style =
            STACK_STYLES[
                Math.min(
                    this.stacks,
                    STACK_STYLES.length - 1
                )
            ];

        if (!style) {
            return;
        }

        this.label.setColor?.(style.color);

        this.label.setFontSize?.(style.fontSize);
    }

    reset() {
        this.stacks = 0;

        this.applyStyle();

        this.label
            ?.setVisible(false)
            ?.setScale(1);
    }

    // =========================================================
    // Resize
    // =========================================================

    handleResize() {
        if (this.isDestroyed) {
            return;
        }

        this.reposition();
    }

    // =========================================================
    // Destrucción
    // =========================================================

    destroy() {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed = true;

        this.label?.destroy();
        this.label = null;

        this.scene = null;
    }
}
