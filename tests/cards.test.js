import { describe, it, expect } from 'vitest';
import { createRng } from '../src/engine/rng.js';
import { createCareer, chooseDraftClub, allocateTraining, resolveCurrentCard, runSeason, startSeason } from '../src/engine/career.js';
import { CARD_POOL, eligibleCards, drawSeasonCards, getClutchChance } from '../src/engine/cards.js';
import { ABILITY_KEYS } from '../src/engine/constants.js';

describe('card gating', () => {
  it('never returns a card outside its own age window', () => {
    for (let age = 15; age <= 40; age++) {
      const state = {
        player: { age, position: 'ST', relations: { managerTrust: 55, dressingRoom: 55, fans: 45, morale: 60 } },
        seasonLog: [],
      };
      for (const card of eligibleCards(state)) {
        expect(card.minAge == null || age >= card.minAge, `${card.id} at age ${age}`).toBe(true);
        expect(card.maxAge == null || age <= card.maxAge, `${card.id} at age ${age}`).toBe(true);
      }
    }
  });

  it('never draws a consequence card at random', () => {
    for (let age = 15; age <= 40; age++) {
      const state = {
        player: { age, position: 'ST', relations: { managerTrust: 55, dressingRoom: 55, fans: 45, morale: 60 } },
        seasonLog: [],
      };
      const eligible = eligibleCards(state);
      expect(eligible.every((c) => c.type !== 'consequence')).toBe(true);
    }
  });

  it('nightlife-style card (teammate_party_invite) never appears outside 17-27', () => {
    for (let age = 15; age <= 40; age++) {
      const state = {
        player: { age, position: 'W', relations: { managerTrust: 55, dressingRoom: 55, fans: 45, morale: 60 } },
        seasonLog: [],
      };
      const eligible = eligibleCards(state);
      const hasPartyCard = eligible.some((c) => c.id === 'teammate_party_invite');
      expect(hasPartyCard).toBe(age >= 17 && age <= 27);
    }
  });

  it('drawSeasonCards respects the season slot count and never repeats a card within one draw', () => {
    const rng = createRng(99);
    const state = {
      player: {
        age: 20,
        position: 'ST',
        relations: { managerTrust: 55, dressingRoom: 55, fans: 45, morale: 60 },
        reputation: 10,
      },
      seasonLog: [],
      pendingConsequences: [],
    };
    const { cards } = drawSeasonCards(state, rng);
    expect(cards.length).toBe(2);
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
  });

  it('a due consequence card is drawn even though it is gated out of random draws', () => {
    const rng = createRng(123);
    const state = {
      player: {
        age: 22,
        position: 'ST',
        relations: { managerTrust: 55, dressingRoom: 55, fans: 45, morale: 60 },
        reputation: 10,
      },
      seasonLog: [],
      pendingConsequences: [{ triggerAtAge: 22, cardId: 'leaked_photo' }],
    };
    const { cards, pendingConsequences } = drawSeasonCards(state, rng);
    expect(cards.some((c) => c.id === 'leaked_photo')).toBe(true);
    expect(pendingConsequences.length).toBe(0);
  });

  it('a consequence card scheduled for a future age is not drawn early', () => {
    const rng = createRng(123);
    const state = {
      player: {
        age: 20,
        position: 'ST',
        relations: { managerTrust: 55, dressingRoom: 55, fans: 45, morale: 60 },
        reputation: 10,
      },
      seasonLog: [],
      pendingConsequences: [{ triggerAtAge: 24, cardId: 'leaked_photo' }],
    };
    const { cards, pendingConsequences } = drawSeasonCards(state, rng);
    expect(cards.some((c) => c.id === 'leaked_photo')).toBe(false);
    expect(pendingConsequences.length).toBe(1);
  });
});

describe('clutch chance formula', () => {
  it('is clamped between 5 and 95', () => {
    const option = { baseChance: 55, relevantAbility: 'shooting' };
    const strong = getClutchChance(option, {
      player: { abilities: { shooting: 99 }, relations: { morale: 100 } },
    });
    const weak = getClutchChance(option, {
      player: { abilities: { shooting: 1 }, relations: { morale: 0 } },
    });
    expect(strong.chance).toBeLessThanOrEqual(95);
    expect(weak.chance).toBeGreaterThanOrEqual(5);
  });

  it('rewards higher relevant ability with a higher chance', () => {
    const option = { baseChance: 55, relevantAbility: 'shooting' };
    const low = getClutchChance(option, { player: { abilities: { shooting: 40 }, relations: { morale: 50 } } });
    const high = getClutchChance(option, { player: { abilities: { shooting: 80 }, relations: { morale: 50 } } });
    expect(high.chance).toBeGreaterThan(low.chance);
  });
});

describe('full pool sanity', () => {
  it('every drawable card has at least 2 options, and every option is fully specified', () => {
    for (const card of CARD_POOL.filter((c) => c.type !== 'consequence')) {
      expect(card.options.length).toBeGreaterThanOrEqual(2);
      for (const option of card.options) {
        if (card.type === 'clutch' && option.baseChance != null) {
          expect(option.relevantAbility).toBeTruthy();
          expect(option.successEffects).toBeTruthy();
          expect(option.failEffects).toBeTruthy();
        } else {
          expect(option.effects).toBeTruthy();
        }
      }
    }
  });

  it('exactly 3 consequence cards exist, and each is referenced by a trigger option', () => {
    const consequenceIds = CARD_POOL.filter((c) => c.type === 'consequence').map((c) => c.id);
    expect(consequenceIds.length).toBe(3);
    const referenced = new Set();
    for (const card of CARD_POOL) {
      for (const option of card.options || []) {
        if (option.consequence) referenced.add(option.consequence.cardId);
        if (option.successConsequence) referenced.add(option.successConsequence.cardId);
        if (option.failConsequence) referenced.add(option.failConsequence.cardId);
      }
    }
    for (const id of consequenceIds) {
      expect(referenced.has(id), `${id} should be referenced by a trigger option`).toBe(true);
    }
  });
});

describe('card resolution end-to-end', () => {
  it('a full season with cards produces a deterministic, valid state', () => {
    const rng = createRng(4242);
    let state = createCareer(4242, { name: 'Test', position: 'ST' });
    state = chooseDraftClub(state, 0);
    const allocation = Object.fromEntries(ABILITY_KEYS.map((k) => [k, Math.floor(state.trainingPoints / 6)]));
    state = allocateTraining(state, allocation, rng);
    expect(state.cardQueue.length).toBeGreaterThanOrEqual(2);
    while (state.cardQueue.length > 0) {
      state = resolveCurrentCard(state, 0, rng);
    }
    expect(state.cardResolutions.length).toBeGreaterThanOrEqual(2);
    state = runSeason(state, rng);
    expect(state.seasonLog.length).toBe(1);
  });
});
