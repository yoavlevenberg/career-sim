function colorFor(value) {
  if (value < 60) return { bar: 'bg-red-500', text: 'text-red-400' };
  if (value < 75) return { bar: 'bg-amber-400', text: 'text-amber-300' };
  return { bar: 'bg-emerald-400', text: 'text-emerald-300' };
}

export default function AbilityBar({ label, value, previewValue, max = 99 }) {
  const { bar, text } = colorFor(previewValue ?? value);
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const previewPct = previewValue != null ? Math.max(0, Math.min(100, (previewValue / max) * 100)) : null;

  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-sm text-slate-300">{label}</span>
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-slate-800">
        <div className={`absolute inset-y-0 right-0 rounded-full ${bar} opacity-40`} style={{ width: `${pct}%` }} />
        {previewPct != null && (
          <div className={`absolute inset-y-0 right-0 rounded-full ${bar}`} style={{ width: `${previewPct}%` }} />
        )}
      </div>
      <span className={`w-14 shrink-0 text-left text-sm font-semibold tabular-nums ${text}`}>
        {previewValue != null && previewValue !== value ? (
          <>
            {value}
            <span className="mx-1 text-slate-500">→</span>
            {previewValue}
          </>
        ) : (
          value
        )}
      </span>
    </div>
  );
}
