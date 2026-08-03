import Phaser from "phaser";

import HighScoreSystem
    from "../systems/HighScoreSystem.js";

import RetroButton
    from "../ui/RetroButton.js";


export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({
            key: "MenuScene"
        });

        this.highScoreSystem =
            null;

        this.backgroundGraphics =
            null;

        this.scanlineGraphics =
            null;

        this.vignetteGraphics =
            null;

        this.titleText =
            null;

        this.subtitleText =
            null;

        this.pressStartText =
            null;

        this.menuButtons = [];

        this.scoreContainer =
            null;

        this.scoreBackground =
            null;

        this.scoreTitleText =
            null;

        this.scoreRows = [];

        this.scoreBackButton =
            null;

        this.footerText =
            null;

        this.selectedIndex =
            0;

        this.menuMode =
            "START_SCREEN";

        this.cursors =
            null;

        this.enterKey =
            null;

        this.spaceKey =
            null;

        this.escapeKey =
            null;

        this.nextInputTime =
            0;

        this.inputCooldown =
            160;

        this.resizeHandler =
            null;

        this.titleTween =
            null;

        this.pressStartTween =
            null;

        this.isTransitioning =
            false;

        this.isDestroyed =
            false;

        this.layout =
            null;
    }

    // =========================================================
    // Create
    // =========================================================

    create() {
        this.isDestroyed =
            false;

        this.isTransitioning =
            false;

        this.selectedIndex =
            0;

        this.highScoreSystem =
            new HighScoreSystem({
                storageKey:
                    "ninjuku_highscores",

                maximumEntries:
                    10,

                maximumNameLength:
                    10
            });

        this.createBackground();
        this.createTitle();
        this.createMenu();
        this.createScorePanel();
        this.createFooter();
        this.createInput();
        this.createTweens();
        this.registerEvents();

        this.showStartScreen();

        this.cameras.main.fadeIn(
            250,
            0,
            0,
            0
        );
    }

    // =========================================================
    // Layout
    // =========================================================

    calculateLayout(
        gameSize =
            this.scale.gameSize
    ) {
        const width =
            Math.max(
                1,
                Number(
                    gameSize?.width ??
                    this.scale.width
                ) || 1
            );

        const height =
            Math.max(
                1,
                Number(
                    gameSize?.height ??
                    this.scale.height
                ) || 1
            );

        const landscape =
            width >= height;

        const shortest =
            Math.min(
                width,
                height
            );

        const safeMargin =
            Phaser.Math.Clamp(
                shortest * 0.045,
                12,
                42
            );

        const usableWidth =
            Math.max(
                1,
                width -
                safeMargin * 2
            );

        const usableHeight =
            Math.max(
                1,
                height -
                safeMargin * 2
            );

        const scale =
            Phaser.Math.Clamp(
                Math.min(
                    usableWidth / 900,
                    usableHeight / 520
                ),
                0.48,
                1.45
            );

        const titleFont =
            Phaser.Math.Clamp(
                Math.round(
                    shortest * (
                        landscape
                            ? 0.13
                            : 0.11
                    )
                ),
                34,
                92
            );

        const buttonWidth =
            Math.min(
                usableWidth * (
                    landscape
                        ? 0.52
                        : 0.86
                ),
                520
            );

        const buttonHeight =
            Phaser.Math.Clamp(
                shortest * 0.105,
                44,
                72
            );

        const panelWidth =
            Math.min(
                usableWidth,
                landscape
                    ? 620
                    : usableWidth * 0.98
            );

        const panelHeight =
            Math.min(
                usableHeight * 0.9,
                landscape
                    ? 470
                    : 610
            );

        return {
            width,
            height,
            landscape,
            scale,
            safeMargin,

            centerX:
                width * 0.5,

            centerY:
                height * 0.5,

            titleY:
                landscape
                    ? height * 0.19
                    : height * 0.17,

            titleFont,

            subtitleFont:
                Phaser.Math.Clamp(
                    Math.round(
                        titleFont * 0.28
                    ),
                    13,
                    24
                ),

            pressStartFont:
                Phaser.Math.Clamp(
                    Math.round(
                        shortest * 0.045
                    ),
                    14,
                    26
                ),

            menuCenterY:
                landscape
                    ? height * 0.61
                    : height * 0.58,

            buttonWidth,

            buttonHeight,

            buttonFont:
                Phaser.Math.Clamp(
                    Math.round(
                        buttonHeight * 0.39
                    ),
                    15,
                    28
                ),

            buttonGap:
                Phaser.Math.Clamp(
                    buttonHeight * 0.28,
                    12,
                    24
                ),

            panelWidth,

            panelHeight,

            panelTitleFont:
                Phaser.Math.Clamp(
                    Math.round(
                        shortest * 0.05
                    ),
                    16,
                    28
                ),

            rowFont:
                Phaser.Math.Clamp(
                    Math.round(
                        shortest * 0.035
                    ),
                    12,
                    20
                ),

            footerFont:
                Phaser.Math.Clamp(
                    Math.round(
                        shortest * 0.027
                    ),
                    10,
                    16
                )
        };
    }

    applyLayout(
        gameSize =
            this.scale.gameSize
    ) {
        if (this.isDestroyed) {
            return;
        }

        this.layout =
            this.calculateLayout(
                gameSize
            );

        const ui =
            this.layout;

        this.drawBackground();

        this.titleText
            ?.setPosition(
                ui.centerX,
                ui.titleY
            )
            .setFontSize(
                ui.titleFont
            )
            .setStroke(
                "#000000",
                Math.max(
                    5,
                    Math.round(
                        ui.titleFont * 0.13
                    )
                )
            );

        this.subtitleText
            ?.setPosition(
                ui.centerX,
                ui.titleY +
                    ui.titleFont * 0.72
            )
            .setFontSize(
                ui.subtitleFont
            )
            .setStroke(
                "#000000",
                Math.max(
                    3,
                    Math.round(
                        ui.subtitleFont * 0.22
                    )
                )
            );

        this.pressStartText
            ?.setPosition(
                ui.centerX,
                ui.landscape
                    ? ui.height * 0.66
                    : ui.height * 0.61
            )
            .setFontSize(
                ui.pressStartFont
            )
            .setStroke(
                "#000000",
                Math.max(
                    3,
                    Math.round(
                        ui.pressStartFont * 0.2
                    )
                )
            );

        this.layoutMenuButtons();
        this.layoutScorePanel();

        this.footerText
            ?.setPosition(
                ui.centerX,
                ui.height -
                    ui.safeMargin
            )
            .setFontSize(
                ui.footerFont
            );

        this.updateMenuSelection();
    }

    // =========================================================
    // Fondo
    // =========================================================

    createBackground() {
        this.backgroundGraphics =
            this.add.graphics()
                .setDepth(
                    -100
                );

        this.scanlineGraphics =
            this.add.graphics()
                .setDepth(
                    -90
                );

        this.vignetteGraphics =
            this.add.graphics()
                .setDepth(
                    -80
                );

        this.drawBackground();
    }

    drawBackground() {
        if (
            !this.backgroundGraphics ||
            !this.scanlineGraphics ||
            !this.vignetteGraphics
        ) {
            return;
        }

        const width =
            Math.max(
                1,
                this.scale.width
            );

        const height =
            Math.max(
                1,
                this.scale.height
            );

        this.backgroundGraphics.clear();

        this.backgroundGraphics.fillStyle(
            0x05070d,
            1
        );

        this.backgroundGraphics.fillRect(
            0,
            0,
            width,
            height
        );

        const bandHeight =
            Math.max(
                32,
                height / 9
            );

        for (
            let y = 0;
            y < height;
            y += bandHeight
        ) {
            const alternate =
                Math.floor(
                    y / bandHeight
                ) % 2 === 0;

            this.backgroundGraphics.fillStyle(
                alternate
                    ? 0x111a2c
                    : 0x080d18,
                0.78
            );

            this.backgroundGraphics.fillRect(
                0,
                y,
                width,
                bandHeight
            );
        }

        const gridSize =
            Phaser.Math.Clamp(
                Math.round(
                    Math.min(
                        width,
                        height
                    ) / 13
                ),
                24,
                70
            );

        this.backgroundGraphics.lineStyle(
            1,
            0x24436f,
            0.28
        );

        for (
            let x = 0;
            x <= width;
            x += gridSize
        ) {
            this.backgroundGraphics.lineBetween(
                x,
                0,
                x,
                height
            );
        }

        for (
            let y = 0;
            y <= height;
            y += gridSize
        ) {
            this.backgroundGraphics.lineBetween(
                0,
                y,
                width,
                y
            );
        }

        this.scanlineGraphics.clear();

        this.scanlineGraphics.fillStyle(
            0x000000,
            0.17
        );

        for (
            let y = 0;
            y < height;
            y += 4
        ) {
            this.scanlineGraphics.fillRect(
                0,
                y,
                width,
                2
            );
        }

        const border =
            Phaser.Math.Clamp(
                Math.min(
                    width,
                    height
                ) * 0.035,
                8,
                36
            );

        this.vignetteGraphics.clear();

        this.vignetteGraphics.fillStyle(
            0x000000,
            0.4
        );

        this.vignetteGraphics.fillRect(
            0,
            0,
            width,
            border
        );

        this.vignetteGraphics.fillRect(
            0,
            height - border,
            width,
            border
        );

        this.vignetteGraphics.fillRect(
            0,
            0,
            border,
            height
        );

        this.vignetteGraphics.fillRect(
            width - border,
            0,
            border,
            height
        );
    }

    // =========================================================
    // Título
    // =========================================================

    createTitle() {
        this.titleText =
            this.add.text(
                0,
                0,
                "NINJUKU",
                {
                    fontFamily:
                        "monospace",

                    fontSize:
                        "72px",

                    fontStyle:
                        "bold",

                    color:
                        "#f8f8f8",

                    stroke:
                        "#000000",

                    strokeThickness:
                        10
                }
            )
                .setOrigin(
                    0.5
                )
                .setDepth(
                    100
                );

        this.subtitleText =
            this.add.text(
                0,
                0,
                "SHADOW WARRIOR",
                {
                    fontFamily:
                        "monospace",

                    fontSize:
                        "20px",

                    fontStyle:
                        "bold",

                    color:
                        "#d4aa3a",

                    stroke:
                        "#000000",

                    strokeThickness:
                        4
                }
            )
                .setOrigin(
                    0.5
                )
                .setDepth(
                    100
                );

        this.pressStartText =
            this.add.text(
                0,
                0,
                "PRESIONA ENTER O TOCA",
                {
                    fontFamily:
                        "monospace",

                    fontSize:
                        "22px",

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
                    0.5
                )
                .setDepth(
                    100
                )
                .setInteractive({
                    useHandCursor:
                        true
                });

        this.pressStartText.on(
            "pointerdown",
            () => {
                this.openMainMenu();
            }
        );
    }

    // =========================================================
    // Menú
    // =========================================================

    createMenu() {
        this.menuButtons = [
            new RetroButton(
                this,
                {
                    label:
                        "JUGAR",

                    action:
                        () => {
                            this.startGame();
                        }
                }
            ),

            new RetroButton(
                this,
                {
                    label:
                        "MEJORES PUNTUACIONES",

                    action:
                        () => {
                            this.openScorePanel();
                        }
                }
            )
        ];

        for (
            let index = 0;
            index < this.menuButtons.length;
            index += 1
        ) {
            const button =
                this.menuButtons[index];

            button.getContainer().on(
                "focus",
                () => {
                    if (
                        this.menuMode !==
                        "MAIN_MENU"
                    ) {
                        return;
                    }

                    this.selectedIndex =
                        index;

                    this.updateMenuSelection();
                }
            );
        }
    }

    layoutMenuButtons() {
        if (
            !this.layout ||
            this.menuButtons.length === 0
        ) {
            return;
        }

        const ui =
            this.layout;

        const totalHeight =
            this.menuButtons.length *
                ui.buttonHeight +
            (
                this.menuButtons.length -
                1
            ) *
                ui.buttonGap;

        const startY =
            ui.menuCenterY -
            totalHeight / 2 +
            ui.buttonHeight / 2;

        for (
            let index = 0;
            index < this.menuButtons.length;
            index += 1
        ) {
            this.menuButtons[
                index
            ].setLayout({
                x:
                    ui.centerX,

                y:
                    startY +
                    index *
                    (
                        ui.buttonHeight +
                        ui.buttonGap
                    ),

                width:
                    ui.buttonWidth,

                height:
                    ui.buttonHeight,

                fontSize:
                    ui.buttonFont
            });
        }
    }

    updateMenuSelection() {
        if (
            this.menuButtons.length === 0
        ) {
            return;
        }

        this.selectedIndex =
            Phaser.Math.Wrap(
                this.selectedIndex,
                0,
                this.menuButtons.length
            );

        for (
            let index = 0;
            index < this.menuButtons.length;
            index += 1
        ) {
            this.menuButtons[
                index
            ].setSelected(
                index ===
                this.selectedIndex
            );
        }
    }

    executeSelectedMenuItem() {
        if (
            this.menuMode !==
                "MAIN_MENU" ||
            this.isTransitioning
        ) {
            return;
        }

        this.menuButtons[
            this.selectedIndex
        ]?.execute();
    }

    // =========================================================
    // Ranking
    // =========================================================

    createScorePanel() {
        this.scoreContainer =
            this.add.container(
                0,
                0
            )
                .setDepth(
                    500
                )
                .setVisible(
                    false
                );

        this.scoreBackground =
            this.add.rectangle(
                0,
                0,
                500,
                400,
                0x05070d,
                0.97
            );

        this.scoreBackground.setStrokeStyle(
            3,
            0xd4aa3a,
            1
        );

        this.scoreTitleText =
            this.add.text(
                0,
                0,
                "MEJORES PUNTUACIONES",
                {
                    fontFamily:
                        "monospace",

                    fontSize:
                        "26px",

                    fontStyle:
                        "bold",

                    color:
                        "#d4aa3a",

                    stroke:
                        "#000000",

                    strokeThickness:
                        4
                }
            )
                .setOrigin(
                    0.5
                );

        this.scoreContainer.add([
            this.scoreBackground,
            this.scoreTitleText
        ]);

        this.scoreBackButton =
            new RetroButton(
                this,
                {
                    label:
                        "VOLVER",

                    action:
                        () => {
                            this.closeScorePanel();
                        },

                    depth:
                        510
                }
            );

        this.createScoreRows();
    }

    createScoreRows() {
        this.clearScoreRows();

        const scores =
            this.highScoreSystem
                ?.getScores(
                    10
                ) ??
            [];

        if (scores.length === 0) {
            const emptyText =
                this.add.text(
                    0,
                    0,
                    "SIN PUNTUACIONES",
                    {
                        fontFamily:
                            "monospace",

                        fontSize:
                            "20px",

                        color:
                            "#9aa2ae",

                        stroke:
                            "#000000",

                        strokeThickness:
                            3
                    }
                )
                    .setOrigin(
                        0.5
                    );

            this.scoreRows.push(
                emptyText
            );

            this.scoreContainer.add(
                emptyText
            );

            this.layoutScorePanel();

            return;
        }

        for (
            let index = 0;
            index < scores.length;
            index += 1
        ) {
            const entry =
                scores[index];

            const position =
                String(
                    index + 1
                ).padStart(
                    2,
                    "0"
                );

            const name =
                String(
                    entry.name
                )
                    .slice(
                        0,
                        10
                    )
                    .padEnd(
                        10,
                        " "
                    );

            const score =
                String(
                    entry.score
                ).padStart(
                    7,
                    "0"
                );

            const row =
                this.add.text(
                    0,
                    0,
                    `${position}. ${name} ${score}`,
                    {
                        fontFamily:
                            "monospace",

                        fontSize:
                            "18px",

                        fontStyle:
                            index === 0
                                ? "bold"
                                : "normal",

                        color:
                            index === 0
                                ? "#ffffff"
                                : "#b7bec8",

                        stroke:
                            "#000000",

                        strokeThickness:
                            3
                    }
                )
                    .setOrigin(
                        0.5
                    );

            this.scoreRows.push(
                row
            );

            this.scoreContainer.add(
                row
            );
        }

        this.layoutScorePanel();
    }

    layoutScorePanel() {
        if (
            !this.layout ||
            !this.scoreContainer
        ) {
            return;
        }

        const ui =
            this.layout;

        const panelWidth =
            ui.panelWidth;

        const panelHeight =
            ui.panelHeight;

        this.scoreContainer.setPosition(
            ui.centerX,
            ui.centerY
        );

        this.scoreBackground.setSize(
            panelWidth,
            panelHeight
        );

        this.scoreTitleText
            .setPosition(
                0,
                -panelHeight * 0.41
            )
            .setFontSize(
                ui.panelTitleFont
            );

        const availableRowsHeight =
            panelHeight * 0.62;

        const rowCount =
            Math.max(
                1,
                this.scoreRows.length
            );

        const rowSpacing =
            Math.min(
                availableRowsHeight /
                    Math.max(
                        rowCount,
                        8
                    ),
                36
            );

        const startY =
            -(
                (
                    rowCount -
                    1
                ) *
                rowSpacing
            ) / 2 -
            panelHeight * 0.01;

        for (
            let index = 0;
            index < this.scoreRows.length;
            index += 1
        ) {
            this.scoreRows[
                index
            ]
                .setPosition(
                    0,
                    startY +
                    index *
                    rowSpacing
                )
                .setFontSize(
                    ui.rowFont
                );
        }

        this.scoreBackButton?.setLayout({
            x:
                ui.centerX,

            y:
                ui.centerY +
                panelHeight * 0.41,

            width:
                Math.min(
                    panelWidth * 0.5,
                    280
                ),

            height:
                Phaser.Math.Clamp(
                    panelHeight * 0.11,
                    42,
                    62
                ),

            fontSize:
                Phaser.Math.Clamp(
                    ui.rowFont * 1.05,
                    13,
                    21
                )
        });
    }

    clearScoreRows() {
        for (
            const row
            of this.scoreRows
        ) {
            row?.destroy();
        }

        this.scoreRows.length =
            0;
    }

    // =========================================================
    // Footer
    // =========================================================

    createFooter() {
        this.footerText =
            this.add.text(
                0,
                0,
                "↑ ↓ SELECCIONAR · ENTER CONFIRMAR",
                {
                    fontFamily:
                        "monospace",

                    fontSize:
                        "14px",

                    color:
                        "#768195",

                    stroke:
                        "#000000",

                    strokeThickness:
                        2
                }
            )
                .setOrigin(
                    0.5,
                    1
                )
                .setDepth(
                    300
                );
    }

    // =========================================================
    // Estados
    // =========================================================

    showStartScreen() {
        this.menuMode =
            "START_SCREEN";

        this.pressStartText
            ?.setVisible(
                true
            );

        for (
            const button
            of this.menuButtons
        ) {
            button.setVisible(
                false
            );
        }

        this.scoreContainer
            ?.setVisible(
                false
            );

        this.scoreBackButton
            ?.setVisible(
                false
            );
    }

    openMainMenu() {
        if (
            this.isTransitioning ||
            this.menuMode ===
                "MAIN_MENU"
        ) {
            return;
        }

        this.menuMode =
            "MAIN_MENU";

        this.selectedIndex =
            0;

        this.pressStartText
            ?.setVisible(
                false
            );

        this.scoreContainer
            ?.setVisible(
                false
            );

        this.scoreBackButton
            ?.setVisible(
                false
            );

        for (
            const button
            of this.menuButtons
        ) {
            button.setVisible(
                true
            );
        }

        this.updateMenuSelection();

        this.cameras.main.flash(
            100,
            255,
            255,
            255
        );
    }

    openScorePanel() {
        if (
            this.isTransitioning ||
            this.menuMode !==
                "MAIN_MENU"
        ) {
            return;
        }

        this.menuMode =
            "SCORE_PANEL";

        this.createScoreRows();

        for (
            const button
            of this.menuButtons
        ) {
            button.setVisible(
                false
            );
        }

        this.scoreContainer
            ?.setVisible(
                true
            );

        this.scoreBackButton
            ?.setVisible(
                true
            );
    }

    closeScorePanel() {
        if (
            this.isTransitioning ||
            this.menuMode !==
                "SCORE_PANEL"
        ) {
            return;
        }

        this.menuMode =
            "MAIN_MENU";

        this.scoreContainer
            ?.setVisible(
                false
            );

        this.scoreBackButton
            ?.setVisible(
                false
            );

        for (
            const button
            of this.menuButtons
        ) {
            button.setVisible(
                true
            );
        }

        this.updateMenuSelection();
    }

    // =========================================================
    // Transición
    // =========================================================

    startGame() {
        if (
            this.isTransitioning ||
            this.isDestroyed
        ) {
            return;
        }

        this.isTransitioning =
            true;

        this.input.enabled =
            false;

        this.cameras.main.fadeOut(
            300,
            0,
            0,
            0
        );

        this.cameras.main.once(
            Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
            () => {
                if (!this.isDestroyed) {
                    this.scene.start(
                        "GameScene"
                    );
                }
            }
        );
    }

    // =========================================================
    // Input
    // =========================================================

    createInput() {
        this.cursors =
            this.input.keyboard
                ?.createCursorKeys();

        this.enterKey =
            this.input.keyboard
                ?.addKey(
                    Phaser.Input.Keyboard.KeyCodes.ENTER
                );

        this.spaceKey =
            this.input.keyboard
                ?.addKey(
                    Phaser.Input.Keyboard.KeyCodes.SPACE
                );

        this.escapeKey =
            this.input.keyboard
                ?.addKey(
                    Phaser.Input.Keyboard.KeyCodes.ESC
                );
    }

    update(time) {
        if (
            this.isDestroyed ||
            this.isTransitioning ||
            !this.input.keyboard ||
            time <
                this.nextInputTime
        ) {
            return;
        }

        if (
            this.menuMode ===
            "START_SCREEN"
        ) {
            if (
                Phaser.Input.Keyboard.JustDown(
                    this.enterKey
                ) ||
                Phaser.Input.Keyboard.JustDown(
                    this.spaceKey
                )
            ) {
                this.nextInputTime =
                    time +
                    this.inputCooldown;

                this.openMainMenu();
            }

            return;
        }

        if (
            this.menuMode ===
            "SCORE_PANEL"
        ) {
            if (
                Phaser.Input.Keyboard.JustDown(
                    this.escapeKey
                ) ||
                Phaser.Input.Keyboard.JustDown(
                    this.enterKey
                )
            ) {
                this.nextInputTime =
                    time +
                    this.inputCooldown;

                this.closeScorePanel();
            }

            return;
        }

        if (
            this.menuMode !==
            "MAIN_MENU"
        ) {
            return;
        }

        if (
            Phaser.Input.Keyboard.JustDown(
                this.cursors?.up
            )
        ) {
            this.selectedIndex -=
                1;

            this.updateMenuSelection();

            this.nextInputTime =
                time +
                this.inputCooldown;

            return;
        }

        if (
            Phaser.Input.Keyboard.JustDown(
                this.cursors?.down
            )
        ) {
            this.selectedIndex +=
                1;

            this.updateMenuSelection();

            this.nextInputTime =
                time +
                this.inputCooldown;

            return;
        }

        if (
            Phaser.Input.Keyboard.JustDown(
                this.enterKey
            ) ||
            Phaser.Input.Keyboard.JustDown(
                this.spaceKey
            )
        ) {
            this.nextInputTime =
                time +
                this.inputCooldown;

            this.executeSelectedMenuItem();
        }
    }

    // =========================================================
    // Tweens
    // =========================================================

    createTweens() {
        this.titleTween =
            this.tweens.add({
                targets:
                    this.titleText,

                y:
                    "-=5",

                duration:
                    1000,

                yoyo:
                    true,

                repeat:
                    -1,

                ease:
                    "Sine.InOut"
            });

        this.pressStartTween =
            this.tweens.add({
                targets:
                    this.pressStartText,

                alpha:
                    0.2,

                duration:
                    520,

                yoyo:
                    true,

                repeat:
                    -1
            });
    }

    // =========================================================
    // Eventos
    // =========================================================

    registerEvents() {
        this.resizeHandler =
            this.handleResize.bind(
                this
            );

        this.scale.on(
            Phaser.Scale.Events.RESIZE,
            this.resizeHandler
        );

        this.events.once(
            Phaser.Scenes.Events.SHUTDOWN,
            this.shutdown,
            this
        );

        this.applyLayout(
            this.scale.gameSize
        );
    }

    handleResize(gameSize) {
        this.applyLayout(
            gameSize
        );
    }

    // =========================================================
    // Shutdown
    // =========================================================

    shutdown() {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed =
            true;

        if (this.resizeHandler) {
            this.scale.off(
                Phaser.Scale.Events.RESIZE,
                this.resizeHandler
            );
        }

        this.tweens.killAll();

        this.pressStartText
            ?.removeAllListeners();

        for (
            const button
            of this.menuButtons
        ) {
            button.destroy();
        }

        this.menuButtons.length =
            0;

        this.scoreBackButton
            ?.destroy();

        this.scoreBackButton =
            null;

        this.clearScoreRows();

        this.scoreContainer
            ?.destroy(
                true
            );

        this.highScoreSystem
            ?.destroy();

        this.highScoreSystem =
            null;

        this.layout =
            null;

        this.resizeHandler =
            null;
    }
}