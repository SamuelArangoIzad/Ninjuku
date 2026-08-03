export default class RetroButton {
    constructor(
        scene,
        configuration = {}
    ) {
        this.scene =
            scene ?? null;

        this.label =
            String(
                configuration.label ??
                "BOTÓN"
            );

        this.action =
            typeof configuration.action ===
                "function"
                ? configuration.action
                : null;

        this.width =
            Math.max(
                80,
                Number(
                    configuration.width
                ) || 280
            );

        this.height =
            Math.max(
                38,
                Number(
                    configuration.height
                ) || 58
            );

        this.fontSize =
            Math.max(
                10,
                Number(
                    configuration.fontSize
                ) || 24
            );

        this.depth =
            Number(
                configuration.depth
            ) || 1000;

        this.selected =
            false;

        this.enabled =
            configuration.enabled ??
            true;

        this.visible =
            configuration.visible ??
            true;

        this.isDestroyed =
            false;

        this.container =
            scene.add.container(
                configuration.x ?? 0,
                configuration.y ?? 0
            );

        this.container
            .setDepth(
                this.depth
            )
            .setVisible(
                this.visible
            );

        this.shadow =
            scene.add.rectangle(
                4,
                5,
                this.width,
                this.height,
                0x000000,
                0.6
            );

        this.background =
            scene.add.rectangle(
                0,
                0,
                this.width,
                this.height,
                0x090d18,
                0.96
            );

        this.background.setStrokeStyle(
            2,
            0x58657a,
            1
        );

        this.text =
            scene.add.text(
                0,
                0,
                this.label,
                {
                    fontFamily:
                        "monospace",

                    fontSize:
                        `${this.fontSize}px`,

                    fontStyle:
                        "bold",

                    color:
                        "#b9c1cd",

                    stroke:
                        "#000000",

                    strokeThickness:
                        Math.max(
                            2,
                            Math.round(
                                this.fontSize * 0.14
                            )
                        ),

                    align:
                        "center"
                }
            )
                .setOrigin(
                    0.5
                );

        this.hitArea =
            scene.add.rectangle(
                0,
                0,
                this.width,
                this.height,
                0xffffff,
                0.001
            )
                .setInteractive({
                    useHandCursor:
                        true
                });

        this.container.add([
            this.shadow,
            this.background,
            this.text,
            this.hitArea
        ]);

        this.registerPointerEvents();
        this.refreshAppearance();
    }

    // =========================================================
    // Entrada
    // =========================================================

    registerPointerEvents() {
        this.hitArea.on(
            "pointerover",
            () => {
                if (
                    this.isDestroyed ||
                    !this.enabled
                ) {
                    return;
                }

                this.setSelected(
                    true
                );

                this.container.emit(
                    "focus",
                    this
                );
            }
        );

        this.hitArea.on(
            "pointerout",
            () => {
                if (
                    this.isDestroyed ||
                    !this.enabled
                ) {
                    return;
                }

                this.container.emit(
                    "blur",
                    this
                );
            }
        );

        this.hitArea.on(
            "pointerdown",
            () => {
                if (
                    this.isDestroyed ||
                    !this.enabled
                ) {
                    return;
                }

                this.background.setScale(
                    0.97
                );

                this.text.setScale(
                    0.97
                );
            }
        );

        this.hitArea.on(
            "pointerup",
            () => {
                if (
                    this.isDestroyed ||
                    !this.enabled
                ) {
                    return;
                }

                this.background.setScale(
                    1
                );

                this.text.setScale(
                    1
                );

                this.execute();
            }
        );

        this.hitArea.on(
            "pointerupoutside",
            () => {
                this.background
                    ?.setScale(
                        1
                    );

                this.text
                    ?.setScale(
                        1
                    );
            }
        );
    }

    execute() {
        if (
            this.isDestroyed ||
            !this.enabled
        ) {
            return false;
        }

        this.action?.();

        return true;
    }

    // =========================================================
    // Diseño
    // =========================================================

    setLayout({
        x,
        y,
        width,
        height,
        fontSize
    } = {}) {
        if (this.isDestroyed) {
            return this;
        }

        if (
            Number.isFinite(x) ||
            Number.isFinite(y)
        ) {
            this.setPosition(
                Number.isFinite(x)
                    ? x
                    : this.container.x,

                Number.isFinite(y)
                    ? y
                    : this.container.y
            );
        }

        if (
            Number.isFinite(width) ||
            Number.isFinite(height)
        ) {
            this.setSize(
                Number.isFinite(width)
                    ? width
                    : this.width,

                Number.isFinite(height)
                    ? height
                    : this.height
            );
        }

        if (
            Number.isFinite(fontSize)
        ) {
            this.setFontSize(
                fontSize
            );
        }

        return this;
    }

    setPosition(x, y) {
        if (
            this.isDestroyed ||
            !this.container
        ) {
            return this;
        }

        this.container.setPosition(
            Math.round(
                Number(x) || 0
            ),
            Math.round(
                Number(y) || 0
            )
        );

        return this;
    }

    setSize(width, height) {
        if (this.isDestroyed) {
            return this;
        }

        this.width =
            Math.max(
                80,
                Number(width) || 80
            );

        this.height =
            Math.max(
                38,
                Number(height) || 38
            );

        this.shadow?.setSize(
            this.width,
            this.height
        );

        this.background?.setSize(
            this.width,
            this.height
        );

        this.hitArea?.setSize(
            this.width,
            this.height
        );

        this.hitArea?.input?.hitArea?.setTo(
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height
        );

        return this;
    }

    setFontSize(fontSize) {
        if (
            this.isDestroyed ||
            !this.text
        ) {
            return this;
        }

        this.fontSize =
            Math.max(
                10,
                Number(fontSize) || 10
            );

        this.text.setFontSize(
            this.fontSize
        );

        this.text.setStroke(
            "#000000",
            Math.max(
                2,
                Math.round(
                    this.fontSize * 0.14
                )
            )
        );

        return this;
    }

    setLabel(label) {
        if (
            this.isDestroyed ||
            !this.text
        ) {
            return this;
        }

        this.label =
            String(
                label ?? ""
            );

        this.text.setText(
            this.label
        );

        return this;
    }

    // =========================================================
    // Estado
    // =========================================================

    setSelected(selected) {
        if (this.isDestroyed) {
            return this;
        }

        const nextSelected =
            Boolean(selected);

        if (
            this.selected ===
            nextSelected
        ) {
            return this;
        }

        this.selected =
            nextSelected;

        this.refreshAppearance();

        return this;
    }

    setEnabled(enabled) {
        if (this.isDestroyed) {
            return this;
        }

        this.enabled =
            Boolean(enabled);

        this.refreshAppearance();

        return this;
    }

    setVisible(visible) {
        if (
            this.isDestroyed ||
            !this.container
        ) {
            return this;
        }

        this.visible =
            Boolean(visible);

        this.container.setVisible(
            this.visible
        );

        return this;
    }

    refreshAppearance() {
        if (
            this.isDestroyed ||
            !this.background ||
            !this.text
        ) {
            return;
        }

        if (!this.enabled) {
            this.background
                .setFillStyle(
                    0x080808,
                    0.8
                )
                .setStrokeStyle(
                    2,
                    0x333333,
                    1
                );

            this.text.setColor(
                "#555555"
            );

            return;
        }

        if (this.selected) {
            this.background
                .setFillStyle(
                    0x17243a,
                    1
                )
                .setStrokeStyle(
                    3,
                    0xd4aa3a,
                    1
                );

            this.text.setColor(
                "#ffffff"
            );

            return;
        }

        this.background
            .setFillStyle(
                0x090d18,
                0.96
            )
            .setStrokeStyle(
                2,
                0x58657a,
                1
            );

        this.text.setColor(
            "#b9c1cd"
        );
    }

    getContainer() {
        return this.container;
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

        this.hitArea
            ?.removeAllListeners();

        this.container
            ?.removeAllListeners();

        this.container
            ?.destroy(
                true
            );

        this.container =
            null;

        this.shadow =
            null;

        this.background =
            null;

        this.text =
            null;

        this.hitArea =
            null;

        this.action =
            null;

        this.scene =
            null;
    }
}