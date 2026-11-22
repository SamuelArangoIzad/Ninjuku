import test from 'node:test';
import assert from 'node:assert/strict';
import { tacticalProfile, tacticalDecision } from '../src/ai/EnemyTactics.js';
test('tres perfiles cíclicos', () => {
    assert.deepEqual([0,1,2,3,4,5].map(i=>tacticalProfile(i).name),
        ['hunter','guard','rookie','hunter','guard','rookie']);
});
test('espera de reacción individual', () => {
    const enemy = { getSprite:()=>({ x: 0 }), tacticalReadyAt:3000,
        tacticalPeers:()=>[], tacticalProfile:tacticalProfile(0) };
    assert.deepEqual(tacticalDecision(enemy, 90, 2000), { action:'hold' });
    assert.equal(tacticalDecision(enemy, 90, 3001), null);
});
test('enemigos próximos no se amontonan', () => {
    const front = { getSprite:()=>({x:40}), isAlive:()=>true };
    const back = { getSprite:()=>({x:0}), isAlive:()=>true,
        tacticalProfile:tacticalProfile(0), tacticalPeers:()=>[front,back] };
    assert.deepEqual(tacticalDecision(back, 100, 4000), { action:'retreat',direction:-1 });
});
test('un enemigo espera mientras otro está atacando', () => {
    const attacker = {getSprite:()=>({x:140}),isAlive:()=>true,isAttacking:true};
    const enemy = {getSprite:()=>({x:20}),isAlive:()=>true,
        tacticalProfile:tacticalProfile(0),tacticalPeers:()=>[attacker,enemy]};
    assert.deepEqual(tacticalDecision(enemy,100,3000), {action:'hold'});
});

test('novato duda pero cazador actúa en la misma situación', () => {
    const makeEnemy = profile => ({getSprite:()=>({x:20}),isAlive:()=>true,
        tacticalProfile:profile,tacticalPeers:()=>[]});
    assert.deepEqual(tacticalDecision(makeEnemy(tacticalProfile(2)),100,2550), {action:'hold'});
    assert.equal(tacticalDecision(makeEnemy(tacticalProfile(0)),100,2550), null);
});
