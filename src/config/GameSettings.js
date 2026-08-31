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
         * siguiente. Subirlo suaviza más la entrada y la salida de
         * la mezcla. El máximo admitido es 0.49.
         */
        blendRatio: 0.48
    },

    // =========================================================
    // Obstaculos
    // =========================================================

    obstacles: {
        /*
         * Secuencia de estructuras. Se repite en bucle.
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
         * Misma velocidad que el fondo, para que parezcan parte del
         * paisaje y no elementos flotando sobre el.
         */
        speed: 35,

        /*
         * Escala de las casas. Fija, no responsiva: la altura del
         * salto tampoco depende de la pantalla. A 0.95 miden entre
         * 142 y 225 px, tamano de casa de verdad.
         *
         * A esa altura ya no se saltan de una vez, por eso delante de
         * cada casa aparece una plataforma que hace de escalon.
         */
        scale: 0.95,

        /*
         * Altura que alcanza un salto. Sale de la fisica del juego:
         * 600^2 / (2 * 1200) = 150 px. De aqui depende que plataforma
         * se elige para cada casa.
         */
        jumpHeight: 150,

        /*
         * Separacion entre parejas (plataforma + casa) consecutivas.
         */
        spacing: 760,

        /*
         * Por delante del fondo (-100) y por detras de los enemigos
         * (9) y del jugador (10).
         */
        depth: 4
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
        moveSpeed: 120,

        attackDamage: 1,
        maximumHealth: 3,
        scoreValue: 100,

        detectionRange: 1200,
        attackRange: 115,
        attackCooldown: 1300,

        attackHitboxWidth: 125,
        attackHitboxHeight: 58,
        attackHitboxOffset: 15,

        decisionInterval: 120,

        /*
         * Distancia alrededor de la pantalla dentro de la cual
         * los enemigos permanecen activos.
         */
        activeAreaMargin: 350,

        /*
         * Cantidad de píxeles que el centro lógico del enemigo
         * debe avanzar dentro de la pantalla antes de pasar
         * al comportamiento normal.
         */
        entryPadding: 55,

        deathScaleMultiplier: 0.82
    },

    // =========================================================
    // EnemyManager
    // =========================================================

    enemies: {
        cullingEnabled: true,
        activeAreaMargin: 350,

        poolingEnabled: true,
        maximumPoolSize: 12
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

        initialDelay: 1200,
        delayBetweenWaves: 2200,
        spawnInterval: 850,

        initialEnemyCount: 2,
        enemyIncrement: 1,
        maximumEnemiesPerWave: 8,

        /*
         * Cero representa oleadas infinitas.
         */
        maximumWaves: 0,

        /*
         * El centro del lienzo se crea ligeramente después
         * del borde derecho.
         */
        spawnOutsideDistance: 35,
        spawnVariation: 25,

        healthIncreaseEveryWaves: 3,
        healthIncreaseAmount: 1,

        speedIncreasePerWave: 2,
        maximumSpeedBonus: 35
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