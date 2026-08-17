import { CARDS } from './constants.js';
import { clamp, clampAbility } from './abilities.js';
import { randInt } from './rng.js';

// ---- Seed card pool ------------------------------------------------------
//
// Stage 1 seed pool: 9 drawable cards (trade-off / clutch / dilemma) + 3
// consequence cards (triggered-only, never drawn at random). Structured so
// Stage 3 can grow this array to ~150 without touching any engine logic —
// every gating/effect/consequence concept a future card needs already
// exists in this shape.
//
// Effect shape: { managerTrust, dressingRoom, fans, morale, reputation,
//                 injuryRisk, abilities: { <key>: delta } }
// Clutch options additionally carry: baseChance, relevantAbility,
//   successEffects, failEffects, and optional successConsequence/failConsequence.
// Trade-off/Dilemma options carry: effects, and optional consequence.
// A consequence spec is { cardId, delayMin?, delayMax? }.

export const CARD_POOL = [
  // ---- Trade-off ----
  {
    id: 'extra_training_or_rest',
    type: 'tradeoff',
    minAge: 15,
    maxAge: 39,
    title: 'שבוע אימונים כפול או מנוחה',
    body: 'המאמן נותן לך לבחור: שבוע אימונים אינטנסיבי במיוחד, או שבוע מנוחה מלאה לפני עונש הליגה.',
    options: [
      {
        id: 'double_training',
        label: 'אימון כפול',
        effects: { injuryRisk: 5 },
        abilityBoostKeyAbility: 1, // resolved against the player's position at apply-time
      },
      {
        id: 'full_rest',
        label: 'מנוחה מלאה',
        effects: { morale: 5 },
      },
    ],
  },
  {
    id: 'teammate_party_invite',
    type: 'tradeoff',
    minAge: 17,
    maxAge: 27,
    title: 'הזמנה למסיבה של חבר לקבוצה',
    body: 'חבר לקבוצה עורך מסיבת יום הולדת גדולה ומזמין את כל הסגל. יש צלמים בכל מקום.',
    options: [
      {
        id: 'go',
        label: 'ללכת למסיבה',
        effects: { fans: 4, dressingRoom: 6, morale: 3, injuryRisk: 3 },
        consequence: { cardId: 'leaked_photo' },
      },
      {
        id: 'stay_home',
        label: 'להישאר בבית',
        effects: { dressingRoom: -3, morale: 1 },
      },
    ],
  },
  {
    id: 'media_interview',
    type: 'tradeoff',
    minAge: 16,
    maxAge: 39,
    title: 'ריאיון לתקשורת',
    body: 'עיתונאי שואל אותך ישירות מה אתה חושב על ההחלטות הטקטיות של המאמן לאחרונה.',
    options: [
      {
        id: 'criticize_coach',
        label: 'לבקר את המאמן בפומבי',
        effects: { fans: 8, managerTrust: -15 },
        consequence: { cardId: 'coach_hired_elsewhere' },
      },
      {
        id: 'praise_coach',
        label: 'לשבח את המאמן',
        effects: { managerTrust: 6, fans: -2 },
      },
    ],
  },
  {
    id: 'play_through_pain',
    type: 'tradeoff',
    minAge: 18,
    maxAge: 39,
    title: 'כאב מטריד לפני משחק גדול',
    body: 'אתה מרגיש כאב לא נעים ברגל כבר כמה ימים. המשחק הזה קריטי לקבוצה.',
    options: [
      {
        id: 'play_anyway',
        label: 'לשחק על אף הכאב',
        effects: { managerTrust: 8, fans: 3, injuryRisk: 10 },
        consequence: { cardId: 'recurring_injury' },
      },
      {
        id: 'see_physio',
        label: 'לדווח לפיזיותרפיסט',
        effects: { injuryRisk: -10, managerTrust: -5, morale: -2 },
      },
    ],
  },

  // ---- Clutch ----
  {
    id: 'last_minute_penalty',
    type: 'clutch',
    minAge: 16,
    maxAge: 39,
    title: 'פנדל בדקה ה-90',
    body: 'המשחק צמוד, ונשפט פנדל לטובתכם ברגע האחרון. מי בועט?',
    options: [
      {
        id: 'take_it',
        label: 'לבעוט בעצמך',
        baseChance: 55,
        relevantAbility: 'shooting',
        successEffects: { reputation: 3, fans: 10, dressingRoom: 4 },
        failEffects: { fans: -6, morale: -4 },
      },
      {
        id: 'pass_to_teammate',
        label: 'להעביר את התפקיד לחבר לקבוצה',
        effects: { dressingRoom: 3, fans: 1 },
      },
    ],
  },
  {
    id: 'tough_opponent_clash',
    type: 'clutch',
    minAge: 17,
    maxAge: 39,
    title: 'עימות עם יריב קשוח',
    body: 'מגן היריב מתחיל להתסיס אותך במגרש לפני פנדל קרנות. הקהל שלכם צועק שתעשה משהו.',
    options: [
      {
        id: 'stand_ground',
        label: 'לעמוד איתן ולהילחם על הכדור',
        baseChance: 50,
        relevantAbility: 'physical',
        successEffects: { dressingRoom: 8, managerTrust: 4 },
        failEffects: { injuryRisk: 6, morale: -5 },
      },
      {
        id: 'stay_focused',
        label: 'להתעלם ולהתרכז במשחק',
        effects: { morale: 2, dressingRoom: -1 },
      },
    ],
  },
  {
    id: 'star_player_training',
    type: 'clutch',
    minAge: 15,
    maxAge: 30,
    title: 'אימון משותף עם כוכב-על שמבקר במועדון',
    body: 'שחקן-על שמבקר באימון בוחר אותך להתאמן מולו אחד-על-אחד. זו הזדמנות להרשים, אבל גם להיראות רע.',
    options: [
      {
        id: 'take_challenge',
        label: 'לנצל את ההזדמנות',
        baseChance: 45,
        relevantAbility: 'dribbling',
        successEffects: { reputation: 3, abilities: { dribbling: 2 } },
        failEffects: { injuryRisk: 4, morale: -3 },
      },
      {
        id: 'stay_in_routine',
        label: 'להישאר בשגרה הרגילה',
        effects: {},
      },
    ],
  },

  // ---- Dilemma ----
  {
    id: 'coach_asks_to_play_hurt',
    type: 'dilemma',
    minAge: 17,
    maxAge: 39,
    title: 'המאמן מבקש ממך לשחק עם פציעה קלה',
    body: 'המאמן פונה אליך אישית: הקבוצה זקוקה לך במשחק המכריע, גם אם אתה לא ב-100%.',
    options: [
      {
        id: 'agree',
        label: 'להסכים ולעזור לקבוצה',
        effects: { managerTrust: 10, dressingRoom: 5, injuryRisk: 6 },
      },
      {
        id: 'refuse',
        label: 'לסרב ולשמור על הגוף',
        effects: { managerTrust: -8, injuryRisk: -5, morale: 3 },
      },
    ],
  },
  {
    id: 'support_teammate_or_yourself',
    type: 'dilemma',
    minAge: 16,
    maxAge: 39,
    title: 'חבר לקבוצה נכשל בראיון עיתונאי',
    body: 'ראיון של חבר לקבוצה יצא רע מאוד ורשתות החברתיות מתקיפות אותו. הוא מבקש שתגבה אותו בפומבי.',
    options: [
      {
        id: 'support_publicly',
        label: 'לתמוך בו בפומבי',
        effects: { dressingRoom: 10, fans: -3 },
      },
      {
        id: 'stay_quiet',
        label: 'להישאר בשקט ולשמור על הפרופיל שלך',
        effects: { dressingRoom: -5, fans: 2, reputation: 1 },
      },
    ],
  },

  // ---- Consequence (triggered-only, never drawn randomly) ----
  {
    id: 'leaked_photo',
    type: 'consequence',
    title: 'תמונה מהמסיבה דלפה לרשת',
    body: 'תמונה שלך מהמסיבה לפני כמה עונות דלפה לרשתות החברתיות ומעוררת ביקורת.',
    options: [
      {
        id: 'apologize',
        label: 'להתנצל בפומבי',
        effects: { fans: -5, managerTrust: -3 },
      },
      {
        id: 'ignore',
        label: 'להתעלם ולא להגיב',
        effects: { fans: -10, dressingRoom: -4 },
      },
    ],
  },
  {
    id: 'coach_hired_elsewhere',
    type: 'consequence',
    title: 'המאמן שרצה אותך פוטר — והתקבל דווקא במועדון שרצה לחתום עליך',
    body: 'המאמן שרבת איתו בעונה שעברה פוטר מהמועדון שלו, ועכשיו התקבל למועדון שהיה מתעניין בך. העברה שיכלה לקרות נעלמה.',
    options: [
      {
        id: 'accept_it',
        label: 'לקבל את זה בהבנה',
        effects: { morale: 2 },
      },
      {
        id: 'react_publicly',
        label: 'להתרגז פומבית',
        effects: { managerTrust: -6, fans: 3 },
      },
    ],
  },
  {
    id: 'recurring_injury',
    type: 'consequence',
    title: 'הפציעה חוזרת — וקשה יותר',
    body: 'הכאב שדחקת הצידה כמה עונות קודם חוזר, והפעם הוא הרבה יותר רציני.',
    baseEffects: { injuryRisk: 12, abilities: { physical: -2, pace: -2 } },
    options: [
      {
        id: 'full_recovery',
        label: 'לעצור ולהחלים לגמרי',
        effects: { injuryRisk: -18, managerTrust: -8 },
      },
      {
        id: 'push_through',
        label: 'להמשיך לדחוף',
        effects: { injuryRisk: 6, managerTrust: 5, fans: 2 },
      },
    ],
  },
];

