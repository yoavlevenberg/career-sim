import {
  STARTING_ABILITIES,
  STARTING_STATE,
  TRAINING,
  RETIREMENT,
  REPUTATION,
} from './constants.js';
import { createRng } from './rng.js';
import { calcOvr, clamp, rollStartingAbilities, applyAgeCurve, applyTrainingAllocation, calcTrainingPoints } from './abilities.js';
import { generateDraftOptions, generateOffers as generateTransferOffers } from './transfers.js';
import { simulateSeason, updateInjuryRisk, driftRelations } from './season.js';
import { chancePercent } from './rng.js';

// ---- Career creation & draft --------------------------------------------

export function createCareer(seed, { name, position }) {
  const rng = createRng(seed);
  const abilities = rollStartingAbilities(rng, position);
  const draftOptions = generateDraftOptions(rng);

  return {
    gamePhase: 'draft',
    seed,
    rngState: rng.getState(),
    player: {
      name,
      position,
      age: STARTING_ABILITIES.AGE,
      abilities,
      relations: {
        managerTrust: STARTING_STATE.managerTrust,
        dressingRoom: STARTING_STATE.dressingRoom,
        fans: STARTING_STATE.fans,
        morale: STARTING_STATE.morale,
      },
      reputation: STARTING_STATE.reputation,
      injuryRisk: STARTING_STATE.injuryRisk,
      injuryStatus: { active: false, severity: null, seasonsOut: 0 },
      peakOvr: calcOvr(abilities, position),
    },
    currentClub: null,
    draftOptions,
    seasonLog: [],
    careerTotals: { matches: 0, goals: 0, assists: 0, trophies: [] },
    pendingConsequences: [],
    trainingPoints: 0,
    lastAgeCurveDeltas: null,
    lastTrainingDeltas: null,
    retirementOffer: null,
    retirementReason: null,
  };
}

function clubSnapshot(club) {
  return {
    clubId: club.id,
    name: club.name,
    country: club.country,
    tier: club.tier,
    prestige: club.prestige,
    clubAvgOvr: club.clubAvgOvr,
  };
}

export function chooseDraftClub(state, clubIndex) {
  const club = state.draftOptions[clubIndex];
  const next = {
    ...state,
    currentClub: clubSnapshot(club),
    draftOptions: null,
  };
  return startSeason(next);
}

// ---- Season loop ---------------------------------------------------------

// 1. Age curve applied (silent; surfaced in recap). 2. Training points
// earned from last season are made available. Transitions to 'training'.
export function startSeason(state) {
  const { abilities, deltas } = applyAgeCurve(state.player.abilities, state.player.age);
  const lastLog = state.seasonLog.at(-1);
  const trainingPoints = lastLog
    ? calcTrainingPoints(lastLog.seasonRating, lastLog.trophies > 0)
    : TRAINING.FIRST_SEASON_TP;

  return {
    ...state,
    player: { ...state.player, abilities },
    trainingPoints,
    gamePhase: 'training',
    lastAgeCurveDeltas: deltas,
  };
}

// Spend the season's training points on an allocation map
// { shooting: n, dribbling: n, ... }. Stage 1 has no card pool yet, so this
// hands control straight to `runSeason`; once cards.js exists the caller
// will insert a 'card' phase here instead.
export function allocateTraining(state, allocation) {
  const { abilities, deltas } = applyTrainingAllocation(
    state.player.abilities,
    allocation,
    state.player.age,
    state.player.relations.managerTrust
  );
  return {
    ...state,
    player: { ...state.player, abilities },
    trainingPoints: 0,
    lastTrainingDeltas: deltas,
    gamePhase: 'card',
  };
}

function reputationDelta(seasonRating) {
  return (seasonRating - REPUTATION.RATING_BASELINE) * REPUTATION.SCALE_PER_RATING_POINT;
}

