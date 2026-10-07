/*
 * Junta los puntos de enganche del kusarigama, que ahora salen de dos
 * sitios distintos:
 *
 * - Los colgantes de las ramas de cerezo, anclados al fondo.
 * - Los que acompañan a cada enemigo de tejado, anclados a su casa.
 *
 * El kusarigama no tiene por qué saber de dónde viene cada uno, así
 * que pregunta aquí y esta clase busca en todas las fuentes. Expone la
 * misma interfaz que ya usaba, para no tocar su lógica.
 */
export default class HookRegistry {
    constructor(sources = []) {
        this.sources =
            Array.isArray(sources)
                ? sources.filter(Boolean)
                : [];
    }

    addSource(source) {
        if (
            source &&
            !this.sources.includes(source)
        ) {
            this.sources.push(source);
        }
    }

    getHooks() {
        const hooks = [];

        for (const source of this.sources) {
            const own =
                source?.getHooks?.() ?? [];

            for (const hook of own) {
                hooks.push(hook);
            }
        }

        return hooks;
    }

    findHookById(id) {
        if (!id) {
            return null;
        }

        for (const hook of this.getHooks()) {
            if (hook.id === id) {
                return hook;
            }
        }

        return null;
    }

    /*
     * Gancho más cercano al jugador que además esté lo bastante alto
     * como para colgarse y balancearse sin rozar el suelo.
     */
    findNearestHook(
        x,
        y,
        options = {}
    ) {
        const maxDistance =
            Number(options.maxDistance) ||
            Infinity;

        const minHeight =
            Number(options.minHeight) || 0;

        let best = null;
        let bestDistance = Infinity;

        for (const hook of this.getHooks()) {
            if (y - hook.y < minHeight) {
                continue;
            }

            const distance =
                Math.hypot(
                    hook.x - x,
                    hook.y - y
                );

            if (
                distance > maxDistance ||
                distance >= bestDistance
            ) {
                continue;
            }

            best = hook;
            bestDistance = distance;
        }

        return best;
    }
}
