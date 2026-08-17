// Single source of truth for every tunable number in the simulation.
// Nothing outside this file should contain a bare numeric literal that
// affects game balance. Change a number here, not in the logic files.

export const POSITIONS = {
  ST: {
    name: 'חלוץ מרכזי',
    blurb: 'חלוץ — שיא מוקדם, תלוי לגמרי בסיום. פורש צעיר אם הבעיטה נחלשת.',
    weights: { shooting: 0.35, dribbling: 0.15, passing: 0.05, defending: 0.0, physical: 0.25, pace: 0.2 },
  },
  W: {
    name: 'כנף',
    blurb: 'כנף — מתפוצץ בגיל 22, נשחק מהר. חייב להמיר מהירות למסירה ולסיום לפני גיל 27.',
    weights: { shooting: 0.2, dribbling: 0.3, passing: 0.15, defending: 0.0, physical: 0.05, pace: 0.3 },
  },
  AM: {
    name: 'קשר התקפי',
    blurb: 'קשר התקפי — קריירה מאוזנת שנשענת על יצירתיות ומחזיקה מעמד עד שנות ה-30.',
    weights: { shooting: 0.2, dribbling: 0.25, passing: 0.35, defending: 0.05, physical: 0.1, pace: 0.05 },
  },
  DM: {
    name: 'קשר אחורי',
    blurb: 'קשר אחורי — עמיד, נשען על מסירה והגנה שדועכות לאט. קריירה ארוכה יחסית.',
    weights: { shooting: 0.05, dribbling: 0.05, passing: 0.25, defending: 0.35, physical: 0.25, pace: 0.05 },
  },
  FB: {
    name: 'מגן צד',
    blurb: 'מגן צד — תלוי במהירות אך מוגן ע"י הגנה. מי שלא מפתח הגנה יקרוס מוקדם.',
    weights: { shooting: 0.0, dribbling: 0.15, passing: 0.15, defending: 0.25, physical: 0.15, pace: 0.3 },
  },
  CB: {
    name: 'בלם',
    blurb: 'בלם — הקריירה הארוכה ביותר. שיא מאוחר ודעיכה איטית של היכולות המרכזיות.',
    weights: { shooting: 0.02, dribbling: 0.03, passing: 0.1, defending: 0.4, physical: 0.3, pace: 0.15 },
  },
};

export const ABILITY_KEYS = ['shooting', 'dribbling', 'passing', 'defending', 'physical', 'pace'];

export const ABILITY_LABELS = {
  shooting: 'בעיטה',
  dribbling: 'כדרור',
  passing: 'מסירה',
  defending: 'הגנה',
  physical: 'פיזי',
  pace: 'מהירות',
};

export const STARTING_ABILITIES = {
  AGE: 15,
  OVR_MIN: 52,
  OVR_MAX: 57,
  KEY_ABILITY_MIN: 55,
  KEY_ABILITY_MAX: 68,
  SECONDARY_ABILITY_MIN: 45,
  SECONDARY_ABILITY_MAX: 58,
  OTHER_ABILITY_MIN: 35,
  OTHER_ABILITY_MAX: 50,
  KEY_ABILITY_WEIGHT_THRESHOLD: 0.2, // weights >= this are "key" abilities for the position
  SECONDARY_ABILITY_WEIGHT_THRESHOLD: 0.08,
};

// ---- Age curves ------------------------------------------------------

export const AGE_CURVES = {
  pace: { peak: 24, declinePerYear: 2.5 },
  dribbling: { peak: 26, declinePerYear: 1.5 },
  physical: { peak: 28, declinePerYear: 1.2 },
  shooting: { peak: 29, declinePerYear: 0.6 },
  defending: { peak: 30, declinePerYear: 0.4 },
  passing: { peak: 31, declinePerYear: 0.2 },
};

export const DECLINE_ACCELERATION = {
  EARLY_YEARS_PAST_PEAK: 3, // up to peak+3
  EARLY_MULTIPLIER: 1.0,
  MID_YEARS_PAST_PEAK: 7, // peak+4 .. peak+7
  MID_MULTIPLIER: 1.4,
  LATE_MULTIPLIER: 1.9, // beyond peak+7
};

export const ABILITY_MIN = 1;
export const ABILITY_MAX = 99;

// ---- Training ----------------------------------------------------------

