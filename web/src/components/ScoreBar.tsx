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
    pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-400";

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-xs text-gray-600 dark:text-gray-400 w-48 shrink-0">{label}</span>
      )}
      <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8 text-right">
        {score}/{max}
      </span>
    </div>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700"
      : score >= 40
        ? "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700"
        : "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold border ${color}`}
    >
      {score}/100
    </span>
  );
}
