import { describe, it, expect } from 'vitest';
import { rngFromState } from '../src/engine/rng.js';
import {
  createCareer,
  chooseDraftClub,
  startSeason,
  allocateTraining,
  runSeason,
  generateOffers,
  applyTransferChoice,
  checkRetirement,
  advanceAge,
  retire,
} from '../src/engine/career.js';
import { ABILITY_KEYS } from '../src/engine/constants.js';

function playSeasons(seed, position, seasons) {
  let state = createCareer(seed, { name: 'Test', position });
  let rng = rngFromState(state.rngState);
  state = chooseDraftClub(state, 0);

  for (let i = 0; i < seasons && state.gamePhase !== 'retired'; i++) {
    const allocation = Object.fromEntries(ABILITY_KEYS.map((k) => [k, Math.floor(state.trainingPoints / 6)]));
    state = allocateTraining(state, allocation);
    state = runSeason(state, rng);
    if (state.gamePhase === 'retired') break;
    const offers = generateOffers(state, rng);
    state = applyTransferChoice(state, null);
    void offers;
    const { offered, forced } = checkRetirement(state, rng);
    if (forced || offered) {
      state = retire(state, forced ? 'forcedAge40' : 'offered');
      break;
    }
    state = advanceAge(state);
    state = startSeason(state);
  }
  return state;
}

describe('deterministic reproducibility', () => {
  it('the same seed produces an identical career', () => {
    const a = playSeasons(777, 'ST', 10);
    const b = playSeasons(777, 'ST', 10);
    expect(a.seasonLog).toEqual(b.seasonLog);
    expect(a.player.abilities).toEqual(b.player.abilities);
    expect(a.careerTotals).toEqual(b.careerTotals);
  });

  it('different seeds produce different careers', () => {
    const a = playSeasons(1, 'ST', 10);
    const b = playSeasons(2, 'ST', 10);
    expect(a.seasonLog).not.toEqual(b.seasonLog);
  });
});

describe('draft options', () => {
  it('draft always offers clubs from tier 5-6 only', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const state = createCareer(seed * 13 + 1, { name: 'Test', position: 'ST' });
      for (const club of state.draftOptions) {
        expect(club.tier).toBeGreaterThanOrEqual(5);
        expect(club.tier).toBeLessThanOrEqual(6);
      }
    }
  });
});

describe('retirement', () => {
  it('never plays past the forced retirement age', () => {
    const state = playSeasons(555, 'CB', 40);
    expect(state.player.age).toBeLessThanOrEqual(41);
  });
});
