import HealthComponent
    from "../components/HealthComponent.js";


/*
 * Enemigo lanzador de shuriken, apostado en los tejados.
 *
 * No se mueve ni persigue: vigila, se gira hacia el jugador cuando lo
 * tiene en su linea de tiro, y lanza. Como tira en horizontal, solo
 * puede alcanzar lo que este a su altura, asi que desde el suelo no
 * hace nada: hay que subir, o colgarse del kusarigama.
 *
 * NO lo gestiona EnemyManager a proposito. Esa clase genera enemigos
 * por oleadas desde los bordes, los mueve, los descarta por distancia
 * y los recicla en un pool, todo pensado para enemigos que caminan por
 * el suelo. Estos viven montados sobre una casa que se desplaza con el
 * escenario, asi que su ciclo de vida es el de la casa, no el de la
 * oleada. Eso si, exponen la misma interfaz que los demas enemigos
 * (isAlive, getSprite, takeDamage, getHealthComponent) para que el
 * combate, la barra de vida y los shuriken del jugador funcionen con
 * ellos sin saber de donde salieron.
 *
 * Cada enemigo trae colgado delante su propio punto de enganche, con
 * su dibujo. Va anclado a la misma casa y no a las ramas del fondo,
 * que se reciclan con otro ritmo: asi se garantiza que siempre haya de
 * donde colgarse para dispararle.
 */

/*
 * Hojas generadas con tools/preparar_animaciones.py.
 *
 * El dibujo solo mira a la derecha; para el otro lado se voltea. Por
 * eso los lienzos se generaron con los pies centrados: al reflejar, un
 * punto de registro descentrado mandaria al enemigo al lado contrario.
 */
const SHEETS = {
    idle: {
        key: "soldier-shuriken",
        frames: 8,
        frameWidth: 260,
        frameHeight: 199,
        originX: 0.5,
        originY: 0.9491,
        frameRate: 10,
        repeat: -1
    },

    hurt: {
        key: "soldier-shuriken-hurt",
        frames: 6,
        frameWidth: 136,
        frameHeight: 184,
        originX: 0.5,
        originY: 0.9463,
        frameRate: 14,
        repeat: 0
    },

    death: {
        key: "soldier-shuriken-death",
        frames: 12,
        frameWidth: 209,
        frameHeight: 150,
        originX: 0.5,
        originY: 0.9215,
        frameRate: 12,
        repeat: 0
    }
};

/*
 * Proporcion entre el dibujo de este enemigo (195 px de alto) y el del
 * soldado que ya existia (125 px). Multiplicada por la escala
 * responsiva de los enemigos, los deja del mismo tamano en pantalla.
 *
 * Se aplica igual a las tres hojas: medir cada una por separado da
 * numeros falseados, porque las poses de herido y muerte estan
 * agachadas y la distancia de cabeza a botas se comprime.
 */
const ART_RATIO = 125 / 195;

/*
 * Caja de golpe, en pixeles del dibujo.
 *
 * Es generosa a proposito. Con una caja cenida al cuerpo, los shuriken
 * que pasaban rozando no registraban impacto y parecia que el enemigo
 * era inmune. Mas vale perdonar un roce de mas que un golpe claro que
 * no cuenta.
 */
const BODY_WIDTH = 104;
const BODY_HEIGHT = 178;

/*
 * Casas sobre las que se aposta.
 *
 * Las cuatro mas altas: torre, pagoda, casa sobre pilotes y portico.
 * En las bajas no tendria sentido, porque el jugador las salta sin
 * necesidad de colgarse.
 */
const ROOF_KEYS = [
    "obstacle-1",
    "obstacle-2",
    "obstacle-5",
    "obstacle-6"
];

/*
 * Alcance horizontal de la linea de tiro.
 */
const SIGHT_RANGE = 580;

/*
 * Cuanto puede desviarse el jugador en vertical y seguir siendo un
 * blanco. Tira en horizontal, asi que fuera de esta banda no dispara.
 */
const SIGHT_HEIGHT = 110;

/*
 * Milisegundos entre lanzamientos.
 */
const THROW_COOLDOWN = 2200;

/*
 * Duracion del parpadeo de dolor.
 */
const HURT_DURATION = 420;