export const TRAINING = {
  BASE_TP: 6,
  RATING_BASELINE: 6.0,
  RATING_STEP: 0.5,
  TROPHY_TP_BONUS: 1,
  TP_MIN: 3,
  TP_MAX: 12,
  FIRST_SEASON_AGE: 15,
  FIRST_SEASON_TP: 8,

  GAIN_BASE: 1.0,

  AGE_FACTOR_BRACKETS: [
    { minAge: 15, maxAge: 19, factor: 1.6 },
    { minAge: 20, maxAge: 25, factor: 1.0 },
    { minAge: 26, maxAge: 29, factor: 0.5 },
    { minAge: 30, maxAge: Infinity, factor: 0.15 },
  ],

  DIMINISHING_BRACKETS: [
    { minValue: -Infinity, maxValue: 69, factor: 1.0 },
    { minValue: 70, maxValue: 84, factor: 0.55 },
    { minValue: 85, maxValue: Infinity, factor: 0.25 },
  ],

  TRUST_HIGH_THRESHOLD: 70, // trust > 70
  TRUST_HIGH_FACTOR: 1.15,
  TRUST_LOW_THRESHOLD: 30, // trust < 30
  TRUST_MID_FACTOR: 1.0,
  TRUST_LOW_FACTOR: 0.7,
};

// ---- Starting relations / reputation -----------------------------------

export const STARTING_STATE = {
  managerTrust: 55,
  dressingRoom: 55,
  fans: 45,
  morale: 60,
  reputation: 8,
  injuryRisk: 5,
};

// ---- Season simulation ---------------------------------------------------

export const SEASON = {
  MATCHES_PER_SEASON: 34,

  MINUTES_FACTOR_BRACKETS: [
    { minTrust: 75, factor: 0.95 },
    { minTrust: 60, factor: 0.8 },
    { minTrust: 45, factor: 0.6 },
    { minTrust: 30, factor: 0.35 },
    { minTrust: -Infinity, factor: 0.12 },
  ],

  ATTACK_WEIGHTS: { shooting: 0.6, dribbling: 0.2, pace: 0.2 },
  CREATIVE_WEIGHTS: { passing: 0.6, dribbling: 0.25, pace: 0.15 },
  RATING_BASELINE: 70, // the /70 in (attackRating/70)^2

  BASE_GOALS: { ST: 18, W: 10, AM: 9, DM: 3, FB: 2, CB: 3 },
  BASE_ASSISTS: { ST: 5, W: 11, AM: 13, DM: 6, FB: 7, CB: 1 },

  TIER_MOD: { 1: 1.15, 2: 1.0, 3: 0.85, 4: 0.72, 5: 0.6, 6: 0.5 },

  MORALE_MOD_BASE: 0.85,
  MORALE_MOD_SCALE: 0.3,

  GOAL_ASSIST_RANDOM_MIN: 0.75,
  GOAL_ASSIST_RANDOM_MAX: 1.3,

  // Contribution-vs-expectation term for season rating: how goals+assists
  // this season compared to a tier-scaled baseline expectation.
  CONTRIBUTION_EXPECTATION_TIER_SCALED: true,
  CONTRIBUTION_CLAMP_MIN: -1.2,
  CONTRIBUTION_CLAMP_MAX: 1.8,
};

export const SEASON_RATING = {
  BASE: 5.0,
  CONTRIBUTION_WEIGHT: 2.2,
  MINUTES_WEIGHT: 1.2,
  MINUTES_BASELINE: 0.6,
  OVR_WEIGHT: 0.8,
  OVR_DIVISOR: 12,
  TROPHY_BONUS: 0.6,
  RANDOM_MIN: -0.3,
  RANDOM_MAX: 0.3,
  MIN: 3.0,
  MAX: 9.8,
};

// ---- Injuries --------------------------------------------------------

export const INJURY_RISK = {
  MIN: 0,
  MAX: 100,
  BASE_GAIN_PER_SEASON: 1.5,
  MINUTES_GAIN_SCALE: 3, // extra risk gained scales with minutesFactor
  AGE_GAIN_START: 28, // risk creeps up faster past this age
  AGE_GAIN_PER_YEAR: 0.4,
  DECAY_IF_NOT_INJURED: 3.5,
  INJURY_EXTRA_GAIN: 8, // being injured this season raises risk further
};

