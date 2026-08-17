import { describe, it, expect } from 'vitest';
import { POSITIONS, ABILITY_KEYS, STARTING_ABILITIES } from '../src/engine/constants.js';
import { calcOvr, rollStartingAbilities, applyAgeCurve, trainingGainPerPoint } from '../src/engine/abilities.js';
import { createRng } from '../src/engine/rng.js';

describe('position OVR weights', () => {
  it('sum to 1.0 for every position', () => {
    for (const [pos, def] of Object.entries(POSITIONS)) {
      const sum = ABILITY_KEYS.reduce((acc, k) => acc + def.weights[k], 0);
      expect(sum, `${pos} weights should sum to 1.0`).toBeCloseTo(1.0, 6);
    }
  });
});

describe('starting abilities', () => {
  it('lands OVR in the configured band for every position, many seeds', () => {
    for (const pos of Object.keys(POSITIONS)) {
      for (let seed = 1; seed <= 50; seed++) {
        const rng = createRng(seed * 97 + 1);
        const abilities = rollStartingAbilities(rng, pos);
        const ovr = calcOvr(abilities, pos);
        expect(ovr, `${pos} seed ${seed}`).toBeGreaterThanOrEqual(STARTING_ABILITIES.OVR_MIN);
        expect(ovr, `${pos} seed ${seed}`).toBeLessThanOrEqual(STARTING_ABILITIES.OVR_MAX);
      }
    }
  });

  it('weights toward key abilities for the position', () => {
    const rng = createRng(42);
    const st = rollStartingAbilities(rng, 'ST');
    // ST key abilities are shooting/physical/pace; passing/defending are not.
    expect(st.shooting).toBeGreaterThan(st.passing);
  });
});

describe('age curves', () => {
  it('a winger collapses in the early 30s while a CB stays near peak', () => {
    // Simulate 20 seasons of pure aging (no training) from age 15 to 34.
    const wPos = 'W';
    const cbPos = 'CB';
    let wAbilities = { shooting: 60, dribbling: 65, passing: 55, defending: 30, physical: 55, pace: 70 };
    let cbAbilities = { shooting: 40, dribbling: 45, passing: 55, defending: 65, physical: 65, pace: 55 };

    const wOvrStart = calcOvr(wAbilities, wPos);
    const cbOvrStart = calcOvr(cbAbilities, cbPos);

    for (let age = 15; age <= 34; age++) {
      wAbilities = applyAgeCurve(wAbilities, age).abilities;
      cbAbilities = applyAgeCurve(cbAbilities, age).abilities;
    }

    const wOvrEnd = calcOvr(wAbilities, wPos);
    const cbOvrEnd = calcOvr(cbAbilities, cbPos);

    const wDrop = wOvrStart - wOvrEnd;
    const cbDrop = cbOvrStart - cbOvrEnd;

    expect(wDrop).toBeGreaterThan(cbDrop);
    // Winger should have lost a large chunk of OVR by 34; CB should be much more intact.
    expect(wDrop).toBeGreaterThan(15);
    expect(cbDrop).toBeLessThan(10);
  });

  it('applies no decline before an ability peak', () => {
    const abilities = { shooting: 50, dribbling: 50, passing: 50, defending: 50, physical: 50, pace: 50 };
    const { deltas } = applyAgeCurve(abilities, 20); // below every peak
    for (const key of ABILITY_KEYS) {
      expect(deltas[key]).toBe(0);
    }
  });

  it('accelerates decline further past peak', () => {
    const abilities = { shooting: 90, dribbling: 90, passing: 90, defending: 90, physical: 90, pace: 90 };
    const nearPeakDrop = -applyAgeCurve(abilities, 25).deltas.pace; // pace peak 24, +1
    const farPastPeakDrop = -applyAgeCurve(abilities, 35).deltas.pace; // pace peak 24, +11
    expect(farPastPeakDrop).toBeGreaterThan(nearPeakDrop);
  });
});

describe('training gain formula', () => {
  it('matches age-factor brackets', () => {
    const youngGain = trainingGainPerPoint(50, 17, 55); // 15-19 -> 1.6
    const primeGain = trainingGainPerPoint(50, 22, 55); // 20-25 -> 1.0
    const declineGain = trainingGainPerPoint(50, 27, 55); // 26-29 -> 0.5
    const oldGain = trainingGainPerPoint(50, 33, 55); // 30+ -> 0.15
    expect(youngGain).toBeCloseTo(1.6, 6);
    expect(primeGain).toBeCloseTo(1.0, 6);
    expect(declineGain).toBeCloseTo(0.5, 6);
    expect(oldGain).toBeCloseTo(0.15, 6);
  });

  it('applies diminishing returns at high ability values', () => {
    const low = trainingGainPerPoint(50, 22, 55);
    const mid = trainingGainPerPoint(75, 22, 55);
    const high = trainingGainPerPoint(90, 22, 55);
    expect(mid).toBeLessThan(low);
    expect(high).toBeLessThan(mid);
  });

  it('applies trust bonus/penalty', () => {
    const highTrust = trainingGainPerPoint(50, 22, 80);
    const midTrust = trainingGainPerPoint(50, 22, 50);
    const lowTrust = trainingGainPerPoint(50, 22, 10);
    expect(highTrust).toBeGreaterThan(midTrust);
    expect(lowTrust).toBeLessThan(midTrust);
  });
});