/*
 * Separacion del enganche respecto al costado izquierdo de la casa.
 *
 * A la izquierda porque es el lado por el que se llega. Deja sitio
 * para abrir el balanceo hacia la casa sin chocar con ella.
 */
const HOOK_SIDE_GAP = 190;

/*
 * Caida tipica del ninja bajo el gancho, en pixeles del dibujo de
 * balanceo. Es la distancia del gancho a sus pies a media apertura.
 */
const CHAIN_DROP = 300;

/*
 * Escala del dibujo de balanceo respecto al jugador.
 */
const GRAPPLE_ART = 1 / 1.82;

/*
 * Alto de la caja del jugador, en pixeles de su textura.
 */
const PLAYER_BODY_HEIGHT = 70;

/*
 * Fila del PNG del colgante (142x167) donde esta el tablon, que es de
 * donde se agarra el kusarigama.
 */
const PROP_PLANK_ROW = 129;
const PROP_HEIGHT = 167;


export default class RoofEnemyManager {
    constructor(
        scene,
        configuration = {}
    ) {
        this.scene = scene;

        this.obstacleManager =
            configuration.obstacleManager ??
            null;

        this.shurikenSystem =
            configuration.shurikenSystem ??
            null;

        this.getPlayerSprite =
            configuration.getPlayerSprite ??
            (() => null);

        /*
         * Para dar de alta la barra de vida, igual que los demas.
         */
        this.healthBarSystem =
            configuration.healthBarSystem ??
            null;

        /*
         * Ronda en curso. Con ella se decide cuantos lanzadores puede
         * haber a la vez.
         */
        this.getRound =
            configuration.getRound ??
            (() => 1);

        /*
         * Cuantos lanzadores como maximo en cada ronda.
         *
         * En la primera no hay ninguno: el jugador todavia esta
         * aprendiendo a colgarse. A partir de ahi suben de uno en uno.
         */
        this.enemiesPerRound =
            Array.isArray(configuration.enemiesPerRound) &&
            configuration.enemiesPerRound.length > 0
                ? configuration.enemiesPerRound.slice()
                : [0, 1, 2, 3, 4];

        this.roofKeys =
            Array.isArray(configuration.roofKeys) &&
            configuration.roofKeys.length > 0
                ? configuration.roofKeys.slice()
                : ROOF_KEYS;

        this.maximumHealth =
            Number(configuration.maximumHealth) || 3;

        this.scoreValue =
            Number(configuration.scoreValue) || 150;

        this.depth =
            Number.isFinite(
                Number(configuration.depth)
            )
                ? Number(configuration.depth)
                : 9;

        /*
         * Profundidad del colgante: por delante del fondo y por detras
         * de los personajes, igual que los de las ramas.
         */
        this.propDepth =
            Number.isFinite(
                Number(configuration.propDepth)
            )
                ? Number(configuration.propDepth)
                : -50;

        this.propTextureKey =
            configuration.propTextureKey ??
            "hanging-prop";

        /*
         * Uno por casa alta visible, mas margen.
         */
        this.poolSize =
            Math.max(
                1,
                Number(configuration.poolSize) || 5
            );

        this.enemies = [];

        this.hooks = [];

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

        this.destroyEnemies();

        const missing =
            Object.values(SHEETS)
                .map((sheet) => sheet.key)
                .filter(
                    (key) =>
                        !this.scene.textures.exists(key)
                );

        if (missing.length > 0) {
            console.error(
                "[RoofEnemyManager] " +
                "Faltan hojas: " +
                missing.join(", ")
            );

            return;
        }

        this.createAnimations();

        for (
            let index = 0;
            index < this.poolSize;
            index += 1
        ) {
            this.enemies.push(
                this.createEnemy()
            );
        }
    }

    createAnimations() {
        for (
            const sheet
            of Object.values(SHEETS)
        ) {
            const key = sheet.key + "-anim";

            if (this.scene.anims.exists(key)) {
                continue;
            }

            this.scene.anims.create({
                key,

                frames:
                    this.scene.anims
                        .generateFrameNumbers(
                            sheet.key,
                            {
                                start: 0,
                                end: sheet.frames - 1
                            }
                        ),

                frameRate: sheet.frameRate,
                repeat: sheet.repeat
            });
        }
    }

