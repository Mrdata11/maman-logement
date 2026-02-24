"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { AuthButton } from "@/components/AuthButton";

interface InterviewConfig {
  enabled: boolean;
  questions: string[];
  tone: "bienveillant" | "neutre" | "exigeant";
  duration: number; // minutes
  autoScreen: boolean;
}

const DEFAULT_QUESTIONS = [
  "Qu'est-ce qui vous attire dans notre projet d'habitat groupé ?",
  "Quelle est votre expérience de la vie en communauté ?",
  "Quelles valeurs sont essentielles pour vous dans un lieu de vie partagé ?",
  "Comment gérez-vous les conflits au quotidien ?",
  "Quelle contribution souhaitez-vous apporter à la communauté ?",
];

const TONE_OPTIONS = [
  { id: "bienveillant" as const, label: "Bienveillant", description: "Ton chaleureux et encourageant" },
  { id: "neutre" as const, label: "Neutre", description: "Questions factuelles et objectives" },
  { id: "exigeant" as const, label: "Exigeant", description: "Questions approfondies et précises" },
];

export default function InterviewIAPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProject, setUserProject] = useState<{ id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState<InterviewConfig>({
    enabled: false,
    questions: [...DEFAULT_QUESTIONS],
    tone: "bienveillant",
    duration: 15,
    autoScreen: false,
  });
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [newQuestion, setNewQuestion] = useState("");
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) loadProject(user.id);
      else setLoading(false);
    });
  }, [supabase]);

  async function loadProject(userId: string) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name")
      .eq("user_id", userId)
      .eq("is_published", true)
      .limit(1);

    if (projects && projects.length > 0) {
      setUserProject(projects[0]);
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!userProject) return;
    setSaving(true);

    // Sauvegarde simulée (à connecter au backend)
    await new Promise((r) => setTimeout(r, 800));

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function addQuestion() {
    if (!newQuestion.trim()) return;
    setConfig((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion.trim()],
    }));
    setNewQuestion("");
  }

  function removeQuestion(index: number) {
    setConfig((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  }

  function updateQuestion(index: number, value: string) {
    setConfig((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? value : q)),
    }));
    setEditingQuestion(null);
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
            Connectez-vous pour configurer l&apos;interview IA de votre projet.
          </p>
          <AuthButton onAuthChange={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  if (!userProject) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-amber-50 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Projet requis</h1>
          <p className="text-sm text-[var(--muted)] mb-6">
            Vous devez d&apos;abord créer et publier un projet d&apos;habitat pour pouvoir configurer l&apos;interview IA des candidats.
          </p>
          <a
            href="/creer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white text-sm font-medium rounded-xl hover:bg-[var(--primary-hover)] transition-colors"
          >
            Créer un habitat
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Interview IA</h1>
          <p className="text-sm text-[var(--muted)] max-w-md mx-auto leading-relaxed">
            Configurez un agent IA qui mènera automatiquement un entretien avec les candidats qui postulent à votre projet <strong>{userProject.name}</strong>.
          </p>
        </div>

        {/* Activation */}
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Activer l&apos;interview IA</h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Les candidats passeront un entretien automatique après leur candidature
              </p>
            </div>
            <button
              onClick={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                config.enabled ? "bg-[var(--primary)]" : "bg-[var(--input-border)]"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  config.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {config.enabled && (
          <>
            {/* Ton de l'interview */}
            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-5 mb-4">
              <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">Ton de l&apos;entretien</h2>
              <div className="grid grid-cols-3 gap-2">
                {TONE_OPTIONS.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setConfig((prev) => ({ ...prev, tone: tone.id }))}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      config.tone === tone.id
                        ? "border-[var(--primary)] bg-[var(--primary)]/5"
                        : "border-[var(--border-light)] hover:border-[var(--border-color)]"
                    }`}
                  >
                    <p className={`text-sm font-medium ${config.tone === tone.id ? "text-[var(--primary)]" : "text-[var(--foreground)]"}`}>
                      {tone.label}
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{tone.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Durée estimée */}
            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-5 mb-4">
              <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">Durée estimée de l&apos;entretien</h2>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={5}
                  value={config.duration}
                  onChange={(e) => setConfig((prev) => ({ ...prev, duration: Number(e.target.value) }))}
                  className="flex-1 accent-[var(--primary)]"
                />
                <span className="text-sm font-medium text-[var(--foreground)] w-16 text-right">
                  {config.duration} min
                </span>
              </div>
            </div>

            {/* Questions */}
            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] overflow-hidden mb-4">
              <div className="px-5 py-4 border-b border-[var(--border-light)] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--foreground)]">
                  Questions de l&apos;entretien ({config.questions.length})
                </h2>
              </div>
              <div className="divide-y divide-[var(--border-light)]">
                {config.questions.map((q, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3 group">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--surface)] text-[var(--muted)] text-xs flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    {editingQuestion === i ? (
                      <input
                        autoFocus
                        defaultValue={q}
                        onBlur={(e) => updateQuestion(i, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") updateQuestion(i, e.currentTarget.value);
                          if (e.key === "Escape") setEditingQuestion(null);
                        }}
                        className="flex-1 text-sm text-[var(--foreground)] bg-[var(--surface)] px-3 py-1.5 rounded-lg border border-[var(--input-border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                      />
                    ) : (
                      <p
                        className="flex-1 text-sm text-[var(--foreground)] cursor-pointer hover:text-[var(--primary)] transition-colors"
                        onClick={() => setEditingQuestion(i)}
                      >
                        {q}
                      </p>
                    )}
                    <button
                      onClick={() => removeQuestion(i)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 text-[var(--muted)] hover:text-red-500 transition-all p-1"
                      title="Supprimer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              {/* Ajouter une question */}
              <div className="px-5 py-3 border-t border-[var(--border-light)]">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addQuestion()}
                    placeholder="Ajouter une question..."
                    className="flex-1 text-sm bg-[var(--surface)] px-3 py-2 rounded-lg border border-[var(--border-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 placeholder:text-[var(--muted-light)]"
                  />
                  <button
                    onClick={addQuestion}
                    disabled={!newQuestion.trim()}
                    className="shrink-0 px-3 py-2 bg-[var(--primary)] text-white text-sm rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-30"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>

            {/* Pré-filtrage automatique */}
            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-5 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--foreground)]">Pré-filtrage automatique</h2>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    L&apos;IA génère un score de compatibilité et vous recommande les meilleurs profils
                  </p>
                </div>
                <button
                  onClick={() => setConfig((prev) => ({ ...prev, autoScreen: !prev.autoScreen }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    config.autoScreen ? "bg-[var(--primary)]" : "bg-[var(--input-border)]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      config.autoScreen ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Bouton sauvegarder */}
        <div className="text-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white text-sm font-medium rounded-xl hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enregistrement...
              </>
            ) : saved ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Enregistré !
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                </svg>
                Enregistrer la configuration
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
