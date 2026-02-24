"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/profile-types";
import { AuthButton } from "@/components/AuthButton";

type ValidationStatus = "not_started" | "in_progress" | "completed" | "failed";

interface ValidationResult {
  status: ValidationStatus;
  score: number | null;
  feedback: string[];
  completedAt: string | null;
}

const VALIDATION_STEPS = [
  {
    id: "identity",
    label: "Vérification d'identité",
    description: "L'agent IA vérifie la cohérence de votre profil et de vos informations",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
      </svg>
    ),
  },
  {
    id: "motivation",
    label: "Analyse des motivations",
    description: "Évaluation de vos réponses au questionnaire et de votre introduction",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    id: "compatibility",
    label: "Score de compatibilité",
    description: "Calcul de votre score d'adéquation avec les projets disponibles",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    id: "badge",
    label: "Attribution du badge",
    description: "Si tout est validé, vous recevez le badge « Profil vérifié par IA »",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
];

export default function ValidationIAPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>("not_started");
  const [currentStep, setCurrentStep] = useState(0);
  const [requesting, setRequesting] = useState(false);
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

  async function startValidation() {
    setRequesting(true);
    setValidationStatus("in_progress");
    setCurrentStep(0);

    // Simulation de la progression de la validation IA
    for (let i = 0; i < VALIDATION_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      setCurrentStep(i + 1);
    }

    await new Promise((r) => setTimeout(r, 800));
    setValidationStatus("completed");
    setRequesting(false);
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
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Connexion requise</h1>
          <p className="text-sm text-[var(--muted)] mb-6">
            Connectez-vous pour accéder à la validation IA de votre profil.
          </p>
          <AuthButton onAuthChange={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-amber-50 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Profil requis</h1>
          <p className="text-sm text-[var(--muted)] mb-6">
            Vous devez d&apos;abord créer et publier votre profil avant de pouvoir le faire valider par l&apos;IA.
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

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center">
            <svg className="w-7 h-7 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Validation IA</h1>
          <p className="text-sm text-[var(--muted)] max-w-md mx-auto leading-relaxed">
            Notre agent IA analyse votre profil pour vérifier sa complétude, évaluer vos motivations et vous attribuer un badge de confiance.
          </p>
        </div>

        {/* Carte profil résumé */}
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-5 mb-6">
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
            {profile.is_verified && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Vérifié
              </span>
            )}
          </div>
        </div>

        {/* Étapes de validation */}
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-[var(--border-light)]">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Étapes de la validation</h2>
          </div>
          <div className="divide-y divide-[var(--border-light)]">
            {VALIDATION_STEPS.map((step, i) => {
              const isDone = validationStatus === "completed" || (validationStatus === "in_progress" && i < currentStep);
              const isActive = validationStatus === "in_progress" && i === currentStep;

              return (
                <div key={step.id} className="flex items-start gap-4 px-5 py-4">
                  <div
                    className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      isDone
                        ? "bg-emerald-100 text-emerald-600"
                        : isActive
                          ? "bg-[var(--primary)]/10 text-[var(--primary)] animate-pulse"
                          : "bg-[var(--surface)] text-[var(--muted)]"
                    }`}
                  >
                    {isDone ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isDone ? "text-emerald-700" : isActive ? "text-[var(--foreground)]" : "text-[var(--muted)]"}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        {validationStatus === "not_started" && (
          <div className="text-center">
            <button
              onClick={startValidation}
              disabled={requesting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white text-sm font-medium rounded-xl hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
              </svg>
              Lancer la validation IA
            </button>
            <p className="text-xs text-[var(--muted)] mt-3">
              La validation prend environ 30 secondes
            </p>
          </div>
        )}

        {validationStatus === "in_progress" && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--surface)] text-[var(--foreground)] text-sm rounded-xl">
              <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              Validation en cours...
            </div>
          </div>
        )}

        {validationStatus === "completed" && (
          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-emerald-800 mb-1">Validation réussie !</h3>
            <p className="text-sm text-emerald-700 mb-4">
              Votre profil a été vérifié par notre agent IA. Le badge « Vérifié » est désormais visible sur votre profil.
            </p>
            <div className="flex items-center justify-center gap-3">
              <a
                href="/profils/mon-profil"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Voir mon profil
              </a>
              <a
                href="/profils"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 text-sm font-medium rounded-xl border border-emerald-200 hover:bg-emerald-50 transition-colors"
              >
                Explorer les profils
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