    /*
     * Misma escala responsiva que el resto de enemigos, para que
     * encojan todos a la vez en pantallas pequenas.
     */
    getResponsiveScale() {
        const shortest =
            Math.min(
                this.scene?.scale?.width ?? 1,
                this.scene?.scale?.height ?? 1
            );

        if (shortest <= 430) {
            return 0.55;
        }

        if (shortest <= 600) {
            return 0.65;
        }

        if (shortest <= 800) {
            return 0.75;
        }

        return 0.85;
    }

    getScale() {
        return (
            this.getResponsiveScale() *
            ART_RATIO
        );
    }

    getPropScale() {
        /*
         * El colgante se dibuja a la misma escala que los de las
         * ramas, que siguen al fondo.
         */
        return Math.max(
            (this.scene?.scale?.width ?? 1600) / 1600,
            (this.scene?.scale?.height ?? 900) / 900
        );
    }

    createEnemy() {
        const sprite =
            this.scene.physics.add
                .sprite(
                    0,
                    0,
                    SHEETS.idle.key,
                    0
                )
                .setOrigin(
                    SHEETS.idle.originX,
                    SHEETS.idle.originY
                )
                .setDepth(this.depth)
                .setVisible(false);

        if (sprite.body) {
            sprite.body.allowGravity = false;
            sprite.body.moves = false;
            sprite.body.enable = false;
        }

        /*
         * El colgante del que se agarra el jugador para dispararle.
         * Sin dibujo, el ninja aparecia colgado del aire.
         */
        const prop =
            this.scene.add
                .image(
                    0,
                    0,
                    this.propTextureKey
                )
                .setOrigin(0.5, 0)
                .setDepth(this.propDepth)
                .setVisible(false);

        const enemy = {
            sprite,
            prop,

            serial: null,
            alive: false,
            state: "IDLE",

            /*
             * Hoja que tiene puesta ahora. La caja de colision se
             * calcula a partir de ella: cada hoja tiene su propio
             * lienzo, y el desplazamiento de la caja en Arcade es
             * relativo al fotograma actual, no a uno fijo.
             */
            sheet: SHEETS.idle,
            hurtUntil: 0,
            facing: 1,
            lastThrowAt: -Infinity,

            health:
                new HealthComponent(
                    this.maximumHealth
                ),

            /*
             * Interfaz comun con los demas enemigos.
             */
            isAlive: () => enemy.alive,

            getSprite: () => enemy.sprite,

            getEnemyType: () => "roof-shuriken",

            getScoreValue: () => this.scoreValue,

            getHealthComponent: () => enemy.health,

            getHealth:
                () =>
                    enemy.health.getCurrentHealth(),

            getMaximumHealth:
                () =>
                    enemy.health.getMaximumHealth(),

            takeDamage: (amount = 1) => {
                if (
                    !enemy.alive ||
                    enemy.state === "DEAD"
                ) {
                    return false;
                }

                enemy.health.takeDamage(
                    Math.max(1, amount)
                );

                if (enemy.health.hasDied()) {
                    this.startDeath(enemy);
                } else {
                    this.startHurt(enemy);
                }

                return true;
            }
        };

        return enemy;
    }

    // =========================================================
    // Update
    // =========================================================

    update(delta, time) {
        if (
            this.isDestroyed ||
            this.enemies.length === 0
        ) {
            return;
        }

        const now =
            Number.isFinite(time)
                ? time
                : (this.scene?.time?.now ?? 0);

        const roofs =
            (
                this.obstacleManager
                    ?.getObstacles?.() ?? []
            ).filter(
                (obstacle) =>
                    this.roofKeys.includes(
                        obstacle.house?.key
                    )
            );

        this.hooks.length = 0;

        const scale = this.getScale();

        const allowed = this.getMaxActive();

        for (
            let index = 0;
            index < this.enemies.length;
            index += 1
        ) {
            const enemy = this.enemies[index];

            /*
             * Solo se ocupan tantos tejados como permita la ronda. El
             * resto de casas pasan vacias.
             */
            const roof =
                index < allowed
                    ? (roofs[index] ?? null)
                    : null;

            if (!roof) {
                this.park(enemy);

                continue;
            }

            this.placeOnRoof(enemy, roof, scale);

            this.hooks.push(
                this.placeProp(enemy, roof)
            );

            if (
                enemy.state === "HURT" &&
                now >= enemy.hurtUntil
            ) {
                this.playIdle(enemy);
            }

            if (
                enemy.alive &&
                enemy.state !== "DEAD"
            ) {
                this.updateAim(enemy, now);
            }
        }
    }

