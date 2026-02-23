export default function Loading() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[var(--muted)]">Chargement...</span>
      </div>
    </div>
  );
}
