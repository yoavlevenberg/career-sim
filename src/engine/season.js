import { SEASON, SEASON_RATING, INJURY_RISK, INJURY_CHECK, TROPHY, RELATIONSHIP_DRIFT } from './constants.js';
import { calcOvr, clamp } from './abilities.js';
import { randRange, randInt, chancePercent } from './rng.js';

function weightedSum(abilities, weights) {
  let total = 0;
  for (const key in weights) total += abilities[key] * weights[key];
  return total;
}

export function getMinutesFactor(managerTrust) {
  const bracket = SEASON.MINUTES_FACTOR_BRACKETS.find((b) => managerTrust >= b.minTrust);
  return bracket.factor;
}

// P(injury) = injuryRisk/100 * ageMod, expressed as a percent chance.
export function checkInjury(state, rng) {
  const { player } = state;
  const ageBracket = INJURY_CHECK.AGE_MOD_BRACKETS.find((b) => player.age <= b.maxAge);
  const ageMod = ageBracket.mod;
  const p = clamp(player.injuryRisk * ageMod, 0, 100);

  if (!chancePercent(rng, p)) {
    return { active: false, severity: null, matchesLost: 0 };
  }

  const canBeCareerEnding = player.age >= INJURY_CHECK.CAREER_ENDING_MIN_AGE;
  const majorShare = canBeCareerEnding
    ? INJURY_CHECK.MAJOR_SHARE
    : INJURY_CHECK.MAJOR_SHARE + INJURY_CHECK.CAREER_ENDING_SHARE;

  const roll = rng();
  let severity;
  if (roll < INJURY_CHECK.MINOR_SHARE) severity = 'minor';
  else if (roll < INJURY_CHECK.MINOR_SHARE + majorShare) severity = 'major';
  else severity = 'careerEnding';

  if (severity === 'minor') {
    const matchesLost = randInt(rng, INJURY_CHECK.MINOR_MATCHES_LOST_MIN, INJURY_CHECK.MINOR_MATCHES_LOST_MAX);
    return { active: true, severity, matchesLost };
  }
  return { active: true, severity, matchesLost: Infinity };
}

// One competition threshold per season, compared against club prestige
// adjusted by how far above/below the club's average the player's OVR is.
export function rollTrophy(state, rng) {
  const { player, currentClub } = state;
  const ovr = calcOvr(player.abilities, player.position);
  const threshold = TROPHY.TIER_BASE[currentClub.tier] + randRange(rng, TROPHY.NOISE_MIN, TROPHY.NOISE_MAX);
  const playerScore = currentClub.prestige + (ovr - currentClub.clubAvgOvr) * TROPHY.OVR_DELTA_WEIGHT;
  return playerScore >= threshold;
}