export function getCardById(id) {
  return CARD_POOL.find((c) => c.id === id);
}

function isEligible(card, state) {
  if (card.type === 'consequence') return false; // triggered-only
  const age = state.player.age;
  if (card.minAge != null && age < card.minAge) return false;
  if (card.maxAge != null && age > card.maxAge) return false;
  if (card.positions && !card.positions.includes(state.player.position)) return false;
  if (card.requires && !card.requires(state)) return false;
  return true;
}

export function eligibleCards(state) {
  return CARD_POOL.filter((c) => isEligible(c, state));
}

// A season becomes "key" (3 cards instead of 2) around a post-injury
// return, a dressing-room/manager-trust crisis, or a transfer window the
// player is strong enough to draw offers in.
export function getKeySeasonType(state) {
  const lastLog = state.seasonLog.at(-1);
  if (lastLog && lastLog.injury) return 'post_injury';
  const { managerTrust, dressingRoom } = state.player.relations;
  if (managerTrust < CARDS.CRISIS_TRUST_THRESHOLD || dressingRoom < CARDS.CRISIS_DRESSING_ROOM_THRESHOLD) {
    return 'crisis';
  }
  const ovrStrength = state.player.reputation; // reputation already tracks OVR-adjacent strength
  if (ovrStrength >= CARDS.TRANSFER_WINDOW_STRENGTH_THRESHOLD) return 'transfer_window';
  return null;
}

