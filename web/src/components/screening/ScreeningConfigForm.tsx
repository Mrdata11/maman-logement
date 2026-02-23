"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Save,
} from "lucide-react";
import Link from "next/link";
import type { ScreeningQuestion, ScreeningConfig } from "@/lib/screening/types";
import { DEFAULT_SCREENING_QUESTIONS } from "@/lib/screening/types";

interface ScreeningConfigFormProps {
  configId?: string;
}

type Step = "info" | "questions" | "voice";

let nextQuestionId = 100;
function generateId() {
  return `q_${Date.now()}_${nextQuestionId++}`;
}

export function ScreeningConfigForm({ configId }: ScreeningConfigFormProps) {
  const router = useRouter();
  const isEditing = !!configId;

  const [step, setStep] = useState<Step>("info");
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<ScreeningQuestion[]>(
    DEFAULT_SCREENING_QUESTIONS
  );
  const [voiceId, setVoiceId] = useState("cgSgspJ2msm6clMCkdW9");
  const [language, setLanguage] = useState("fr");

  const fetchConfig = useCallback(async () => {
    if (!configId) return;
    try {
      const res = await fetch(`/api/screening/configs/${configId}`);
      if (res.ok) {
        const data = await res.json();
        const config: ScreeningConfig = data.config;
        setTitle(config.title);
        setDescription(config.description || "");
        setQuestions(config.questions);
        setVoiceId(config.voice_id);
        setLanguage(config.language);
      } else {
        setError("Configuration introuvable.");
      }
    } catch {
      setError("Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, [configId]);

  useEffect(() => {
    if (isEditing) fetchConfig();
  }, [isEditing, fetchConfig]);

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= questions.length) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[newIndex]] = [
      newQuestions[newIndex],
      newQuestions[index],
    ];
    setQuestions(newQuestions.map((q, i) => ({ ...q, order: i })));
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: generateId(),
        text: "",
        required: true,
        order: questions.length,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(
      questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i }))
    );
  };

  const updateQuestion = (
    index: number,
    updates: Partial<ScreeningQuestion>
  ) => {
    setQuestions(
      questions.map((q, i) => (i === index ? { ...q, ...updates } : q))
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Le titre est requis.");
      setStep("info");
      return;
    }
    if (questions.some((q) => !q.text.trim())) {
      setError("Toutes les questions doivent avoir un texte.");
      setStep("questions");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      questions,
      voice_id: voiceId,
      language,
    };

    try {
      const url = isEditing
        ? `/api/screening/configs/${configId}`
        : "/api/screening/configs";
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/screening");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Erreur lors de la sauvegarde.");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  const steps: { key: Step; label: string }[] = [
    { key: "info", label: "Informations" },
    { key: "questions", label: "Questions" },
    { key: "voice", label: "Voix & Langue" },
  ];

  return (
    <div>
      <Link
        href="/screening"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Retour au dashboard
      </Link>

      <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-6">
        {isEditing ? "Modifier la configuration" : "Nouvelle configuration"}
      </h1>

      {/* Indicateur d'étapes */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setStep(s.key)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              step === s.key
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
              {i + 1}
            </span>
            {s.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6" style={{ boxShadow: "var(--card-shadow)" }}>
        {/* Étape 1: Informations */}
        {step === "info" && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Titre du screening
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Habitat groupé Les Oliviers - Sélection 2026"
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Description (optionnel)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contexte du screening pour vos notes internes..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] resize-none"
              />
            </div>
          </div>
        )}

        {/* Étape 2: Questions */}
        {step === "questions" && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--muted)] mb-4">
              Définissez les questions que l&apos;IA posera aux candidats. Vous
              pouvez réordonner, ajouter ou supprimer des questions.
            </p>

            {questions.map((question, index) => (
              <div
                key={question.id}
                className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--surface)]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 mt-2">
                    <GripVertical
                      size={16}
                      className="text-[var(--muted-light)]"
                    />
                    <button
                      onClick={() => moveQuestion(index, -1)}
                      disabled={index === 0}
                      className="p-0.5 text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-30 transition-colors"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => moveQuestion(index, 1)}
                      disabled={index === questions.length - 1}
                      className="p-0.5 text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-30 transition-colors"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                        Question {index + 1}
                      </label>
                      <input
                        type="text"
                        value={question.text}
                        onChange={(e) =>
                          updateQuestion(index, { text: e.target.value })
                        }
                        placeholder="Tapez votre question ici..."
                        className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                        Instruction de relance (optionnel)
                      </label>
                      <input
                        type="text"
                        value={question.followUp || ""}
                        onChange={(e) =>
                          updateQuestion(index, {
                            followUp: e.target.value || undefined,
                          })
                        }
                        placeholder="Ex: Si la réponse est vague, demande des précisions..."
                        className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) =>
                          updateQuestion(index, {
                            required: e.target.checked,
                          })
                        }
                        className="rounded border-[var(--input-border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                      />
                      Obligatoire
                    </label>
                  </div>

                  <button
                    onClick={() => removeQuestion(index)}
                    disabled={questions.length <= 1}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={addQuestion}
              className="w-full py-2.5 border-2 border-dashed border-[var(--border-color)] rounded-lg text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--primary)] transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Ajouter une question
            </button>
          </div>
        )}

        {/* Étape 3: Voix & Langue */}
        {step === "voice" && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Langue de l&apos;entretien
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
                <option value="nl">Nederlands</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                ID de la voix ElevenLabs
              </label>
              <input
                type="text"
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                placeholder="ID de la voix ElevenLabs"
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
              />
              <p className="text-xs text-[var(--muted)] mt-1">
                Laissez la valeur par défaut ou collez l&apos;ID d&apos;une voix
                depuis votre bibliothèque ElevenLabs.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation entre étapes + sauvegarde */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => {
            const idx = steps.findIndex((s) => s.key === step);
            if (idx > 0) setStep(steps[idx - 1].key);
          }}
          disabled={step === "info"}
          className="px-4 py-2.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-30 transition-colors"
        >
          Précédent
        </button>

        <div className="flex items-center gap-3">
          {step !== "voice" ? (
            <button
              onClick={() => {
                const idx = steps.findIndex((s) => s.key === step);
                if (idx < steps.length - 1) setStep(steps[idx + 1].key);
              }}
              className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium"
            >
              Suivant
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium disabled:opacity-50"
            >
              <Save size={16} />
              {saving
                ? "Sauvegarde..."
                : isEditing
                  ? "Mettre à jour"
                  : "Créer la configuration"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
