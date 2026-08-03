export default class HighScoreSystem {
    constructor(configuration = {}) {
        // =====================================================
        // Configuración
        // =====================================================

        this.storageKey =
            configuration.storageKey ??
            "ninjuku_highscores";

        this.maximumEntries =
            Math.max(
                1,
                Math.floor(
                    Number(
                        configuration.maximumEntries
                    ) || 10
                )
            );

        this.maximumNameLength =
            Math.max(
                1,
                Math.floor(
                    Number(
                        configuration.maximumNameLength
                    ) || 10
                )
            );

        this.defaultName =
            this.normalizeName(
                configuration.defaultName ??
                "PLAYER"
            );

        // =====================================================
        // Estado
        // =====================================================

        this.scores = [];

        this.isDestroyed = false;

        this.load();
    }

    // =========================================================
    // Lectura
    // =========================================================

    load() {
        if (this.isDestroyed) {
            return [];
        }

        const storage =
            this.getStorage();

        if (!storage) {
            this.scores = [];

            return this.scores;
        }

        try {
            const storedValue =
                storage.getItem(
                    this.storageKey
                );

            if (!storedValue) {
                this.scores = [];

                return this.scores;
            }

            const parsedValue =
                JSON.parse(
                    storedValue
                );

            if (
                !Array.isArray(
                    parsedValue
                )
            ) {
                this.scores = [];

                return this.scores;
            }

            this.scores =
                parsedValue
                    .map(
                        (entry) =>
                            this.normalizeEntry(
                                entry
                            )
                    )
                    .filter(
                        Boolean
                    );

            this.sortScores();
            this.trimScores();

            return this.scores;
        } catch (error) {
            console.error(
                "[HighScoreSystem] " +
                "No se pudieron cargar las puntuaciones:",
                error
            );

            this.scores = [];

            return this.scores;
        }
    }

    // =========================================================
    // Escritura
    // =========================================================

    save() {
        if (this.isDestroyed) {
            return false;
        }

        const storage =
            this.getStorage();

        if (!storage) {
            return false;
        }

        try {
            storage.setItem(
                this.storageKey,
                JSON.stringify(
                    this.scores
                )
            );

            return true;
        } catch (error) {
            console.error(
                "[HighScoreSystem] " +
                "No se pudieron guardar las puntuaciones:",
                error
            );

            return false;
        }
    }

    // =========================================================
    // Registro de puntuaciones
    // =========================================================

    addScore(
        name,
        score
    ) {
        if (this.isDestroyed) {
            return null;
        }

        const entry = {
            name:
                this.normalizeName(
                    name
                ),

            score:
                this.normalizeScore(
                    score
                ),

            createdAt:
                Date.now()
        };

        this.scores.push(
            entry
        );

        this.sortScores();
        this.trimScores();
        this.save();

        return {
            ...entry,

            position:
                this.getEntryPosition(
                    entry
                )
        };
    }

    qualifies(score) {
        if (this.isDestroyed) {
            return false;
        }

        const safeScore =
            this.normalizeScore(
                score
            );

        if (
            this.scores.length <
            this.maximumEntries
        ) {
            return true;
        }

        const lastEntry =
            this.scores[
                this.scores.length - 1
            ];

        return (
            safeScore >
            (
                lastEntry?.score ??
                0
            )
        );
    }

    getEntryPosition(entry) {
        const index =
            this.scores.indexOf(
                entry
            );

        return index >= 0
            ? index + 1
            : null;
    }

    // =========================================================
    // Ordenamiento
    // =========================================================

    sortScores() {
        this.scores.sort(
            (
                firstEntry,
                secondEntry
            ) => {
                const scoreDifference =
                    secondEntry.score -
                    firstEntry.score;

                if (
                    scoreDifference !== 0
                ) {
                    return scoreDifference;
                }

                /*
                 * En caso de empate, la puntuación más antigua
                 * queda primero.
                 */
                return (
                    firstEntry.createdAt -
                    secondEntry.createdAt
                );
            }
        );
    }

    trimScores() {
        if (
            this.scores.length <=
            this.maximumEntries
        ) {
            return;
        }

        this.scores.length =
            this.maximumEntries;
    }

    // =========================================================
    // Normalización
    // =========================================================

    normalizeEntry(entry) {
        if (
            !entry ||
            typeof entry !==
                "object"
        ) {
            return null;
        }

        return {
            name:
                this.normalizeName(
                    entry.name
                ),

            score:
                this.normalizeScore(
                    entry.score
                ),

            createdAt:
                this.normalizeDate(
                    entry.createdAt
                )
        };
    }

    normalizeName(name) {
        const safeName =
            String(
                name ?? ""
            )
                .trim()
                .toUpperCase()
                .replace(
                    /[^A-Z0-9 ÁÉÍÓÚÑ_-]/g,
                    ""
                )
                .slice(
                    0,
                    this.maximumNameLength
                );

        return (
            safeName ||
            this.defaultName ||
            "PLAYER"
        );
    }

    normalizeScore(score) {
        const safeScore =
            Number(score);

        if (
            !Number.isFinite(
                safeScore
            )
        ) {
            return 0;
        }

        return Math.max(
            0,
            Math.floor(
                safeScore
            )
        );
    }

    normalizeDate(value) {
        const date =
            Number(value);

        if (
            !Number.isFinite(date) ||
            date <= 0
        ) {
            return Date.now();
        }

        return Math.floor(
            date
        );
    }

    // =========================================================
    // Consultas
    // =========================================================

    getScores(
        limit =
            this.maximumEntries
    ) {
        if (this.isDestroyed) {
            return [];
        }

        const safeLimit =
            Math.max(
                0,
                Math.floor(
                    Number(limit) ||
                    this.maximumEntries
                )
            );

        return this.scores
            .slice(
                0,
                safeLimit
            )
            .map(
                (entry) => ({
                    ...entry
                })
            );
    }

    getBestScore() {
        if (
            this.isDestroyed ||
            this.scores.length === 0
        ) {
            return 0;
        }

        return (
            this.scores[0]?.score ??
            0
        );
    }

    getBestEntry() {
        if (
            this.isDestroyed ||
            this.scores.length === 0
        ) {
            return null;
        }

        return {
            ...this.scores[0]
        };
    }

    getScoreCount() {
        return this.scores.length;
    }

    getMaximumEntries() {
        return this.maximumEntries;
    }

    isEmpty() {
        return (
            this.scores.length === 0
        );
    }

    // =========================================================
    // Eliminación de puntuaciones
    // =========================================================

    removeScoreAt(index) {
        if (this.isDestroyed) {
            return false;
        }

        const safeIndex =
            Math.floor(
                Number(index)
            );

        if (
            !Number.isFinite(
                safeIndex
            ) ||
            safeIndex < 0 ||
            safeIndex >=
                this.scores.length
        ) {
            return false;
        }

        this.scores.splice(
            safeIndex,
            1
        );

        this.save();

        return true;
    }

    clear() {
        if (this.isDestroyed) {
            return false;
        }

        this.scores.length =
            0;

        const storage =
            this.getStorage();

        if (!storage) {
            return false;
        }

        try {
            storage.removeItem(
                this.storageKey
            );

            return true;
        } catch (error) {
            console.error(
                "[HighScoreSystem] " +
                "No se pudieron borrar las puntuaciones:",
                error
            );

            return false;
        }
    }

    // =========================================================
    // Exportar e importar JSON
    // =========================================================

    exportToJSON(
        formatted = true
    ) {
        if (this.isDestroyed) {
            return "[]";
        }

        return JSON.stringify(
            this.scores,
            null,
            formatted
                ? 4
                : 0
        );
    }

    importFromJSON(
        json,
        replace = true
    ) {
        if (
            this.isDestroyed ||
            typeof json !==
                "string"
        ) {
            return false;
        }

        try {
            const parsedValue =
                JSON.parse(
                    json
                );

            if (
                !Array.isArray(
                    parsedValue
                )
            ) {
                return false;
            }

            const importedScores =
                parsedValue
                    .map(
                        (entry) =>
                            this.normalizeEntry(
                                entry
                            )
                    )
                    .filter(
                        Boolean
                    );

            if (replace) {
                this.scores.length =
                    0;
            }

            this.scores.push(
                ...importedScores
            );

            this.sortScores();
            this.trimScores();
            this.save();

            return true;
        } catch (error) {
            console.error(
                "[HighScoreSystem] " +
                "JSON de puntuaciones inválido:",
                error
            );

            return false;
        }
    }

    // =========================================================
    // localStorage
    // =========================================================

    getStorage() {
        if (
            typeof window ===
                "undefined" ||
            !window.localStorage
        ) {
            return null;
        }

        return window.localStorage;
    }

    // =========================================================
    // Destrucción
    // =========================================================

    destroy() {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed =
            true;

        /*
         * No se borra localStorage.
         * Solo se libera la instancia en memoria.
         */
        this.scores.length =
            0;
    }
}