import Phaser from "phaser";
import { computeActionLayout, computeControlMetrics } from "./actionLayout.js";

export default class Controls {
    constructor(scene) {
        this.scene = scene;

        // =====================================================
        // Configuración visual de los controles
        // =====================================================
        /*
         * Modifica estos valores para ajustar toda la interfaz.
         */
        this.layout = {
            buttonSize: 42,

            /*
             * Distancia entre el centro de los botones inferiores
             * y el borde inferior.
             *
             * Menor valor = botones más abajo.
             * Mayor valor = botones más arriba.
             */
            bottomOffset: 28,

            /*
             * Controles de movimiento del lado izquierdo.
             */
            movementGroup: {
                leftOffset: 35,
                spacing: 54
            },

            /*
             * Botones de acción del lado derecho.
             *
             *              △
             *
             *         □         ○
             *
             *              ×
             */
            actionGroup: {
                rightOffset: 38,

                /*
                 * Distancia entre × y □.
                 */
                horizontalSpacing: 58,

                /*
                 * Distancia vertical del círculo superior.
                 */
                verticalSpacing: 47
            },

            /*
             * Tamaño de los símbolos.
             */
            textSize: {
                arrows: 18,
                action: 22
            },

            /*
             * Apariencia visual.
             */
            backgroundAlpha: 0.35,
            pressedAlpha: 0.28,
            borderAlpha: 0.60
        };

        // =====================================================
        // Teclado
        // =====================================================

        this.cursors =
            scene.input.keyboard
                .createCursorKeys();

        this.keys =
            scene.input.keyboard.addKeys({
                left:
                    Phaser.Input.Keyboard
                        .KeyCodes.A,

                right:
                    Phaser.Input.Keyboard
                        .KeyCodes.D,

                jump:
                    Phaser.Input.Keyboard
                        .KeyCodes.W,

                attack:
                    Phaser.Input.Keyboard
                        .KeyCodes.J,

                run:
                    Phaser.Input.Keyboard
                        .KeyCodes.SHIFT,

                grapple:
                    Phaser.Input.Keyboard
                        .KeyCodes.H,

                shuriken:
                    Phaser.Input.Keyboard.KeyCodes.K
            });

        // =====================================================
        // Compatibilidad multitáctil
        // =====================================================
        /*
         * Permite mantener una dirección y pulsar correr,
         * saltar o atacar con otro dedo.
         */
        this.scene.input.addPointer(4);

        // =====================================================
        // Estados táctiles
        // =====================================================

        this.touchState = {
            left: false,
            right: false,
            run: false,

            jumpHeld: false,
            jumpJustPressed: false,

            attackHeld: false,
            attackJustPressed: false,
            shurikenHeld: false,
            shurikenJustPressed: false
        };

        this.touchControls = [];

        // =====================================================
        // Inicialización
        // =====================================================

        this.createTouchControls();

        this.scene.scale.on(
            Phaser.Scale.Events.RESIZE,
            this.handleResize,
            this
        );

        this.scene.events.once(
            Phaser.Scenes.Events.SHUTDOWN,
            this.destroy,
            this
        );
    }

    // =========================================================
    // Creación de controles táctiles
    // =========================================================

    createTouchControls() {
        const buttonSize =
            this.layout.buttonSize;

        /*
         * Grupo izquierdo.
         */
        this.leftButton =
            this.createButton(
                0,
                0,
                buttonSize,
                "◀",
                "movement"
            );

        this.rightButton =
            this.createButton(
                0,
                0,
                buttonSize,
                "▶",
                "movement"
            );

        // Botones de acción: cruz simétrica (△ arriba, □ izquierda,
        // ○ derecha, × abajo). Cada símbolo se dibuja como vector para
        // evitar el contraste desigual de los caracteres de fuente.
        this.shurikenButton = this.createButton(0, 0, buttonSize, "△", "action");
        this.attackButton = this.createButton(0, 0, buttonSize, "□", "action");
        this.jumpButton = this.createButton(0, 0, buttonSize, "○", "action");
        this.runButton = this.createButton(0, 0, buttonSize, "×", "action");

        // Movimiento sostenido.
        this.bindHoldButton(
            this.leftButton,
            "left"
        );

        this.bindHoldButton(
            this.rightButton,
            "right"
        );

        /*
         * Correr también se mantiene presionado.
         */
        this.bindHoldButton(
            this.runButton,
            "run"
        );

        // Acciones de una pulsación.
        this.bindActionButton(
            this.jumpButton,
            "jumpHeld",
            "jumpJustPressed"
        );

        this.bindActionButton(
            this.attackButton,
            "attackHeld",
            "attackJustPressed"
        );

        this.bindActionButton(
            this.shurikenButton,
            "shurikenHeld",
            "shurikenJustPressed"
        );

        this.positionTouchControls();
    }

