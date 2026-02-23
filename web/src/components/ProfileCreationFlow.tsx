"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  ProfileIntroduction,
  EMPTY_INTRODUCTION,
  PROFILE_VOICE_QUESTIONS,
  deriveProfileCardData,
} from "@/lib/profile-types";
import {
  QuestionnaireState,
  QuestionnaireAnswers,
  QUESTIONNAIRE_STORAGE_KEY,
} from "@/lib/questionnaire-types";
import { QUESTIONNAIRE_STEPS } from "@/lib/questionnaire-data";
import { ProfileVoiceIntro } from "./ProfileVoiceIntro";
import { AuthButton } from "./AuthButton";

type Step = "questionnaire" | "introduction" | "preview" | "publish";

export function ProfileCreationFlow() {
  const [step, setStep] = useState<Step>("questionnaire");
  const [questionnaireAnswers, setQuestionnaireAnswers] =
    useState<QuestionnaireAnswers>({});
  const [questionnaireCompleted, setQuestionnaireCompleted] = useState(false);
  const [introduction, setIntroduction] =
    useState<ProfileIntroduction>(EMPTY_INTRODUCTION);
  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const supabase = createClient();

  const steps: { id: Step; label: string }[] = [
    { id: "questionnaire", label: "Questionnaire" },
    { id: "introduction", label: "Pr\u00e9sentation" },
    { id: "preview", label: "Aper\u00e7u" },
    { id: "publish", label: "Publication" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  // Load questionnaire from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(QUESTIONNAIRE_STORAGE_KEY);
      if (saved) {
        const state: QuestionnaireState = JSON.parse(saved);
        if (state.completedAt) {
          setQuestionnaireAnswers(state.answers);
          setQuestionnaireCompleted(true);
        }
      }
    } catch {}
  }, []);

  // Check auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        if (!displayName)
          setDisplayName(user.user_metadata?.full_name || "");
        if (!contactEmail) setContactEmail(user.email || "");
      }
    });
  }, [supabase]);

  const handleIntroComplete = useCallback(
    (intro: ProfileIntroduction) => {
      setIntroduction(intro);
      setStep("preview");
    },
    []
  );

  const generateSummary = useCallback(async () => {
    setGeneratingSummary(true);
    setError(null);
    try {
      const res = await fetch("/api/profiles/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionnaireAnswers,
          introduction,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.summary);
        setAiTags(data.tags);
      } else {
        setError("Impossible de g\u00e9n\u00e9rer le r\u00e9sum\u00e9. Tu peux continuer sans.");
      }
    } catch {
      setError("Erreur r\u00e9seau. Tu peux continuer sans r\u00e9sum\u00e9.");
    }
    setGeneratingSummary(false);
  }, [questionnaireAnswers, introduction]);

  // Auto-generate summary when reaching preview
  useEffect(() => {
    if (step === "preview" && !aiSummary && !generatingSummary) {
      generateSummary();
    }
  }, [step, aiSummary, generatingSummary, generateSummary]);

  const handlePublish = useCallback(async () => {
    if (!user) return;
    setPublishing(true);
    setError(null);

    try {
      const { error: dbError } = await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          display_name: displayName.trim() || "Anonyme",
          avatar_url: user.user_metadata?.avatar_url || null,
          location: location.trim() || null,
          contact_email: contactEmail.trim() || user.email,
          questionnaire_answers: questionnaireAnswers,
          introduction,
          photos,
          ai_summary: aiSummary,
          ai_tags: aiTags,
          is_published: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (dbError) {
        setError(`Erreur lors de la publication : ${dbError.message}`);
      } else {
        setPublished(true);
      }
    } catch (err) {
      setError(
        `Erreur : ${err instanceof Error ? err.message : "Erreur inconnue"}`
      );
    }
    setPublishing(false);
  }, [
    user,
    supabase,
    displayName,
    location,
    contactEmail,
    questionnaireAnswers,
    introduction,
    photos,
    aiSummary,
    aiTags,
  ]);

  const handlePhotoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setUploadingPhotos(true);
      setError(null);
      const newUrls: string[] = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) {
          setError("Les images doivent faire moins de 5 Mo.");
          continue;
        }

        const ext = file.name.split(".").pop() || "jpg";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(path, file, { contentType: file.type });

        if (uploadError) {
          setError(`Erreur d'upload : ${uploadError.message}`);
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("profile-photos").getPublicUrl(path);

        if (publicUrl) newUrls.push(publicUrl);
      }

      if (newUrls.length > 0) {
        setPhotos((prev) => [...prev, ...newUrls].slice(0, 6));
      }
      setUploadingPhotos(false);
      e.target.value = "";
    },
    [supabase]
  );

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAuthChange = useCallback(
    (newUser: User | null) => {
      setUser(newUser);
      if (newUser) {
        if (!displayName)
          setDisplayName(newUser.user_metadata?.full_name || "");
        if (!contactEmail) setContactEmail(newUser.email || "");
      }
    },
    [displayName, contactEmail]
  );

  // Derive questionnaire display data
  const questionnaireDisplay = deriveProfileCardData(questionnaireAnswers);

  // Format questionnaire answers for display
  const formatAnswerDisplay = (
    questionId: string,
    value: string | string[] | number
  ): string => {
    for (const step of QUESTIONNAIRE_STEPS) {
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
  };

  if (published) {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            Ton profil est publi&eacute; !
          </h2>
          <p className="text-[var(--muted)] mt-2">
            Les porteurs de projets peuvent maintenant te d&eacute;couvrir et te contacter.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <a
            href="/profils"
            className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
          >
            Voir les profils
          </a>
          <a
            href="/profils/mon-profil"
            className="px-5 py-2.5 border border-[var(--border-color)] text-[var(--foreground)] rounded-xl text-sm font-medium hover:bg-[var(--surface)] transition-colors"
          >
            Mon profil
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step progress */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i < currentStepIndex
                  ? "bg-[var(--primary)] text-white"
                  : i === currentStepIndex
                    ? "bg-[var(--primary)] text-white ring-4 ring-[var(--primary)]/20"
                    : "bg-[var(--surface)] text-[var(--muted)]"
              }`}
            >
              {i < currentStepIndex ? (
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`ml-2 text-sm hidden sm:inline ${
                i === currentStepIndex
                  ? "font-medium text-[var(--foreground)]"
                  : "text-[var(--muted)]"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`w-8 sm:w-16 h-0.5 mx-2 ${
                  i < currentStepIndex
                    ? "bg-[var(--primary)]"
                    : "bg-[var(--border-color)]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8">
        {/* STEP 1: Questionnaire check */}
        {step === "questionnaire" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                Ton questionnaire
              </h2>
              <p className="text-sm text-[var(--muted)] mt-2">
                Les r&eacute;ponses au questionnaire servent de base &agrave; ton profil.
              </p>
            </div>

            {questionnaireCompleted ? (
              <>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg
                      className="w-5 h-5 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-semibold text-emerald-800">
                      Questionnaire compl&eacute;t&eacute; !
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {questionnaireDisplay.budget_range && (
                      <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                        {questionnaireDisplay.budget_range}
                      </span>
                    )}
                    {questionnaireDisplay.preferred_regions.map((r, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full"
                      >
                        {r}
                      </span>
                    ))}
                    {questionnaireDisplay.community_size && (
                      <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                        {questionnaireDisplay.community_size}
                      </span>
                    )}
                    {questionnaireDisplay.core_values.map((v, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setStep("introduction")}
                  className="w-full px-5 py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Continuer vers la pr&eacute;sentation
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-800">
                    Pour cr&eacute;er ton profil, commence par remplir le questionnaire.
                    Tes r&eacute;ponses serviront de base.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="/questionnaire"
                    className="flex-1 px-5 py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors text-center"
                  >
                    Remplir le questionnaire
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Voice introduction */}
        {step === "introduction" && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                Pr&eacute;sente-toi
              </h2>
              <p className="text-sm text-[var(--muted)] mt-1">
                R&eacute;ponds &agrave; quelques questions pour que les gens apprennent &agrave; te conna&icirc;tre.
              </p>
            </div>
            <ProfileVoiceIntro
              initialIntroduction={introduction}
              onComplete={handleIntroComplete}
              onBack={() => setStep("questionnaire")}
            />
          </div>
        )}

        {/* STEP 3: Preview */}
        {step === "preview" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                Aper&ccedil;u de ton profil
              </h2>
              <p className="text-sm text-[var(--muted)] mt-1">
                V&eacute;rifie et compl&egrave;te avant de publier.
              </p>
            </div>

            {/* Editable fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Nom d&apos;affichage
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ton pr\u00e9nom ou pseudo"
                  className="w-full px-3 py-2 border border-[var(--input-border)] rounded-lg text-sm bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Localisation
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ville ou r\u00e9gion"
                  className="w-full px-3 py-2 border border-[var(--input-border)] rounded-lg text-sm bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Email de contact (affich&eacute; publiquement)
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="ton@email.com"
                  className="w-full px-3 py-2 border border-[var(--input-border)] rounded-lg text-sm bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
            </div>

            {/* Photos */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[var(--foreground)]">
                Photos (optionnel, max 6)
              </label>
              <p className="text-xs text-[var(--muted)]">
                Ajoute des photos de toi pour que les gens puissent mieux te conna&icirc;tre.
              </p>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length < 6 && (
                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-[var(--border-color)] rounded-xl cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhotos}
                  />
                  {uploadingPhotos ? (
                    <span className="text-sm text-[var(--muted)]">Upload en cours...</span>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-[var(--muted)]">
                        Ajouter des photos
                      </span>
                    </>
                  )}
                </label>
              )}
            </div>

            {/* AI Summary */}
            {generatingSummary ? (
              <div className="text-center py-4 space-y-2">
                <div className="flex justify-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2.5 h-2.5 bg-[var(--primary)] rounded-full"
                      style={{
                        animation: `recording-pulse 1s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-sm text-[var(--muted)]">
                  G&eacute;n&eacute;ration du r&eacute;sum&eacute;...
                </p>
              </div>
            ) : (
              aiSummary && (
                <div className="bg-[var(--surface)] rounded-xl p-4 space-y-2">
                  <p className="text-xs font-medium text-[var(--muted)]">
                    R&eacute;sum&eacute; g&eacute;n&eacute;r&eacute; par l&apos;IA
                  </p>
                  <p className="text-sm text-[var(--foreground)] italic leading-relaxed">
                    &laquo; {aiSummary} &raquo;
                  </p>
                  {aiTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {aiTags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={generateSummary}
                    className="text-xs text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                  >
                    Reg&eacute;n&eacute;rer le r&eacute;sum&eacute;
                  </button>
                </div>
              )
            )}

            {/* Introduction preview */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-[var(--foreground)]">
                Ta pr&eacute;sentation
              </p>
              {PROFILE_VOICE_QUESTIONS.map((q) => {
                const answer = introduction[q.id];
                if (!answer) return null;
                return (
                  <div key={q.id} className="bg-[var(--surface)] rounded-lg p-3">
                    <p className="text-xs font-medium text-[var(--muted)] mb-1">
                      {q.question}
                    </p>
                    <p className="text-sm text-[var(--foreground)] leading-relaxed">
                      {answer}
                    </p>
                  </div>
                );
              })}
              <button
                onClick={() => setStep("introduction")}
                className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
              >
                Modifier les r&eacute;ponses
              </button>
            </div>

            {/* Questionnaire summary */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-[var(--foreground)]">
                Ce que tu recherches
              </p>
              <div className="flex flex-wrap gap-1.5">
                {questionnaireDisplay.budget_range && (
                  <span className="text-xs px-2 py-0.5 bg-[var(--surface)] text-[var(--muted)] rounded-full">
                    {questionnaireDisplay.budget_range}
                  </span>
                )}
                {questionnaireDisplay.preferred_regions.map((r, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 bg-[var(--surface)] text-[var(--muted)] rounded-full"
                  >
                    {r}
                  </span>
                ))}
                {questionnaireDisplay.community_size && (
                  <span className="text-xs px-2 py-0.5 bg-[var(--surface)] text-[var(--muted)] rounded-full">
                    {questionnaireDisplay.community_size}
                  </span>
                )}
                {questionnaireDisplay.core_values.map((v, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 bg-[var(--surface)] text-[var(--muted)] rounded-full"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("introduction")}
                className="px-5 py-2.5 border border-[var(--border-color)] text-[var(--foreground)] rounded-xl text-sm font-medium hover:bg-[var(--surface)] transition-colors"
              >
                Retour
              </button>
              <button
                onClick={() => setStep("publish")}
                className="flex-1 px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Auth + Publish */}
        {step === "publish" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                Publier ton profil
              </h2>
              <p className="text-sm text-[var(--muted)] mt-1">
                Connecte-toi pour publier et g&eacute;rer ton profil.
              </p>
            </div>

            {!user ? (
              <div className="space-y-4">
                <div className="bg-[var(--surface)] rounded-xl p-4">
                  <p className="text-sm text-[var(--foreground)] leading-relaxed">
                    La connexion Google permet de :
                  </p>
                  <ul className="text-sm text-[var(--muted)] mt-2 space-y-1">
                    <li className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-[var(--primary)] mt-0.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Publier ton profil
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-[var(--primary)] mt-0.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Modifier ou supprimer ton profil plus tard
                    </li>
                  </ul>
                </div>
                <AuthButton
                  onAuthChange={handleAuthChange}
                  className="w-full justify-center"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                  {user.user_metadata?.avatar_url && (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium text-emerald-800">
                      Connect&eacute;(e) en tant que{" "}
                      {user.user_metadata?.full_name || user.email}
                    </p>
                    <p className="text-xs text-emerald-600">
                      Pr&ecirc;t(e) &agrave; publier
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="w-full px-5 py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-bold hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {publishing ? (
                    <>
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 bg-white rounded-full"
                            style={{
                              animation: `recording-pulse 1s ease-in-out ${i * 0.2}s infinite`,
                            }}
                          />
                        ))}
                      </div>
                      Publication en cours...
                    </>
                  ) : (
                    "Publier mon profil"
                  )}
                </button>
              </div>
            )}

            <button
              onClick={() => setStep("preview")}
              className="w-full text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              &larr; Retour &agrave; l&apos;aper&ccedil;u
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
