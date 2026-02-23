"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  ProfileIntroduction,
  PROFILE_VOICE_QUESTIONS,
  EMPTY_INTRODUCTION,
} from "@/lib/profile-types";

// Web Speech API type declarations
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

function hasMediaRecorderSupport(): boolean {
  if (typeof window === "undefined") return false;
  return typeof MediaRecorder !== "undefined" && !!navigator?.mediaDevices?.getUserMedia;
}

interface ProfileVoiceIntroProps {
  initialIntroduction?: ProfileIntroduction;
  onComplete: (introduction: ProfileIntroduction) => void;
  onBack: () => void;
}

type QuestionPhase = "ready" | "recording" | "transcribing" | "reviewing" | "cleaning" | "done";

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
  const [voiceFailed, setVoiceFailed] = useState(false);

  // Refs for Web Speech API
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isRecordingRef = useRef(false);

  // Refs for MediaRecorder fallback
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const useMediaRecorderRef = useRef(false);

  // Shared timer refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canUseVoice = !voiceFailed && (getSpeechRecognition() !== null || hasMediaRecorderSupport());
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
    }, 120_000);
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
        setError("Aucun texte détecté. Essaie de parler plus fort ou tape ta réponse ci-dessous.");
        setPhase("ready");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur de transcription.";
      setError(msg + " Tu peux taper ta réponse ci-dessous.");
      setVoiceFailed(true);
      setPhase("ready");
    }
  }, []);

  const startMediaRecording = useCallback(async () => {
    try {
      if (!hasMediaRecorderSupport()) {
        throw new Error("Enregistrement audio non supporté par ce navigateur.");
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
          setPhase("ready");
        }
      };

      mediaRecorder.start(1000);
      isRecordingRef.current = true;
      setPhase("recording");
      startTimers();
    } catch {
      setError("Impossible d'accéder au microphone. Tu peux taper ta réponse ci-dessous.");
      setVoiceFailed(true);
      setPhase("ready");
    }
  }, [transcribeAudio, startTimers]);

  // --- Web Speech API (primary) ---

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
      // No Web Speech API at all → try MediaRecorder
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
        setError(
          "L'accès au micro a été refusé. Tu peux taper ta réponse ci-dessous."
        );
        setVoiceFailed(true);
        isRecordingRef.current = false;
        try { recognition.onend = null; recognition.stop(); } catch {}
        recognitionRef.current = null;
        clearTimers();
        setPhase("ready");
      } else if (event.error === "network") {
        // Web Speech API service unavailable → silently switch to MediaRecorder
        try { recognition.onend = null; recognition.stop(); } catch {}
        recognitionRef.current = null;
        clearTimers();

        useMediaRecorderRef.current = true;
        await startMediaRecording();
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
      startTimers();
    } catch {
      // Web Speech API failed to start → try MediaRecorder
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
      // Web Speech API provides transcript in real-time, go to reviewing
      setPhase("reviewing");
    }

    // Stop MediaRecorder (onstop handler will call transcribeAudio)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      // Don't setPhase here — onstop handler → transcribeAudio will handle phase
    }
  }, [clearTimers]);

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
          {canUseVoice ? (
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
          {!canUseVoice && transcript.trim() && (
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

          {/* Hint when using MediaRecorder (no real-time transcript) */}
          {useMediaRecorderRef.current && !transcript && !interimText && (
            <div className="text-center py-4">
              <p className="text-sm text-[var(--muted)]">
                Parle, ton audio est enregistr&eacute;...
              </p>
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

      {/* TRANSCRIBING phase (MediaRecorder mode) */}
      {phase === "transcribing" && (
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
            Transcription en cours...
          </p>
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
            {canUseVoice && (
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
          {currentIndex > 0 ? "Question précédente" : "Retour"}
        </button>

        {phase !== "recording" && phase !== "cleaning" && phase !== "transcribing" && (
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
