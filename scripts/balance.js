#!/usr/bin/env node
// Headless balance runner. Simulates N careers with a scriptable policy and
// prints distributions so game numbers can be tuned without a browser.
//
// Usage: node scripts/balance.js --runs=10000 --strategy=balanced
//        node scripts/balance.js --runs=10000 --strategy=specialist
//        node scripts/balance.js --runs=10000 --strategy=both

import { createRng, rngFromState } from '../src/engine/rng.js';
import { POSITIONS, ABILITY_KEYS, RETIREMENT } from '../src/engine/constants.js';
import { calcOvr } from '../src/engine/abilities.js';
import {
  createCareer,
  chooseDraftClub,
  startSeason,
  allocateTraining,
  runSeason,
  generateOffers,
  applyTransferChoice,
  checkRetirement,
  retire,
  advanceAge,
} from '../src/engine/career.js';

// ---- CLI args ------------------------------------------------------------

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const RUNS = parseInt(args.runs ?? '5000', 10);
const STRATEGY = args.strategy ?? 'balanced';
const MAX_SEASONS = 30; // safety cap so a stuck loop can't run forever

// ---- Training policies -----------------------------------------------

function allocateBalanced(state) {
  const weights = POSITIONS[state.player.position].weights;
  const points = state.trainingPoints;
  const totalWeight = ABILITY_KEYS.reduce((s, k) => s + weights[k], 0) || 1;
  const raw = ABILITY_KEYS.map((k) => ({ k, val: (weights[k] / totalWeight) * points }));
  const alloc = Object.fromEntries(ABILITY_KEYS.map((k) => [k, 0]));
  let used = 0;
  for (const { k, val } of raw) {
    const f = Math.floor(val);
    alloc[k] = f;
    used += f;
  }
  let remainder = points - used;
  raw.sort((a, b) => (b.val - Math.floor(b.val)) - (a.val - Math.floor(a.val)));
  let i = 0;
  while (remainder > 0) {
    alloc[raw[i % raw.length].k]++;
    remainder--;
    i++;
  }
  return alloc;
}

function allocateSpecialist(state) {
  const weights = POSITIONS[state.player.position].weights;
  const points = state.trainingPoints;
  const sorted = [...ABILITY_KEYS].sort((a, b) => weights[b] - weights[a]);
  const alloc = Object.fromEntries(ABILITY_KEYS.map((k) => [k, 0]));
  const primary = Math.round(points * 0.75);
  alloc[sorted[0]] += primary;
  alloc[sorted[1]] += points - primary;
  return alloc;
}

function allocateByStrategy(state, strategy) {
  return strategy === 'specialist' ? allocateSpecialist(state) : allocateBalanced(state);
}

// ---- Transfer & retirement policy -----------------------------------

function pickTransfer(state, offers) {
  if (!offers.length) return null;
  const currentTier = state.currentClub.tier;
  const sorted = [...offers].sort((a, b) => a.club.tier - b.club.tier); // lower number = better tier
  const best = sorted[0];
  if (best.club.tier < currentTier) return best; // upgrade: always take it
  if (best.club.tier === currentTier) return null; // sideways: stay
  const lastLog = state.seasonLog.at(-1);
  const struggling = lastLog && (lastLog.seasonRating < 5.5 || lastLog.minutesFactor < 0.4);
  return struggling ? best : null; // only drop down when struggling
}

function shouldAcceptRetirement(state) {
  const lastLog = state.seasonLog.at(-1);
  if (!lastLog) return false;
  return state.player.age >= 36 || lastLog.seasonRating < 5.3;
}

// ---- Single career run -----------------------------------------------

