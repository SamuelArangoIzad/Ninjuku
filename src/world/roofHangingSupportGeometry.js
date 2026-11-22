/**
 * Geometría del soporte que une un colgante de tejado con su casa.
 * Usa coordenadas de pantalla/mundo de RoofEnemyManager, sin afectar la física.
 */
export function getRoofHangingSupportGeometry({ hookTopX, hookTopY, roofLeftX, roofSurfaceY, scale = 1 }) {
    for (const value of [hookTopX, hookTopY, roofLeftX, roofSurfaceY, scale]) {
        if (!Number.isFinite(value)) throw new TypeError("Geometría de tejado inválida");
    }
    const s = Math.max(0.2, Math.abs(scale));
    const postX = roofLeftX - hookTopX + 7 * s;
    const postBottom = roofSurfaceY - hookTopY;
    return {
        postX,
        postBottom,
        beamY: -10 * s,
        beamLeft: -12 * s,
        thickness: Math.max(5, 16 * s),
        scale: s
    };
}
