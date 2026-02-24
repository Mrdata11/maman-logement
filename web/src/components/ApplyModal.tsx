"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onSuccess: () => void;
}

export function ApplyModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  onSuccess,
}: ApplyModalProps) {
  const [motivation, setMotivation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMotivation("");
      setError(null);
      setSuccess(false);
      setSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          motivation: motivation.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'envoi");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setSubmitting(false);
      onSuccess();
    } catch {
      setError("Erreur de connexion. Veuillez r\u00e9essayer.");
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md mx-4 bg-[var(--card-bg)] rounded-3xl shadow-2xl animate-modalIn overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--surface)] hover:bg-[var(--border-color)] transition-all duration-200 z-10"
          aria-label="Fermer"
        >
          <X className="w-4 h-4 text-[var(--foreground)]" />
        </button>

        <div className="px-8 pt-10 pb-8">
          {!success ? (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-4 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-[var(--primary)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[var(--foreground)]">
                  Candidater
                </h2>
                <p className="text-sm text-[var(--muted)] mt-1">
                  {projectName}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="motivation"
                    className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
                  >
                    Message de motivation{" "}
                    <span className="text-[var(--muted-light)] font-normal">
                      (optionnel)
                    </span>
                  </label>
                  <textarea
                    id="motivation"
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    placeholder="Pourquoi ce projet vous int&eacute;resse-t-il ? Qu'aimeriez-vous y apporter ?"
                    rows={4}
                    maxLength={2000}
                    className="w-full px-4 py-3 border-2 border-[var(--border-light)] rounded-2xl text-sm bg-[var(--surface)]/30 text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none focus:border-[var(--primary)] transition-all duration-200 resize-none"
                  />
                  {motivation.length > 0 && (
                    <p className="text-xs text-[var(--muted-light)] text-right mt-1">
                      {motivation.length}/2000
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-2xl hover:bg-[var(--primary-hover)] transition-all duration-200 shadow-lg shadow-[var(--primary)]/20 hover:shadow-xl hover:shadow-[var(--primary)]/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      Envoyer ma candidature
                    </>
                  )}
                </button>

                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}
              </form>

              <p className="text-xs text-[var(--muted-light)] text-center mt-5 leading-relaxed">
                Votre profil sera partag&eacute; avec le cr&eacute;ateur du
                projet
              </p>
            </>
          ) : (
            /* Success state */
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
                Candidature envoy&eacute;e !
              </h2>
              <p className="text-sm text-[var(--muted)] mb-6">
                Le cr&eacute;ateur du projet recevra votre candidature et pourra
                consulter votre profil.
              </p>
              <button
                onClick={onClose}
                className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
