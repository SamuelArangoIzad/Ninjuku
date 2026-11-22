/** Etiquetas bilingües del HUD y de la supervivencia por oleadas. */
export const HUD_LABELS = Object.freeze({
    health: "体力 · VIDA",
    energy: "気力 · ENERGÍA",
    score: "得点 · PUNTAJE"
});

const DIGITS = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

/** Representación japonesa simple para rondas 1–99. */
export function roundNumberToKanji(value) {
    if (!Number.isSafeInteger(value) || value < 1) return String(value);
    if (value > 99) return String(value);
    if (value < 10) return DIGITS[value];
    const tens = Math.floor(value / 10);
    const ones = value % 10;
    return `${tens === 1 ? "" : DIGITS[tens]}十${DIGITS[ones]}`;
}

export function formatRoundLabel(number) {
    return `第${roundNumberToKanji(number)}波 · RONDA ${number}`;
}