export const INJURY_CHECK = {
  // P = injuryRisk/100 * ageMod
  AGE_MOD_BRACKETS: [
    { maxAge: 22, mod: 0.6 },
    { maxAge: 29, mod: 0.9 },
    { maxAge: 33, mod: 1.2 },
    { maxAge: Infinity, mod: 1.5 },
  ],
  // Once injured, severity is rolled among these shares (must sum to 1.0
  // for ages below CAREER_ENDING_MIN_AGE, where the career-ending share is
  // redistributed to "major").
  MINOR_SHARE: 0.7,
  MAJOR_SHARE: 0.27,
  CAREER_ENDING_SHARE: 0.03,
  CAREER_ENDING_MIN_AGE: 28,
  MINOR_MATCHES_LOST_MIN: 4,
  MINOR_MATCHES_LOST_MAX: 12,
  MAJOR_PACE_PENALTY: -3,
  MAJOR_PHYSICAL_PENALTY: -3,
};

// ---- Trophies ----------------------------------------------------------

export const TROPHY = {
  TIER_BASE: { 1: 72, 2: 62, 3: 52, 4: 42, 5: 32, 6: 22 },
  NOISE_MIN: -15,
  NOISE_MAX: 15,
  OVR_DELTA_WEIGHT: 0.4,
};

// ---- Relationship drift -------------------------------------------------

export const RELATIONSHIP_DRIFT = {
  TARGET_CENTER: 50,
  TARGET_SCALE_PER_RATING_POINT: 15, // vs SEASON_RATING baseline (6.0)
  RATING_BASELINE: 6.0,
  TRUST_DRIFT_RATE: 0.4,
  MORALE_DRIFT_RATE: 0.35,
  FANS_TROPHY_BONUS: 6,
  FANS_DRIFT_RATE: 0.15,
  MIN: 0,
  MAX: 100,
};

// ---- Retirement ----------------------------------------------------------

export const RETIREMENT = {
  OFFER_MIN_AGE: 33,
  FORCE_AGE: 40,
  BASE_PROB_AT_MIN_AGE: 0.12,
  PROB_PER_YEAR_PAST_MIN: 0.13,
  LOW_RATING_THRESHOLD: 5.5, // a poor season nudges retirement pressure up
  LOW_RATING_PROB_BONUS: 0.15,
};

// ---- Transfers -----------------------------------------------------------

export const TRANSFER = {
  OFFER_THRESHOLD: 78, // reputation + OVR must clear this to draw any offers
  OFFER_COUNT_MIN: 2,
  OFFER_COUNT_MAX: 3,
  CANDIDATE_POOL_SIZE: 10,
  MAX_TIER_JUMP_UP: 1, // reputation permitting, can't jump more than 1 tier up per window
  STRUGGLING_RATING_THRESHOLD: 5.5,
  STRUGGLING_MINUTES_THRESHOLD: 0.45,
  DOWNWARD_OFFER_SHARE: 0.34, // fraction of offers biased toward loans/downward moves when struggling
  EXPECTED_TIME_BRACKETS: [
    { minDiff: 3, label: 'צפוי לשחק כל משחק', startingTrust: 65 },
    { minDiff: -3, label: 'מקום קבוע בהרכב', startingTrust: 55 },
    { minDiff: -8, label: 'תחרות קשה על מקום', startingTrust: 42 },
    { minDiff: -Infinity, label: 'צפוי להתחיל בספסל', startingTrust: 28 },
  ],
};

export const REPUTATION = {
  SCALE_PER_RATING_POINT: 1.2,
  RATING_BASELINE: 6.0,
};

// ---- Clubs / draft ---------------------------------------------------

export const CLUB_TIER_CONFIG = {
  1: { prestigeRange: [88, 99], ovrRange: [83, 90] },
  2: { prestigeRange: [72, 87], ovrRange: [76, 82] },
  3: { prestigeRange: [55, 71], ovrRange: [70, 75] },
  4: { prestigeRange: [38, 54], ovrRange: [63, 69] },
  5: { prestigeRange: [22, 37], ovrRange: [56, 62] },
  6: { prestigeRange: [5, 21], ovrRange: [48, 55] },
};

export const DRAFT = {
  TIER_MIN: 5,
  TIER_MAX: 6,
  OPTION_COUNT: 4,
};
