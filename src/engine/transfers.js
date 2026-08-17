import { CLUBS, getClubsByTier } from './clubs.js';
import { TRANSFER, DRAFT } from './constants.js';
import { calcOvr } from './abilities.js';
import { randInt, pick } from './rng.js';

// Draft: 4 club options rolled from the lowest tiers (semi-pro), the
// player's entry point into the career.
export function generateDraftOptions(rng) {
  const pool = CLUBS.filter((c) => c.tier >= DRAFT.TIER_MIN && c.tier <= DRAFT.TIER_MAX);
  const shuffled = [...pool];
  const options = [];
  for (let i = 0; i < DRAFT.OPTION_COUNT && shuffled.length > 0; i++) {
    const idx = randInt(rng, 0, shuffled.length - 1);
    options.push(shuffled[idx]);
    shuffled.splice(idx, 1);
  }
  return options;
}

function expectedTimeBracket(playerOvr, clubAvgOvr) {
  const diff = playerOvr - clubAvgOvr;
  return TRANSFER.EXPECTED_TIME_BRACKETS.find((b) => diff >= b.minDiff) || TRANSFER.EXPECTED_TIME_BRACKETS.at(-1);
}

function tierCeilingForReputation(reputation, ovr, currentTier) {
  // Reputation+OVR gate how far up the player can realistically jump.
  const strength = reputation + ovr;
  let ceilingTier = 6;
  for (let tier = 1; tier <= 6; tier++) {
    const cfg = getClubsByTier(tier)[0];
    if (!cfg) continue;
    if (strength >= cfg.prestige - 10) {
      ceilingTier = tier;
      break;
    }
  }
  return Math.min(ceilingTier, currentTier + TRANSFER.MAX_TIER_JUMP_UP + 3); // soft cap, still bounded
}

// Generates 2-3 offers at season end when reputation+OVR clears the
// threshold. Always includes at least one downward move/loan-style option
// when the player is struggling (poor rating or low minutes last season).
export function generateOffers(state, rng) {
  const { player, currentClub, seasonLog } = state;
  const ovr = calcOvr(player.abilities, player.position);
  const strength = player.reputation + ovr;
  if (strength < TRANSFER.OFFER_THRESHOLD) return [];

  const lastSeason = seasonLog.at(-1);
  const struggling =
    lastSeason &&
    (lastSeason.seasonRating < TRANSFER.STRUGGLING_RATING_THRESHOLD ||
      lastSeason.minutesFactor < TRANSFER.STRUGGLING_MINUTES_THRESHOLD);

  const ceilingTier = tierCeilingForReputation(player.reputation, ovr, currentClub.tier);
  const candidates = CLUBS.filter((c) => c.id !== currentClub.id && c.tier >= 1 && c.tier <= 6);

  // Sort candidates by proximity to what the player can realistically get:
  // clubs at or slightly above ceilingTier and near the player's OVR band.
  const scored = candidates
    .map((c) => {
      const tierGap = Math.abs(c.tier - ceilingTier);
      const ovrGap = Math.abs(c.clubAvgOvr - ovr);
      return { club: c, score: tierGap * 10 + ovrGap };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, TRANSFER.CANDIDATE_POOL_SIZE)
    .map((s) => s.club);

  const offerCount = randInt(rng, TRANSFER.OFFER_COUNT_MIN, TRANSFER.OFFER_COUNT_MAX);
  const offers = [];
  const used = new Set();

  const takeOne = (fromList) => {
    const available = fromList.filter((c) => !used.has(c.id));
    if (available.length === 0) return null;
    const club = pick(rng, available);
    used.add(club.id);
    return club;
  };

  // If struggling, bias at least one offer toward a lower tier (downward move / loan).
  if (struggling) {
    const downward = candidates.filter((c) => c.tier > currentClub.tier).sort((a, b) => a.tier - b.tier);
    const club = takeOne(downward.length ? downward : scored);
    if (club) {
      offers.push(buildOffer(club, ovr, true));
    }
  }

  while (offers.length < offerCount) {
    const club = takeOne(scored.length ? scored : candidates);
    if (!club) break;
    offers.push(buildOffer(club, ovr, false));
  }

  return offers;
}

function buildOffer(club, playerOvr, isLoan) {
  const bracket = expectedTimeBracket(playerOvr, club.clubAvgOvr);
  return {
    clubId: club.id,
    club,
    isLoan,
    expectedPlayingTime: bracket.label,
    startingManagerTrust: bracket.startingTrust,
  };
}
