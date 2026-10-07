/*
 * Regla de permanencia en cámara.
 *
 * El escenario avanza solo, así que quedarse atrás es perder. Cuando
 * buena parte del cuerpo del jugador sale del encuadre se considera
 * que se ha descolgado del nivel: no tiene sentido seguir jugando a
 * ciegas fuera de pantalla.
 *
 * Va en su propio archivo, sin depender de Phaser, para poder
 * comprobarla sin levantar el juego entero.
 */

/*
 * Fracción del cuerpo que debe seguir viéndose. Por debajo de esto el
 * jugador muere.
 */
export const MIN_VISIBLE_FRACTION = 0.5;


/*
 * Qué parte del cuerpo queda dentro de la pantalla, de 0 a 1.
 *
 * Se mide contra el ancho de la pantalla, no contra los límites del
 * mundo físico, que se extienden 700 px a cada lado para que los
 * enemigos entren desde fuera del encuadre.
 */
export function getVisibleFraction(
    left,
    right,
    screenWidth
) {
    const width = right - left;

    if (
        !Number.isFinite(width) ||
        width <= 0 ||
        !Number.isFinite(screenWidth) ||
        screenWidth <= 0
    ) {
        return 1;
    }

    const visible =
        Math.min(right, screenWidth) -
        Math.max(left, 0);

    return (
        Math.max(0, visible) /
        width
    );
}


export function isOutOfCamera(
    left,
    right,
    screenWidth,
    minFraction = MIN_VISIBLE_FRACTION
) {
    return (
        getVisibleFraction(
            left,
            right,
            screenWidth
        ) < minFraction
    );
}
