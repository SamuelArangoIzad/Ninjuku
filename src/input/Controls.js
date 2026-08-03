import Phaser from "phaser";

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
             *              ○
             *
             *         ×         □
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
                        .KeyCodes.SHIFT
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
            attackJustPressed: false
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

        /*
         * Grupo derecho con símbolos tipo PSP.
         *
         * ○ = saltar
         * × = correr
         * □ = atacar
         */
        this.jumpButton =
            this.createButton(
                0,
                0,
                buttonSize,
                "○",
                "action"
            );

        this.runButton =
            this.createButton(
                0,
                0,
                buttonSize,
                "×",
                "action"
            );

        this.attackButton =
            this.createButton(
                0,
                0,
                buttonSize,
                "□",
                "action"
            );

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

        const text =
            this.scene.add.text(
                x,
                y,
                label,
                {
                    fontFamily:
                        "Arial, sans-serif",

                    fontSize:
                        `${fontSize}px`,

                    color:
                        "#ffffff",

                    fontStyle:
                        "bold"
                }
            );

        text
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1001);

        /*
         * El texto no recibe eventos para que el toque
         * siempre llegue al círculo.
         */
        text.disableInteractive();

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
        const width =
            this.scene.scale.width;

        const height =
            this.scene.scale.height;

        const buttonRadius =
            this.layout.buttonSize / 2;

        /*
         * Fila inferior.
         *
         * El clamp impide que los botones queden cortados.
         */
        const bottomY =
            Phaser.Math.Clamp(
                height -
                    this.layout.bottomOffset,

                buttonRadius + 3,

                height -
                    buttonRadius -
                    3
            );

        // =====================================================
        // Grupo izquierdo: ◀ ▶
        // =====================================================

        const movementLeft =
            this.layout
                .movementGroup
                .leftOffset;

        const movementSpacing =
            this.layout
                .movementGroup
                .spacing;

        this.setButtonPosition(
            this.leftButton,
            movementLeft,
            bottomY
        );

        this.setButtonPosition(
            this.rightButton,
            movementLeft +
                movementSpacing,
            bottomY
        );

        // =====================================================
        // Grupo derecho triangular
        // =====================================================

        const rightOffset =
            this.layout
                .actionGroup
                .rightOffset;

        const horizontalSpacing =
            this.layout
                .actionGroup
                .horizontalSpacing;

        const verticalSpacing =
            this.layout
                .actionGroup
                .verticalSpacing;

        /*
         * □ Atacar: vértice inferior derecho.
         */
        const attackX =
            width -
            rightOffset;

        const attackY =
            bottomY;

        /*
         * × Correr: vértice inferior izquierdo.
         */
        const runX =
            attackX -
            horizontalSpacing;

        const runY =
            bottomY;

        /*
         * ○ Saltar: vértice superior centrado.
         */
        const jumpX =
            (
                runX +
                attackX
            ) / 2;

        const jumpY =
            bottomY -
            verticalSpacing;

        this.setButtonPosition(
            this.runButton,
            runX,
            runY
        );

        this.setButtonPosition(
            this.attackButton,
            attackX,
            attackY
        );

        this.setButtonPosition(
            this.jumpButton,
            jumpX,
            jumpY
        );
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

        button.text.setScale(0.90);
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

        button.text.setScale(1);
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

        this.cursors = null;
        this.keys = null;
    }
}