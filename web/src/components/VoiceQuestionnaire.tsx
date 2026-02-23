"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  QuestionnaireState,
  QUESTIONNAIRE_STORAGE_KEY,
} from "@/lib/questionnaire-types";
import { QUESTIONNAIRE_STEPS } from "@/lib/questionnaire-data";

// Web Speech API type declarations (not in standard TS lib)
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

interface VoiceQuestionnaireProps {
  onClose: () => void;
  onComplete: () => void;
}

type Phase = "idle" | "recording" | "reviewing" | "extracting" | "done";

// Check SpeechRecognition support
function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as Record<string, unknown>).SpeechRecognition ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition
  ) as (new () => SpeechRecognitionInstance) | null;
}

const totalQuestions = QUESTIONNAIRE_STEPS.reduce(
  (sum, step) => sum + step.questions.length,
  0
);

export function VoiceQuestionnaire({ onClose, onComplete }: VoiceQuestionnaireProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [coverage, setCoverage] = useState(0);
  const [summary, setSummary] = useState("");
  const [speechFailed, setSpeechFailed] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSpeechSupported = getSpeechRecognition() !== null && !speechFailed;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
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
        setError("L'accès au micro a été refusé. Tu peux taper ta description ci-dessous.");
        setSpeechFailed(true);
        stopRecording();
        setPhase("idle");
      } else if (event.error === "network") {
        setError("La reconnaissance vocale n'est pas disponible. Tu peux taper ta description ci-dessous.");
        setSpeechFailed(true);
        stopRecording();
        setPhase("idle");
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        setError(`Erreur de reconnaissance : ${event.error}`);
      }
    };

    // Auto-restart on end (iOS Safari stops after ~60s)
    recognition.onend = () => {
      if (phase === "recording" && recognitionRef.current === recognition) {
        try {
          recognition.start();
        } catch {
          // Already stopped by user
        }
      }
    };

    try {
      recognition.start();
      setPhase("recording");

      // Timer
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);

      // Max 3 minutes
      maxTimerRef.current = setTimeout(() => {
        stopRecording();
      }, 180_000);
    } catch {
      setError("Impossible de démarrer la reconnaissance vocale.");
    }
  }, [phase]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null; // Prevent auto-restart
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

  const extractAnswers = useCallback(async () => {
    if (!transcript.trim() || transcript.trim().length < 10) {
      setError("Le texte est trop court. Essaie de donner plus de détails.");
      return;
    }

    setPhase("extracting");
    setError(null);

    try {
      const res = await fetch("/api/voice-questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcript.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Erreur serveur" }));
        throw new Error(data.error || `Erreur ${res.status}`);
      }

      const data = await res.json();

      if (Object.keys(data.answers).length < 2) {
        setError(
          "Nous n'avons pas pu extraire assez d'informations. Essaie de donner plus de détails, ou utilise le questionnaire écrit."
        );
        setPhase("reviewing");
        return;
      }

      // Save to localStorage
      const state: QuestionnaireState = {
        answers: data.answers,
        currentStep: QUESTIONNAIRE_STEPS.length - 1,
        completedAt: new Date().toISOString(),
        lastEditedAt: new Date().toISOString(),
        version: 1,
        inputMethod: "voice",
      };
      localStorage.setItem(QUESTIONNAIRE_STORAGE_KEY, JSON.stringify(state));

      setCoverage(data.coverage);
      setSummary(data.summary);
      setPhase("done");

      // Auto-close after 2.5s
      setTimeout(() => {
        onComplete();
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'analyse.");
      setPhase("reviewing");
    }
  }, [transcript, onComplete]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
          <h2 className="font-bold text-lg text-[var(--foreground)]">
            {phase === "done" ? "C'est tout bon !" : "Dis-nous ce que tu cherches"}
          </h2>
          {phase !== "done" && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-[var(--surface)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="p-5">
          {/* IDLE phase */}
          {phase === "idle" && (
            <div className="text-center space-y-5">
              {/* Microphone icon */}
              <div className="w-20 h-20 mx-auto bg-[var(--primary)]/10 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>

              <div>
                <p className="text-[var(--foreground)] font-medium">
                  Décris en quelques mots ce que tu recherches
                </p>
                <p className="text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
                  Parle de ton budget, la région, le type de communauté, tes valeurs, ce que tu veux éviter...
                  L&apos;IA extraira tes préférences automatiquement.
                </p>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              {isSpeechSupported ? (
                <button
                  onClick={startRecording}
                  className="w-full px-5 py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Commencer l&apos;enregistrement
                </button>
              ) : (
                /* Fallback: textarea for browsers without SpeechRecognition */
                <div className="space-y-3">
                  <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                    Ton navigateur ne supporte pas la reconnaissance vocale. Tu peux taper ta description ci-dessous.
                  </p>
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    rows={5}
                    placeholder="Décris ce que tu recherches : budget, région, type de communauté, valeurs..."
                    className="w-full px-3 py-2 border border-[var(--input-border)] rounded-lg text-sm bg-[var(--input-bg)] text-[var(--foreground)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                  <button
                    onClick={() => {
                      if (transcript.trim().length >= 10) {
                        setPhase("reviewing");
                      }
                    }}
                    disabled={transcript.trim().length < 10}
                    className="w-full px-5 py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continuer
                  </button>
                </div>
              )}

              <a
                href="/questionnaire"
                className="inline-block text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
              >
                Ou remplir le questionnaire étape par étape &rarr;
              </a>
            </div>
          )}

          {/* RECORDING phase */}
          {phase === "recording" && (
            <div className="space-y-5">
              {/* Recording indicator */}
              <div className="flex items-center justify-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-recording-pulse" />
                <span className="text-[var(--foreground)] font-medium text-sm">Enregistrement en cours</span>
                <span className="text-[var(--muted)] font-mono text-sm">{formatTime(seconds)}</span>
              </div>

              {/* Live transcript */}
              {(transcript || interimText) && (
                <div className="min-h-[60px] max-h-[200px] overflow-y-auto p-3 bg-[var(--surface)] rounded-lg text-sm text-[var(--foreground)] leading-relaxed">
                  {transcript}
                  {interimText && (
                    <span className="text-[var(--muted)]"> {interimText}</span>
                  )}
                </div>
              )}

              {/* Suggested topics */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-[var(--muted)]">Tu peux parler de :</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Ton budget",
                    "La région souhaitée",
                    "Type de logement",
                    "Tes motivations",
                    "Taille de la communauté",
                    "Activités souhaitées",
                    "Tes valeurs",
                    "Ce que tu veux éviter",
                  ].map((topic) => (
                    <span
                      key={topic}
                      className="text-xs px-2.5 py-1 bg-[var(--surface)] text-[var(--muted)] rounded-full border border-[var(--border-color)]"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={stopRecording}
                className="w-full px-5 py-3 border border-[var(--input-border)] text-[var(--foreground)] rounded-xl text-sm font-medium hover:bg-[var(--surface)] transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                Terminer
              </button>
            </div>
          )}

          {/* REVIEWING phase */}
          {phase === "reviewing" && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--muted)]">
                Vérifie et corrige le texte si besoin, puis lance l&apos;analyse.
              </p>

              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={8}
                className="w-full px-3 py-2.5 border border-[var(--input-border)] rounded-lg text-sm bg-[var(--input-bg)] text-[var(--foreground)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] leading-relaxed"
              />

              {error && (
                <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setTranscript("");
                    setPhase("idle");
                  }}
                  className="flex-1 px-4 py-2.5 border border-[var(--input-border)] text-[var(--foreground)] rounded-xl text-sm font-medium hover:bg-[var(--surface)] transition-colors"
                >
                  Re-enregistrer
                </button>
                <button
                  onClick={extractAnswers}
                  disabled={transcript.trim().length < 10}
                  className="flex-1 px-4 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Analyser mes besoins
                </button>
              </div>
            </div>
          )}

          {/* EXTRACTING phase */}
          {phase === "extracting" && (
            <div className="text-center py-8 space-y-4">
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
              <p className="text-[var(--foreground)] font-medium">
                Analyse de tes préférences en cours...
              </p>
              <p className="text-sm text-[var(--muted)]">
                L&apos;IA extrait tes critères de recherche
              </p>
            </div>
          )}

          {/* DONE phase */}
          {phase === "done" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-[var(--foreground)] font-semibold text-lg">
                  Ton profil est prêt !
                </p>
                <p className="text-sm text-[var(--primary)] mt-1">
                  {coverage} réponse{coverage !== 1 ? "s" : ""} extraite{coverage !== 1 ? "s" : ""} sur {totalQuestions} questions
                </p>
                {summary && (
                  <p className="text-sm text-[var(--muted)] mt-2 italic">
                    &laquo; {summary} &raquo;
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
