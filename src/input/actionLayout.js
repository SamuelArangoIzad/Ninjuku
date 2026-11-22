/** Diseño móvil en coordenadas del canvas. Mantiene las cuatro acciones dentro de la pantalla. */
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export function computeControlMetrics(width, height) {
    const w = Math.max(1, Number(width) || 1);
    const h = Math.max(1, Number(height) || 1);
    const small = Math.min(w, h);
    // El área visible es menor que el área de toque (radio ampliado en Controls).
    const size = Math.round(clamp(small * 0.078, 28, 34));
    const spacing = Math.round(clamp(small * 0.108, 38, 47));
    const edge = Math.round(clamp(small * 0.060, 22, 38));
    return { size, spacing, edge };
}

export function computeActionLayout(width, height, config = {}) {
    const w = Math.max(1, Number(width) || 1);
    const h = Math.max(1, Number(height) || 1);
    const metrics = computeControlMetrics(w, h);
    const size = Number(config.size) || metrics.size;
    const arm = Number(config.spacing) || metrics.spacing;
    const safe = Math.max(2, size / 2 + 2);
    const right = Math.max(safe, Number(config.rightOffset) || metrics.edge);
    const bottom = Math.max(safe, Number(config.bottomOffset) || metrics.edge);
    // Dejar margen suficiente para los cuatro botones, incluso en equipos compactos.
    const centerX = clamp(w - right - arm, safe + arm, Math.max(safe + arm, w - safe - arm));
    const centerY = clamp(h - bottom - arm, safe + arm, Math.max(safe + arm, h - safe - arm));
    return {
        triangle: { x: Math.round(centerX), y: Math.round(centerY - arm) },
        square: { x: Math.round(centerX - arm), y: Math.round(centerY) },
        circle: { x: Math.round(centerX + arm), y: Math.round(centerY) },
        cross: { x: Math.round(centerX), y: Math.round(centerY + arm) }
    };
}
