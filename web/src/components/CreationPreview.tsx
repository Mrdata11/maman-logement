"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QuestionnaireAnswers } from "@/lib/questionnaire-types";
import {
  CreationProjectState,
  CREATION_STORAGE_KEY,
} from "@/lib/creation-questionnaire-types";
import { CREATION_STEPS } from "@/lib/creation-questionnaire-data";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { AuthButton } from "./AuthButton";

function formatAnswer(
  questionId: string,
  value: string | string[] | number
): string {
  for (const step of CREATION_STEPS) {
    const q = step.questions.find((q) => q.id === questionId);
    if (!q) continue;
    if (Array.isArray(value)) {
      return value
        .map((v) => q.options?.find((o) => o.id === v)?.label || v)
        .join(", ");
    }
    if (typeof value === "number" && q.sliderConfig) {
      return `${value}${q.sliderConfig.unit || ""}`;
    }
    if (typeof value === "string" && q.options) {
      return q.options.find((o) => o.id === value)?.label || value;
    }
    return String(value);
  }
  return String(value);
}

function getQuestionText(questionId: string): string {
  for (const step of CREATION_STEPS) {
    const q = step.questions.find((q) => q.id === questionId);
    if (q) return q.text;
  }
  return questionId;
}

export function CreationPreview() {
  const router = useRouter();
  const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CREATION_STORAGE_KEY);
      if (raw) {
        const state: CreationProjectState = JSON.parse(raw);
        if (Object.keys(state.answers).length > 0) {
          setAnswers(state.answers);
          return;
        }
      }
    } catch {}
    // No data, redirect back
    router.push("/creer");
  }, [router]);

  const handleSave = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const projectName = answers?.project_name as string | undefined;
      const projectVision = answers?.project_vision as string | undefined;

      const { data: projectData, error } = await supabase.from("projects").upsert({
        user_id: user.id,
        name: projectName || "Projet sans nom",
        vision: projectVision || null,
        answers: answers,
        is_published: true,
      }, { onConflict: "user_id" }).select("id").single();

      if (error) {
        console.error("Error saving project:", error);
        setSaveError("Erreur lors de la sauvegarde. Veuillez réessayer.");
        setSaving(false);
        return;
      }

      if (projectData) {
        setProjectId(projectData.id);

        // Auto-lier le créateur comme membre (s'il a un profil)
        const { data: creatorProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (creatorProfile) {
          await supabase.from("project_members").upsert(
            {
              project_id: projectData.id,
              profile_id: creatorProfile.id,
              role: "creator",
            },
            { onConflict: "project_id,profile_id" }
          );
        }
      }

      localStorage.removeItem(CREATION_STORAGE_KEY);
      setSaved(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSaveError("Erreur lors de la sauvegarde. Veuillez réessayer.");
    }
    setSaving(false);
  };

  const handleReset = () => {
    localStorage.removeItem(CREATION_STORAGE_KEY);
    router.push("/creer");
  };

  if (!answers) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="text-[var(--muted-light)]">Chargement...</div>
      </div>
    );
  }

  const handleGenerateInvite = async () => {
    if (!projectId) return;
    setGeneratingInvite(true);
    try {
      const res = await fetch("/api/projects/generate-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });
      const data = await res.json();
      if (data.invite_url) {
        setInviteUrl(data.invite_url);
      }
    } catch (err) {
      console.error("Error generating invite:", err);
    }
    setGeneratingInvite(false);
  };

  const handleCopyInvite = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (saved) {
    return (
      <div className="max-w-lg mx-auto py-12 space-y-8">
        {/* Animated success icon */}
        <div className="flex justify-center">
          <div className="relative success-icon-container" style={{ opacity: 0 }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-24 h-24 rounded-full border-2 border-[var(--primary)] success-ring"
                style={{ opacity: 0 }}
              />
            </div>
            <span className="success-sparkle" style={{ opacity: 0 }} />
            <span className="success-sparkle" style={{ opacity: 0 }} />
            <span className="success-sparkle" style={{ opacity: 0 }} />
            <span className="success-sparkle" style={{ opacity: 0 }} />
            <span className="success-sparkle" style={{ opacity: 0 }} />
            <span className="success-sparkle" style={{ opacity: 0 }} />
            <svg width="80" height="80" viewBox="0 0 52 52">
              <circle
                className="success-circle-fill"
                cx="26" cy="26" r="25"
                fill="var(--primary)"
              />
              <circle
                className="success-circle-svg"
                cx="26" cy="26" r="25"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                className="success-check-svg"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 27l6 6 16-16"
              />
            </svg>
          </div>
        </div>

        {/* Title + subtitle */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-[var(--foreground)] success-text-1">
            Votre projet est en ligne !
          </h2>
          <p className="text-[var(--muted)] success-text-2">
            Des personnes qui partagent vos valeurs peuvent maintenant vous d&eacute;couvrir et candidater.
          </p>
        </div>

        {/* Primary CTA */}
        {projectId && (
          <div className="success-text-3">
            <a
              href={`/habitats/${projectId}`}
              className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-[var(--primary)] text-white rounded-xl text-sm font-bold hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Voir mon projet
            </a>
          </div>
        )}

        {/* Invite + next steps */}
        <div className="success-text-4 bg-[var(--surface)] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Et maintenant ?
          </h3>
          <div className="space-y-3">
            {/* Invite members */}
            <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4.5 h-4.5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span className="text-sm font-medium text-[var(--foreground)]">Inviter des membres</span>
              </div>
              <p className="text-xs text-[var(--muted)] mb-3">
                Partagez un lien d&apos;invitation pour que vos futurs voisins rejoignent le projet.
              </p>
              {inviteUrl ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteUrl}
                      className="flex-1 px-3 py-2 bg-[var(--surface)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--foreground)] select-all"
                    />
                    <button
                      onClick={handleCopyInvite}
                      className="shrink-0 px-3 py-2 bg-[var(--primary)] text-white rounded-lg text-xs font-medium hover:bg-[var(--primary-hover)] transition-colors"
                    >
                      {copied ? "Copi\u00e9 !" : "Copier"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleGenerateInvite}
                  disabled={generatingInvite || !projectId}
                  className="w-full px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
                >
                  {generatingInvite ? "G\u00e9n\u00e9ration..." : "G\u00e9n\u00e9rer un lien d\u2019invitation"}
                </button>
              )}
            </div>

            {/* Explore projects */}
            <a
              href="/habitats"
              className="flex items-center gap-3 p-3 bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] hover:border-[var(--primary)] hover:shadow-sm transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-[var(--golden)]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--golden)]/15 transition-colors">
                <svg className="w-4.5 h-4.5 text-[var(--golden)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)]">Explorer d&apos;autres projets</p>
                <p className="text-xs text-[var(--muted)]">D&eacute;couvrez les communaut&eacute;s existantes</p>
              </div>
              <svg className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>

            {/* Back home */}
            <a
              href="/"
              className="flex items-center gap-3 p-3 bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] hover:border-[var(--primary)] hover:shadow-sm transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--primary)]/15 transition-colors">
                <svg className="w-4.5 h-4.5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)]">Retour &agrave; l&apos;accueil</p>
              </div>
              <svg className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--muted)] success-text-5">
          Vous pouvez modifier votre projet &agrave; tout moment.
        </p>
      </div>
    );
  }

  // Group answers by step
  const stepSections = CREATION_STEPS.map((step) => {
    const stepAnswers = step.questions
      .filter((q) => answers[q.id] !== undefined)
      .map((q) => ({
        id: q.id,
        question: q.text,
        answer: formatAnswer(q.id, answers[q.id]),
      }));
    return { ...step, answers: stepAnswers };
  }).filter((s) => s.answers.length > 0);

  // Extract key fields
  const projectName = answers.project_name as string | undefined;
  const projectVision = answers.project_vision as string | undefined;

  // Badge data (reusing ProjectCard pattern)
  const regions = Array.isArray(answers.project_region)
    ? (answers.project_region as string[]).filter((r) => r !== "not_decided")
    : [];
  const getOptionLabel = (qId: string, optId: string) => {
    for (const step of CREATION_STEPS) {
      const q = step.questions.find((q) => q.id === qId);
      if (q?.options) return q.options.find((o) => o.id === optId)?.label || optId;
    }
    return optId;
  };
  const settingType =
    typeof answers.setting_type === "string" && answers.setting_type !== "not_decided"
      ? getOptionLabel("setting_type", answers.setting_type)
      : null;
  const projectStage =
    typeof answers.project_stage === "string"
      ? getOptionLabel("project_stage", answers.project_stage)
      : null;
  const communityValues = Array.isArray(answers.community_values)
    ? (answers.community_values as string[]).slice(0, 4)
    : [];
  const plannedUnits =
    typeof answers.planned_units === "number" ? answers.planned_units : null;

  const totalFields = CREATION_STEPS.reduce((sum, s) => sum + s.questions.length, 0);
  const answeredFields = Object.keys(answers).length;
  const missing = totalFields - answeredFields;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.push("/creer")}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>
      </div>

      {/* Project card preview — how it will look in listings */}
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-5 sm:p-6 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="text-xs text-[var(--muted)] font-medium">Aper&ccedil;u tel qu&apos;il appara&icirc;tra</span>
        </div>

        <h2 className="font-bold text-lg text-[var(--foreground)] mb-1">
          {projectName || "Projet sans nom"}
        </h2>
        {projectVision && (
          <p className="text-sm text-[var(--muted)] italic line-clamp-2 mb-3 leading-relaxed">
            &laquo; {projectVision} &raquo;
          </p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {projectStage && (
            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {projectStage}
            </span>
          )}
          {regions.slice(0, 2).map((r) => (
            <span key={r} className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
              {getOptionLabel("project_region", r)}
            </span>
          ))}
          {settingType && (
            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">
              {settingType}
            </span>
          )}
          {plannedUnits && (
            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
              {plannedUnits} logements
            </span>
          )}
          {communityValues.map((v) => (
            <span key={v} className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
              {getOptionLabel("community_values", v)}
            </span>
          ))}
        </div>

        <div className="pt-3 border-t border-[var(--border-color)]/50 text-xs text-[var(--muted-light)]">
          Cr&eacute;&eacute; aujourd&apos;hui &middot; 1 membre
        </div>
      </div>

      {/* Detailed answers */}
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8 mb-6">
        <h2 className="text-base font-bold text-[var(--foreground)] mb-5">
          D&eacute;tails du projet
        </h2>

        <div className="space-y-6">
          {stepSections.map((section) => (
            <div key={section.id}>
              <h3 className="text-sm font-semibold text-[var(--primary)] mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full" />
                {section.title}
              </h3>
              <div className="space-y-2.5 ml-4">
                {section.answers.map((a) => (
                  <div key={a.id}>
                    <span className="text-xs text-[var(--muted)] block mb-0.5">
                      {a.question}
                    </span>
                    <span className="text-sm text-[var(--foreground)] font-medium">
                      {a.answer}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Unanswered fields notice */}
        {missing > 0 && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-sm text-amber-800">
              {missing} champ{missing > 1 ? "s" : ""} non renseign&eacute;{missing > 1 ? "s" : ""}.
              Vous pouvez les compl&eacute;ter en modifiant le questionnaire.
            </p>
          </div>
        )}
      </div>

      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
          <p className="text-sm text-red-800">{saveError}</p>
        </div>
      )}

      {/* Auth + Actions */}
      <div className="space-y-4 mb-8">
        {!user ? (
          <>
            <div className="bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <svg className="w-5 h-5 text-[var(--primary)] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    Connectez-vous pour publier votre projet
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Votre brouillon est sauvegard&eacute; localement. La connexion permet de le publier et de recevoir des candidatures.
                  </p>
                </div>
              </div>
              <AuthButton
                onAuthChange={(u) => {
                  if (u) setShowAuth(false);
                }}
              />
            </div>
          </>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-5 py-3.5 bg-[var(--primary)] text-white rounded-xl text-sm font-bold hover:bg-[var(--primary-hover)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 bg-white rounded-full"
                      style={{ animation: `recording-pulse 1s ease-in-out ${i * 0.2}s infinite` }}
                    />
                  ))}
                </div>
                Enregistrement...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Publier mon projet
              </>
            )}
          </button>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => {
              const raw = localStorage.getItem(CREATION_STORAGE_KEY);
              if (raw) {
                const state: CreationProjectState = JSON.parse(raw);
                state.completedAt = null;
                state.currentStep = 0;
                localStorage.setItem(CREATION_STORAGE_KEY, JSON.stringify(state));
              }
              router.push("/creer");
            }}
            className="flex-1 px-5 py-2.5 border border-[var(--border-color)] text-[var(--foreground)] rounded-xl text-sm font-medium hover:bg-[var(--surface)] transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Modifier
          </button>
          <button
            onClick={handleReset}
            className="px-5 py-2.5 text-[var(--muted)] hover:text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Recommencer
          </button>
        </div>
      </div>
    </div>
  );
}
