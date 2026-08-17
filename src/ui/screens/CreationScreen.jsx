import { useState } from 'react';
import { POSITIONS } from '../../engine/constants.js';

export default function CreationScreen({ onCreate }) {
  const [name, setName] = useState('');
  const [position, setPosition] = useState(null);

  const canStart = name.trim().length > 0 && position;

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-emerald-400">קריירה</h1>
        <p className="mt-1 text-sm text-slate-400">סימולטור קריירת כדורגל</p>
      </div>

      <div>
        <label className="mb-2 block text-sm text-slate-300">שם השחקן</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="לדוגמה: יואב לוי"
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          maxLength={24}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-slate-300">עמדה</label>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(POSITIONS).map(([key, def]) => (
            <button
              key={key}
              onClick={() => setPosition(key)}
              className={`rounded-lg border p-3 text-right transition ${
                position === key
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
              }`}
            >
              <div className="font-semibold text-slate-100">{def.name}</div>
              <div className="mt-0.5 text-xs leading-relaxed text-slate-400">{def.blurb}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        disabled={!canStart}
        onClick={() => {
          const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
          onCreate(seed, { name: name.trim(), position });
        }}
        className="w-full rounded-lg bg-emerald-500 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        להתחיל קריירה
      </button>
    </div>
  );
}
