"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/profile-types";
import { AuthButton } from "@/components/AuthButton";
import { ScreeningCallInterface } from "@/components/screening/ScreeningCallInterface";

export default function ValidationIAPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) loadProfile(user.id);
      else setLoading(false);
    });
  }, [supabase]);

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (data) setProfile(data as Profile);
    setLoading(false);
  }

  async function startVerification() {
    if (!profile) return;
    setStarting(true);
    setError(null);

    try {
      const res = await fetch("/api/screening/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "profile",
          target_id: profile.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors du lancement de la vérification.");
        setStarting(false);
        return;
      }

      setToken(data.token);
    } catch {
      setError("Erreur de connexion. Vérifiez votre réseau.");
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-lg mx-auto px-4 py-10 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Connexion requise</h1>
          <p className="text-sm text-[var(--muted)] mb-6">
            Connectez-vous pour accéder à la qualification de votre profil.
          </p>
          <AuthButton onAuthChange={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-lg mx-auto px-4 py-10 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-amber-50 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Profil requis</h1>
          <p className="text-sm text-[var(--muted)] mb-6">
            Vous devez d&apos;abord créer et publier votre profil avant de pouvoir le faire qualifier.
          </p>
          <a
            href="/profils/creer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white text-sm font-medium rounded-xl hover:bg-[var(--primary-hover)] transition-colors"
          >
            Créer mon profil
          </a>
        </div>
      </div>
    );
  }

  // Profil déjà vérifié
  if (profile.is_verified) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-lg mx-auto px-4 py-10 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-emerald-50 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Profil déjà qualifié</h1>
          <p className="text-sm text-[var(--muted)] mb-6">
            Votre profil est déjà qualifié. Le badge « Profil qualifié » est visible sur votre profil.
          </p>
          <a
            href="/profils/mon-profil"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white text-sm font-medium rounded-xl hover:bg-[var(--primary-hover)] transition-colors"
          >
            Voir mon profil
          </a>
        </div>
      </div>
    );
  }

  // Interview ElevenLabs en cours
  if (token) {
    return <ScreeningCallInterface token={token} />;
  }

  // Page d'accueil de la vérification
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        {/* En-tête */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 mx-auto mb-3 bg-emerald-50 rounded-2xl flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Qualifier mon profil</h1>
          <p className="text-sm text-[var(--muted)] max-w-md mx-auto leading-relaxed">
            Passez un court entretien vocal pour qualifier votre profil et obtenir le badge « Profil qualifié ».
          </p>
        </div>

        {/* Carte profil résumé */}
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-4 mb-4">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold">
                {profile.display_name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--foreground)] truncate">{profile.display_name}</p>
              {profile.location && (
                <p className="text-xs text-[var(--muted)]">{profile.location}</p>
              )}
            </div>
          </div>
        </div>

        {/* Comment ça marche */}
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-[var(--border-light)]">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Comment ça marche</h2>
          </div>
          <div className="divide-y divide-[var(--border-light)]">
            {[
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                ),
                label: "Entretien vocal",
                description: "Quelques questions par la voix, comme un appel téléphonique (~5 min)",
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                  </svg>
                ),
                label: "Vérification du profil",
                description: "On vérifie la cohérence de votre profil et de vos motivations",
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                ),
                label: "Badge « Profil qualifié »",
                description: "Une fois validé, le badge apparaît sur votre profil et renforce la confiance",
              },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-[var(--surface)] text-[var(--muted)] flex items-center justify-center">
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)]">{step.label}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 rounded-xl border border-red-200 px-4 py-3 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={startVerification}
            disabled={starting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white text-sm font-medium rounded-xl hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
          >
            {starting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Préparation...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
                Qualifier mon profil
              </>
            )}
          </button>
          <p className="text-xs text-[var(--muted)] mt-3">
            Durée : environ 3 à 5 minutes · Microphone requis
          </p>
        </div>
      </div>
    </div>
  );
}
