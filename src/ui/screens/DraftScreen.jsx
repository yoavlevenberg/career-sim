export default function DraftScreen({ state, onChoose }) {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-5 p-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-slate-100">מאיפה מתחילים?</h1>
        <p className="mt-1 text-sm text-slate-400">בחר את המועדון הראשון שלך בקריירה</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {state.draftOptions.map((club, idx) => (
          <button
            key={club.id}
            onClick={() => onChoose(idx)}
            className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-right transition hover:border-emerald-500 hover:bg-emerald-500/5"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-100">{club.name}</span>
              <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">שכבה {club.tier}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
              <span>{club.country}</span>
              <span>
                יוקרה {club.prestige} · רמת סגל {club.clubAvgOvr}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