// Draws this season's cards: due consequence cards fill slots first
// (triggered-only, replacing a normal draw), remaining slots filled at
// random from currently-eligible cards.
export function drawSeasonCards(state, rng) {
  const age = state.player.age;
  const due = state.pendingConsequences.filter((pc) => pc.triggerAtAge <= age);
  const stillPending = state.pendingConsequences.filter((pc) => pc.triggerAtAge > age);

  const keySeasonType = getKeySeasonType(state);
  const totalSlots = keySeasonType ? CARDS.KEY_SEASON_DRAW_COUNT : CARDS.BASE_DRAW_COUNT;

  const dueCards = due.map((pc) => getCardById(pc.cardId)).filter(Boolean);
  const cards = dueCards.slice(0, totalSlots);
  const usedIds = new Set(cards.map((c) => c.id));

  let pool = eligibleCards(state).filter((c) => !usedIds.has(c.id));
  while (cards.length < totalSlots && pool.length > 0) {
    const idx = randInt(rng, 0, pool.length - 1);
    const card = pool[idx];
    cards.push(card);
    usedIds.add(card.id);
    pool = pool.filter((c) => c.id !== card.id);
  }

  return { cards, pendingConsequences: stillPending, keySeasonType };
}

function applyEffects(player, effects = {}) {
  const relations = { ...player.relations };
  for (const key of ['managerTrust', 'dressingRoom', 'fans', 'morale']) {
    if (effects[key] != null) relations[key] = clamp(relations[key] + effects[key], 0, 100);
  }
  const abilities = { ...player.abilities };
  if (effects.abilities) {
    for (const [key, delta] of Object.entries(effects.abilities)) {
      abilities[key] = clampAbility(abilities[key] + delta);
    }
  }
  const reputation = effects.reputation != null ? clamp(player.reputation + effects.reputation, 0, 100) : player.reputation;
  const injuryRisk = effects.injuryRisk != null ? clamp(player.injuryRisk + effects.injuryRisk, 0, 100) : player.injuryRisk;
  return { ...player, relations, abilities, reputation, injuryRisk };
}

