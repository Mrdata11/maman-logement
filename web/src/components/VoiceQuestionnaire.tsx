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

type Phase = "idle" | "recording" | "transcribing" | "reviewing" | "extracting" | "done";

// Check SpeechRecognition support
function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as Record<string, unknown>).SpeechRecognition ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition
  ) as (new () => SpeechRecognitionInstance) | null;
}

function hasMediaRecorderSupport(): boolean {
  if (typeof window === "undefined") return false;
  return typeof MediaRecorder !== "undefined" && !!navigator?.mediaDevices?.getUserMedia;
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
  const [voiceFailed, setVoiceFailed] = useState(false);

  // Web Speech API refs
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const useMediaRecorderRef = useRef(false);

  // Shared refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRecordingRef = useRef(false);

  const canUseVoice = !voiceFailed && (getSpeechRecognition() !== null || hasMediaRecorderSupport());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    };
  }, []);

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (maxTimerRef.current) { clearTimeout(maxTimerRef.current); maxTimerRef.current = null; }
  }, []);

  const startTimers = useCallback(() => {
    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    maxTimerRef.current = setTimeout(() => {
      stopRecording();
    }, 180_000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- MediaRecorder fallback ---

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setPhase("transcribing");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, `recording.${audioBlob.type.includes("mp4") ? "m4a" : "webm"}`);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Erreur serveur" }));
        throw new Error(data.error || `Erreur ${res.status}`);
      }

      const data = await res.json();
      if (data.text?.trim()) {
        setTranscript(data.text.trim());
        setPhase("reviewing");
      } else {
        setError("Aucun texte détecté. Essaie de parler plus fort.");
        setPhase("idle");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur de transcription.";
      setError(msg + " Tu peux taper ta description ci-dessous.");
      setVoiceFailed(true);
      setPhase("idle");
    }
  }, []);

  const startMediaRecording = useCallback(async () => {
    try {
      if (!hasMediaRecorderSupport()) {
        throw new Error("Enregistrement audio non supporté.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        mediaRecorderRef.current = null;
        if (audioBlob.size > 0) {
          transcribeAudio(audioBlob);
        } else {
          setPhase("idle");
        }
      };

      mediaRecorder.start(1000);
      isRecordingRef.current = true;
      setPhase("recording");
      startTimers();
    } catch {
      setError("Impossible d'accéder au microphone. Tu peux taper ta description ci-dessous.");
      setVoiceFailed(true);
      setPhase("idle");
    }
  }, [transcribeAudio, startTimers]);

  // --- Main recording logic ---

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript("");
    setInterimText("");
    setSeconds(0);

    // If we already know Web Speech API doesn't work, go straight to MediaRecorder
    if (useMediaRecorderRef.current) {
      await startMediaRecording();
      return;
    }

    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) {
      useMediaRecorderRef.current = true;
      await startMediaRecording();
      return;
    }

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

    recognition.onerror = async (event) => {
      if (event.error === "not-allowed") {
        setVoiceFailed(true);
        setError(null);
        isRecordingRef.current = false;
        try { recognition.onend = null; recognition.stop(); } catch {}
        recognitionRef.current = null;
        clearTimers();
        setPhase("idle");
      } else if (event.error === "network") {
        // Silently switch to MediaRecorder
        try { recognition.onend = null; recognition.stop(); } catch {}
        recognitionRef.current = null;
        clearTimers();

        useMediaRecorderRef.current = true;
        await startMediaRecording();
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        setError(`Erreur de reconnaissance : ${event.error}`);
      }
    };

    // Auto-restart on end (iOS Safari stops after ~60s)
    recognition.onend = () => {
      if (isRecordingRef.current && recognitionRef.current === recognition) {
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
      startTimers();
    } catch {
      useMediaRecorderRef.current = true;
      await startMediaRecording();
    }
  }, [startMediaRecording, clearTimers, startTimers]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    clearTimers();
    setInterimText("");

    // Stop Web Speech API
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
      setPhase("reviewing");
    }

    // Stop MediaRecorder (onstop handler will call transcribeAudio)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, [clearTimers]);

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
                  D&eacute;cris en quelques mots ce que tu recherches
                </p>
                <p className="text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
                  Parle de ton budget, la r&eacute;gion, le type de communaut&eacute;, tes valeurs, ce que tu veux &eacute;viter...
                  L&apos;IA extraira tes pr&eacute;f&eacute;rences automatiquement.
                </p>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              {canUseVoice ? (
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
                /* Fallback: textarea for browsers without any voice support */
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
                Ou remplir le questionnaire &eacute;tape par &eacute;tape &rarr;
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

              {/* Live transcript (Web Speech API) or hint (MediaRecorder) */}
              {(transcript || interimText) ? (
                <div className="min-h-[60px] max-h-[200px] overflow-y-auto p-3 bg-[var(--surface)] rounded-lg text-sm text-[var(--foreground)] leading-relaxed">
                  {transcript}
                  {interimText && (
                    <span className="text-[var(--muted)]"> {interimText}</span>
                  )}
                </div>
              ) : useMediaRecorderRef.current ? (
                <div className="text-center py-4">
                  <p className="text-sm text-[var(--muted)]">
                    Parle, ton audio est enregistr&eacute;...
                  </p>
                </div>
              ) : null}

              {/* Suggested questions */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-[var(--muted)]">Par exemple :</p>
                {[
                  "Quel est ton budget ?",
                  "Dans quelle région tu cherches ?",
                  "Quel type de logement tu veux ?",
                  "Qu'est-ce qui te motive ?",
                  "Quelle taille de communauté tu imagines ?",
                  "Quelles activités t'intéressent ?",
                  "Quelles sont tes valeurs ?",
                  "Qu'est-ce que tu veux éviter ?",
                ].map((question) => (
                  <p
                    key={question}
                    className="text-xs text-[var(--muted)] leading-relaxed italic"
                  >
                    {question}
                  </p>
                ))}
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

          {/* TRANSCRIBING phase (MediaRecorder mode) */}
          {phase === "transcribing" && (
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
                Transcription en cours...
              </p>
              <p className="text-sm text-[var(--muted)]">
                Conversion de l&apos;audio en texte
              </p>
            </div>
          )}

          {/* REVIEWING phase */}
          {phase === "reviewing" && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--muted)]">
                V&eacute;rifie et corrige le texte si besoin, puis lance l&apos;analyse.
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
                Analyse de tes pr&eacute;f&eacute;rences en cours...
              </p>
              <p className="text-sm text-[var(--muted)]">
                L&apos;IA extrait tes crit&egrave;res de recherche
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
                  Ton profil est pr&ecirc;t !
                </p>
                <p className="text-sm text-[var(--primary)] mt-1">
                  {coverage} r&eacute;ponse{coverage !== 1 ? "s" : ""} extraite{coverage !== 1 ? "s" : ""} sur {totalQuestions} questions
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
