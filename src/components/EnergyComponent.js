/** Energía del kusarigama: drenaje continuo y recuperación por intervalos.
 * Los cálculos usan delta de Phaser, no intervalos del navegador.
 */
export default class EnergyComponent {
    constructor({ maximumSegments = 5, drainMsPerSegment = 3000, regenerationMsPerSegment = 15000 } = {}) {
        this.maximumSegments = Math.max(1, Math.floor(maximumSegments));
        this.currentSegments = this.maximumSegments;
        this.drainMsPerSegment = Math.max(1, drainMsPerSegment);
        this.regenerationMsPerSegment = Math.max(1, regenerationMsPerSegment);
        this.regenerationElapsedMs = 0;
        this.wasHanging = false;
    }

    // Exige al menos un segmento completo para iniciar un nuevo enganche.
    // Un enganche ya activo puede consumir su fracción restante hasta agotarla.
    canHook() { return this.currentSegments >= 1; }
    getPercentage() { return this.currentSegments / this.maximumSegments; }

    update(delta, hanging) {
        const duration = Math.max(0, Number(delta) || 0);
        // Enganchado equivale al estado HOOKED del kusarigama, no a tocar suelo.
        if (hanging) {
            // Nunca regenerar mientras se está colgado.
            this.regenerationElapsedMs = 0;
            this.currentSegments = Math.max(0, this.currentSegments - duration / this.drainMsPerSegment);
            // Evita residuos de coma flotante que permitirían engancharse sin energía.
            if (this.currentSegments < 1e-8) this.currentSegments = 0;
            this.wasHanging = true;
            return this.currentSegments > 0;
        }
        if (this.wasHanging) this.regenerationElapsedMs = 0;
        this.wasHanging = false;
        if (this.currentSegments >= this.maximumSegments) {
            this.regenerationElapsedMs = 0;
            return true;
        }
        this.regenerationElapsedMs += duration;
        while (this.regenerationElapsedMs >= this.regenerationMsPerSegment) {
            this.regenerationElapsedMs -= this.regenerationMsPerSegment;
            this.currentSegments = Math.min(this.maximumSegments, this.currentSegments + 1);
            if (this.currentSegments >= this.maximumSegments) {
                this.regenerationElapsedMs = 0;
                break;
            }
        }
        return true;
    }
}
