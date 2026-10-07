/*
 * Shuriken que el ninja lanza mientras cuelga del kusarigama.
 *
 * Vuela en horizontal, sin gravedad, a la altura a la que salio. Esa
 * altura es la del torso del ninja en el momento del lanzamiento, asi
 * que cuanto mas abierto este el balanceo mas alto sale: apuntar es
 * elegir desde donde lanzar.
 *
 * No usa cuerpos de Arcade. Se mueve a mano y comprueba el impacto por
 * solape de rectangulos. Los enemigos aparecen y mueren sin parar, y
 * mantener colisionadores al dia para unos proyectiles que viven dos
 * segundos cuesta mas de lo que vale.
 */

/*
 * Hoja generada con tools/preparar_animaciones.py. El punto de
 * registro es el centroide de la parte solida, que en una estrella
 * simetrica cae sobre su eje de giro.
 */
const SHEET = {
    key: "shuriken",
    frames: 12,
    frameWidth: 94,
    frameHeight: 110,
    originX: 0.5254,
    originY: 0.5138,
    frameRate: 24
};

/*
 * Mitad del ancho de la estrella en el dibujo, sin contar la estela.
 * Con ella se calcula la caja de impacto a cualquier escala.
 */
const STAR_HALF_SIZE = 36;

/*
 * Margen fuera de pantalla antes de retirar un shuriken.
 */
const DESPAWN_MARGIN = 160;


export default class ShurikenSystem {
    constructor(
        scene,
        configuration = {}
    ) {
        this.scene = scene;

        this.getEnemies =
            configuration.getEnemies ??
            (() => []);

        /*
         * Velocidad de vuelo. Por encima de la carrera del jugador
         * (400) para que se lea como un disparo, pero lo bastante
         * lenta como para seguirlo con la vista: cruza una pantalla
         * de 1280 en algo mas de dos segundos.
         */
        this.speed =
            Number(configuration.speed) ||
            600;

        /*
         * A 0.45 la estrella queda del tamano de la cabeza del ninja,
         * que es lo creible para un arma arrojadiza.
         */
        this.scale =
            Number(configuration.scale) ||
            0.45;

        this.depth =
            Number.isFinite(
                Number(configuration.depth)
            )
                ? Number(configuration.depth)
                : 9;

        this.damage =
            Number(configuration.damage) ||
            1;

        /*
         * Cuantos pueden volar a la vez.
         */
        this.poolSize =
            Math.max(
                1,
                Number(configuration.poolSize) || 8
            );

        this.shurikens = [];

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

        this.destroyShurikens();

        if (
            !this.scene.textures.exists(
                SHEET.key
            )
        ) {
            console.error(
                "[ShurikenSystem] " +
                "No existe la hoja: " +
                SHEET.key
            );

            return;
        }

        const animationKey =
            SHEET.key + "-anim";

        if (
            !this.scene.anims.exists(
                animationKey
            )
        ) {
            this.scene.anims.create({
                key: animationKey,

                frames:
                    this.scene.anims
                        .generateFrameNumbers(
                            SHEET.key,
                            {
                                start: 0,
                                end: SHEET.frames - 1
                            }
                        ),

                frameRate: SHEET.frameRate,
                repeat: -1
            });
        }

        for (
            let index = 0;
            index < this.poolSize;
            index += 1
        ) {
            this.shurikens.push({
                sprite:
                    this.scene.add
                        .sprite(
                            0,
                            0,
                            SHEET.key,
                            0
                        )
                        .setOrigin(
                            SHEET.originX,
                            SHEET.originY
                        )
                        .setScale(this.scale)
                        .setDepth(this.depth)
                        .setVisible(false),

                active: false,
                x: 0,
                y: 0,
                direction: 1
            });
        }
    }

    // =========================================================
    // Lanzamiento
    // =========================================================

    /*
     * Devuelve false si no habia ninguno libre en la reserva.
     */
    throwFrom(x, y, direction) {
        if (
            this.isDestroyed ||
            !direction
        ) {
            return false;
        }

        const shuriken =
            this.shurikens.find(
                (item) => !item.active
            );

        if (!shuriken) {
            return false;
        }

        shuriken.active = true;
        shuriken.x = x;
        shuriken.y = y;

        shuriken.direction =
            direction > 0 ? 1 : -1;

        shuriken.sprite
            .setPosition(x, y)
            .setScale(this.scale)
            .setVisible(true);

        shuriken.sprite.play(
            SHEET.key + "-anim",
            true
        );

        return true;
    }

    // =========================================================
    // Update
    // =========================================================

    update(delta) {
        if (this.isDestroyed) {
            return;
        }

        const clampedDelta =
            Math.min(
                Number.isFinite(delta) ? delta : 0,
                100
            );

        const step =
            this.speed *
            (clampedDelta / 1000);

        const screenWidth =
            Math.max(
                1,
                this.scene?.scale?.width ?? 1
            );

        for (
            const shuriken
            of this.shurikens
        ) {
            if (!shuriken.active) {
                continue;
            }

            shuriken.x +=
                shuriken.direction * step;

            shuriken.sprite.setPosition(
                shuriken.x,
                shuriken.y
            );

            if (
                shuriken.x < -DESPAWN_MARGIN ||
                shuriken.x >
                    screenWidth + DESPAWN_MARGIN
            ) {
                this.retire(shuriken);

                continue;
            }

            if (this.hitEnemy(shuriken)) {
                this.retire(shuriken);
            }
        }
    }

    getHalfSize() {
        return STAR_HALF_SIZE * this.scale;
    }

    hitEnemy(shuriken) {
        const half = this.getHalfSize();

        const left = shuriken.x - half;
        const right = shuriken.x + half;
        const top = shuriken.y - half;
        const bottom = shuriken.y + half;

        for (
            const enemy
            of this.getEnemies() ?? []
        ) {
            if (!enemy?.isAlive?.()) {
                continue;
            }

            const body =
                enemy.getSprite?.()?.body;

            if (
                !body ||
                !body.enable
            ) {
                continue;
            }

            const overlaps =
                right > body.left &&
                left < body.right &&
                bottom > body.top &&
                top < body.bottom;

            if (!overlaps) {
                continue;
            }

            enemy.takeDamage?.(
                this.damage,
                shuriken.x
            );

            return true;
        }

        return false;
    }

    retire(shuriken) {
        shuriken.active = false;

        shuriken.sprite
            .setVisible(false)
            .stop();
    }

    getActiveCount() {
        return this.shurikens.filter(
            (item) => item.active
        ).length;
    }

    // =========================================================
    // Destrucción
    // =========================================================

    destroyShurikens() {
        for (
            const shuriken
            of this.shurikens
        ) {
            shuriken.sprite?.destroy();
        }

        this.shurikens = [];
    }

    destroy() {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed = true;

        this.destroyShurikens();

        this.scene = null;
        this.getEnemies = () => [];
    }
}
