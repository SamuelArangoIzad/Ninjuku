import Phaser from "phaser";

import "./style.css";

import createGameConfig
    from "./config/gameConfig.js";


const container =
    document.getElementById(
        "game-container"
    );

if (!container) {
    throw new Error(
        "[main] No existe el elemento #game-container."
    );
}


/**
 * Obtiene las dimensiones iniciales reales del contenedor.
 *
 * Esta función se utiliza una sola vez, antes de crear Phaser.
 * Después de crear el juego, Phaser.Scale.RESIZE será el único
 * responsable de observar y aplicar cambios de tamaño.
 */
function getInitialContainerSize() {
    const rectangle =
        container.getBoundingClientRect();

    const width =
        Math.max(
            1,
            Math.round(
                rectangle.width ||
                document.documentElement.clientWidth ||
                window.innerWidth ||
                1
            )
        );

    const height =
        Math.max(
            1,
            Math.round(
                rectangle.height ||
                document.documentElement.clientHeight ||
                window.innerHeight ||
                1
            )
        );

    return {
        width,
        height
    };
}


/**
 * Crea Phaser únicamente cuando el navegador ya realizó
 * al menos dos ciclos de layout.
 */
function createGame() {
    const {
        width,
        height
    } = getInitialContainerSize();

    const configuration =
        createGameConfig(
            width,
            height
        );

    const game =
        new Phaser.Game(
            configuration
        );

    console.log(
        "[main] Phaser creado:",
        {
            width,
            height
        }
    );

    return game;
}


let game = null;


/*
 * Dos requestAnimationFrame permiten que el navegador:
 *
 * 1. Calcule el tamaño del documento.
 * 2. Calcule el tamaño final de #game-container.
 * 3. Cree Phaser con dimensiones numéricas válidas.
 */
requestAnimationFrame(
    () => {
        requestAnimationFrame(
            () => {
                game =
                    createGame();
            }
        );
    }
);


export {
    game
};