function runCareer(seed, position, strategy) {
  let state = createCareer(seed, { name: 'Player', position });
  let rng = rngFromState(state.rngState);

  let bestIdx = 0;
  let bestOvr = -1;
  state.draftOptions.forEach((c, i) => {
    if (c.clubAvgOvr > bestOvr) {
      bestOvr = c.clubAvgOvr;
      bestIdx = i;
    }
  });
  state = chooseDraftClub(state, bestIdx);

  const tpHistory = [];
  let reachedTier1 = false;
  let seasons = 0;

  while (state.gamePhase !== 'retired' && seasons < MAX_SEASONS) {
    tpHistory.push(state.trainingPoints);
    const allocation = allocateByStrategy(state, strategy);
    state = allocateTraining(state, allocation);

    // Stage 1 step 2: no card pool yet — go straight to the season sim.
    state = runSeason(state, rng);
    if (state.currentClub.tier === 1) reachedTier1 = true;
    if (state.gamePhase === 'retired') break;

    const offers = generateOffers(state, rng);
    const chosen = pickTransfer(state, offers);
    state = applyTransferChoice(state, chosen);
    if (state.currentClub.tier === 1) reachedTier1 = true;

    const { offered, forced } = checkRetirement(state, rng);
    if (forced || (offered && shouldAcceptRetirement(state))) {
      state = retire(state, forced ? 'forcedAge40' : 'offeredRetirement');
      break;
    }

    state = advanceAge(state);
    state = startSeason(state);
    seasons++;
  }

  return {
    position,
    peakOvr: state.player.peakOvr,
    retirementAge: state.player.age,
    careerEndingInjury: state.retirementReason === 'careerEndingInjury',
    goals: state.careerTotals.goals,
    reachedTier1,
    tpHistory,
  };
}

// ---- Stats helpers -----------------------------------------------------

function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return NaN;
  const idx = Math.min(sortedArr.length - 1, Math.max(0, Math.ceil((p / 100) * sortedArr.length) - 1));
  return sortedArr[idx];
}

function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return { p10: percentile(sorted, 10), p50: percentile(sorted, 50), p90: percentile(sorted, 90) };
}

function fmt(n) {
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : 'n/a';
}

// ---- Run & report ------------------------------------------------------

function runStrategy(strategy, runs) {
  const positions = Object.keys(POSITIONS);
  const byPosition = Object.fromEntries(positions.map((p) => [p, []]));
  const allTpHistory = [];
  let careerEndingCount = 0;
  let tier1Count = 0;

  for (let i = 0; i < runs; i++) {
    const position = positions[i % positions.length];
    const seed = i * 1_000_003 + hashString(strategy) + 1; // deterministic, strategy-distinct seeds
    const result = runCareer(seed, position, strategy);
    byPosition[position].push(result);
    allTpHistory.push(...result.tpHistory);
    if (result.careerEndingInjury) careerEndingCount++;
    if (result.reachedTier1) tier1Count++;
  }

  console.log(`\n=== Strategy: ${strategy} — ${runs} careers (${Math.floor(runs / positions.length)} per position) ===\n`);

  console.log('Peak OVR (p10 / p50 / p90) by position:');
  for (const pos of positions) {
    const s = summarize(byPosition[pos].map((r) => r.peakOvr));
    console.log(`  ${pos.padEnd(3)} ${fmt(s.p10)} / ${fmt(s.p50)} / ${fmt(s.p90)}`);
  }

  console.log('\nRetirement age (median / p90) by position:');
  for (const pos of positions) {
    const s = summarize(byPosition[pos].map((r) => r.retirementAge));
    console.log(`  ${pos.padEnd(3)} ${fmt(s.p50)} / ${fmt(s.p90)}`);
  }

  console.log('\nMedian career goals by position:');
  for (const pos of positions) {
    const s = summarize(byPosition[pos].map((r) => r.goals));
    console.log(`  ${pos.padEnd(3)} ${fmt(s.p50)}`);
  }

  console.log(`\n% careers reaching Tier 1: ${fmt((tier1Count / runs) * 100)}%`);
  console.log(`% careers ending via career-ending injury: ${fmt((careerEndingCount / runs) * 100)}%`);

  const tpSummary = summarize(allTpHistory);
  console.log(
    `\nTraining points/season distribution — p10=${fmt(tpSummary.p10)} p50=${fmt(tpSummary.p50)} p90=${fmt(tpSummary.p90)} (design bounds ${3}-${12})`
  );
}

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

if (STRATEGY === 'both') {
  runStrategy('balanced', RUNS);
  runStrategy('specialist', RUNS);
} else {
  runStrategy(STRATEGY, RUNS);
}
