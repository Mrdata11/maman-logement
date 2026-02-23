"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-md mx-auto py-16 text-center">
      <div className="w-16 h-16 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
        Quelque chose s&apos;est mal pass&eacute;
      </h1>
      <p className="text-[var(--muted)] text-sm mb-6">
        Une erreur inattendue est survenue. Veuillez r&eacute;essayer.
      </p>
      <div className="flex justify-center gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          R&eacute;essayer
        </button>
        <a
          href="/"
          className="px-5 py-2.5 border border-[var(--border-color)] text-[var(--foreground)] rounded-xl text-sm font-medium hover:bg-[var(--surface)] transition-colors"
        >
          Retour &agrave; l&apos;accueil
        </a>
      </div>
    </div>
  );
}
