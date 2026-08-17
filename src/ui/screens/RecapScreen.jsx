import { useState } from 'react';
import { ABILITY_KEYS, ABILITY_LABELS } from '../../engine/constants.js';

function DeltaLines({ title, deltas, positiveIsGood }) {
  const entries = ABILITY_KEYS.map((k) => [k, deltas?.[k] || 0]).filter(([, v]) => v !== 0);
  if (entries.length === 0) return null;
  return (
    <div>
      <div className="text-xs font-semibold text-slate-400">{title}</div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
        {entries.map(([k, v]) => {
          const good = positiveIsGood ? v > 0 : v > 0;
          return (
            <span key={k} className={good ? 'text-emerald-400' : 'text-red-400'}>
              {ABILITY_LABELS[k]} {v > 0 ? '+' : ''}
              {Math.round(v * 10) / 10}
            </span>
          );
        })}
      </div>
    </div>
  );
}

const INJURY_LABEL = { minor: 'פציעה קלה', major: 'פציעה חמורה', careerEnding: 'פציעה מסיימת קריירה' };

export default function RecapScreen({ state, onContinue }) {
  const log = state.seasonLog.at(-1);
  const { transferOffers, retirementCheck } = state;
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [acceptRetirement, setAcceptRetirement] = useState(false);

  const forced = retirementCheck?.forced;
  const offered = retirementCheck?.offered;

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-4 p-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-slate-100">
          סיכום עונה — גיל {log.age} · {log.club}
        </h1>
      </div>

      <div className="grid grid-cols-4 gap-2 rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-center">
        <div>
          <div className="text-lg font-bold text-slate-100">{log.matches}</div>
          <div className="text-xs text-slate-400">משחקים</div>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-100">{log.goals}</div>
          <div className="text-xs text-slate-400">שערים</div>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-100">{log.assists}</div>
          <div className="text-xs text-slate-400">בישולים</div>
        </div>
        <div>
          <div className="text-lg font-bold text-emerald-400">{log.seasonRating.toFixed(1)}</div>
          <div className="text-xs text-slate-400">דירוג עונה</div>
        </div>
      </div>

      {log.trophies > 0 && (
        <div className="rounded-lg border border-amber-600 bg-amber-500/10 p-2 text-center text-sm font-semibold text-amber-300">
          🏆 זכייה בגביע העונה!
        </div>
      )}
      {log.injury && (
        <div className="rounded-lg border border-red-700 bg-red-500/10 p-2 text-center text-sm font-semibold text-red-300">
          {INJURY_LABEL[log.injury]}
        </div>
      )}

      <div className="space-y-2 rounded-lg border border-slate-700 bg-slate-800/40 p-3">
        <DeltaLines title="דעיכת גיל" deltas={state.lastAgeCurveDeltas} />
        <DeltaLines title="שיפור מאימונים" deltas={state.lastTrainingDeltas} />
        <div className="text-xs text-slate-500">
          OVR: {log.ovr} · אחוז דקות: {Math.round(log.minutesFactor * 100)}%
        </div>
      </div>

      {transferOffers && transferOffers.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-slate-300">הצעות מעבר</div>
          <button
            onClick={() => setSelectedOffer(null)}
            className={`w-full rounded-lg border p-2 text-right text-sm transition ${
              selectedOffer === null ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/40'
            }`}
          >
            להישאר ב{state.currentClub.name}
          </button>
          {transferOffers.map((offer, idx) => (
            <button
              key={offer.clubId}
              onClick={() => setSelectedOffer(offer)}
              className={`w-full rounded-lg border p-2 text-right text-sm transition ${
                selectedOffer === offer ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/40'
              }`}
            >
              <div className="flex justify-between">
                <span className="font-semibold text-slate-100">
                  {offer.club.name} {offer.isLoan && '(השאלה)'}
                </span>
                <span className="text-xs text-slate-400">שכבה {offer.club.tier}</span>
              </div>
              <div className="text-xs text-slate-400">{offer.expectedPlayingTime}</div>
            </button>
          ))}
        </div>
      )}

      {offered && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
          <div className="text-sm font-semibold text-slate-200">
            {forced ? 'הגיע הזמן לפרוש — גיל 40' : 'המועדון מציע לך לשקול פרישה'}
          </div>
          {!forced && (
            <label className="mt-2 flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={acceptRetirement} onChange={(e) => setAcceptRetirement(e.target.checked)} />
              לפרוש בסוף העונה
            </label>
          )}
        </div>
      )}

      <button
        onClick={() => onContinue(selectedOffer, forced ? true : acceptRetirement)}
        className="w-full rounded-lg bg-emerald-500 py-3 font-bold text-slate-950 transition hover:bg-emerald-400"
      >
        {forced || acceptRetirement ? 'לסיים את הקריירה' : 'המשך לעונה הבאה'}
      </button>
    </div>
  );
}
