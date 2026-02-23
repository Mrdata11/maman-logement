export default function NotFound() {
  return (
    <div className="max-w-md mx-auto py-16 text-center">
      <div className="w-16 h-16 mx-auto mb-6 bg-[var(--surface)] rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
        Page introuvable
      </h1>
      <p className="text-[var(--muted)] text-sm mb-6">
        Cette page n&apos;existe pas ou a &eacute;t&eacute; d&eacute;plac&eacute;e.
      </p>
      <div className="flex justify-center gap-3">
        <a
          href="/"
          className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          Retour &agrave; l&apos;accueil
        </a>
        <a
          href="/profils"
          className="px-5 py-2.5 border border-[var(--border-color)] text-[var(--foreground)] rounded-xl text-sm font-medium hover:bg-[var(--surface)] transition-colors"
        >
          Voir les profils
        </a>
      </div>
    </div>
  );
}
