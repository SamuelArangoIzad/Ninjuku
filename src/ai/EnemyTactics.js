/** Roles inspirados en la diferenciación de perseguidores de juegos arcade.
 * No copian algoritmos de Pac-Man: son tres perfiles de combate propios.
 */
export const TACTICAL_PROFILES = Object.freeze([
    Object.freeze({ name: "hunter", cooldownBonus: 450, reaction: 650, preferredDistance: 55 }),
    Object.freeze({ name: "guard", cooldownBonus: 850, reaction: 1100, preferredDistance: 88 }),
    Object.freeze({ name: "rookie", cooldownBonus: 1350, reaction: 1550, preferredDistance: 105 })
]);
export function tacticalProfile(index) {
    return TACTICAL_PROFILES[(Math.max(0, Math.floor(index)) % TACTICAL_PROFILES.length)];
}

/** Separación suave; nunca modifica la física ni teletransporta enemigos. */
export function tacticalDecision(enemy, targetX, time) {
    const ownX = enemy?.getSprite?.()?.x;
    if (!Number.isFinite(ownX) || !Number.isFinite(targetX)) return null;
    const profile = enemy.tacticalProfile ?? TACTICAL_PROFILES[0];
    const direction = Math.sign(targetX - ownX);
    const peers = enemy.tacticalPeers?.() ?? [];
    for (const peer of peers) {
        if (peer === enemy || !peer?.isAlive?.()) continue;
        const otherX = peer?.getSprite?.()?.x;
        if (!Number.isFinite(otherX)) continue;
        const spacing = Math.abs(otherX - ownX);
        if (spacing >= 47 || spacing < 0.01) continue;
        const sameSide = Math.sign(targetX - otherX) === direction;
        if (!sameSide) continue;
        // Solo el que está más lejos del jugador cede espacio.
        if (Math.abs(targetX - ownX) > Math.abs(targetX - otherX)) {
            return { action: 'retreat', direction: -direction };
        }
    }
    if (time < (enemy.tacticalReadyAt ?? 0)) return { action: 'hold' };
    const attackingPeer = peers.some(peer => peer !== enemy && peer?.isAlive?.() &&
        peer.isAttacking && Math.abs((peer?.getSprite?.()?.x ?? Infinity) - targetX) < 180);
    if (attackingPeer) return { action: 'hold' };
    // El novato duda ocasionalmente al entrar en rango; el cazador no.
    if (profile.name === 'rookie' && Math.abs(targetX - ownX) < profile.preferredDistance &&
        (Math.floor(time / 850) % 3 === 0)) return { action: 'hold' };
    return null;
}
