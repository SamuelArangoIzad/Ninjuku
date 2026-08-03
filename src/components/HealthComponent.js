export default class HealthComponent {
    constructor(
        maximumHealth,
        callbacks = {}
    ) {
        this.maximumHealth =
            this.normalizeHealthValue(
                maximumHealth,
                1
            );

        this.currentHealth =
            this.maximumHealth;

        this.isDead =
            false;

        this.isDestroyed =
            false;

        // =====================================================
        // Callbacks internos
        // =====================================================

        this.onDamage =
            callbacks.onDamage ??
            null;

        this.onHeal =
            callbacks.onHeal ??
            null;

        this.onChange =
            callbacks.onChange ??
            null;

        this.onDeath =
            callbacks.onDeath ??
            null;

        // =====================================================
        // Suscriptores externos
        // =====================================================

        this.changeListeners =
            new Set();

        this.damageListeners =
            new Set();

        this.healListeners =
            new Set();

        this.deathListeners =
            new Set();
    }

    // =========================================================
    // Normalización
    // =========================================================

    normalizeHealthValue(
        value,
        fallback = 1
    ) {
        const parsedValue =
            Number(value);

        if (
            !Number.isFinite(
                parsedValue
            )
        ) {
            return Math.max(
                1,
                Math.floor(
                    Number(fallback) || 1
                )
            );
        }

        return Math.max(
            1,
            Math.floor(
                parsedValue
            )
        );
    }

    normalizeAmount(value) {
        const parsedValue =
            Number(value);

        if (
            !Number.isFinite(
                parsedValue
            )
        ) {
            return 0;
        }

        return Math.max(
            0,
            parsedValue
        );
    }

    // =========================================================
    // Daño
    // =========================================================

    takeDamage(amount) {
        if (
            this.isDestroyed ||
            this.isDead
        ) {
            return false;
        }

        const damage =
            this.normalizeAmount(
                amount
            );

        if (damage <= 0) {
            return false;
        }

        const previousHealth =
            this.currentHealth;

        this.currentHealth =
            Math.max(
                0,
                this.currentHealth -
                    damage
            );

        const appliedDamage =
            previousHealth -
            this.currentHealth;

        if (appliedDamage <= 0) {
            return false;
        }

        const damagePayload =
            this.createPayload({
                amount:
                    appliedDamage
            });

        this.onDamage?.(
            appliedDamage,
            this
        );

        this.emitToListeners(
            this.damageListeners,
            damagePayload
        );

        /*
         * Primero se actualiza el estado de muerte y después
         * se notifica el cambio. Así los suscriptores reciben
         * isDead correcto cuando la vida llega a cero.
         */
        if (this.currentHealth <= 0) {
            this.currentHealth =
                0;

            this.isDead =
                true;
        }

        this.notifyChange();

        if (this.isDead) {
            const deathPayload =
                this.createPayload();

            this.onDeath?.(
                this
            );

            this.emitToListeners(
                this.deathListeners,
                deathPayload
            );
        }

        return true;
    }

    // =========================================================
    // Curación
    // =========================================================

    heal(amount) {
        if (
            this.isDestroyed ||
            this.isDead
        ) {
            return false;
        }

        const healing =
            this.normalizeAmount(
                amount
            );

        if (healing <= 0) {
            return false;
        }

        const previousHealth =
            this.currentHealth;

        this.currentHealth =
            Math.min(
                this.maximumHealth,
                this.currentHealth +
                    healing
            );

        const appliedHealing =
            this.currentHealth -
            previousHealth;

        if (appliedHealing <= 0) {
            return false;
        }

        const healPayload =
            this.createPayload({
                amount:
                    appliedHealing
            });

        this.onHeal?.(
            appliedHealing,
            this
        );

        this.emitToListeners(
            this.healListeners,
            healPayload
        );

        this.notifyChange();

        return true;
    }

    // =========================================================
    // Reinicio y reutilización
    // =========================================================

    reset(
        maximumHealth = null,
        notify = true
    ) {
        if (this.isDestroyed) {
            return false;
        }

        if (
            maximumHealth !== null &&
            maximumHealth !== undefined
        ) {
            this.maximumHealth =
                this.normalizeHealthValue(
                    maximumHealth,
                    this.maximumHealth
                );
        }

        this.currentHealth =
            this.maximumHealth;

        this.isDead =
            false;

        if (notify) {
            this.notifyChange();
        }

        return true;
    }

    revive(
        health = null,
        notify = true
    ) {
        if (this.isDestroyed) {
            return false;
        }

        this.isDead =
            false;

        if (
            health === null ||
            health === undefined
        ) {
            this.currentHealth =
                this.maximumHealth;
        } else {
            const nextHealth =
                Number(health);

            if (
                !Number.isFinite(
                    nextHealth
                )
            ) {
                this.currentHealth =
                    this.maximumHealth;
            } else {
                this.currentHealth =
                    Math.min(
                        this.maximumHealth,
                        Math.max(
                            1,
                            nextHealth
                        )
                    );
            }
        }

        if (notify) {
            this.notifyChange();
        }

        return true;
    }

    setMaximumHealth(
        value,
        options = {}
    ) {
        if (this.isDestroyed) {
            return false;
        }

        const nextMaximumHealth =
            this.normalizeHealthValue(
                value,
                this.maximumHealth
            );

        const preservePercentage =
            Boolean(
                options.preservePercentage
            );

        const fillCurrentHealth =
            Boolean(
                options.fillCurrentHealth
            );

        const notify =
            options.notify ??
            true;

        if (
            nextMaximumHealth ===
            this.maximumHealth &&
            !fillCurrentHealth
        ) {
            return false;
        }

        const previousPercentage =
            this.getPercentage();

        this.maximumHealth =
            nextMaximumHealth;

        if (fillCurrentHealth) {
            this.currentHealth =
                this.maximumHealth;

            this.isDead =
                false;
        } else if (preservePercentage) {
            this.currentHealth =
                Math.max(
                    this.isDead
                        ? 0
                        : 1,

                    Math.round(
                        this.maximumHealth *
                        previousPercentage
                    )
                );

            this.currentHealth =
                Math.min(
                    this.maximumHealth,
                    this.currentHealth
                );
        } else {
            this.currentHealth =
                Math.min(
                    this.currentHealth,
                    this.maximumHealth
                );
        }

        if (
            this.currentHealth <= 0
        ) {
            this.currentHealth =
                0;

            this.isDead =
                true;
        }

        if (notify) {
            this.notifyChange();
        }

        return true;
    }

    setCurrentHealth(
        value,
        notify = true
    ) {
        if (this.isDestroyed) {
            return false;
        }

        const parsedValue =
            Number(value);

        if (
            !Number.isFinite(
                parsedValue
            )
        ) {
            return false;
        }

        const nextHealth =
            Math.min(
                this.maximumHealth,
                Math.max(
                    0,
                    parsedValue
                )
            );

        if (
            nextHealth ===
            this.currentHealth
        ) {
            return false;
        }

        this.currentHealth =
            nextHealth;

        this.isDead =
            this.currentHealth <= 0;

        if (notify) {
            this.notifyChange();
        }

        return true;
    }

    // =========================================================
    // Callbacks
    // =========================================================

    setCallbacks(
        callbacks = {}
    ) {
        if (this.isDestroyed) {
            return false;
        }

        this.onDamage =
            callbacks.onDamage ??
            this.onDamage;

        this.onHeal =
            callbacks.onHeal ??
            this.onHeal;

        this.onChange =
            callbacks.onChange ??
            this.onChange;

        this.onDeath =
            callbacks.onDeath ??
            this.onDeath;

        return true;
    }

    clearCallbacks() {
        if (this.isDestroyed) {
            return;
        }

        this.onDamage =
            null;

        this.onHeal =
            null;

        this.onChange =
            null;

        this.onDeath =
            null;
    }

    // =========================================================
    // Suscripciones
    // =========================================================

    subscribe(listener) {
        return this.addListener(
            this.changeListeners,
            listener
        );
    }

    subscribeToDamage(listener) {
        return this.addListener(
            this.damageListeners,
            listener
        );
    }

    subscribeToHeal(listener) {
        return this.addListener(
            this.healListeners,
            listener
        );
    }

    subscribeToDeath(listener) {
        return this.addListener(
            this.deathListeners,
            listener
        );
    }

    addListener(
        collection,
        listener
    ) {
        if (
            this.isDestroyed ||
            !(collection instanceof Set) ||
            typeof listener !==
                "function"
        ) {
            return () => {};
        }

        collection.add(
            listener
        );

        let isSubscribed =
            true;

        return () => {
            if (!isSubscribed) {
                return;
            }

            isSubscribed =
                false;

            collection.delete(
                listener
            );
        };
    }

    emitToListeners(
        collection,
        payload
    ) {
        if (
            this.isDestroyed ||
            !(collection instanceof Set) ||
            collection.size === 0
        ) {
            return;
        }

        /*
         * Se copia el Set para permitir que un listener se
         * desuscriba durante la propia notificación sin alterar
         * el recorrido activo.
         */
        const listeners =
            Array.from(
                collection
            );

        for (
            const listener
            of listeners
        ) {
            try {
                listener(
                    payload
                );
            } catch (error) {
                console.error(
                    "[HealthComponent] " +
                    "Error en listener:",
                    error
                );
            }
        }
    }

    clearListeners() {
        this.changeListeners.clear();
        this.damageListeners.clear();
        this.healListeners.clear();
        this.deathListeners.clear();
    }

    // =========================================================
    // Notificaciones
    // =========================================================

    createPayload(
        additionalData = {}
    ) {
        return {
            ...additionalData,

            currentHealth:
                this.currentHealth,

            maximumHealth:
                this.maximumHealth,

            percentage:
                this.getPercentage(),

            isDead:
                this.isDead,

            component:
                this
        };
    }

    notifyChange() {
        if (this.isDestroyed) {
            return;
        }

        const payload =
            this.createPayload();

        this.onChange?.(
            this.currentHealth,
            this.maximumHealth,
            this
        );

        this.emitToListeners(
            this.changeListeners,
            payload
        );
    }

    // =========================================================
    // Consultas
    // =========================================================

    getCurrentHealth() {
        return this.currentHealth;
    }

    getMaximumHealth() {
        return this.maximumHealth;
    }

    getMissingHealth() {
        return Math.max(
            0,
            this.maximumHealth -
            this.currentHealth
        );
    }

    getPercentage() {
        if (
            this.maximumHealth <= 0
        ) {
            return 0;
        }

        return Math.min(
            1,
            Math.max(
                0,
                this.currentHealth /
                    this.maximumHealth
            )
        );
    }

    hasDied() {
        return this.isDead;
    }

    isAlive() {
        return (
            !this.isDestroyed &&
            !this.isDead &&
            this.currentHealth > 0
        );
    }

    isAtMaximumHealth() {
        return (
            !this.isDestroyed &&
            this.currentHealth >=
                this.maximumHealth
        );
    }

    isDamaged() {
        return (
            !this.isDestroyed &&
            this.currentHealth > 0 &&
            this.currentHealth <
                this.maximumHealth
        );
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

        this.clearListeners();
        this.clearCallbacks();

        this.currentHealth =
            0;

        this.maximumHealth =
            1;

        this.isDead =
            true;
    }
}