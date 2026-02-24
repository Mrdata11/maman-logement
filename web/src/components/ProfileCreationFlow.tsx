"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/profile-types";
import {
  ProfileIntroduction,
  EMPTY_INTRODUCTION,
  PROFILE_VOICE_QUESTIONS,
  deriveProfileCardData,
  getIntroAudioUrl,
  getIntroText,
} from "@/lib/profile-types";
import {
  QuestionnaireState,
  QuestionnaireAnswers,
  QUESTIONNAIRE_STORAGE_KEY,
} from "@/lib/questionnaire-types";
import { QUESTIONNAIRE_STEPS } from "@/lib/questionnaire-data";
import { ProfileVoiceIntro, AudioBlobMap } from "./ProfileVoiceIntro";
import { AuthButton } from "./AuthButton";

type Step = "questionnaire" | "introduction" | "preview";

interface ProfileCreationFlowProps {
  existingProfile?: Profile;
}

export function ProfileCreationFlow({ existingProfile }: ProfileCreationFlowProps) {
  const isEditing = !!existingProfile;

  const [step, setStep] = useState<Step>(
    isEditing ? "preview" : "questionnaire"
  );
  const [questionnaireAnswers, setQuestionnaireAnswers] =
    useState<QuestionnaireAnswers>(
      isEditing ? existingProfile.questionnaire_answers : {}
    );
  const [questionnaireCompleted, setQuestionnaireCompleted] = useState(
    isEditing
      ? Object.keys(existingProfile.questionnaire_answers).length > 0
      : false
  );
  const [introduction, setIntroduction] = useState<ProfileIntroduction>(
    isEditing ? existingProfile.introduction : EMPTY_INTRODUCTION
  );
  const [displayName, setDisplayName] = useState(
    isEditing ? existingProfile.display_name : ""
  );
  const [location, setLocation] = useState(
    isEditing ? existingProfile.location || "" : ""
  );
  const [contactEmail, setContactEmail] = useState(
    isEditing ? existingProfile.contact_email : ""
  );
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    isEditing ? existingProfile.avatar_url : null
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [photos, setPhotos] = useState<string[]>(
    isEditing ? existingProfile.photos : []
  );
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [draggingPhotos, setDraggingPhotos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [audioBlobs, setAudioBlobs] = useState<AudioBlobMap>({});

  const supabase = createClient();

  const steps: { id: Step; label: string }[] = [
    { id: "questionnaire", label: "Questionnaire" },
    { id: "introduction", label: "Présentation" },
    { id: "preview", label: "Aperçu & publication" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  // Load questionnaire from localStorage (only when creating, not editing)
  useEffect(() => {
    if (isEditing) return;
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
  }, [isEditing]);

  // Pre-fill fields from auth user (only when creating)
  useEffect(() => {
    if (user && !isEditing) {
      if (!displayName)
        setDisplayName(user.user_metadata?.full_name || "");
      if (!contactEmail) setContactEmail(user.email || "");
      if (!avatarUrl && user.user_metadata?.avatar_url)
        setAvatarUrl(user.user_metadata.avatar_url);
    }
  }, [user, isEditing]);

  const handleIntroComplete = useCallback(
    (intro: ProfileIntroduction, blobs: AudioBlobMap) => {
      setIntroduction(intro);
      setAudioBlobs(blobs);
      setStep("preview");
    },
    []
  );


  const handlePublish = useCallback(async () => {
    if (!user) return;
    setPublishing(true);
    setError(null);

    try {
      // Upload audio blobs that haven't been uploaded yet
      let finalIntro = { ...introduction };
      for (const [questionId, blob] of Object.entries(audioBlobs)) {
        const formData = new FormData();
        formData.append("audio", blob, `recording.${blob.type.includes("mp4") ? "m4a" : "webm"}`);
        formData.append("questionId", questionId);
        formData.append("duration", String(
          (finalIntro[questionId as keyof ProfileIntroduction] as { duration_seconds?: number })?.duration_seconds || 0
        ));

        const res = await fetch("/api/profiles/upload-intro-audio", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          finalIntro = { ...finalIntro, [questionId]: data };
        }
      }

      const { error: dbError } = await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          display_name: displayName.trim() || "Anonyme",
          avatar_url: avatarUrl || user.user_metadata?.avatar_url || null,
          location: location.trim() || null,
          contact_email: contactEmail.trim() || user.email,
          questionnaire_answers: questionnaireAnswers,
          introduction: finalIntro,
          photos,
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
    audioBlobs,
    photos,
    avatarUrl,
  ]);

  const handleAvatarUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return;
      if (file.size > 5 * 1024 * 1024) {
        setError("L'image doit faire moins de 5 Mo.");
        return;
      }

      setUploadingAvatar(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");

      try {
        const res = await fetch("/api/profiles/upload-photo", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          setError(`Erreur d'upload : ${data.error || "Erreur inconnue"}`);
          setUploadingAvatar(false);
          e.target.value = "";
          return;
        }

        const { publicUrl } = await res.json();
        if (publicUrl) setAvatarUrl(publicUrl);
      } catch {
        setError("Erreur d'upload : erreur réseau");
      }

      setUploadingAvatar(false);
      e.target.value = "";
    },
    []
  );

  const uploadPhotoFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setUploadingPhotos(true);
      setError(null);
      const newUrls: string[] = [];

      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) {
          setError("Les images doivent faire moins de 5 Mo.");
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch("/api/profiles/upload-photo", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const data = await res.json();
            setError(`Erreur d'upload : ${data.error || "Erreur inconnue"}`);
            continue;
          }

          const { publicUrl } = await res.json();
          if (publicUrl) newUrls.push(publicUrl);
        } catch {
          setError("Erreur d'upload : erreur réseau");
        }
      }

      if (newUrls.length > 0) {
        setPhotos((prev) => [...prev, ...newUrls].slice(0, 5));
      }
      setUploadingPhotos(false);
    },
    []
  );

  const handlePhotoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      await uploadPhotoFiles(Array.from(files));
      e.target.value = "";
    },
    [uploadPhotoFiles]
  );

  const handlePhotoDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDraggingPhotos(false);
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      uploadPhotoFiles(files);
    },
    [uploadPhotoFiles]
  );

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAuthChange = useCallback(
    (newUser: User | null) => {
      setUser(newUser);
      if (newUser && !isEditing) {
        if (!displayName)
          setDisplayName(newUser.user_metadata?.full_name || "");
        if (!contactEmail) setContactEmail(newUser.email || "");
        if (!avatarUrl && newUser.user_metadata?.avatar_url)
          setAvatarUrl(newUser.user_metadata.avatar_url);
      }
    },
    [displayName, contactEmail, avatarUrl, isEditing]
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

  // Auth gate: require login before starting
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) setUser(u);
      setAuthLoading(false);
    });
  }, [supabase]);

  if (authLoading) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center gap-1.5 mb-3">
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
        <p className="text-sm text-[var(--muted)]">Chargement...</p>
      </div>
    );
  }

  if (!user && !isEditing) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
            Cr&eacute;er mon profil
          </h1>
          <p className="text-[var(--muted)]">
            Connecte-toi pour cr&eacute;er et g&eacute;rer ton profil.
          </p>
        </div>
        <div className="max-w-xs mx-auto">
          <AuthButton onAuthChange={handleAuthChange} redirectTo="/profils/creer" />
        </div>
      </div>
    );
  }

  if (published) {
    return (
      <div className="max-w-lg mx-auto py-12 space-y-8">
        {/* Animated success icon */}
        <div className="flex justify-center">
          <div className="relative success-icon-container" style={{ opacity: 0 }}>
            {/* Expanding ring */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-24 h-24 rounded-full border-2 border-[var(--primary)] success-ring"
                style={{ opacity: 0 }}
              />
            </div>
            {/* Sparkles */}
            <span className="success-sparkle" style={{ opacity: 0 }} />
            <span className="success-sparkle" style={{ opacity: 0 }} />
            <span className="success-sparkle" style={{ opacity: 0 }} />
            <span className="success-sparkle" style={{ opacity: 0 }} />
            <span className="success-sparkle" style={{ opacity: 0 }} />
            <span className="success-sparkle" style={{ opacity: 0 }} />
            {/* Main circle + check */}
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
            {isEditing ? "Ton profil a été mis à jour !" : "Ton profil est en ligne !"}
          </h2>
          <p className="text-[var(--muted)] success-text-2">
            {isEditing
              ? "Les modifications sont visibles immédiatement."
              : "Bienvenue dans la communauté. Les porteurs de projets peuvent maintenant te découvrir."}
          </p>
        </div>

        {/* Primary CTA */}
        <div className="success-text-3">
          <a
            href="/profils/mon-profil"
            className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-[var(--primary)] text-white rounded-xl text-sm font-bold hover:bg-[var(--primary-hover)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Voir mon profil
          </a>
        </div>

        {/* Next steps */}
        {!isEditing && (
          <div className="success-text-4 bg-[var(--surface)] rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Et maintenant ?
            </h3>
            <div className="space-y-3">
              <a
                href="/habitats"
                className="flex items-center gap-3 p-3 bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] hover:border-[var(--primary)] hover:shadow-sm transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--primary)]/15 transition-colors">
                  <svg className="w-4.5 h-4.5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)]">Explorer les habitats</p>
                  <p className="text-xs text-[var(--muted)]">D&eacute;couvre les lieux et communaut&eacute;s qui recrutent</p>
                </div>
                <svg className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>

              <a
                href="/profils"
                className="flex items-center gap-3 p-3 bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] hover:border-[var(--primary)] hover:shadow-sm transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-[var(--golden)]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--golden)]/15 transition-colors">
                  <svg className="w-4.5 h-4.5 text-[var(--golden)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)]">Voir les autres profils</p>
                  <p className="text-xs text-[var(--muted)]">Rencontre les membres de la communaut&eacute;</p>
                </div>
                <svg className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        )}

        {/* Tip */}
        {!isEditing && (
          <p className="text-center text-xs text-[var(--muted)] success-text-5">
            Tu peux modifier ton profil &agrave; tout moment depuis &laquo;&nbsp;Mon profil&nbsp;&raquo;.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step progress — minimal pill stepper */}
      <div className="flex items-center justify-center gap-1 mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                i < currentStepIndex
                  ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                  : i === currentStepIndex
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-[var(--muted)]"
              }`}
            >
              {i < currentStepIndex ? (
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <span>{i + 1}</span>
              )}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-4 sm:w-6 h-px mx-0.5 transition-colors duration-300 ${
                  i < currentStepIndex
                    ? "bg-[var(--primary)]/30"
                    : "bg-[var(--border-color)]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-[var(--card-shadow)] p-6 sm:p-8">
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
                    href="/questionnaire?returnTo=/profils/creer"
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
          <div>
            <ProfileVoiceIntro
              initialIntroduction={introduction}
              initialBlobs={audioBlobs}
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

            {/* Photo de profil */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--foreground)]">
                Photo de profil
              </label>
              <div className="flex items-center gap-4">
                {avatarUrl ? (
                  <div className="relative group">
                    <img
                      src={avatarUrl}
                      alt="Photo de profil"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <button
                      onClick={() => setAvatarUrl(null)}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[var(--surface)] flex items-center justify-center">
                    <svg className="w-8 h-8 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                <label className="cursor-pointer px-4 py-2 border border-[var(--border-color)] rounded-xl text-sm text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                  {uploadingAvatar ? "Upload..." : avatarUrl ? "Changer" : "Ajouter une photo"}
                </label>
              </div>
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
                  placeholder="Ton prénom ou pseudo"
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
                  placeholder="Ville ou région"
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
                Moi en 5 images
              </label>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Pas forc&eacute;ment des photos de toi &mdash; montre ce qui compte : un lieu qui t&apos;inspire, ton animal, un projet, un coucher de soleil... Les profils avec photos re&ccedil;oivent beaucoup plus de visites.
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

              {photos.length < 5 && (
                <label
                  className={`flex flex-col items-center justify-center gap-3 px-6 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                    draggingPhotos
                      ? "border-[var(--primary)] bg-[var(--primary)]/10"
                      : "border-[var(--border-color)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDraggingPhotos(true);
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDraggingPhotos(true);
                  }}
                  onDragLeave={() => setDraggingPhotos(false)}
                  onDrop={handlePhotoDrop}
                >
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
                  ) : draggingPhotos ? (
                    <>
                      <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      <span className="text-sm font-medium text-[var(--primary)]">
                        Lâche ici !
                      </span>
                    </>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-[var(--foreground)]">
                        Glisse tes photos ici
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        ou clique pour parcourir
                      </span>
                    </>
                  )}
                </label>
              )}
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
                onClick={handlePublish}
                disabled={publishing}
                className="flex-1 px-5 py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-bold hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                    {isEditing ? "Mise à jour..." : "Publication..."}
                  </>
                ) : (
                  isEditing ? "Mettre à jour" : "Publier mon profil"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