    /*
     * Coloca al enemigo sobre su casa. Si la casa se reciclo (cambio
     * de serial) vuelve a nacer entero: es otra casa y, por tanto,
     * otro enemigo.
     */
    placeOnRoof(enemy, roof, scale) {
        if (enemy.serial !== roof.serial) {
            this.respawn(enemy, roof.serial);
        }

        const house = roof.house;

        const x =
            (house.boxLeft + house.boxRight) / 2;

        enemy.sprite
            .setScale(scale)
            .setPosition(x, house.surfaceY);

        const body = enemy.sprite.body;

        if (!body) {
            return;
        }

        body.enable =
            enemy.alive &&
            enemy.state !== "DEAD";

        if (!body.enable) {
            return;
        }

        /*
         * El cuerpo se ajusta a mano porque el sprite no se mueve por
         * fisica: lo coloca esta clase siguiendo a la casa.
         *
         * El desplazamiento se mide sobre la hoja que tenga puesta en
         * ese momento. Las de dolor y muerte tienen otro lienzo, y
         * calcularlo siempre con el de reposo dejaba la caja fuera de
         * sitio justo mientras encajaba los golpes.
         */
        const sheet = enemy.sheet ?? SHEETS.idle;

        body.setSize(
            BODY_WIDTH,
            BODY_HEIGHT,
            false
        );

        body.setOffset(
            (sheet.frameWidth - BODY_WIDTH) / 2,

            (sheet.frameHeight * sheet.originY) -
            BODY_HEIGHT
        );
    }

    respawn(enemy, serial) {
        enemy.serial = serial;
        enemy.alive = true;
        enemy.state = "IDLE";
        enemy.hurtUntil = 0;
        enemy.lastThrowAt = -Infinity;

        enemy.health.reset?.();

        enemy.sprite
            .setVisible(true)
            .setAlpha(1)
            .setFlipX(false);

        this.playIdle(enemy);

        this.healthBarSystem
            ?.addEnemy?.(enemy);
    }

    park(enemy) {
        if (enemy.serial !== null) {
            this.healthBarSystem
                ?.removeEnemy?.(enemy);
        }

        enemy.serial = null;
        enemy.alive = false;
        enemy.state = "IDLE";

        enemy.sprite.setVisible(false);
        enemy.prop.setVisible(false);

        if (enemy.sprite.body) {
            enemy.sprite.body.enable = false;
        }
    }

    // =========================================================
    // Colgante emparejado
    // =========================================================

    /*
     * Altura del enganche sobre el tejado.
     *
     * No es un numero fijo. El jugador y el enemigo se escalan con el
     * tamano de pantalla, asi que la longitud de la cadena y el alto
     * del enemigo cambian con ella. Con una altura fija, en pantallas
     * pequenas el ninja quedaba colgado por encima del enemigo y sus
     * shuriken le pasaban por encima de la cabeza.
     *
     * Se calcula para que el tiro salga a la altura del pecho:
     *
     *   caida de la cadena - medio cuerpo del jugador + medio enemigo
     */
    getHookDrop() {
        const player = this.getPlayerSprite();

        const playerScale =
            Number(player?.scaleX) || 0.85;

        const chainDrop =
            CHAIN_DROP *
            playerScale *
            GRAPPLE_ART;

        const playerHalf =
            (PLAYER_BODY_HEIGHT / 2) *
            playerScale;

        const enemyChest =
            (BODY_HEIGHT * this.getScale()) / 2;

        return (
            chainDrop -
            playerHalf +
            enemyChest
        );
    }

    placeProp(enemy, roof) {
        const house = roof.house;

        const x =
            house.boxLeft - HOOK_SIDE_GAP;

        const y =
            house.surfaceY - this.getHookDrop();

        const scale = this.getPropScale();

        /*
         * La imagen se ancla por el gancho de arriba, asi que se sube
         * lo que mide la cadena para que el tablon caiga justo en el
         * punto del que se agarra el kusarigama.
         */
        enemy.prop
            .setScale(scale)
            .setPosition(
                x,
                y - (PROP_PLANK_ROW * scale)
            )
            .setVisible(true);

        return {
            id: "roof:" + roof.serial,
            x,
            y
        };
    }

