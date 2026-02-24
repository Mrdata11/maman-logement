"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CreationProjectState,
  CREATION_STORAGE_KEY,
} from "@/lib/creation-questionnaire-types";
import { CREATION_STEPS } from "@/lib/creation-questionnaire-data";

interface VoiceCreationProps {
  initialMode: "voice" | "text";
}

import { QuestionnaireAnswers } from "@/lib/questionnaire-types";

type Phase = "idle" | "recording" | "transcribing" | "reviewing" | "extracting" | "results" | "done";

function hasMediaRecorderSupport(): boolean {
  if (typeof window === "undefined") return false;
  return typeof MediaRecorder !== "undefined" && !!navigator?.mediaDevices?.getUserMedia;
}

const totalQuestions = CREATION_STEPS.reduce(
  (sum, step) => sum + step.questions.length,
  0
);

export function VoiceCreation({ initialMode }: VoiceCreationProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [coverage, setCoverage] = useState(0);
  const [summary, setSummary] = useState("");
  const [voiceFailed, setVoiceFailed] = useState(initialMode === "text");
  const [extractedAnswers, setExtractedAnswers] = useState<QuestionnaireAnswers>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canUseVoice = !voiceFailed && hasMediaRecorderSupport();

  useEffect(() => {
    return () => {
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
        setError("Aucun texte détecté. Essayez de parler plus fort.");
        setPhase("idle");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur de transcription.";
      setError(msg + " Vous pouvez taper votre description ci-dessous.");
      setVoiceFailed(true);
      setPhase("idle");
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript("");
    setSeconds(0);

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
      setPhase("recording");

      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);

      maxTimerRef.current = setTimeout(() => {
        stopRecording();
      }, 180_000);
    } catch {
      setError("Impossible d’accéder au microphone. Vous pouvez taper votre description ci-dessous.");
      setVoiceFailed(true);
      setPhase("idle");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcribeAudio]);

  const stopRecording = useCallback(() => {
    clearTimers();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      // onstop handler will call transcribeAudio
    }
  }, [clearTimers]);

  const extractAnswers = useCallback(async () => {
    if (!transcript.trim() || transcript.trim().length < 10) {
      setError("Le texte est trop court. Essayez de donner plus de détails.");
      return;
    }

    setPhase("extracting");
    setError(null);

    try {
      const res = await fetch("/api/voice-creation", {
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
          "Nous n’avons pas pu extraire assez d’informations. Essayez de donner plus de détails, ou utilisez le questionnaire guidé."
        );
        setPhase("reviewing");
        return;
      }

      setExtractedAnswers(data.answers);
      setCoverage(data.coverage);
      setSummary(data.summary);
      setPhase("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du traitement.");
      setPhase("reviewing");
    }
  }, [transcript, router]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-[var(--card-bg)] rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-color)]">
          <h2 className="font-bold text-lg text-[var(--foreground)]">
            {phase === "done" ? "Projet enregistré !" : "Décrivez votre projet"}
          </h2>
        </div>

        <div className="p-5">
          {/* IDLE phase */}
          {phase === "idle" && (
            <div className="text-center space-y-5">
              {canUseVoice ? (
                <>
                  <div className="w-20 h-20 mx-auto bg-[var(--accent)]/10 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>

                  <div>
                    <p className="text-[var(--foreground)] font-medium">
                      Racontez votre projet d&apos;habitat group&eacute;
                    </p>
                    <p className="text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
                      Parlez du lieu, du nombre de logements, de votre vision de la communaut&eacute;,
                      de vos valeurs, de ce que vous cherchez...
                    </p>
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={startRecording}
                    className="w-full px-5 py-3 bg-[var(--accent)] text-white rounded-xl text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Commencer l&apos;enregistrement
                  </button>

                  <button
                    onClick={() => setVoiceFailed(true)}
                    className="inline-block text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                  >
                    Ou &eacute;crire en texte libre &rarr;
                  </button>
                </>
              ) : (
                /* Text mode fallback */
                <div className="space-y-4 text-left">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto bg-[var(--golden)]/10 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-[var(--golden)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <p className="text-[var(--foreground)] font-medium mb-1">
                      D&eacute;crivez votre projet
                    </p>
                    <p className="text-sm text-[var(--muted)] leading-relaxed">
                      Parlez du lieu, du nombre de logements, de la communaut&eacute; que vous imaginez,
                      de vos valeurs...
                    </p>
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                      {error}
                    </div>
                  )}

                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    rows={8}
                    placeholder="Par exemple : Nous sommes un groupe de 5 familles qui cherchons &agrave; cr&eacute;er un habitat group&eacute; en Brabant wallon. On imagine un lieu avec un jardin partag&eacute;, une salle commune, des logements individuels de 2-3 chambres. Nos valeurs sont l'&eacute;cologie, l'entraide, et l'ouverture..."
                    className="w-full px-3 py-2.5 border border-[var(--input-border)] rounded-lg text-sm bg-[var(--input-bg)] text-[var(--foreground)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] leading-relaxed"
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
            </div>
          )}

          {/* RECORDING phase */}
          {phase === "recording" && (
            <div className="space-y-5">
              <div className="flex items-center justify-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-recording-pulse" />
                <span className="text-[var(--foreground)] font-medium text-sm">Enregistrement en cours</span>
                <span className="text-[var(--muted)] font-mono text-sm">{formatTime(seconds)}</span>
              </div>

              <div className="text-center py-4">
                <p className="text-sm text-[var(--muted)]">
                  Parlez, votre audio est enregistr&eacute;...
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-[var(--muted)]">Vous pouvez parler de :</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Le lieu",
                    "Type de logement",
                    "Nombre d’unités",
                    "Votre vision",
                    "Les valeurs",
                    "Espaces partagés",
                    "Public visé",
                    "Modèle financier",
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

          {/* TRANSCRIBING phase (Groq Whisper) */}
          {phase === "transcribing" && (
            <div className="text-center py-8 space-y-4">
              <div className="flex justify-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 bg-[var(--accent)] rounded-full"
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
                V&eacute;rifiez et corrigez le texte si besoin, puis soumettez votre projet.
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
                  Recommencer
                </button>
                <button
                  onClick={extractAnswers}
                  disabled={transcript.trim().length < 10}
                  className="flex-1 px-4 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Soumettre
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
                Traitement de votre projet en cours...
              </p>
              <p className="text-sm text-[var(--muted)]">
                Structuration des informations de votre projet
              </p>
            </div>
          )}

          {/* RESULTS phase — show extracted data for review */}
          {phase === "results" && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-[var(--primary)]/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-[var(--foreground)] font-semibold">
                  {coverage} information{coverage !== 1 ? "s" : ""} extraite{coverage !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  sur {totalQuestions} champs possibles. V&eacute;rifiez et continuez.
                </p>
              </div>

              {summary && (
                <div className="bg-[var(--surface)] rounded-lg p-3">
                  <p className="text-sm text-[var(--muted)] italic leading-relaxed">
                    &laquo; {summary} &raquo;
                  </p>
                </div>
              )}

              {/* Extracted answers grouped by step */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {CREATION_STEPS.map((step) => {
                  const stepAnswers = step.questions.filter(
                    (q) => extractedAnswers[q.id] !== undefined
                  );
                  if (stepAnswers.length === 0) return null;
                  return (
                    <div key={step.id}>
                      <h4 className="text-xs font-semibold text-[var(--primary)] mb-2 flex items-center gap-1.5">
                        <span className="w-1 h-1 bg-[var(--primary)] rounded-full" />
                        {step.title}
                      </h4>
                      <div className="space-y-1.5">
                        {stepAnswers.map((q) => {
                          const val = extractedAnswers[q.id];
                          let display = String(val);
                          if (Array.isArray(val)) {
                            display = val
                              .map((v) => q.options?.find((o) => o.id === v)?.label || v)
                              .join(", ");
                          } else if (typeof val === "string" && q.options) {
                            display = q.options.find((o) => o.id === val)?.label || val;
                          }
                          return (
                            <div key={q.id} className="flex items-start gap-2 text-sm">
                              <svg className="w-3.5 h-3.5 text-[var(--primary)] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <div className="min-w-0">
                                <span className="text-[var(--muted)] text-xs">{q.text}</span>
                                <p className="text-[var(--foreground)] font-medium text-sm">{display}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Missing fields notice */}
              {coverage < totalQuestions && (
                <p className="text-xs text-[var(--muted)] text-center">
                  Les champs manquants pourront &ecirc;tre compl&eacute;t&eacute;s dans l&apos;aper&ccedil;u.
                </p>
              )}

              <button
                onClick={() => {
                  // Save to localStorage and go to results
                  const state: CreationProjectState = {
                    answers: extractedAnswers,
                    currentStep: CREATION_STEPS.length - 1,
                    completedAt: new Date().toISOString(),
                    lastEditedAt: new Date().toISOString(),
                    version: 1,
                    inputMethod: "voice",
                  };
                  localStorage.setItem(CREATION_STORAGE_KEY, JSON.stringify(state));
                  setPhase("done");
                }}
                className="w-full px-5 py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors flex items-center justify-center gap-2"
              >
                Valider et continuer
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* DONE phase */}
          {phase === "done" && (
            <div className="py-6 space-y-6">
              {/* Animated success icon */}
              <div className="flex justify-center">
                <div className="relative success-icon-container" style={{ opacity: 0 }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-20 h-20 rounded-full border-2 border-[var(--primary)] success-ring"
                      style={{ opacity: 0 }}
                    />
                  </div>
                  <span className="success-sparkle" style={{ opacity: 0 }} />
                  <span className="success-sparkle" style={{ opacity: 0 }} />
                  <span className="success-sparkle" style={{ opacity: 0 }} />
                  <span className="success-sparkle" style={{ opacity: 0 }} />
                  <span className="success-sparkle" style={{ opacity: 0 }} />
                  <span className="success-sparkle" style={{ opacity: 0 }} />
                  <svg width="64" height="64" viewBox="0 0 52 52">
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

              <div className="text-center space-y-2">
                <p className="text-lg font-bold text-[var(--foreground)] success-text-1">
                  Projet analys&eacute; !
                </p>
                <p className="text-sm text-[var(--primary)] success-text-2">
                  {coverage} information{coverage !== 1 ? "s" : ""} extraite{coverage !== 1 ? "s" : ""} sur {totalQuestions} champs
                </p>
                {summary && (
                  <p className="text-sm text-[var(--muted)] italic success-text-3">
                    &laquo; {summary} &raquo;
                  </p>
                )}
              </div>

              <div className="success-text-4">
                <button
                  onClick={() => router.push("/creer/apercu")}
                  className="w-full px-5 py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors flex items-center justify-center gap-2"
                >
                  Voir l&apos;aper&ccedil;u de mon projet
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
