import Phaser from "phaser";

import HighScoreSystem
    from "../systems/HighScoreSystem.js";

import RetroButton
    from "../ui/RetroButton.js";


export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({
            key: "GameOverScene"
        });

        this.finalScore =
            0;

        this.playerName =
            "";

        this.maximumNameLength =
            10;

        this.savedEntry =
            null;

        this.highScoreSystem =
            null;

        this.backgroundGraphics =
            null;

        this.scanlineGraphics =
            null;

        this.vignetteGraphics =
            null;

        this.gameOverText =
            null;

        this.scoreLabelText =
            null;

        this.scoreValueText =
            null;

        this.entryContainer =
            null;

        this.entryBackground =
            null;

        this.nameLabelText =
            null;

        this.nameValueText =
            null;

        this.nameHintText =
            null;

        this.saveButton =
            null;

        this.resultContainer =
            null;

        this.resultBackground =
            null;

        this.resultText =
            null;

        this.menuButtons = [];

        this.selectedIndex =
            0;

        this.mode =
            "NAME_ENTRY";

        this.hasSavedScore =
            false;

        this.isTransitioning =
            false;

        this.isDestroyed =
            false;

        this.cursors =
            null;

        this.enterKey =
            null;

        this.spaceKey =
            null;

        this.backspaceKey =
            null;

        this.keyboardHandler =
            null;

        this.nextInputTime =
            0;

        this.inputCooldown =
            160;

        this.resizeHandler =
            null;

        this.layout =
            null;

        this.gameOverTween =
            null;
    }

    // =========================================================
    // Init
    // =========================================================

    init(data = {}) {
        this.finalScore =
            Math.max(
                0,
                Math.floor(
                    Number(
                        data.score
                    ) || 0
                )
            );

        this.playerName =
            "";

        this.savedEntry =
            null;

        this.hasSavedScore =
            false;

        this.isTransitioning =
            false;

        this.isDestroyed =
            false;

        this.mode =
            "NAME_ENTRY";

        this.selectedIndex =
            0;
    }

    // =========================================================
    // Create
    // =========================================================

    create() {
        this.highScoreSystem =
            new HighScoreSystem({
                storageKey:
                    "ninjuku_highscores",

                maximumEntries:
                    10,

                maximumNameLength:
                    this.maximumNameLength,

                defaultName:
                    "PLAYER"
            });

        this.createBackground();
        this.createMainContent();
        this.createNameEntry();
        this.createResultPanel();
        this.createMenu();
        this.createInput();
        this.createTweens();
        this.registerEvents();

        this.showNameEntry();

        this.cameras.main.fadeIn(
            300,
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
                40
            );

        const usableWidth =
            width -
            safeMargin * 2;

        const usableHeight =
            height -
            safeMargin * 2;

        const panelWidth =
            Math.min(
                usableWidth * (
                    landscape
                        ? 0.64
                        : 0.94
                ),
                580
            );

        const panelHeight =
            Math.min(
                usableHeight * (
                    landscape
                        ? 0.39
                        : 0.3
                ),
                230
            );

        const titleFont =
            Phaser.Math.Clamp(
                shortest * (
                    landscape
                        ? 0.12
                        : 0.1
                ),
                34,
                78
            );

        return {
            width,
            height,
            landscape,
            shortest,
            safeMargin,

            centerX:
                width * 0.5,

            centerY:
                height * 0.5,

            titleY:
                landscape
                    ? height * 0.14
                    : height * 0.12,

            titleFont,

            scoreLabelFont:
                Phaser.Math.Clamp(
                    titleFont * 0.28,
                    12,
                    22
                ),

            scoreFont:
                Phaser.Math.Clamp(
                    titleFont * 0.52,
                    20,
                    40
                ),

            panelWidth,

            panelHeight,

            panelY:
                landscape
                    ? height * 0.56
                    : height * 0.5,

            nameLabelFont:
                Phaser.Math.Clamp(
                    shortest * 0.043,
                    14,
                    23
                ),

            nameFont:
                Phaser.Math.Clamp(
                    shortest * 0.065,
                    21,
                    38
                ),

            hintFont:
                Phaser.Math.Clamp(
                    shortest * 0.03,
                    11,
                    17
                ),

            buttonWidth:
                Math.min(
                    usableWidth * (
                        landscape
                            ? 0.46
                            : 0.86
                    ),
                    420
                ),

            buttonHeight:
                Phaser.Math.Clamp(
                    shortest * 0.1,
                    44,
                    68
                ),

            buttonFont:
                Phaser.Math.Clamp(
                    shortest * 0.042,
                    14,
                    24
                ),

            buttonGap:
                Phaser.Math.Clamp(
                    shortest * 0.025,
                    10,
                    22
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

        this.gameOverText
            ?.setPosition(
                ui.centerX,
                ui.titleY
            )
            .setFontSize(
                ui.titleFont
            )
            .setStroke(
                "#750000",
                Math.max(
                    5,
                    Math.round(
                        ui.titleFont * 0.14
                    )
                )
            );

        this.scoreLabelText
            ?.setPosition(
                ui.centerX,
                ui.titleY +
                    ui.titleFont * 0.9
            )
            .setFontSize(
                ui.scoreLabelFont
            );

        this.scoreValueText
            ?.setPosition(
                ui.centerX,
                ui.titleY +
                    ui.titleFont * 1.37
            )
            .setFontSize(
                ui.scoreFont
            );

        this.entryContainer
            ?.setPosition(
                ui.centerX,
                ui.panelY
            );

        this.entryBackground
            ?.setSize(
                ui.panelWidth,
                ui.panelHeight
            );

        this.nameLabelText
            ?.setPosition(
                0,
                -ui.panelHeight * 0.3
            )
            .setFontSize(
                ui.nameLabelFont
            );

        this.nameValueText
            ?.setPosition(
                0,
                -ui.panelHeight * 0.02
            )
            .setFontSize(
                ui.nameFont
            )
            .setFixedSize(
                ui.panelWidth * 0.82,
                0
            );

        this.nameHintText
            ?.setPosition(
                0,
                ui.panelHeight * 0.24
            )
            .setFontSize(
                ui.hintFont
            );

        this.saveButton?.setLayout({
            x:
                ui.centerX,

            y:
                ui.panelY +
                ui.panelHeight * 0.72,

            width:
                ui.buttonWidth,

            height:
                ui.buttonHeight,

            fontSize:
                ui.buttonFont
        });

        this.resultContainer
            ?.setPosition(
                ui.centerX,
                ui.panelY
            );

        this.resultBackground
            ?.setSize(
                ui.panelWidth,
                ui.panelHeight
            );

        this.resultText
            ?.setFontSize(
                ui.nameLabelFont
            );

        this.layoutMenuButtons();
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
            0x050505,
            1
        );

        this.backgroundGraphics.fillRect(
            0,
            0,
            width,
            height
        );

        const grid =
            Phaser.Math.Clamp(
                Math.round(
                    Math.min(
                        width,
                        height
                    ) / 14
                ),
                24,
                64
            );

        this.backgroundGraphics.lineStyle(
            1,
            0x6f1919,
            0.24
        );

        for (
            let x = 0;
            x <= width;
            x += grid
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
            y += grid
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
            0.2
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
                ) * 0.04,
                8,
                38
            );

        this.vignetteGraphics.clear();

        this.vignetteGraphics.fillStyle(
            0x000000,
            0.46
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
    // Contenido principal
    // =========================================================

    createMainContent() {
        this.gameOverText =
            this.add.text(
                0,
                0,
                "GAME OVER",
                {
                    fontFamily:
                        "monospace",

                    fontSize:
                        "68px",

                    fontStyle:
                        "bold",

                    color:
                        "#f2f2f2",

                    stroke:
                        "#750000",

                    strokeThickness:
                        9
                }
            )
                .setOrigin(
                    0.5
                )
                .setDepth(
                    100
                );

        this.scoreLabelText =
            this.add.text(
                0,
                0,
                "PUNTUACIÓN FINAL",
                {
                    fontFamily:
                        "monospace",

                    fontSize:
                        "20px",

                    fontStyle:
                        "bold",

                    color:
                        "#b8b8b8",

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

        this.scoreValueText =
            this.add.text(
                0,
                0,
                String(
                    this.finalScore
                ).padStart(
                    6,
                    "0"
                ),
                {
                    fontFamily:
                        "monospace",

                    fontSize:
                        "38px",

                    fontStyle:
                        "bold",

                    color:
                        "#f0c747",

                    stroke:
                        "#000000",

                    strokeThickness:
                        5
                }
            )
                .setOrigin(
                    0.5
                )
                .setDepth(
                    100
                );
    }

    // =========================================================
    // Nombre
    // =========================================================

    createNameEntry() {
        this.entryContainer =
            this.add.container(
                0,
                0
            )
                .setDepth(
                    200
                );

        this.entryBackground =
            this.add.rectangle(
                0,
                0,
                480,
                180,
                0x090909,
                0.96
            );

        this.entryBackground.setStrokeStyle(
            3,
            0xf0c747,
            1
        );

        this.nameLabelText =
            this.add.text(
                0,
                0,
                "INGRESA TU NOMBRE",
                {
                    fontFamily:
                        "monospace",

                    fontSize:
                        "21px",

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
                );

        this.nameValueText =
            this.add.text(
                0,
                0,
                "_",
                {
                    fontFamily:
                        "monospace",

                    fontSize:
                        "34px",

                    fontStyle:
                        "bold",

                    color:
                        "#f0c747",

                    stroke:
                        "#000000",

                    strokeThickness:
                        5,

                    align:
                        "center"
                }
            )
                .setOrigin(
                    0.5
                );

        this.nameHintText =
            this.add.text(
                0,
                0,
                "ESCRIBE Y PRESIONA ENTER",
                {
                    fontFamily:
                        "monospace",

                    fontSize:
                        "15px",

                    color:
                        "#9b9b9b",

                    stroke:
                        "#000000",

                    strokeThickness:
                        3
                }
            )
                .setOrigin(
                    0.5
                );

        this.entryContainer.add([
            this.entryBackground,
            this.nameLabelText,
            this.nameValueText,
            this.nameHintText
        ]);

        this.saveButton =
            new RetroButton(
                this,
                {
                    label:
                        "GUARDAR",

                    action:
                        () => {
                            this.saveScore();
                        },

                    depth:
                        250
                }
            );

        this.updateNameText();
    }

    updateNameText() {
        this.nameValueText?.setText(
            `${this.playerName}_`
        );
    }

    addCharacter(character) {
        if (
            this.mode !==
                "NAME_ENTRY" ||
            this.playerName.length >=
                this.maximumNameLength
        ) {
            return false;
        }

        const normalized =
            String(
                character ?? ""
            )
                .toUpperCase()
                .replace(
                    /[^A-Z0-9ÁÉÍÓÚÑ_-]/g,
                    ""
                )
                .slice(
                    0,
                    1
                );

        if (!normalized) {
            return false;
        }

        this.playerName +=
            normalized;

        this.updateNameText();

        return true;
    }

    removeLastCharacter() {
        if (
            this.mode !==
                "NAME_ENTRY" ||
            this.playerName.length === 0
        ) {
            return false;
        }

        this.playerName =
            this.playerName.slice(
                0,
                -1
            );

        this.updateNameText();

        return true;
    }

    saveScore() {
        if (
            this.hasSavedScore ||
            this.isDestroyed ||
            !this.highScoreSystem
        ) {
            return false;
        }

        this.savedEntry =
            this.highScoreSystem.addScore(
                this.playerName.trim() ||
                    "PLAYER",
                this.finalScore
            );

        this.hasSavedScore =
            true;

        this.showResult();

        return true;
    }

    // =========================================================
    // Resultado
    // =========================================================

    createResultPanel() {
        this.resultContainer =
            this.add.container(
                0,
                0
            )
                .setDepth(
                    220
                )
                .setVisible(
                    false
                );

        this.resultBackground =
            this.add.rectangle(
                0,
                0,
                500,
                160,
                0x090909,
                0.96
            );

        this.resultBackground.setStrokeStyle(
            3,
            0xf0c747,
            1
        );

        this.resultText =
            this.add.text(
                0,
                0,
                "",
                {
                    fontFamily:
                        "monospace",

                    fontSize:
                        "20px",

                    fontStyle:
                        "bold",

                    color:
                        "#ffffff",

                    stroke:
                        "#000000",

                    strokeThickness:
                        4,

                    align:
                        "center",

                    lineSpacing:
                        8
                }
            )
                .setOrigin(
                    0.5
                );

        this.resultContainer.add([
            this.resultBackground,
            this.resultText
        ]);
    }

    showResult() {
        this.mode =
            "RESULT";

        this.entryContainer
            ?.setVisible(
                false
            );

        this.saveButton
            ?.setVisible(
                false
            );

        const name =
            this.savedEntry?.name ??
            "PLAYER";

        const position =
            this.savedEntry?.position;

        this.resultText?.setText(
            Number.isFinite(position)
                ? `${name}\nPOSICIÓN ${position}`
                : `${name}\nPUNTUACIÓN GUARDADA`
        );

        this.resultContainer
            ?.setVisible(
                true
            );

        this.time.delayedCall(
            750,
            () => {
                if (!this.isDestroyed) {
                    this.showMenu();
                }
            }
        );
    }

    // =========================================================
    // Menú final
    // =========================================================

    createMenu() {
        this.menuButtons = [
            new RetroButton(
                this,
                {
                    label:
                        "JUGAR DE NUEVO",

                    action:
                        () => {
                            this.startScene(
                                "GameScene"
                            );
                        },

                    visible:
                        false
                }
            ),

            new RetroButton(
                this,
                {
                    label:
                        "VOLVER AL MENÚ",

                    action:
                        () => {
                            this.startScene(
                                "MenuScene"
                            );
                        },

                    visible:
                        false
                }
            )
        ];

        for (
            let index = 0;
            index < this.menuButtons.length;
            index += 1
        ) {
            this.menuButtons[
                index
            ].getContainer().on(
                "focus",
                () => {
                    if (
                        this.mode !==
                        "MENU"
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

        const startY =
            ui.landscape
                ? ui.height * 0.78
                : ui.height * 0.7;

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

        this.updateMenuSelection();
    }

    showMenu() {
        this.mode =
            "MENU";

        this.resultContainer
            ?.setVisible(
                false
            );

        this.selectedIndex =
            0;

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

    // =========================================================
    // Estados
    // =========================================================

    showNameEntry() {
        this.mode =
            "NAME_ENTRY";

        this.entryContainer
            ?.setVisible(
                true
            );

        this.saveButton
            ?.setVisible(
                true
            );

        this.resultContainer
            ?.setVisible(
                false
            );

        for (
            const button
            of this.menuButtons
        ) {
            button.setVisible(
                false
            );
        }

        this.updateNameText();
    }

    // =========================================================
    // Transición
    // =========================================================

    startScene(sceneKey) {
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
            280,
            0,
            0,
            0
        );

        this.cameras.main.once(
            Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
            () => {
                if (!this.isDestroyed) {
                    this.scene.start(
                        sceneKey
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

        this.backspaceKey =
            this.input.keyboard
                ?.addKey(
                    Phaser.Input.Keyboard.KeyCodes.BACKSPACE
                );

        this.keyboardHandler =
            (event) => {
                if (
                    this.isDestroyed ||
                    this.isTransitioning ||
                    this.mode !==
                        "NAME_ENTRY" ||
                    event.key.length !== 1
                ) {
                    return;
                }

                this.addCharacter(
                    event.key
                );
            };

        this.input.keyboard?.on(
            "keydown",
            this.keyboardHandler
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
            this.mode ===
            "NAME_ENTRY"
        ) {
            if (
                Phaser.Input.Keyboard.JustDown(
                    this.backspaceKey
                )
            ) {
                this.removeLastCharacter();

                this.nextInputTime =
                    time + 80;

                return;
            }

            if (
                Phaser.Input.Keyboard.JustDown(
                    this.enterKey
                )
            ) {
                this.nextInputTime =
                    time +
                    this.inputCooldown;

                this.saveScore();
            }

            return;
        }

        if (
            this.mode !==
            "MENU"
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

            this.menuButtons[
                this.selectedIndex
            ]?.execute();
        }
    }

    // =========================================================
    // Tweens
    // =========================================================

    createTweens() {
        this.gameOverTween =
            this.tweens.add({
                targets:
                    this.gameOverText,

                alpha:
                    0.7,

                duration:
                    700,

                yoyo:
                    true,

                repeat:
                    -1,

                ease:
                    "Sine.InOut"
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

        if (this.keyboardHandler) {
            this.input.keyboard?.off(
                "keydown",
                this.keyboardHandler
            );
        }

        this.tweens.killAll();

        this.saveButton
            ?.destroy();

        this.saveButton =
            null;

        for (
            const button
            of this.menuButtons
        ) {
            button.destroy();
        }

        this.menuButtons.length =
            0;

        this.highScoreSystem
            ?.destroy();

        this.highScoreSystem =
            null;

        this.resizeHandler =
            null;

        this.keyboardHandler =
            null;

        this.layout =
            null;
    }
}