function keyAbilityFor(position) {
  // Highest-weighted ability for the position — used by cards that boost
  // "the player's main skill" generically rather than naming one ability.
  const weights = { ST: 'shooting', W: 'dribbling', AM: 'passing', DM: 'defending', FB: 'pace', CB: 'defending' };
  return weights[position] || 'shooting';
}

export function getClutchChance(option, state) {
  const ability = state.player.abilities[option.relevantAbility];
  const abilityContribution = (ability - CARDS.CLUTCH_ABILITY_BASELINE) * CARDS.CLUTCH_ABILITY_WEIGHT;
  const moraleContribution = (state.player.relations.morale - CARDS.CLUTCH_MORALE_BASELINE) * CARDS.CLUTCH_MORALE_WEIGHT;
  const chance = clamp(
    option.baseChance + abilityContribution + moraleContribution,
    CARDS.CLUTCH_MIN_CHANCE,
    CARDS.CLUTCH_MAX_CHANCE
  );
  return { chance, base: option.baseChance, abilityContribution, moraleContribution, ability };
}

// Resolves a chosen option against current state. Returns the new player
// object, any newly-queued consequence, and a `resolution` breakdown the UI
// can turn into a causal explanation (never a bare "success"/"failure").
export function applyCardOption(state, card, option, rng) {
  let player = state.player;
  if (card.baseEffects) player = applyEffects(player, card.baseEffects);

  let resolution = null;
  let consequenceSpec = option.consequence;

  if (card.type === 'clutch' && option.baseChance != null) {
    const { chance, base, abilityContribution, moraleContribution, ability } = getClutchChance(option, state);
    const roll = rng() * 100;
    const success = roll < chance;
    resolution = { type: 'clutch', success, chance, base, abilityContribution, moraleContribution, ability, roll };
    player = applyEffects(player, success ? option.successEffects : option.failEffects);
    consequenceSpec = success ? option.successConsequence : option.failConsequence;
  } else {
    const effects = { ...option.effects };
    if (option.abilityBoostKeyAbility) {
      effects.abilities = { ...(effects.abilities || {}), [keyAbilityFor(player.position)]: option.abilityBoostKeyAbility };
    }
    player = applyEffects(player, effects);
    resolution = { type: card.type, success: true };
  }

  let pendingConsequences = state.pendingConsequences;
  if (consequenceSpec) {
    const delay = randInt(
      rng,
      consequenceSpec.delayMin ?? CARDS.CONSEQUENCE_DELAY_MIN,
      consequenceSpec.delayMax ?? CARDS.CONSEQUENCE_DELAY_MAX
    );
    pendingConsequences = [...pendingConsequences, { triggerAtAge: state.player.age + delay, cardId: consequenceSpec.cardId }];
  }

  return { player, pendingConsequences, resolution };
}