export function simulateSeason(state, rng) {
  const { player, currentClub } = state;
  const pos = player.position;
  const ovr = calcOvr(player.abilities, pos);
  const minutesFactor = getMinutesFactor(player.relations.managerTrust);
  const fullMatches = Math.round(SEASON.MATCHES_PER_SEASON * minutesFactor);
  const tierMod = SEASON.TIER_MOD[currentClub.tier];
  const moraleMod = SEASON.MORALE_MOD_BASE + (player.relations.morale / 100) * SEASON.MORALE_MOD_SCALE;

  const attackRating = weightedSum(player.abilities, SEASON.ATTACK_WEIGHTS);
  const creativeRating = weightedSum(player.abilities, SEASON.CREATIVE_WEIGHTS);

  const goalsRandom = randRange(rng, SEASON.GOAL_ASSIST_RANDOM_MIN, SEASON.GOAL_ASSIST_RANDOM_MAX);
  const assistsRandom = randRange(rng, SEASON.GOAL_ASSIST_RANDOM_MIN, SEASON.GOAL_ASSIST_RANDOM_MAX);

  let goals = SEASON.BASE_GOALS[pos] * (attackRating / SEASON.RATING_BASELINE) ** 2 * tierMod * moraleMod * minutesFactor * goalsRandom;
  let assists =
    SEASON.BASE_ASSISTS[pos] * (creativeRating / SEASON.RATING_BASELINE) ** 2 * tierMod * moraleMod * minutesFactor * assistsRandom;

  // Expectation for the contribution term deliberately does NOT scale with
  // the player's own ability — it's "what a player getting these minutes
  // at this tier is normally expected to produce" (tier + minutes only).
  // That's what lets both sides of the age curve show up in season rating:
  // a young player whose ability is still below the tier standard isn't
  // punished forever (his ability keeps climbing toward it), but an aged,
  // declined player whose ability has fallen below what the club now
  // expects genuinely starts underperforming, eroding trust and minutes.
  const expectedGoals = SEASON.BASE_GOALS[pos] * tierMod * minutesFactor;
  const expectedAssists = SEASON.BASE_ASSISTS[pos] * tierMod * minutesFactor;

  const injury = checkInjury(state, rng);
  let matches = fullMatches;
  if (injury.active) {
    matches = injury.severity === 'minor' ? Math.max(0, fullMatches - injury.matchesLost) : 0;
    const playRatio = fullMatches > 0 ? matches / fullMatches : 0;
    goals *= playRatio;
    assists *= playRatio;
  }

  goals = Math.max(0, Math.round(goals));
  assists = Math.max(0, Math.round(assists));

  const expectedGA = expectedGoals + expectedAssists;
  const rawContribution = expectedGA > 0 ? (goals + assists - expectedGA) / expectedGA : 0;
  const contribution = clamp(rawContribution, SEASON.CONTRIBUTION_CLAMP_MIN, SEASON.CONTRIBUTION_CLAMP_MAX);

  const trophy = injury.severity === 'careerEnding' ? false : rollTrophy(state, rng);

  let seasonRating =
    SEASON_RATING.BASE +
    SEASON_RATING.CONTRIBUTION_WEIGHT * contribution +
    SEASON_RATING.MINUTES_WEIGHT * (minutesFactor - SEASON_RATING.MINUTES_BASELINE) +
    SEASON_RATING.OVR_WEIGHT * ((ovr - currentClub.clubAvgOvr) / SEASON_RATING.OVR_DIVISOR) +
    (trophy ? SEASON_RATING.TROPHY_BONUS : 0) +
    randRange(rng, SEASON_RATING.RANDOM_MIN, SEASON_RATING.RANDOM_MAX);
  seasonRating = clamp(seasonRating, SEASON_RATING.MIN, SEASON_RATING.MAX);
  seasonRating = Math.round(seasonRating * 100) / 100;

  return { matches, goals, assists, seasonRating, trophy, ovr, minutesFactor, injury };
}

export function updateInjuryRisk(player, injuryResult) {
  let risk = player.injuryRisk;
  risk += INJURY_RISK.BASE_GAIN_PER_SEASON;
  const minutesFactor = getMinutesFactor(player.relations.managerTrust);
  risk += minutesFactor * INJURY_RISK.MINUTES_GAIN_SCALE;
  if (player.age >= INJURY_RISK.AGE_GAIN_START) {
    risk += (player.age - INJURY_RISK.AGE_GAIN_START + 1) * INJURY_RISK.AGE_GAIN_PER_YEAR;
  }
  risk += injuryResult.active ? INJURY_RISK.INJURY_EXTRA_GAIN : -INJURY_RISK.DECAY_IF_NOT_INJURED;
  return clamp(risk, INJURY_RISK.MIN, INJURY_RISK.MAX);
}

// managerTrust and morale drift toward a target derived from seasonRating,
// so a strong season repairs relationships and a weak one erodes them
// without any card firing. Fans drift the same way, plus a trophy bump.
export function driftRelations(relations, seasonRating, trophy) {
  const target = clamp(
    RELATIONSHIP_DRIFT.TARGET_CENTER + (seasonRating - RELATIONSHIP_DRIFT.RATING_BASELINE) * RELATIONSHIP_DRIFT.TARGET_SCALE_PER_RATING_POINT,
    RELATIONSHIP_DRIFT.MIN,
    RELATIONSHIP_DRIFT.MAX
  );
  const managerTrust = clamp(
    relations.managerTrust + (target - relations.managerTrust) * RELATIONSHIP_DRIFT.TRUST_DRIFT_RATE,
    RELATIONSHIP_DRIFT.MIN,
    RELATIONSHIP_DRIFT.MAX
  );
  const morale = clamp(
    relations.morale + (target - relations.morale) * RELATIONSHIP_DRIFT.MORALE_DRIFT_RATE,
    RELATIONSHIP_DRIFT.MIN,
    RELATIONSHIP_DRIFT.MAX
  );
  let fans = relations.fans + (target - relations.fans) * RELATIONSHIP_DRIFT.FANS_DRIFT_RATE;
  if (trophy) fans += RELATIONSHIP_DRIFT.FANS_TROPHY_BONUS;
  fans = clamp(fans, RELATIONSHIP_DRIFT.MIN, RELATIONSHIP_DRIFT.MAX);

  return { managerTrust, dressingRoom: relations.dressingRoom, morale, fans };
}
