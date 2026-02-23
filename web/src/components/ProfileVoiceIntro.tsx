"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  ProfileIntroduction,
  PROFILE_VOICE_QUESTIONS,
  EMPTY_INTRODUCTION,
} from "@/lib/profile-types";

// Web Speech API type declarations (same as VoiceQuestionnaire)
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: { transcript: string; confidence: number };
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as Record<string, unknown>).SpeechRecognition ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition
  ) as (new () => SpeechRecognitionInstance) | null;
}

interface ProfileVoiceIntroProps {
  initialIntroduction?: ProfileIntroduction;
  onComplete: (introduction: ProfileIntroduction) => void;
  onBack: () => void;
}

type QuestionPhase = "ready" | "recording" | "reviewing" | "cleaning" | "done";

export function ProfileVoiceIntro({
  initialIntroduction,
  onComplete,
  onBack,
}: ProfileVoiceIntroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [introduction, setIntroduction] = useState<ProfileIntroduction>(
    initialIntroduction || EMPTY_INTRODUCTION
  );
  const [phase, setPhase] = useState<QuestionPhase>("ready");
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [speechFailed, setSpeechFailed] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRecordingRef = useRef(false);

  const isSpeechSupported = getSpeechRecognition() !== null && !speechFailed;
  const currentQuestion = PROFILE_VOICE_QUESTIONS[currentIndex];
  const currentAnswer = introduction[currentQuestion.id];
  const totalQuestions = PROFILE_VOICE_QUESTIONS.length;

  // Pre-fill transcript if editing existing answer
  useEffect(() => {
    if (currentAnswer) {
      setTranscript(currentAnswer);
      setPhase("reviewing");
    } else {
      setTranscript("");
      setPhase("ready");
    }
    setInterimText("");
    setSeconds(0);
    setError(null);
  }, [currentIndex, currentAnswer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    };
  }, []);

  const startRecording = useCallback(() => {
    setError(null);
    setTranscript("");
    setInterimText("");
    setSeconds(0);

    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "fr-BE";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;
    isRecordingRef.current = true;

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
          setTranscript(finalTranscript.trim());
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setError(
          "L'acc\u00e8s au micro a \u00e9t\u00e9 refus\u00e9. Tu peux taper ta r\u00e9ponse ci-dessous."
        );
        setSpeechFailed(true);
        stopRecording();
        setPhase("ready");
      } else if (event.error === "network") {
        setError(
          "La reconnaissance vocale n'est pas disponible. Tu peux taper ta r\u00e9ponse ci-dessous."
        );
        setSpeechFailed(true);
        stopRecording();
        setPhase("ready");
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        setError(`Erreur de reconnaissance : ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (isRecordingRef.current && recognitionRef.current === recognition) {
        try {
          recognition.start();
        } catch {}
      }
    };

    try {
      recognition.start();
      setPhase("recording");

      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);

      // Max 2 minutes per question
      maxTimerRef.current = setTimeout(() => {
        stopRecording();
      }, 120_000);
    } catch {
      setError("Impossible de d\u00e9marrer la reconnaissance vocale.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    setInterimText("");
    setPhase("reviewing");
  }, []);

  const cleanWithAI = useCallback(async () => {
    if (!transcript.trim()) return;
    setPhase("cleaning");
    setError(null);

    try {
      const res = await fetch("/api/voice-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcript.trim(),
          questionId: currentQuestion.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.cleanedText) {
          setTranscript(data.cleanedText);
        }
      }
    } catch {
      // Silently fail — keep the original transcript
    }

    setPhase("reviewing");
  }, [transcript, currentQuestion.id]);

  const saveAndNext = useCallback(() => {
    const updated = { ...introduction, [currentQuestion.id]: transcript.trim() };
    setIntroduction(updated);

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete(updated);
    }
  }, [
    introduction,
    currentQuestion.id,
    transcript,
    currentIndex,
    totalQuestions,
    onComplete,
  ]);

  const skipQuestion = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete(introduction);
    }
  }, [currentIndex, totalQuestions, introduction, onComplete]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-[var(--muted)]">
          <span>
            Question {currentIndex + 1} sur {totalQuestions}
          </span>
          <span>
            {Math.round(((currentIndex + (phase === "done" ? 1 : 0)) / totalQuestions) * 100)}%
          </span>
        </div>
        <div className="h-1.5 bg-[var(--surface)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
            style={{
              width: `${((currentIndex + (transcript.trim() ? 1 : 0)) / totalQuestions) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-[var(--foreground)]">
          {currentQuestion.question}
        </h3>
        <p className="text-sm text-[var(--muted)]">{currentQuestion.helpText}</p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* READY phase */}
      {phase === "ready" && (
        <div className="space-y-4">
          {isSpeechSupported ? (
            <div className="text-center space-y-4">
              <button
                onClick={startRecording}
                className="mx-auto w-20 h-20 bg-[var(--primary)]/10 rounded-full flex items-center justify-center hover:bg-[var(--primary)]/20 transition-colors"
              >
                <svg
                  className="w-10 h-10 text-[var(--primary)]"
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
              </button>
              <p className="text-sm text-[var(--muted)]">
                Appuie pour enregistrer ta r&eacute;ponse
              </p>
            </div>
          ) : (
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={4}
              placeholder={currentQuestion.placeholder}
              className="w-full px-3 py-2.5 border border-[var(--input-border)] rounded-lg text-sm bg-[var(--input-bg)] text-[var(--foreground)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] leading-relaxed"
            />
          )}

          {/* If using text fallback and has content, show continue */}
          {!isSpeechSupported && transcript.trim() && (
            <button
              onClick={saveAndNext}
              className="w-full px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
            >
              {currentIndex < totalQuestions - 1 ? "Suivant" : "Terminer"}
            </button>
          )}
        </div>
      )}

      {/* RECORDING phase */}
      {phase === "recording" && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-recording-pulse" />
            <span className="text-[var(--foreground)] font-medium text-sm">
              Enregistrement en cours
            </span>
            <span className="text-[var(--muted)] font-mono text-sm">
              {formatTime(seconds)}
            </span>
          </div>

          {(transcript || interimText) && (
            <div className="min-h-[60px] max-h-[150px] overflow-y-auto p-3 bg-[var(--surface)] rounded-lg text-sm text-[var(--foreground)] leading-relaxed">
              {transcript}
              {interimText && (
                <span className="text-[var(--muted)]"> {interimText}</span>
              )}
            </div>
          )}

          <button
            onClick={stopRecording}
            className="w-full px-5 py-2.5 border border-[var(--input-border)] text-[var(--foreground)] rounded-xl text-sm font-medium hover:bg-[var(--surface)] transition-colors flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4 text-red-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            Terminer
          </button>
        </div>
      )}

      {/* REVIEWING phase */}
      {phase === "reviewing" && (
        <div className="space-y-4">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={5}
            placeholder={currentQuestion.placeholder}
            className="w-full px-3 py-2.5 border border-[var(--input-border)] rounded-lg text-sm bg-[var(--input-bg)] text-[var(--foreground)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] leading-relaxed"
          />

          <div className="flex gap-2">
            {isSpeechSupported && (
              <button
                onClick={() => {
                  setTranscript("");
                  setPhase("ready");
                }}
                className="px-4 py-2 border border-[var(--input-border)] text-[var(--foreground)] rounded-xl text-sm hover:bg-[var(--surface)] transition-colors"
              >
                Re-enregistrer
              </button>
            )}
            {transcript.trim().length > 10 && (
              <button
                onClick={cleanWithAI}
                className="px-4 py-2 border border-[var(--primary)] text-[var(--primary)] rounded-xl text-sm hover:bg-[var(--primary)]/10 transition-colors"
              >
                Nettoyer le texte
              </button>
            )}
            <button
              onClick={saveAndNext}
              disabled={!transcript.trim()}
              className="flex-1 px-5 py-2 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {currentIndex < totalQuestions - 1 ? "Suivant" : "Terminer"}
            </button>
          </div>
        </div>
      )}

      {/* CLEANING phase */}
      {phase === "cleaning" && (
        <div className="text-center py-4 space-y-3">
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
            Nettoyage du texte en cours...
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2 border-t border-[var(--border-color)]">
        <button
          onClick={currentIndex > 0 ? () => setCurrentIndex(currentIndex - 1) : onBack}
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1"
        >
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {currentIndex > 0 ? "Question pr\u00e9c\u00e9dente" : "Retour"}
        </button>

        {phase !== "recording" && phase !== "cleaning" && (
          <button
            onClick={skipQuestion}
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Passer &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
