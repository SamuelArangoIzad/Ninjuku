import Phaser from "phaser";

import MenuScene
    from "../scenes/MenuScene.js";

import GameScene
    from "../scenes/GameScene.js";

import GameOverScene
    from "../scenes/GameOverScene.js";


export default function createGameConfig(
    width,
    height
) {
    const safeWidth =
        Math.max(
            1,
            Math.round(
                Number(width) || 1
            )
        );

    const safeHeight =
        Math.max(
            1,
            Math.round(
                Number(height) || 1
            )
        );

    return {
        type:
            Phaser.AUTO,

        parent:
            "game-container",

        width:
            safeWidth,

        height:
            safeHeight,

        backgroundColor:
            "#000000",

        pixelArt:
            true,

        roundPixels:
            true,

        scale: {
            mode:
                Phaser.Scale.RESIZE,

            autoCenter:
                Phaser.Scale.NO_CENTER,

            width:
                safeWidth,

            height:
                safeHeight,

            expandParent:
                true
        },

        physics: {
            default:
                "arcade",

            arcade: {
                gravity: {
                    y: 1200
                },

                debug:
                    false
            }
        },

        render: {
            pixelArt:
                true,

            roundPixels:
                true,

            antialias:
                false,

            antialiasGL:
                false,

            powerPreference:
                "high-performance"
        },

        scene: [
            MenuScene,
            GameScene,
            GameOverScene
        ]
    };
}