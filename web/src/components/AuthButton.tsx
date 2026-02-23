"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface AuthButtonProps {
  onAuthChange?: (user: User | null) => void;
  className?: string;
  redirectTo?: string;
}

export function AuthButton({ onAuthChange, className, redirectTo }: AuthButtonProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const supabase = createClient();

  const getRedirectUrl = () => {
    if (redirectTo) return `${window.location.origin}${redirectTo}`;
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`;
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      onAuthChange?.(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      onAuthChange?.(newUser);
    });

    return () => subscription.unsubscribe();
  }, [supabase, onAuthChange]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getRedirectUrl(),
      },
    });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSendingEmail(true);
    setEmailError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: getRedirectUrl(),
      },
    });

    setSendingEmail(false);

    if (error) {
      setEmailError("Erreur lors de l'envoi. V\u00e9rifiez votre adresse email.");
    } else {
      setEmailSent(true);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  };

  if (loading) {
    return (
      <div
        className={`px-4 py-2.5 bg-[var(--surface)] rounded-xl text-sm text-[var(--muted)] ${className || ""}`}
      >
        Chargement...
      </div>
    );
  }

  if (user) {
    return (
      <div className={`flex items-center gap-3 ${className || ""}`}>
        <div className="flex items-center gap-2">
          {user.user_metadata?.avatar_url && (
            <img
              src={user.user_metadata.avatar_url}
              alt=""
              className="w-7 h-7 rounded-full"
            />
          )}
          <span className="text-sm font-medium text-[var(--foreground)]">
            {user.user_metadata?.full_name || user.email}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          D&eacute;connexion
        </button>
      </div>
    );
  }

  if (emailSent) {
    return (
      <div className={`text-center ${className || ""}`}>
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm font-medium text-green-800 mb-1">
            Lien envoy&eacute; !
          </p>
          <p className="text-xs text-green-700">
            V&eacute;rifiez votre bo&icirc;te mail <strong>{email}</strong> et cliquez sur le lien pour vous connecter.
          </p>
        </div>
        <button
          onClick={() => { setEmailSent(false); setEmail(""); }}
          className="mt-3 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Utiliser une autre adresse
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className || ""}`}>
      <form onSubmit={handleEmailSignIn} className="space-y-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.com"
          required
          className="w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-sm text-[var(--foreground)] placeholder:text-[var(--muted-light)] focus:outline-none focus:border-[var(--primary)] transition-colors"
        />
        {emailError && (
          <p className="text-xs text-red-600">{emailError}</p>
        )}
        <button
          type="submit"
          disabled={sendingEmail}
          className="w-full px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
        >
          {sendingEmail ? "Envoi en cours..." : "Recevoir un lien de connexion"}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[var(--border-color)]" />
        <span className="text-xs text-[var(--muted)]">ou</span>
        <div className="flex-1 h-px bg-[var(--border-color)]" />
      </div>

      <button
        onClick={handleGoogleSignIn}
        className="w-full px-5 py-2.5 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors flex items-center justify-center gap-2.5"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
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
        Se connecter avec Google
      </button>
    </div>
  );
}
