/** Geometría local del soporte. El gancho del sprite está en (0,0). */
export function getHangingSupportGeometry(anchorY, groundY, scale) {
    const s = Math.max(0.25, Number(scale) || 1);
    const deckY = 129;
    const height = Math.max(deckY + 45, (groundY - anchorY) / s);
    return {
        scale: s,
        height,
        postX: 132,
        deckY,
        // La viga debe sostener la argolla superior, no el tablón inferior.
        beamY: -13,
        ringX: 0,
        armStartX: -14
    };
}
