import { useState } from 'react';
import { getCardById, getClutchChance } from '../../engine/cards.js';
import { ABILITY_LABELS } from '../../engine/constants.js';

const EFFECT_LABELS = {
  managerTrust: 'אמון המאמן',
  dressingRoom: 'חדר ההלבשה',
  fans: 'אוהדים',
  morale: 'מורל',
  reputation: 'מוניטין',
  injuryRisk: 'סיכון פציעה',
};

function EffectList({ effects }) {
  if (!effects) return null;
  const rows = [];
  for (const [key, delta] of Object.entries(effects)) {
    if (key === 'abilities') {
      for (const [abKey, abDelta] of Object.entries(delta)) {
        rows.push({ label: ABILITY_LABELS[abKey], delta: abDelta });
      }
    } else if (delta) {
      rows.push({ label: EFFECT_LABELS[key] || key, delta });
    }
  }
  if (rows.length === 0) return <span className="text-xs text-slate-500">ללא השפעה ישירה</span>;
  return (
    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
      {rows.map((r, i) => (
        <span key={i} className={r.delta > 0 ? 'text-emerald-400' : 'text-red-400'}>
          {r.label} {r.delta > 0 ? '+' : ''}
          {r.delta}
        </span>
      ))}
    </div>
  );
}

function causalMessage(card, option, resolution) {
  if (resolution.type !== 'clutch') return null;
  const abilitySign = resolution.abilityContribution >= 0 ? '+' : '';
  const moraleSign = resolution.moraleContribution >= 0 ? '+' : '';
  const base = `${ABILITY_LABELS[option.relevantAbility]} ${resolution.ability} נתנה בסיס ${Math.round(resolution.base + resolution.abilityContribution)}%`;
  const moraleNote = `מורל ${Math.round(resolution.moraleContribution)}${
    resolution.moraleContribution >= 0 ? '%- הוסיף' : '%- הוריד'
  } לסיכוי`;
  return resolution.success
    ? `הצלחת! ${base}, ${moraleNote}. סיכוי סופי: ${Math.round(resolution.chance)}%.`
    : `החמצת. ${base}, ${moraleNote}. סיכוי סופי: ${Math.round(resolution.chance)}% (הגרלת ${Math.round(resolution.roll)}).`;
}

export default function CardScreen({ state, onResolve, onContinue }) {
  const [mode, setMode] = useState('question');
  const card = state.cardQueue[0];
  const lastResolution = state.cardResolutions.at(-1);

  if (mode === 'result' && lastResolution) {
    const resolvedCard = getCardById(lastResolution.cardId);
    const option = resolvedCard.options.find((o) => o.id === lastResolution.optionId);
    const { resolution } = lastResolution;
    const message = causalMessage(resolvedCard, option, resolution);
    const effects =
      resolution.type === 'clutch' ? (resolution.success ? option.successEffects : option.failEffects) : option.effects;

    return (
      <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-5 p-6">
        <div
          className={`rounded-lg border p-5 text-center ${
            resolution.type === 'clutch'
              ? resolution.success
                ? 'border-emerald-600 bg-emerald-500/10'
                : 'border-red-600 bg-red-500/10'
              : 'border-slate-700 bg-slate-800/50'
          }`}
        >
          <h2 className="text-lg font-bold text-slate-100">{resolvedCard.title}</h2>
          {message && <p className="mt-2 text-sm leading-relaxed text-slate-300">{message}</p>}
          <div className="mt-3 flex justify-center">
            <EffectList effects={effects} />
          </div>
        </div>
        <button
          onClick={() => {
            if (state.cardQueue.length > 0) {
              setMode('question');
            } else {
              onContinue();
            }
          }}
          className="w-full rounded-lg bg-emerald-500 py-3 font-bold text-slate-950 transition hover:bg-emerald-400"
        >
          {state.cardQueue.length > 0 ? 'לקלף הבא' : 'לסיכום העונה'}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-5 p-6">
      <div className="text-center">
        <h1 className="text-lg font-bold text-slate-100">{card.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{card.body}</p>
      </div>

      <div className="space-y-3">
        {card.options.map((option, idx) => {
          const chanceInfo = option.baseChance != null ? getClutchChance(option, state) : null;
          return (
            <button
              key={option.id}
              onClick={() => {
                onResolve(idx);
                setMode('result');
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-right transition hover:border-emerald-500 hover:bg-emerald-500/5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-100">{option.label}</span>
                {chanceInfo && (
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-sm font-bold text-emerald-300">
                    {Math.round(chanceInfo.chance)}%
                  </span>
                )}
              </div>
              <EffectList effects={chanceInfo ? option.successEffects : option.effects} />
              {chanceInfo && <div className="mt-1 text-xs text-slate-500">בכישלון: <EffectListInline effects={option.failEffects} /></div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EffectListInline({ effects }) {
  const rows = [];
  for (const [key, delta] of Object.entries(effects || {})) {
    if (key === 'abilities') continue;
    if (delta) rows.push(`${EFFECT_LABELS[key] || key} ${delta > 0 ? '+' : ''}${delta}`);
  }
  return <span>{rows.join(' · ') || 'ללא'}</span>;
}
