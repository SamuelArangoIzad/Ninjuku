import test from "node:test";
import assert from "node:assert/strict";
import { HUD_LABELS, formatRoundLabel, roundNumberToKanji } from "../src/ui/japaneseLabels.js";

test("etiquetas bilingües para HUD", () => {
  assert.equal(HUD_LABELS.health, "体力 · VIDA");
  assert.equal(HUD_LABELS.energy, "気力 · ENERGÍA");
  assert.equal(HUD_LABELS.score, "得点 · PUNTAJE");
});

test("rondas iniciales con caracteres japoneses", () => {
  assert.equal(formatRoundLabel(1), "第一波 · RONDA 1");
  assert.equal(formatRoundLabel(2), "第二波 · RONDA 2");
  assert.equal(formatRoundLabel(3), "第三波 · RONDA 3");
});

test("rondas 10, 11, 20 y 99", () => {
  assert.equal(roundNumberToKanji(10), "十");
  assert.equal(roundNumberToKanji(11), "十一");
  assert.equal(roundNumberToKanji(20), "二十");
  assert.equal(roundNumberToKanji(99), "九十九");
});

test("las rondas superiores a 99 conservan representación legible", () => {
  assert.equal(formatRoundLabel(100), "第100波 · RONDA 100");
});
