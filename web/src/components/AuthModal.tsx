"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { X } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

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
      setEmail("");
      setEmailSent(false);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/profils/creer`,
      },
    });
    if (error) {
      setError("Erreur de connexion. Réessayez.");
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/profils/creer`,
      },
    });
    if (error) {
      setError("Erreur lors de l\u2019envoi. V\u00e9rifiez votre email.");
      setLoading(false);
    } else {
      setEmailSent(true);
      setLoading(false);
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
          {!emailSent ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
                  Bienvenue
                </h2>
                <p className="text-sm text-[var(--muted)] mt-2">
                  Connectez-vous pour rejoindre la communaut&eacute;
                </p>
              </div>

              {/* Google button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-[var(--card-bg)] border-2 border-[var(--border-color)] rounded-2xl text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface)] hover:border-[var(--muted-light)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuer avec Google
              </button>

              {/* Separator */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-[var(--border-light)]" />
                <span className="text-xs font-medium text-[var(--muted-light)] uppercase tracking-wider">
                  ou
                </span>
                <div className="flex-1 h-px bg-[var(--border-light)]" />
              </div>

              {/* Email form */}
              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="w-full px-4 py-3.5 border-2 border-[var(--border-light)] rounded-2xl text-sm bg-[var(--surface)]/30 text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none focus:border-[var(--primary)] transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-3.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-2xl hover:bg-[var(--primary-hover)] transition-all duration-200 shadow-lg shadow-[var(--primary)]/20 hover:shadow-xl hover:shadow-[var(--primary)]/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Recevoir un lien de connexion
                </button>
              </form>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-500 text-center mt-4">{error}</p>
              )}

              {/* Footer */}
              <p className="text-xs text-[var(--muted-light)] text-center mt-6 leading-relaxed">
                En continuant, vous acceptez nos conditions d&apos;utilisation
              </p>
            </>
          ) : (
            /* Email sent confirmation */
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[var(--primary)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
                V&eacute;rifiez vos emails
              </h2>
              <p className="text-sm text-[var(--muted)] mb-1">
                Un lien de connexion a &eacute;t&eacute; envoy&eacute; &agrave;
              </p>
              <p className="text-sm font-semibold text-[var(--foreground)] mb-6">
                {email}
              </p>
              <button
                onClick={() => setEmailSent(false)}
                className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
              >
                Utiliser une autre adresse
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