    // =========================================================
    // Animación
    // =========================================================

    playIdle(enemy) {
        enemy.state = "IDLE";

        this.applySheet(enemy, SHEETS.idle);
    }

    startHurt(enemy) {
        enemy.state = "HURT";

        enemy.hurtUntil =
            (this.scene?.time?.now ?? 0) +
            HURT_DURATION;

        this.applySheet(enemy, SHEETS.hurt);
    }

    startDeath(enemy) {
        enemy.state = "DEAD";
        enemy.alive = false;

        if (enemy.sprite.body) {
            enemy.sprite.body.enable = false;
        }

        this.applySheet(enemy, SHEETS.death);

        this.healthBarSystem
            ?.removeEnemy?.(enemy);
    }

    applySheet(enemy, sheet) {
        enemy.sheet = sheet;

        enemy.sprite
            .setTexture(sheet.key, 0)
            .setOrigin(
                sheet.originX,
                sheet.originY
            )
            .setScale(this.getScale());

        enemy.sprite.play(
            sheet.key + "-anim",
            true
        );
    }

    // =========================================================
    // Puntería
    // =========================================================

    /*
     * Linea de tiro: el jugador tiene que estar cerca en horizontal y
     * a la altura del enemigo. Como lanza en horizontal, lo que quede
     * muy por encima o por debajo no es un blanco posible.
     */
    updateAim(enemy, now) {
        const player = this.getPlayerSprite();

        const body = player?.body;

        if (
            !player?.active ||
            !body
        ) {
            return;
        }

        const eyeY =
            enemy.sprite.y -
            (
                BODY_HEIGHT *
                this.getScale() *
                0.55
            );

        const targetY =
            body.top + (body.height / 2);

        const dx = player.x - enemy.sprite.x;

        if (
            Math.abs(dx) > SIGHT_RANGE ||
            Math.abs(targetY - eyeY) > SIGHT_HEIGHT
        ) {
            return;
        }

        /*
         * Se gira hacia el jugador aunque todavia no toque lanzar.
         */
        enemy.facing = dx >= 0 ? 1 : -1;

        enemy.sprite.setFlipX(
            enemy.facing < 0
        );

        if (
            enemy.state !== "IDLE" ||
            now - enemy.lastThrowAt < THROW_COOLDOWN
        ) {
            return;
        }

        const launched =
            this.shurikenSystem?.throwFrom?.(
                enemy.sprite.x +
                (enemy.facing * 30),

                eyeY,

                enemy.facing
            );

        if (launched) {
            enemy.lastThrowAt = now;
        }
    }

    // =========================================================
    // Consultas
    // =========================================================

    /*
     * La barra de vida se engancha despues, porque el sistema de UI
     * se construye mas tarde que este gestor.
     */
    setHealthBarSystem(system) {
        this.healthBarSystem = system ?? null;

        if (!this.healthBarSystem) {
            return;
        }

        for (const enemy of this.enemies) {
            if (enemy.alive) {
                this.healthBarSystem
                    .addEnemy?.(enemy);
            }
        }
    }

    /*
     * Cuantos lanzadores admite la ronda en curso.
     */
    getMaxActive() {
        const round =
            Math.max(
                1,
                Math.floor(
                    Number(this.getRound()) || 1
                )
            );

        const index =
            Math.min(
                round - 1,
                this.enemiesPerRound.length - 1
            );

        return Math.max(
            0,
            Math.floor(
                this.enemiesPerRound[index]
            )
        );
    }

    getEnemies() {
        return this.enemies;
    }

    getAliveEnemies() {
        return this.enemies.filter(
            (enemy) => enemy.alive
        );
    }

    getHooks() {
        return this.hooks;
    }

    // =========================================================
    // Destrucción
    // =========================================================

    destroyEnemies() {
        for (const enemy of this.enemies) {
            this.healthBarSystem
                ?.removeEnemy?.(enemy);

            enemy.sprite?.destroy();
            enemy.prop?.destroy();
            enemy.health?.destroy?.();
        }

        this.enemies = [];
        this.hooks = [];
    }

    destroy() {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed = true;

        this.destroyEnemies();

        this.scene = null;
        this.obstacleManager = null;
        this.shurikenSystem = null;
        this.healthBarSystem = null;
        this.getPlayerSprite = () => null;
    }
}
