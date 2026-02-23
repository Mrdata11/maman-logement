"use client";

export function ScoreBar({
  score,
  max = 10,
  label,
}: {
  score: number;
  max?: number;
  label?: string;
}) {
  const pct = (score / max) * 100;
  const color =
    pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-rose-400";

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-xs text-[var(--muted)] w-48 shrink-0">{label}</span>
      )}
      <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-[var(--foreground)] w-8 text-right">
        {score}/{max}
      </span>
    </div>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
      : score >= 40
        ? "bg-amber-100 text-amber-800 border-amber-300"
        : "bg-rose-100 text-rose-800 border-rose-300";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${color}`}
    >
      {score}
    </span>
  );
}
