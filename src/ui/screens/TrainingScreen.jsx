import { useMemo, useState } from 'react';
import { ABILITY_KEYS, ABILITY_LABELS } from '../../engine/constants.js';
import { calcOvr, applyTrainingPoints } from '../../engine/abilities.js';
import AbilityBar from '../components/AbilityBar.jsx';

export default function TrainingScreen({ state, onSubmit }) {
  const { player, trainingPoints } = state;
  const [allocation, setAllocation] = useState(() => Object.fromEntries(ABILITY_KEYS.map((k) => [k, 0])));

  const spent = Object.values(allocation).reduce((a, b) => a + b, 0);
  const remaining = trainingPoints - spent;

  const previewAbilities = useMemo(() => {
    const next = { ...player.abilities };
    for (const key of ABILITY_KEYS) {
      if (allocation[key] > 0) {
        next[key] = applyTrainingPoints(player.abilities[key], allocation[key], player.age, player.relations.managerTrust).newValue;
      }
    }
    return next;
  }, [allocation, player.abilities, player.age, player.relations.managerTrust]);

  const currentOvr = calcOvr(player.abilities, player.position);
  const previewOvr = calcOvr(previewAbilities, player.position);

  const bump = (key, delta) => {
    setAllocation((prev) => {
      const nextVal = prev[key] + delta;
      if (nextVal < 0) return prev;
      if (delta > 0 && remaining <= 0) return prev;
      if (nextVal > 40) return prev; // sane per-ability cap for a single season
      return { ...prev, [key]: nextVal };
    });
  };

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-5 p-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-slate-100">אימונים — גיל {player.age}</h1>
        <div className="mt-1 text-sm text-slate-400">
          OVR נוכחי: <span className="font-semibold text-slate-200">{currentOvr}</span>
          {previewOvr !== currentOvr && (
            <>
              <span className="mx-1">→</span>
              <span className="font-semibold text-emerald-400">{previewOvr}</span>
            </>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-emerald-700/50 bg-emerald-500/10 px-4 py-2 text-center">
        <span className="text-sm text-slate-300">נקודות אימון נותרות: </span>
        <span className="text-lg font-bold text-emerald-400">{remaining}</span>
        <span className="text-sm text-slate-400"> / {trainingPoints}</span>
      </div>

      <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-800/40 p-4">
        {ABILITY_KEYS.map((key) => (
          <div key={key} className="flex items-center gap-2">
            <button
              onClick={() => bump(key, -1)}
              disabled={allocation[key] === 0}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-slate-200 transition hover:bg-slate-600 disabled:opacity-30"
            >
              −
            </button>
            <div className="flex-1">
              <AbilityBar
                label={ABILITY_LABELS[key]}
                value={player.abilities[key]}
                previewValue={previewAbilities[key]}
              />
            </div>
            <button
              onClick={() => bump(key, 1)}
              disabled={remaining <= 0}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-slate-200 transition hover:bg-slate-600 disabled:opacity-30"
            >
              +
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => onSubmit(allocation)}
        className="w-full rounded-lg bg-emerald-500 py-3 font-bold text-slate-950 transition hover:bg-emerald-400"
      >
        {remaining === 0 ? 'המשך' : 'המשך (יש נקודות שלא נוצלו)'}
      </button>
    </div>
  );
}
