/*
 * Multiplicador de dano x2.
 *
 * Guarda si esta activo y lo muestra arriba a la izquierda, junto a la
 * barra de vida. Lo consultan todas las fuentes de dano del jugador
 * (golpe cuerpo a cuerpo y shuriken) y el marcador.
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


export default class DamageBoost {
    constructor(
        scene,
        configuration = {}
    ) {
        this.scene = scene;

        this.multiplier =
            Math.max(
                1,
                Number(configuration.multiplier) || 2
            );

        this.depth =
            Number.isFinite(
                Number(configuration.depth)
            )
                ? Number(configuration.depth)
                : DEPTH;

        this.active = false;

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
        return this.active;
    }

    /*
     * Factor por el que hay que multiplicar el dano y la puntuacion.
     * Vale 1 mientras no se haya recogido el multiplicador.
     */
    getMultiplier() {
        return this.active
            ? this.multiplier
            : 1;
    }

    activate() {
        if (
            this.isDestroyed ||
            this.active
        ) {
            return false;
        }

        this.active = true;

        this.label?.setVisible(true);

        /*
         * Un golpe de escala al aparecer, para que se note que se ha
         * recogido algo y no pase desapercibido en mitad de la
         * accion.
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

    reset() {
        this.active = false;

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
