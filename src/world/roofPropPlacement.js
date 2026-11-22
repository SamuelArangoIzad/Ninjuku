/**
 * Disposición del tablón de tejado en píxeles de pantalla.
 * Conserva la altura de la tabla respecto a su argolla, pero impide que
 * la argolla termine pegada al borde superior en pantallas horizontales.
 */
export function getRoofPropPlacement({
    roofLeft, roofY, hookDrop, propScale, screenWidth, screenHeight,
    plankRow = 129
}) {
    const values = [roofLeft, roofY, hookDrop, propScale, screenWidth, screenHeight, plankRow];
    if (!values.every(Number.isFinite) || propScale <= 0 || screenWidth <= 0 || screenHeight <= 0) {
        throw new TypeError('Coordenadas inválidas para colgante de tejado');
    }

    // A 915px de ancho, el hueco será ~137px; a tamaño escritorio
    // conserva el límite anterior de 190px.
    const gap = Math.min(190, Math.max(130, screenWidth * 0.15));
    const x = roofLeft - gap;
    const naturalTopY = roofY - hookDrop - plankRow * propScale;
    const topMargin = Math.max(38, Math.min(68, screenHeight * 0.13));
    // Un soporte muy alto tapaba la montaña y dejaba la argolla fuera
    // del área útil. Máximo 135px de elevación sobre el tejado.
    const topY = Math.max(naturalTopY, topMargin, roofY - Math.min(135, screenHeight * 0.34));
    return {
        x,
        topY,
        hookX: x,
        hookY: topY + plankRow * propScale,
        gap
    };
}
