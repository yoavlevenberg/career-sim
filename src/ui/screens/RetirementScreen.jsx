import { legacyRank } from '../../engine/career.js';

const REASON_LABEL = {
  careerEndingInjury: 'הקריירה הסתיימה בעקבות פציעה קשה',
  offeredRetirement: 'פרשת בבחירה שלך',
  forcedAge40: 'פרשת בגיל 40',
};

export default function RetirementScreen({ state, onRestart }) {
  const { player, careerTotals, seasonLog } = state;
  const rank = legacyRank(state);
  const clubs = [...new Set(seasonLog.map((s) => s.club))];

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-5 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-100">{player.name}</h1>
        <p className="mt-1 text-sm text-slate-400">{REASON_LABEL[state.retirementReason] || 'סוף הקריירה'}</p>
        <div className="mt-3 inline-block rounded-full border border-emerald-500 bg-emerald-500/10 px-4 py-1 text-lg font-bold text-emerald-400">
          {rank}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-center">
        <div>
          <div className="text-lg font-bold text-slate-100">{player.peakOvr}</div>
          <div className="text-xs text-slate-400">OVR שיא</div>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-100">{careerTotals.goals}</div>
          <div className="text-xs text-slate-400">שערים</div>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-100">{careerTotals.assists}</div>
          <div className="text-xs text-slate-400">בישולים</div>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-100">{careerTotals.matches}</div>
          <div className="text-xs text-slate-400">משחקים</div>
        </div>
        <div>
          <div className="text-lg font-bold text-amber-400">{careerTotals.trophies.length}</div>
          <div className="text-xs text-slate-400">גביעים</div>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-100">{clubs.length}</div>
          <div className="text-xs text-slate-400">מועדונים</div>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-700">
        <table className="w-full text-right text-xs">
          <thead className="sticky top-0 bg-slate-800 text-slate-400">
            <tr>
              <th className="p-2">גיל</th>
              <th className="p-2">מועדון</th>
              <th className="p-2">OVR</th>
              <th className="p-2">שערים</th>
              <th className="p-2">בישולים</th>
              <th className="p-2">דירוג</th>
            </tr>
          </thead>
          <tbody>
            {seasonLog.map((s) => (
              <tr key={s.age} className="border-t border-slate-800 text-slate-300">
                <td className="p-2">{s.age}</td>
                <td className="p-2">{s.club}</td>
                <td className="p-2">{s.ovr}</td>
                <td className="p-2">{s.goals}</td>
                <td className="p-2">{s.assists}</td>
                <td className="p-2">{s.seasonRating.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={onRestart}
        className="w-full rounded-lg bg-emerald-500 py-3 font-bold text-slate-950 transition hover:bg-emerald-400"
      >
        קריירה חדשה
      </button>
    </div>
  );
}
