export default class ScoreHUD {
    constructor(
        scene,
        configuration = {}
    ) {
        this.scene =
            scene ?? null;

        this.marginRight =
            Math.max(
                0,
                Number(
                    configuration.marginRight
                ) || 22
            );

        this.marginTop =
            Math.max(
                0,
                Number(
                    configuration.marginTop
                ) || 18
            );

        this.maximumDigits =
            Math.max(
                1,
                Math.floor(
                    Number(
                        configuration.maximumDigits
                    ) || 6
                )
            );

        this.currentScore =
            -1;

        this.lastWidth =
            null;

        this.visible =
            true;

        this.isDestroyed =
            false;

        this.container =
            scene.add.container(
                0,
                0
            );

        this.container
            .setDepth(
                5000
            )
            .setScrollFactor(
                0
            );

        this.titleText =
            scene.add.text(
                0,
                0,
                "SCORE",
                {
                    fontFamily:
                        "monospace",

                    fontSize:
                        "18px",

                    fontStyle:
                        "bold",

                    color:
                        "#ffffff",

                    stroke:
                        "#000000",

                    strokeThickness:
                        4
                }
            )
                .setOrigin(
                    1,
                    0
                );

        this.valueText =
            scene.add.text(
                0,
                20,
                "0".repeat(
                    this.maximumDigits
                ),
                {
                    fontFamily:
                        "monospace",

                    fontSize:
                        "25px",

                    fontStyle:
                        "bold",

                    color:
                        "#ffffff",

                    stroke:
                        "#000000",

                    strokeThickness:
                        5
                }
            )
                .setOrigin(
                    1,
                    0
                );

        this.container.add([
            this.titleText,
            this.valueText
        ]);

        this.setScore(
            configuration.initialScore ??
            0,
            false
        );

        this.handleResize(
            scene.scale.gameSize
        );
    }

    // =========================================================
    // Puntaje
    // =========================================================

    setScore(
        score,
        animate = true
    ) {
        if (
            this.isDestroyed ||
            !this.valueText
        ) {
            return false;
        }

        const safeScore =
            Math.max(
                0,
                Math.floor(
                    Number(score) || 0
                )
            );

        /*
         * No se actualiza el texto ni se crea un tween
         * si el puntaje es idéntico.
         */
        if (
            safeScore ===
            this.currentScore
        ) {
            return false;
        }

        this.currentScore =
            safeScore;

        const formattedScore =
            String(
                safeScore
            ).padStart(
                this.maximumDigits,
                "0"
            );

        this.valueText.setText(
            formattedScore
        );

        if (animate) {
            this.playScoreEffect();
        }

        return true;
    }

    getScore() {
        return Math.max(
            0,
            this.currentScore
        );
    }

    // =========================================================
    // Efecto
    // =========================================================

    playScoreEffect() {
        if (
            this.isDestroyed ||
            !this.scene ||
            !this.valueText
        ) {
            return;
        }

        this.scene.tweens
            .killTweensOf(
                this.valueText
            );

        this.valueText.setScale(
            1.15
        );

        this.scene.tweens.add({
            targets:
                this.valueText,

            scaleX:
                1,

            scaleY:
                1,

            duration:
                120,

            ease:
                "Quad.Out"
        });
    }

    // =========================================================
    // Responsive
    // =========================================================

    handleResize(gameSize) {
        if (
            this.isDestroyed ||
            !gameSize ||
            !this.container
        ) {
            return;
        }

        const width =
            Math.max(
                1,
                Math.round(
                    Number(
                        gameSize.width
                    ) || 1
                )
            );

        if (
            width ===
            this.lastWidth
        ) {
            return;
        }

        this.lastWidth =
            width;

        this.container.setPosition(
            width -
            this.marginRight,
            this.marginTop
        );
    }

    // =========================================================
    // Visibilidad
    // =========================================================

    setVisible(visible) {
        if (
            this.isDestroyed ||
            !this.container
        ) {
            return;
        }

        const nextVisible =
            Boolean(visible);

        if (
            this.visible ===
            nextVisible
        ) {
            return;
        }

        this.visible =
            nextVisible;

        this.container.setVisible(
            nextVisible
        );
    }

    // =========================================================
    // Destrucción
    // =========================================================

    destroy() {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed =
            true;

        this.scene
            ?.tweens
            ?.killTweensOf(
                this.valueText
            );

        this.container
            ?.destroy(
                true
            );

        this.container =
            null;

        this.titleText =
            null;

        this.valueText =
            null;

        this.scene =
            null;

        this.lastWidth =
            null;
    }
}