import test from 'node:test';
import assert from 'node:assert/strict';
import EnergyComponent from '../src/components/EnergyComponent.js';

const create = () => new EnergyComponent({ maximumSegments: 5, drainMsPerSegment: 3000, regenerationMsPerSegment: 15000 });

test('inicia con energía completa', () => {
  const energy = create();
  assert.equal(energy.getPercentage(), 1);
  assert.equal(energy.canHook(), true);
});

test('drena un segmento por cada 3 segundos de enganche', () => {
  const energy = create();
  energy.update(6000, true);
  assert.equal(energy.currentSegments, 3);
  assert.equal(energy.canHook(), true);
});

test('no regenera energía mientras está enganchado', () => {
  const energy = create();
  energy.update(3000, true);
  energy.update(15000, true);
  assert.equal(energy.currentSegments, 0);
  assert.equal(energy.canHook(), false);
});

test('un nuevo enganche requiere un segmento entero', () => {
  const energy = create();
  energy.update(14500, true);
  assert.ok(energy.currentSegments > 0 && energy.currentSegments < 1);
  assert.equal(energy.canHook(), false);
});

test('la energía termina el enganche al agotarse', () => {
  const energy = create();
  assert.equal(energy.update(15000, true), false);
  assert.equal(energy.currentSegments, 0);
});

test('regenera un segmento tras 15 segundos fuera del enganche', () => {
  const energy = create();
  energy.update(15000, true);
  energy.update(14999, false);
  assert.equal(energy.currentSegments, 0);
  assert.equal(energy.canHook(), false);
  energy.update(1, false);
  assert.equal(energy.currentSegments, 1);
  assert.equal(energy.canHook(), true);
});

test('no usa tiempo parcial acumulado antes de soltarse', () => {
  const energy = create();
  energy.update(9000, true);
  energy.update(10000, false);
  energy.update(1000, true);
  energy.update(5000, false);
  assert.ok(Math.abs(energy.currentSegments - (5 - (9000 + 1000)/3000)) < 1e-10);
});

test('nunca supera la energía máxima', () => {
  const energy = create();
  energy.update(15000, true);
  energy.update(300000, false);
  assert.equal(energy.currentSegments, 5);
});
