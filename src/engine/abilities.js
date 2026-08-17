import {
  ABILITY_KEYS,
  ABILITY_MIN,
  ABILITY_MAX,
  POSITIONS,
  STARTING_ABILITIES,
  AGE_CURVES,
  DECLINE_ACCELERATION,
  TRAINING,
} from './constants.js';
import { randInt } from './rng.js';

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function clampAbility(value) {
  return clamp(Math.round(value), ABILITY_MIN, ABILITY_MAX);
}

// OVR is always derived, never stored: OVR = round(Σ ability * weight).
export function calcOvr(abilities, position) {
  const weights = POSITIONS[position].weights;
  let total = 0;
  for (const key of ABILITY_KEYS) {
    total += abilities[key] * weights[key];
  }
  return Math.round(total);
}

// Roll starting abilities (age 15) so OVR lands in the configured band,
// weighted toward the position's key abilities.
export function rollStartingAbilities(rng, position) {
  const weights = POSITIONS[position].weights;
  const {
    KEY_ABILITY_WEIGHT_THRESHOLD,
    SECONDARY_ABILITY_WEIGHT_THRESHOLD,
    KEY_ABILITY_MIN,
    KEY_ABILITY_MAX,
    SECONDARY_ABILITY_MIN,
    SECONDARY_ABILITY_MAX,
    OTHER_ABILITY_MIN,
    OTHER_ABILITY_MAX,
    OVR_MIN,
    OVR_MAX,
  } = STARTING_ABILITIES;

  const rollFor = (key) => {
    const w = weights[key];
    if (w >= KEY_ABILITY_WEIGHT_THRESHOLD) return randInt(rng, KEY_ABILITY_MIN, KEY_ABILITY_MAX);
    if (w >= SECONDARY_ABILITY_WEIGHT_THRESHOLD) return randInt(rng, SECONDARY_ABILITY_MIN, SECONDARY_ABILITY_MAX);
    return randInt(rng, OTHER_ABILITY_MIN, OTHER_ABILITY_MAX);
  };

  let abilities = Object.fromEntries(ABILITY_KEYS.map((key) => [key, rollFor(key)]));
  let ovr = calcOvr(abilities, position);

  // Nudge key abilities up/down until OVR lands in band. Bounded loop —
  // the starting ranges above make this converge in a handful of steps.
  const keyAbilities = ABILITY_KEYS.filter((k) => weights[k] >= KEY_ABILITY_WEIGHT_THRESHOLD);
  let guard = 0;
  while (ovr < OVR_MIN && guard < 200) {
    const k = keyAbilities[guard % keyAbilities.length];
    if (abilities[k] < ABILITY_MAX) abilities[k] += 1;
    ovr = calcOvr(abilities, position);
    guard++;
  }
  guard = 0;
  while (ovr > OVR_MAX && guard < 200) {
    const k = keyAbilities[guard % keyAbilities.length];
    if (abilities[k] > ABILITY_MIN) abilities[k] -= 1;
    ovr = calcOvr(abilities, position);
    guard++;
  }

  return abilities;
}

function declineMultiplier(yearsPastPeak) {
  const { EARLY_YEARS_PAST_PEAK, EARLY_MULTIPLIER, MID_YEARS_PAST_PEAK, MID_MULTIPLIER, LATE_MULTIPLIER } =
    DECLINE_ACCELERATION;
  if (yearsPastPeak <= 0) return 0;
  if (yearsPastPeak <= EARLY_YEARS_PAST_PEAK) return EARLY_MULTIPLIER;
  if (yearsPastPeak <= MID_YEARS_PAST_PEAK) return MID_MULTIPLIER;
  return LATE_MULTIPLIER;
}

// Applied once per season, for the age the player is entering. Returns a
// new abilities object plus a per-ability delta log (for the recap screen).
export function applyAgeCurve(abilities, age) {
  const next = { ...abilities };
  const deltas = {};
  for (const key of ABILITY_KEYS) {
    const curve = AGE_CURVES[key];
    const yearsPastPeak = age - curve.peak;
    const mult = declineMultiplier(yearsPastPeak);
    const decline = mult > 0 ? curve.declinePerYear * mult : 0;
    const before = next[key];
    next[key] = clampAbility(before - decline);
    deltas[key] = next[key] - before;
  }
  return { abilities: next, deltas };
}

function ageFactor(age) {
  const bracket = TRAINING.AGE_FACTOR_BRACKETS.find((b) => age >= b.minAge && age <= b.maxAge);
  return bracket ? bracket.factor : TRAINING.AGE_FACTOR_BRACKETS.at(-1).factor;
}

function diminishingFactor(currentValue) {
  const bracket = TRAINING.DIMINISHING_BRACKETS.find((b) => currentValue >= b.minValue && currentValue <= b.maxValue);
  return bracket ? bracket.factor : TRAINING.DIMINISHING_BRACKETS.at(-1).factor;
}

function trustBonusFactor(trust) {
  if (trust > TRAINING.TRUST_HIGH_THRESHOLD) return TRAINING.TRUST_HIGH_FACTOR;
  if (trust < TRAINING.TRUST_LOW_THRESHOLD) return TRAINING.TRUST_LOW_FACTOR;
  return TRAINING.TRUST_MID_FACTOR;
}

// Gain in ability points for spending ONE training point on `key`.
export function trainingGainPerPoint(currentValue, age, managerTrust) {
  return TRAINING.GAIN_BASE * ageFactor(age) * diminishingFactor(currentValue) * trustBonusFactor(managerTrust);
}

// Spend `points` training points on a single ability, applying diminishing
// returns point-by-point (since the bracket can change mid-allocation).
export function applyTrainingPoints(currentValue, points, age, managerTrust) {
  let value = currentValue;
  let totalGain = 0;
  for (let i = 0; i < points; i++) {
    const gain = trainingGainPerPoint(value, age, managerTrust);
    value = clampAbility(value + gain);
    totalGain += gain;
  }
  return { newValue: value, totalGain };
}

// Apply a full allocation map { shooting: n, dribbling: n, ... } of spent
// training points to an abilities object.
export function applyTrainingAllocation(abilities, allocation, age, managerTrust) {
  const next = { ...abilities };
  const deltas = {};
  for (const key of ABILITY_KEYS) {
    const points = allocation[key] || 0;
    if (points <= 0) {
      deltas[key] = 0;
      continue;
    }
    const { newValue } = applyTrainingPoints(next[key], points, age, managerTrust);
    deltas[key] = newValue - next[key];
    next[key] = newValue;
  }
  return { abilities: next, deltas };
}

// Training points earned from last season's performance.
export function calcTrainingPoints(seasonRating, wonTrophy) {
  let tp = TRAINING.BASE_TP + Math.round((seasonRating - TRAINING.RATING_BASELINE) / TRAINING.RATING_STEP);
  if (wonTrophy) tp += TRAINING.TROPHY_TP_BONUS;
  return clamp(tp, TRAINING.TP_MIN, TRAINING.TP_MAX);
}
