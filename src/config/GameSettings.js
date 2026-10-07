const GameSettings = {
    // =========================================================
    // Mundo
    // =========================================================

    world: {
        gravity: 1200
    },

    // =========================================================
    // Fondo
    // =========================================================

    background: {
        textureKeys: [
            "background-1",
            "background-2",
            "background-3",
            "background-4",
            "background-5",
            "background-6",
            "background-7",
            "background-8"
        ],

        speed: 35,
        depth: -100,

        /*
         * Fracción del fondo que dura la disolución hacia el
         * siguiente. Subirlo suaviza más la entrada y la salida
         * de la mezcla.
         *
         * El máximo admitido es 0.49.
         */
        blendRatio: 0.48
    },

    // =========================================================
    // Obstáculos
    // =========================================================

    obstacles: {
        /*
         * Secuencia de estructuras.
         * Se repite en bucle.
         */
        sequence: [
            "obstacle-3",
            "obstacle-1",
            "obstacle-5",
            "obstacle-2",
            "obstacle-4",
            "obstacle-6"
        ],

        /*
         * Misma velocidad que el fondo para que parezcan parte
         * del paisaje y no elementos flotando sobre él.
         */
        speed: 35,

        /*
         * Escala de las casas.
         *
         * Es fija, no responsiva: la altura del salto tampoco
         * depende de la pantalla.
         */
        scale: 0.95,

        /*
         * Altura que alcanza un salto.
         *
         * 600^2 / (2 * 1200) = 150 px.
         */
        jumpHeight: 150,

        /*
         * Separación entre parejas:
         *
         * plataforma + casa
         */
        spacing: 760,

        /*
         * Por delante del fondo (-100) y por detrás de:
         *
         * enemigos -> 9
         * jugador  -> 10
         */
        depth: 4
    },

    // =========================================================
    // Objeto colgado de las ramas
    // =========================================================

    hangingProp: {
        textureKey: "hanging-prop",

        /*
         * Delante del fondo (-100) y detras de todo lo demas.
         */
        depth: -50,

        /*
         * Multiplica la escala del propio fondo. Cuelga de una rama
         * pintada en el fondo, asi que crece y encoge con el.
         */
        scale: 1
    },

    // =========================================================
    // Jugador
    // =========================================================

    player: {
        walkSpeed: 250,
        runSpeed: 400,

        jumpForce: -600,
        maximumFallSpeed: 1000,

        maximumHealth: 5,

        /*
         * Tiempo durante el cual no puede volver a recibir daño
         * después de ser golpeado.
         */
        invulnerabilityDuration: 700,

        attackDamage: 1,

        attackRange: 105,
        attackHeight: 72,

        scale: {
            phone: 0.45,
            smallTablet: 0.55,
            tablet: 0.65,
            desktop: 0.75
        }
    },

    // =========================================================
    // Soldado
    // =========================================================

    soldier: {
        /*
         * Identificador lógico.
         */
        enemyType: "soldier",

        // -----------------------------------------------------
        // Estadísticas
        // -----------------------------------------------------

        moveSpeed: 120,

        maximumHealth: 3,

        attackDamage: 1,

        scoreValue: 100,

        // -----------------------------------------------------
        // IA
        // -----------------------------------------------------

        /*
         * Distancia máxima desde la cual detecta al jugador.
         */
        detectionRange: 1200,

        /*
         * Distancia a partir de la cual deja de caminar y
         * comienza a atacar.
         */
        attackRange: 115,

        /*
         * Milisegundos entre ataques.
         */
        attackCooldown: 1300,

        /*
         * Frecuencia con la que SoldierAI vuelve a tomar
         * decisiones.
         */
        decisionInterval: 120,

        // -----------------------------------------------------
        // Hitbox de ataque
        // -----------------------------------------------------

        attackHitboxWidth: 125,
        attackHitboxHeight: 58,
        attackHitboxOffset: 15,

        // -----------------------------------------------------
        // Gestión
        // -----------------------------------------------------

        /*
         * Distancia alrededor de la pantalla dentro de la cual
         * el enemigo permanece activo.
         */
        activeAreaMargin: 350,

        /*
         * Píxeles que debe avanzar dentro de la pantalla antes
         * de abandonar el estado ENTERING.
         */
        entryPadding: 55,

        /*
         * Escala aplicada durante la animación de muerte.
         */
        deathScaleMultiplier: 0.82
    },

    // =========================================================
    // Samurai
    // =========================================================

    samurai: {
        /*
         * Identificador lógico.
         */
        enemyType: "samurai",

        // -----------------------------------------------------
        // Estadísticas
        // -----------------------------------------------------

        /*
         * El Samurai comienza siendo ligeramente más lento
         * que el Soldier.
         */
        moveSpeed: 105,

        /*
         * Más resistente que el Soldier:
         *
         * Soldier = 3
         * Samurai = 5
         */
        maximumHealth: 5,

        /*
         * El golpe de katana causa dos puntos de daño.
         *
         * El jugador tiene actualmente 5 puntos de vida.
         */
        attackDamage: 2,

        /*
         * Recompensa superior por derrotarlo.
         */
        scoreValue: 175,

        // -----------------------------------------------------
        // IA
        // -----------------------------------------------------

        /*
         * Detecta al jugador prácticamente desde cualquier
         * posición visible del escenario.
         */
        detectionRange: 1200,

        /*
         * Enemigo cuerpo a cuerpo.
         *
         * Tiene que acercarse bastante antes de atacar.
         */
        attackRange: 105,

        /*
         * Ataque más potente pero ligeramente más lento.
         */
        attackCooldown: 1500,

        /*
         * Reacciona un poco más rápido que SoldierAI.
         */
        decisionInterval: 100,

        // -----------------------------------------------------
        // Hitbox de katana
        // -----------------------------------------------------

        /*
         * La espada permite una hitbox algo más ancha que la
         * del Soldier.
         */
        attackHitboxWidth: 145,

        attackHitboxHeight: 65,

        attackHitboxOffset: 20,

        // -----------------------------------------------------
        // Gestión
        // -----------------------------------------------------

        activeAreaMargin: 350,

        entryPadding: 55,

        deathScaleMultiplier: 0.82,

        // -----------------------------------------------------
        // Animaciones
        // -----------------------------------------------------

        /*
         * Cantidad real de frames disponibles dentro de:
         *
         * public/assets/enemies/samurai/frames/
         */
        animations: {
            idle: {
                frameCount: 7,
                frameRate: 8,
                repeat: -1
            },

            walk: {
                frameCount: 8,
                frameRate: 10,
                repeat: -1
            },

            attack: {
                frameCount: 7,
                frameRate: 12,
                repeat: 0
            },

            hurt: {
                frameCount: 5,
                frameRate: 12,
                repeat: 0
            },

            death: {
                frameCount: 7,
                frameRate: 10,
                repeat: 0
            }
        },

        /*
         * Frame aproximado del ataque en el cual la katana
         * debería producir daño.
         *
         * Los frames reales son:
         *
         * samuAttack1
         * samuAttack2
         * samuAttack3
         * samuAttack4
         * samuAttack5
         * samuAttack6
         * samuAttack7
         *
         * Usaremos inicialmente el cuarto frame como impacto.
         */
        attackImpactFrame: 4
    },

    // =========================================================
    // EnemyManager
    // =========================================================

    enemies: {
        cullingEnabled: true,

        activeAreaMargin: 350,

        /*
         * Se mantiene pooling porque tanto Soldier como Samurai
         * podrán reutilizar instancias.
         *
         * EnemyManager debe mantener separado el tipo lógico de
         * cada objeto para evitar reutilizar un Samurai como
         * Soldier o viceversa.
         */
        poolingEnabled: true,

        /*
         * Límite conjunto de objetos almacenados en el pool.
         */
        maximumPoolSize: 12,

        /*
         * Posición adicional fuera del límite visible desde la
         * que EnemyManager puede generar entidades.
         */
        spawnOffset: 35
    },

    // =========================================================
    // Interfaz
    // =========================================================

    ui: {
        healthBar: {
            playerWidth: 170,
            playerHeight: 16,

            enemyWidth: 70,
            enemyHeight: 8
        }
    },

    // =========================================================
    // Oleadas
    // =========================================================

    waves: {
        enabled: true,

        // -----------------------------------------------------
        // Tiempos
        // -----------------------------------------------------

        initialDelay: 1200,

        delayBetweenWaves: 2200,

        spawnInterval: 850,

        // -----------------------------------------------------
        // Cantidad de enemigos
        // -----------------------------------------------------

        initialEnemyCount: 2,

        enemyIncrement: 1,

        maximumEnemiesPerWave: 8,

        /*
         * 0 = oleadas infinitas.
         */
        maximumWaves: 0,

        // -----------------------------------------------------
        // Spawn
        // -----------------------------------------------------

        /*
         * Los enemigos aparecen ligeramente por fuera de la
         * pantalla.
         */
        spawnOutsideDistance: 35,

        spawnVariation: 25,

        // -----------------------------------------------------
        // Escalado de vida
        // -----------------------------------------------------

        /*
         * Cada tres oleadas aumenta la salud.
         */
        healthIncreaseEveryWaves: 3,

        healthIncreaseAmount: 1,

        // -----------------------------------------------------
        // Escalado de velocidad
        // -----------------------------------------------------

        speedIncreasePerWave: 2,

        maximumSpeedBonus: 35,

        // -----------------------------------------------------
        // Samurai
        // -----------------------------------------------------

        /*
         * Oleada 1:
         *
         * solamente Soldiers.
         *
         * Oleada 2 en adelante:
         *
         * puede comenzar a aparecer Samurai.
         */
        samuraiStartsAtWave: 2,

        /*
         * Probabilidad inicial de Samurai al desbloquearse.
         *
         * 0.25 = 25 %
         */
        samuraiBaseChance: 0.25,

        /*
         * Cada nueva oleada aumenta la probabilidad en 10 %.
         */
        samuraiChanceIncrease: 0.10,

        /*
         * Nunca habrá más de 65 % de probabilidad de Samurai
         * para mantener Soldiers presentes.
         */
        maximumSamuraiChance: 0.65
    },

    // =========================================================
    // Rendimiento
    // =========================================================

    performance: {
        visible: true,

        updateInterval: 500
    }
};

export default GameSettings;