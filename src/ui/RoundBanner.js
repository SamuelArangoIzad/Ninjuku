/*
 * Letrero que anuncia la ronda que entra.
 *
 * Aparece centrado, se mantiene un momento y se va. No interrumpe la
 * partida: el escenario sigue avanzando y el jugador puede moverse
 * mientras lo lee, que es lo normal en un juego de accion.
 */

/*
 * Tiempos del letrero, en milisegundos.
 */
const FADE_IN = 220;
const HOLD = 1400;
const FADE_OUT = 420;

/*
 * Por encima de todo lo demas: jugador (10) y enemigos (9).
 */
const DEPTH = 1000;


export default class RoundBanner {
    constructor(
        scene,
        configuration = {}
    ) {
        this.scene = scene;

        this.depth =
            Number.isFinite(
                Number(configuration.depth)
            )
                ? Number(configuration.depth)
                : DEPTH;

        this.title = null;
        this.subtitle = null;

        this.tween = null;
        this.timer = null;

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

        this.destroyObjects();

        this.title =
            this.scene.add
                .text(
                    0,
                    0,
                    "",
                    {
                        fontFamily:
                            "monospace",

                        fontSize: "64px",
                        color: "#ffffff",
                        stroke: "#000000",
                        strokeThickness: 8,
                        align: "center"
                    }
                )
                .setOrigin(0.5)
                .setDepth(this.depth)
                .setScrollFactor(0)
                .setAlpha(0);

        this.subtitle =
            this.scene.add
                .text(
                    0,
                    0,
                    "",
                    {
                        fontFamily:
                            "monospace",

                        fontSize: "24px",
                        color: "#ffd77a",
                        stroke: "#000000",
                        strokeThickness: 5,
                        align: "center"
                    }
                )
                .setOrigin(0.5)
                .setDepth(this.depth)
                .setScrollFactor(0)
                .setAlpha(0);

        this.reposition();
    }

    reposition() {
        const width =
            this.scene?.scale?.width ?? 0;

        const height =
            this.scene?.scale?.height ?? 0;

        const centerX = width / 2;

        /*
         * Un poco por encima del centro, para no taparle al jugador
         * la zona donde esta la accion.
         */
        const centerY = height * 0.34;

        this.title?.setPosition(
            centerX,
            centerY
        );

        this.subtitle?.setPosition(
            centerX,
            centerY + 52
        );
    }

    // =========================================================
    // Mostrar
    // =========================================================

    showRound(number, enemies) {
        const detalle =
            Number.isFinite(enemies) && enemies > 0
                ? `${enemies} enemigos`
                : "";

        this.show(
            `RONDA ${number}`,
            detalle
        );
    }

    showFinished(rounds) {
        this.show(
            "¡COMPLETADO!",
            `${rounds} rondas superadas`
        );
    }

    show(titleText, subtitleText = "") {
        if (
            this.isDestroyed ||
            !this.title ||
            !this.subtitle
        ) {
            return;
        }

        this.clearAnimation();

        this.reposition();

        this.title.setText(titleText);
        this.subtitle.setText(subtitleText);

        this.title.setAlpha(0);
        this.subtitle.setAlpha(0);

        const targets = [
            this.title,
            this.subtitle
        ];

        this.tween =
            this.scene.tweens.add({
                targets,
                alpha: 1,
                duration: FADE_IN,

                onComplete: () => {
                    this.tween = null;

                    this.timer =
                        this.scene.time
                            .delayedCall(
                                HOLD,
                                () => {
                                    this.timer = null;

                                    this.fadeOut(
                                        targets
                                    );
                                }
                            );
                }
            });
    }

    fadeOut(targets) {
        if (
            this.isDestroyed ||
            !this.scene
        ) {
            return;
        }

        this.tween =
            this.scene.tweens.add({
                targets,
                alpha: 0,
                duration: FADE_OUT,

                onComplete: () => {
                    this.tween = null;
                }
            });
    }

    clearAnimation() {
        this.tween?.remove?.();
        this.tween = null;

        this.timer?.remove?.(false);
        this.timer = null;
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

    destroyObjects() {
        this.clearAnimation();

        this.title?.destroy();
        this.title = null;

        this.subtitle?.destroy();
        this.subtitle = null;
    }

    destroy() {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed = true;

        this.destroyObjects();

        this.scene = null;
    }
}