    createButton(
        x,
        y,
        size,
        label,
        type = "action"
    ) {
        const background =
            this.scene.add.circle(
                x,
                y,
                size / 2,
                0x000000,
                this.layout.backgroundAlpha
            );

        background
            .setScrollFactor(0)
            .setDepth(1000)
            .setStrokeStyle(
                2,
                0xffffff,
                this.layout.borderAlpha
            );

        /*
         * Zona táctil un poco más grande que el círculo
         * visible, sin modificar su tamaño gráfico.
         */
        const interactiveRadius =
            size / 2 + 7;

        background.setInteractive(
            new Phaser.Geom.Circle(
                size / 2,
                size / 2,
                interactiveRadius
            ),
            Phaser.Geom.Circle.Contains
        );

        const fontSize =
            type === "movement"
                ? this.layout.textSize.arrows
                : this.layout.textSize.action;

        // Las acciones usan geometría vectorial, con igual grosor y
        // luminosidad. Las flechas conservan sus caracteres de texto.
        let text;
        if (type === "action") {
            text = this.scene.add.graphics();
            text.lineStyle(2.7, 0xffffff, 1);
            const r = 8.5;
            if (label === "×") {
                text.lineBetween(-r, -r, r, r);
                text.lineBetween(-r, r, r, -r);
            } else if (label === "○") {
                text.strokeCircle(0, 0, r);
            } else if (label === "□") {
                text.strokeRect(-r, -r, r * 2, r * 2);
            } else if (label === "△") {
                text.strokeTriangle(0, -r - 1, -r - 1, r, r + 1, r);
            }
            text.setPosition(x, y).setScrollFactor(0).setDepth(1001);
        } else {
            text = this.scene.add.text(x, y, label, {
                fontFamily: "Arial, sans-serif",
                fontSize: `${fontSize}px`,
                color: "#ffffff",
                fontStyle: "bold"
            }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
        }

        const button = {
            background,
            text,
            size,
            label,
            type
        };

        this.touchControls.push(
            button
        );

        return button;
    }

    // =========================================================
    // Posicionamiento de los controles
    // =========================================================

    positionTouchControls() {
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;
        const metrics = computeControlMetrics(width, height);
        // Reducimos las áreas visibles, manteniendo la zona interactiva ampliada.
        const scale = metrics.size / this.layout.buttonSize;
        for (const button of this.touchControls) {
            button.background.setScale(scale);
            button.text.setScale(scale);
        }

        const bottomY = Math.round(height - metrics.edge);
        const movementSpacing = Math.round(Math.max(metrics.size + 10, metrics.spacing * 0.94));
        const leftX = Math.round(metrics.edge);
        this.setButtonPosition(this.leftButton, leftX, bottomY);
        this.setButtonPosition(this.rightButton, leftX + movementSpacing, bottomY);

        const layout = computeActionLayout(width, height, {
            size: metrics.size,
            spacing: metrics.spacing,
            rightOffset: metrics.edge,
            bottomOffset: metrics.edge
        });
        this.setButtonPosition(this.shurikenButton, layout.triangle.x, layout.triangle.y);
        this.setButtonPosition(this.attackButton, layout.square.x, layout.square.y);
        this.setButtonPosition(this.jumpButton, layout.circle.x, layout.circle.y);
        this.setButtonPosition(this.runButton, layout.cross.x, layout.cross.y);
    }

    setButtonPosition(
        button,
        x,
        y
    ) {
        if (!button) {
            return;
        }

        const finalX =
            Math.round(x);

        const finalY =
            Math.round(y);

        button.background.setPosition(
            finalX,
            finalY
        );

        button.text.setPosition(
            finalX,
            finalY
        );
    }

    handleResize() {
        this.positionTouchControls();
    }

    // =========================================================
    // Apariencia de botones
    // =========================================================

    setButtonPressedAppearance(button) {
        if (!button?.background) {
            return;
        }

        button.background.setFillStyle(
            0xffffff,
            this.layout.pressedAlpha
        );

        button.background.setStrokeStyle(
            2,
            0xffffff,
            0.95
        );

        button.text.setScale(button.background.scaleX * 0.90);
    }

    restoreButtonAppearance(button) {
        if (!button?.background) {
            return;
        }

        button.background.setFillStyle(
            0x000000,
            this.layout.backgroundAlpha
        );

        button.background.setStrokeStyle(
            2,
            0xffffff,
            this.layout.borderAlpha
        );

        button.text.setScale(button.background.scaleX);
    }

    // =========================================================
    // Botones sostenidos
    // =========================================================

    bindHoldButton(
        button,
        stateName
    ) {
        const activate = () => {
            this.touchState[
                stateName
            ] = true;

            this.setButtonPressedAppearance(
                button
            );
        };

        const deactivate = () => {
            this.touchState[
                stateName
            ] = false;

            this.restoreButtonAppearance(
                button
            );
        };

        button.background.on(
            "pointerdown",
            activate
        );

        button.background.on(
            "pointerup",
            deactivate
        );

        button.background.on(
            "pointerout",
            deactivate
        );

        button.background.on(
            "pointerupoutside",
            deactivate
        );
    }

    // =========================================================
    // Botones de acción
    // =========================================================

    bindActionButton(
        button,
        heldState,
        pressedState
    ) {
        const activate = () => {
            if (
                !this.touchState[
                    heldState
                ]
            ) {
                this.touchState[
                    pressedState
                ] = true;
            }

            this.touchState[
                heldState
            ] = true;

            this.setButtonPressedAppearance(
                button
            );
        };

        const deactivate = () => {
            this.touchState[
                heldState
            ] = false;

            this.restoreButtonAppearance(
                button
            );
        };

        button.background.on(
            "pointerdown",
            activate
        );

        button.background.on(
            "pointerup",
            deactivate
        );

        button.background.on(
            "pointerout",
            deactivate
        );

        button.background.on(
            "pointerupoutside",
            deactivate
        );
    }

    // =========================================================
    // API utilizada por Player.js
    // =========================================================

    left() {
        return (
            this.cursors.left.isDown ||
            this.keys.left.isDown ||
            this.touchState.left
        );
    }

    right() {
        return (
            this.cursors.right.isDown ||
            this.keys.right.isDown ||
            this.touchState.right
        );
    }

    run() {
        return (
            this.keys.run.isDown ||
            this.touchState.run
        );
    }

    jump() {
        const keyboardJump =
            Phaser.Input.Keyboard.JustDown(
                this.cursors.up
            ) ||
            Phaser.Input.Keyboard.JustDown(
                this.cursors.space
            ) ||
            Phaser.Input.Keyboard.JustDown(
                this.keys.jump
            );

        const touchJump =
            this.touchState
                .jumpJustPressed;

        /*
         * Cada toque produce solamente un salto.
         */
        this.touchState
            .jumpJustPressed = false;

        return (
            keyboardJump ||
            touchJump
        );
    }

    /*
     * Kusarigama. La misma tecla engancha y suelta, asi que solo
     * interesa el instante de la pulsacion, no si sigue apretada.
     */
    grapple() {
        return Phaser.Input.Keyboard.JustDown(
            this.keys.grapple
        );
    }

    shuriken() {
        const keyboard = Phaser.Input.Keyboard.JustDown(this.keys.shuriken);
        const touch = this.touchState.shurikenJustPressed;
        this.touchState.shurikenJustPressed = false;
        return keyboard || touch;
    }

    attack() {
        const keyboardAttack =
            Phaser.Input.Keyboard.JustDown(
                this.keys.attack
            );

        const touchAttack =
            this.touchState
                .attackJustPressed;

        /*
         * Cada toque produce solamente un ataque.
         */
        this.touchState
            .attackJustPressed = false;

        return (
            keyboardAttack ||
            touchAttack
        );
    }

    // =========================================================
    // Liberación de estados táctiles
    // =========================================================

    resetTouchState() {
        this.touchState.left = false;
        this.touchState.right = false;
        this.touchState.run = false;

        this.touchState.jumpHeld = false;
        this.touchState.jumpJustPressed = false;

        this.touchState.attackHeld = false;
        this.touchState.attackJustPressed = false;
        this.touchState.shurikenHeld = false;
        this.touchState.shurikenJustPressed = false;

        for (
            const button
            of this.touchControls
        ) {
            this.restoreButtonAppearance(
                button
            );
        }
    }

    // =========================================================
    // Destrucción
    // =========================================================

    destroy() {
        this.scene.scale.off(
            Phaser.Scale.Events.RESIZE,
            this.handleResize,
            this
        );

        this.resetTouchState();

        for (
            const button
            of this.touchControls
        ) {
            button.background
                .removeAllListeners();

            button.background.destroy();
            button.text.destroy();
        }

        this.touchControls = [];

        this.leftButton = null;
        this.rightButton = null;

        this.runButton = null;
        this.jumpButton = null;
        this.attackButton = null;
        this.shurikenButton = null;

        this.cursors = null;
        this.keys = null;
    }
}