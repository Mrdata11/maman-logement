"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  ProfileIntroduction,
  PROFILE_VOICE_QUESTIONS,
  EMPTY_INTRODUCTION,
  isIntroAnswer,
  getIntroAudioUrl,
} from "@/lib/profile-types";

export type AudioBlobMap = Record<string, Blob>;

interface ProfileVoiceIntroProps {
  initialIntroduction?: ProfileIntroduction;
  initialBlobs?: AudioBlobMap;
  onComplete: (introduction: ProfileIntroduction, audioBlobs: AudioBlobMap) => void;
  onBack: () => void;
}

type QuestionPhase = "ready" | "recording" | "review" | "done";

export function ProfileVoiceIntro({
  initialIntroduction,
  initialBlobs,
  onComplete,
  onBack,
}: ProfileVoiceIntroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [introduction, setIntroduction] = useState<ProfileIntroduction>(
    initialIntroduction || EMPTY_INTRODUCTION
  );
  const [phase, setPhase] = useState<QuestionPhase>("ready");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);

  // Refs for MediaRecorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const mimeTypeRef = useRef<string>("");

  // Accumulated audio blobs (keyed by question id)
  const allBlobsRef = useRef<AudioBlobMap>(initialBlobs || {});

  // Timer refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQuestion = PROFILE_VOICE_QUESTIONS[currentIndex];
  const currentAnswer = introduction[currentQuestion.id];
  const currentAudioUrl = getIntroAudioUrl(currentAnswer);
  const totalQuestions = PROFILE_VOICE_QUESTIONS.length;

  // Init phase based on existing answer
  useEffect(() => {
    if (isIntroAnswer(currentAnswer)) {
      setPhase("done");
      setAudioBlobUrl(null);
    } else {
      setPhase("ready");
      setAudioBlobUrl(null);
    }
    setSeconds(0);
    setError(null);
    audioBlobRef.current = null;
  }, [currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    };
  }, []);

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (maxTimerRef.current) { clearTimeout(maxTimerRef.current); maxTimerRef.current = null; }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setSeconds(0);
    setAudioBlobUrl(null);
    audioBlobRef.current = null;

    try {
      if (typeof MediaRecorder === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
        setError("Ton navigateur ne supporte pas l'enregistrement audio. Essaie avec Chrome, Firefox ou Safari.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Choisir un mimeType audio supporté explicitement
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : undefined;

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;
      mimeTypeRef.current = mediaRecorder.mimeType || mimeType || "audio/webm";

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        const chunks = audioChunksRef.current;
        mediaRecorderRef.current = null;

        if (chunks.length === 0) {
          setError("Aucun son détecté. Réessaie.");
          setPhase("ready");
          return;
        }

        // Créer le blob avec le type MIME sauvegardé
        const audioBlob = new Blob(chunks, { type: mimeTypeRef.current });
        audioBlobRef.current = audioBlob;
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);
        setPhase("review");
      };

      mediaRecorder.start(500);
      setPhase("recording");

      // Timer
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);

      // Max 2 minutes
      maxTimerRef.current = setTimeout(() => {
        stopRecording();
      }, 120_000);
    } catch {
      setError("Impossible d'accéder au microphone. Vérifie les permissions de ton navigateur.");
      setPhase("ready");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopRecording = useCallback(() => {
    clearTimers();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      // Forcer le flush des données avant d'arrêter
      try { mediaRecorderRef.current.requestData(); } catch {}
      mediaRecorderRef.current.stop();
    }
  }, [clearTimers]);

  const confirmRecording = useCallback(() => {
    const blob = audioBlobRef.current;
    if (!blob) return;

    // Stocker le blob localement (upload différé à la publication)
    allBlobsRef.current = { ...allBlobsRef.current, [currentQuestion.id]: blob };

    // Créer un IntroAnswer temporaire avec blob URL pour la prévisualisation
    const blobUrl = URL.createObjectURL(blob);
    const updated = {
      ...introduction,
      [currentQuestion.id]: {
        audio_url: blobUrl,
        audio_path: "",
        transcript: "",
        duration_seconds: seconds,
      },
    };
    setIntroduction(updated);

    // Passer automatiquement à la question suivante (ou terminer)
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete(updated, allBlobsRef.current);
    }
  }, [currentQuestion.id, seconds, introduction, currentIndex, totalQuestions, onComplete]);

  const reRecord = useCallback(() => {
    setAudioBlobUrl(null);
    audioBlobRef.current = null;
    setPhase("ready");
    setError(null);
  }, []);

  const saveAndNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete(introduction, allBlobsRef.current);
    }
  }, [currentIndex, totalQuestions, introduction, onComplete]);

  const skipQuestion = useCallback(() => {
    // Supprimer le blob si on passe la question
    const { [currentQuestion.id]: _, ...restBlobs } = allBlobsRef.current;
    allBlobsRef.current = restBlobs;

    const updated = { ...introduction, [currentQuestion.id]: null };
    setIntroduction(updated);

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete(updated, allBlobsRef.current);
    }
  }, [currentIndex, totalQuestions, introduction, currentQuestion.id, onComplete]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Determine which audio URL to show in done phase
  const playbackUrl = audioBlobUrl || currentAudioUrl;

  // Count answered questions
  const answeredCount = PROFILE_VOICE_QUESTIONS.filter(
    (q) => isIntroAnswer(introduction[q.id])
  ).length;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Segmented progress dots */}
      <div className="flex items-center justify-center gap-2">
        {PROFILE_VOICE_QUESTIONS.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              if (phase !== "recording" && phase !== "review") {
                setCurrentIndex(i);
              }
            }}
            disabled={phase === "recording" || phase === "review"}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex
                ? "w-8 bg-[var(--primary)]"
                : i < currentIndex || isIntroAnswer(introduction[PROFILE_VOICE_QUESTIONS[i].id])
                  ? "w-4 bg-[var(--primary)]/40"
                  : "w-4 bg-[var(--border-color)]"
            } ${phase !== "recording" && phase !== "review" ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
          />
        ))}
      </div>

      {/* Question */}
      <div className="text-center space-y-3" key={currentIndex}>
        <p className="text-xs font-medium text-[var(--primary)] tracking-wide uppercase">
          {currentIndex + 1} / {totalQuestions}
        </p>
        <h3 className="text-2xl font-bold text-[var(--foreground)] leading-snug">
          {currentQuestion.question}
        </h3>
        <p className="text-sm text-[var(--muted)] max-w-sm mx-auto leading-relaxed">
          {currentQuestion.helpText}
        </p>
      </div>

      {/* Error (softer amber style) */}
      {error && (
        <div className="flex items-start gap-2.5 text-sm text-amber-700 bg-amber-50 border border-amber-200/60 rounded-xl px-4 py-3 animate-fade-in-up">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* READY phase — big inviting mic button */}
      {phase === "ready" && (
        <div className="text-center space-y-5 py-4">
          <button
            onClick={startRecording}
            className="mx-auto w-28 h-28 bg-[var(--primary)]/10 rounded-full flex items-center justify-center hover:bg-[var(--primary)]/20 transition-all duration-300 mic-breathe group"
          >
            <div className="w-20 h-20 bg-[var(--primary)]/15 rounded-full flex items-center justify-center group-hover:bg-[var(--primary)]/25 transition-colors">
              <svg
                className="w-9 h-9 text-[var(--primary)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
          </button>
          <p className="text-sm text-[var(--muted)]">
            Appuie et raconte-nous
          </p>
        </div>
      )}

      {/* RECORDING phase — visual waveform + timer */}
      {phase === "recording" && (
        <div className="space-y-6 py-2">
          {/* Central recording visual */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={stopRecording}
              className="w-28 h-28 bg-red-50 rounded-full flex items-center justify-center mic-recording-ring cursor-pointer hover:bg-red-100 transition-colors"
            >
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="7" y="7" width="10" height="10" rx="2" />
                </svg>
              </div>
            </button>

            {/* Waveform bars */}
            <div className="flex items-center gap-1 h-8">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-400 rounded-full wave-bar"
                  style={{
                    height: `${12 + Math.random() * 20}px`,
                    animationDelay: `${i * 0.08}s`,
                    animationDuration: `${0.6 + Math.random() * 0.4}s`,
                  }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-recording-pulse" />
              <span className="text-sm font-medium text-[var(--foreground)]">
                {formatTime(seconds)}
              </span>
            </div>
          </div>

          <p className="text-center text-xs text-[var(--muted)]">
            Appuie sur le bouton pour terminer
          </p>
        </div>
      )}

      {/* REVIEW phase — listen before confirming */}
      {phase === "review" && audioBlobUrl && (
        <div className="space-y-5 animate-fade-in-up">
          <div className="text-center">
            <p className="text-sm text-[var(--muted)] mb-3">Réécoute ton enregistrement</p>
          </div>
          <div className="bg-[var(--surface)] rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--primary)]/15 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <audio
              key={audioBlobUrl}
              src={audioBlobUrl}
              controls
              preload="auto"
              className="w-full min-w-0"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={reRecord}
              className="px-4 py-2.5 border border-[var(--input-border)] text-[var(--foreground)] rounded-xl text-sm hover:bg-[var(--surface)] transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refaire
            </button>
            <button
              onClick={confirmRecording}
              className="flex-1 px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors flex items-center justify-center gap-1.5"
            >
              Valider
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* DONE phase — success feedback */}
      {phase === "done" && (
        <div className="space-y-5 animate-fade-in-up">
          {/* Audio player */}
          {playbackUrl && (
            <div className="bg-[var(--surface)] rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--primary)]/15 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <audio
                key={playbackUrl}
                src={playbackUrl}
                controls
                preload="auto"
                className="w-full min-w-0"
              />
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={reRecord}
              className="px-4 py-2.5 border border-[var(--input-border)] text-[var(--foreground)] rounded-xl text-sm hover:bg-[var(--surface)] transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refaire
            </button>
            <button
              onClick={saveAndNext}
              className="flex-1 px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors flex items-center justify-center gap-1.5"
            >
              {currentIndex < totalQuestions - 1 ? (
                <>
                  Suivant
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              ) : (
                <>
                  Terminer
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Navigation — clean, no separator */}
      <div className="flex justify-between items-center">
        <button
          onClick={
            currentIndex > 0 ? () => setCurrentIndex(currentIndex - 1) : onBack
          }
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1.5 py-1"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {currentIndex > 0 ? "Précédente" : "Retour"}
        </button>

        {/* Answered count */}
        <span className="text-xs text-[var(--muted)]">
          {answeredCount} / {totalQuestions} répondu{answeredCount > 1 ? "es" : "e"}
        </span>

        {phase !== "recording" && phase !== "review" && (
          <button
            onClick={skipQuestion}
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors py-1"
          >
            Passer
          </button>
        )}
        {(phase === "recording" || phase === "review") && (
          <div />
        )}
      </div>
    </div>
  );
}
