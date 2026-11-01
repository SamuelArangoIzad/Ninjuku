/*
 * Musica de fondo del juego.
 *
 * Suena durante toda la partida, de principio a fin, sin cortarse al
 * cambiar de escena. Phaser guarda los sonidos en el gestor del
 * juego, no en la escena, asi que basta con crearla una vez y
 * comprobar antes si ya existe: al pasar del menu a la partida y de
 * la partida al final, la misma pista sigue sonando sin reiniciarse.
 *
 * Los navegadores no dejan que un sonido empiece solo, sin que el
 * jugador haya tocado nada. Si llega bloqueada, se deja preparada y
 * arranca en cuanto Phaser avisa de que ya se puede, que en este
 * juego ocurre al pulsar para empezar.
 *
 * La musica va atada a la pagina que se esta viendo, no al proceso
 * del servidor. Esto importa: con el servidor de desarrollo en marcha
 * es facil acabar con varias pestañas abiertas en el mismo localhost,
 * y cada una tiene su propio juego sonando. Una pestaña que queda
 * detras, o minimizada, seguia sonando aunque no se viera, y daba la
 * sensacion de que la musica no se apagaba nunca. Asi que:
 *
 *   - mientras la pagina no se ve, la musica se calla;
 *   - al volver a ella, sigue por donde iba;
 *   - al cerrarla o recargarla, se para del todo.
 */

export const MUSIC_KEY = "background-music";

const VOLUME = 0.35;

/*
 * Una sola vez por pagina, aunque se llame a start() desde varias
 * escenas.
 */
let lifecycleBound = false;

/*
 * Si la musica se callo solo porque la pagina dejo de verse. Sirve
 * para no reanudarla cuando el jugador la habia parado por su cuenta.
 */
let pausedByPage = false;


export default class BackgroundMusic {
    /*
     * Pide el archivo. Se llama desde el preload de la primera
     * escena que lo necesite; si ya esta pedido, no hace nada.
     */
    static load(scene) {
        if (
            !scene?.load ||
            scene.cache?.audio?.exists?.(MUSIC_KEY)
        ) {
            return;
        }

        scene.load.audio(
            MUSIC_KEY,
            "/assets/MusicBackground/Steel_Under_the_Moon.mp3"
        );
    }

    /*
     * Arranca la musica si no estaba ya sonando. Se puede llamar
     * desde cualquier escena y tantas veces como haga falta.
     */
    static start(scene) {
        const manager = scene?.sound;

        if (
            !manager ||
            !scene.cache?.audio?.exists?.(MUSIC_KEY)
        ) {
            return null;
        }

        BackgroundMusic.bindToPage(scene);

        /*
         * Si la pagina no se esta viendo, ni se empieza. Ya arrancara
         * cuando se vuelva a ella.
         */
        if (BackgroundMusic.isPageHidden()) {
            pausedByPage = true;

            return manager.get?.(MUSIC_KEY) ?? null;
        }

        const existente =
            manager.get?.(MUSIC_KEY) ?? null;

        if (existente) {
            if (!existente.isPlaying) {
                BackgroundMusic.play(
                    manager,
                    existente
                );
            }

            return existente;
        }

        const pista =
            manager.add(
                MUSIC_KEY,
                {
                    loop: true,
                    volume: VOLUME
                }
            );

        BackgroundMusic.play(manager, pista);

        return pista;
    }

    /*
     * Intenta sonar ya; si el navegador lo tiene bloqueado, espera a
     * que Phaser lo desbloquee con el primer toque o tecla.
     */
    static play(manager, pista) {
        if (!manager.locked) {
            pista.play();

            return;
        }

        manager.once(
            "unlocked",
            () => {
                /*
                 * Entre el bloqueo y el desbloqueo puede haber pasado
                 * de todo, asi que se vuelve a mirar.
                 */
                if (
                    !pista.isPlaying &&
                    !BackgroundMusic.isPageHidden()
                ) {
                    pista.play();
                }
            }
        );
    }

    // =========================================================
    // Ciclo de vida de la página
    // =========================================================

    static isPageHidden() {
        return (
            typeof document !== "undefined" &&
            document.visibilityState === "hidden"
        );
    }

    /*
     * Ata la musica a la pagina. Los avisos se ponen una sola vez y
     * se quitan solos cuando el juego se destruye, para no dejar
     * nada colgando apuntando a un juego que ya no existe.
     */
    static bindToPage(scene) {
        if (
            lifecycleBound ||
            typeof document === "undefined" ||
            typeof window === "undefined"
        ) {
            return;
        }

        const game = scene?.game;

        if (!game) {
            return;
        }

        lifecycleBound = true;

        const alCambiarVisibilidad = () => {
            const pista =
                game.sound?.get?.(MUSIC_KEY);

            if (BackgroundMusic.isPageHidden()) {
                if (pista?.isPlaying) {
                    pista.pause();

                    pausedByPage = true;
                }

                return;
            }

            /*
             * Si la pagina arranco oculta, la pista ni siquiera
             * llego a crearse. Se crea ahora, al mirarla por fin.
             */
            if (!pista) {
                BackgroundMusic.startFromActiveScene(game);

                return;
            }

            if (
                pausedByPage &&
                !pista.isPlaying
            ) {
                /*
                 * Si solo estaba en pausa, sigue por donde iba. Si
                 * estaba parada del todo (al salir de la pagina se
                 * para, y el navegador puede devolverla despues),
                 * hay que volver a ponerla.
                 */
                if (pista.isPaused) {
                    pista.resume();
                } else {
                    pista.play();
                }
            }

            pausedByPage = false;
        };

        /*
         * Al cerrar o recargar la pagina se corta del todo. Sin esto,
         * en algunos navegadores la pestaña se guarda en memoria con
         * el sonido todavia vivo.
         */
        const alSalir = () => {
            game.sound?.get?.(MUSIC_KEY)?.stop?.();

            game.sound?.stopAll?.();

            /*
             * Queda marcado que el silencio es cosa de la pagina, no
             * del jugador, por si el navegador la devuelve.
             */
            pausedByPage = true;
        };

        document.addEventListener(
            "visibilitychange",
            alCambiarVisibilidad
        );

        window.addEventListener(
            "pagehide",
            alSalir
        );

        /*
         * Si el navegador devuelve la pagina desde su memoria, la
         * musica se habia parado al salir: vuelve a empezar.
         */
        window.addEventListener(
            "pageshow",
            alCambiarVisibilidad
        );

        game.events?.once?.(
            "destroy",
            () => {
                document.removeEventListener(
                    "visibilitychange",
                    alCambiarVisibilidad
                );

                window.removeEventListener(
                    "pagehide",
                    alSalir
                );

                window.removeEventListener(
                    "pageshow",
                    alCambiarVisibilidad
                );

                lifecycleBound = false;
                pausedByPage = false;
            }
        );
    }

    /*
     * Arranca la musica usando cualquier escena que este corriendo.
     * Lo usa el aviso de visibilidad, que no tiene escena propia.
     */
    static startFromActiveScene(game) {
        const escenas =
            game?.scene?.getScenes?.(true) ?? [];

        for (const escena of escenas) {
            if (
                escena?.cache?.audio
                    ?.exists?.(MUSIC_KEY)
            ) {
                BackgroundMusic.start(escena);

                return;
            }
        }
    }

    static stop(scene) {
        const pista =
            scene?.sound?.get?.(MUSIC_KEY);

        pista?.stop?.();

        pausedByPage = false;
    }
}