// 4. Season simulation, then recap bookkeeping: injury risk, relationship
// drift, season log, career totals, reputation. Ends the career on a
// career-ending injury.
export function runSeason(state, rng) {
  const result = simulateSeason(state, rng);
  const injuryRisk = updateInjuryRisk(state.player, result.injury);
  const relations = driftRelations(state.player.relations, result.seasonRating, result.trophy);
  const peakOvr = Math.max(state.player.peakOvr, result.ovr);
  const reputation = clamp(state.player.reputation + reputationDelta(result.seasonRating), 0, 100);

  const injuryStatus =
    result.injury.severity === 'careerEnding'
      ? { active: true, severity: 'careerEnding', seasonsOut: Infinity }
      : result.injury.severity === 'major'
        ? { active: true, severity: 'major', seasonsOut: 1 }
        : { active: false, severity: null, seasonsOut: 0 };

  const logEntry = {
    age: state.player.age,
    club: state.currentClub.name,
    clubTier: state.currentClub.tier,
    ovr: result.ovr,
    matches: result.matches,
    goals: result.goals,
    assists: result.assists,
    seasonRating: result.seasonRating,
    trophies: result.trophy ? 1 : 0,
    minutesFactor: result.minutesFactor,
    injury: result.injury.active ? result.injury.severity : null,
  };

  const careerTotals = {
    matches: state.careerTotals.matches + result.matches,
    goals: state.careerTotals.goals + result.goals,
    assists: state.careerTotals.assists + result.assists,
    trophies: result.trophy
      ? [...state.careerTotals.trophies, { age: state.player.age, club: state.currentClub.name }]
      : state.careerTotals.trophies,
  };

  const nextPlayer = { ...state.player, relations, injuryRisk, injuryStatus, peakOvr, reputation };

  const nextState = {
    ...state,
    player: nextPlayer,
    seasonLog: [...state.seasonLog, logEntry],
    careerTotals,
    gamePhase: 'season_recap',
  };

  if (result.injury.severity === 'careerEnding') {
    return { ...nextState, gamePhase: 'retired', retirementReason: 'careerEndingInjury' };
  }
  return nextState;
}

// ---- Transfers -------------------------------------------------------

export function generateOffers(state, rng) {
  return generateTransferOffers(state, rng);
}

export function applyTransferChoice(state, offer) {
  if (!offer) return state; // staying is always an option
  return {
    ...state,
    currentClub: clubSnapshot(offer.club),
    player: {
      ...state.player,
      relations: { ...state.player.relations, managerTrust: offer.startingManagerTrust },
    },
  };
}

// ---- Retirement --------------------------------------------------------

export function checkRetirement(state, rng) {
  const age = state.player.age;
  if (age >= RETIREMENT.FORCE_AGE) return { offered: true, forced: true };
  if (age < RETIREMENT.OFFER_MIN_AGE) return { offered: false, forced: false };

  const yearsPastMin = age - RETIREMENT.OFFER_MIN_AGE;
  let prob = RETIREMENT.BASE_PROB_AT_MIN_AGE + yearsPastMin * RETIREMENT.PROB_PER_YEAR_PAST_MIN;
  const lastLog = state.seasonLog.at(-1);
  if (lastLog && lastLog.seasonRating < RETIREMENT.LOW_RATING_THRESHOLD) {
    prob += RETIREMENT.LOW_RATING_PROB_BONUS;
  }
  prob = clamp(prob, 0, 1);
  return { offered: chancePercent(rng, prob * 100), forced: false };
}

export function retire(state, reason) {
  return { ...state, gamePhase: 'retired', retirementReason: reason };
}

export function advanceAge(state) {
  return { ...state, player: { ...state.player, age: state.player.age + 1 } };
}

// ---- Legacy rank (for the retirement screen) ----------------------------

export function legacyRank(state) {
  const { peakOvr } = state.player;
  const trophies = state.careerTotals.trophies.length;
  if (peakOvr >= 88 && trophies >= 3) return 'אגדה עולמית';
  if (peakOvr >= 82 && trophies >= 1) return 'כוכב-על';
  if (peakOvr >= 74) return 'שחקן מצוין';
  if (peakOvr >= 64) return 'מקצוען אמין';
  return 'פוטנציאל מבוזבז';
}
