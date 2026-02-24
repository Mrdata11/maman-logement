"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useConversation } from "@elevenlabs/react";
import { Mic, MicOff, Phone, PhoneOff, AlertCircle, CheckCircle } from "lucide-react";

type Phase =
  | "loading"
  | "ready"
  | "connecting"
  | "active"
  | "ending"
  | "completed"
  | "error"
  | "expired";

interface ScreeningCallInterfaceProps {
  token: string;
}

export function ScreeningCallInterface({
  token,
}: ScreeningCallInterfaceProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [configTitle, setConfigTitle] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isVerification, setIsVerification] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const conversation = useConversation({
    onConnect: () => {
      setPhase("active");
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    },
    onDisconnect: () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setPhase("ending");
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      setErrorMessage("Une erreur est survenue pendant l'appel.");
      setPhase("error");
    },
  });

  // Upload l'enregistrement audio
  const uploadAudio = useCallback(async (sid: string) => {
    if (audioChunksRef.current.length === 0) return;
    setUploadingAudio(true);
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", audioBlob, `recording_${sid}.webm`);
      formData.append("session_id", sid);
      await fetch("/api/screening/upload-audio", {
        method: "POST",
        body: formData,
      });
    } catch (e) {
      console.error("Error uploading audio:", e);
    } finally {
      setUploadingAudio(false);
      audioChunksRef.current = [];
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Fetch agent token on mount
  useEffect(() => {
    const initAgent = async () => {
      try {
        const res = await fetch("/api/screening/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (res.status === 410) {
            setErrorMessage(data.error || "Ce lien n'est plus valide.");
            setPhase("expired");
          } else {
            setErrorMessage(
              data.error || "Erreur lors de la préparation de l'entretien."
            );
            setPhase("error");
          }
          return;
        }

        const data = await res.json();
        setSignedUrl(data.signedUrl);
        setSessionId(data.sessionId);
        setCandidateName(data.candidateName);
        setConfigTitle(data.configTitle);
        setIsVerification(!!data.isVerification);
        setPhase("ready");
      } catch {
        setErrorMessage("Erreur de connexion. Vérifiez votre réseau.");
        setPhase("error");
      }
    };

    initAgent();
  }, [token]);

  const startCall = useCallback(async () => {
    if (!signedUrl) return;
    setPhase("connecting");

    try {
      // Demander l'accès au micro
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Démarrer l'enregistrement audio
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.start(1000); // Chunk toutes les secondes
      mediaRecorderRef.current = recorder;

      const convId = await conversation.startSession({
        signedUrl,
      });

      setConversationId(convId || null);
    } catch (err) {
      console.error("Start call error:", err);
      if (
        err instanceof DOMException &&
        err.name === "NotAllowedError"
      ) {
        setErrorMessage(
          "L'accès au microphone a été refusé. Veuillez autoriser l'accès au microphone dans les paramètres de votre navigateur."
        );
      } else {
        setErrorMessage("Impossible de démarrer l'appel.");
      }
      setPhase("error");
    }
  }, [signedUrl, conversation]);

  const endCall = useCallback(async () => {
    // Arrêter l'enregistrement audio
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    try {
      await conversation.endSession();
    } catch {
      // Session may already be ended
    }
    setPhase("ending");
  }, [conversation]);

  // When ending phase: upload audio + auto-complete for verification calls
  useEffect(() => {
    if (phase !== "ending" || !conversationId || !sessionId) return;

    const finalize = async () => {
      // Upload l'enregistrement audio en parallèle
      const audioUpload = uploadAudio(sessionId);

      if (isVerification) {
        // Appeler l'API de complétion de vérification automatiquement
        try {
          await fetch("/api/screening/verify/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: sessionId,
              conversation_id: conversationId,
            }),
          });
        } catch (e) {
          console.error("Error completing verification:", e);
        }
      }

      // Attendre la fin de l'upload audio
      await audioUpload;
      setPhase("completed");
    };

    finalize();
  }, [phase, conversationId, sessionId, isVerification, uploadAudio]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      conversation.setVolume({ volume: 1 });
    } else {
      conversation.setVolume({ volume: 0 });
    }
    setIsMuted(!isMuted);
  }, [isMuted, conversation]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-[var(--background)] flex items-center justify-center z-50">
      <div className="max-w-md w-full mx-4 text-center">
        {/* Loading */}
        {phase === "loading" && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-3 border-[var(--primary)] border-t-transparent mx-auto mb-4" />
            <p className="text-[var(--muted)]">
              Préparation de l&apos;entretien...
            </p>
          </div>
        )}

        {/* Ready */}
        {phase === "ready" && (
          <div>
            <div className="w-20 h-20 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-6">
              <Phone size={36} className="text-[var(--primary)]" />
            </div>
            <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">
              Bonjour {candidateName}
            </h1>
            <p className="text-[var(--muted)] mb-2 text-sm">
              {configTitle}
            </p>
            <p className="text-[var(--muted)] mb-8 text-sm max-w-sm mx-auto">
              Vous allez passer un court entretien vocal avec notre assistant IA.
              Assurez-vous d&apos;être dans un endroit calme avec un microphone
              fonctionnel.
            </p>
            <button
              onClick={startCall}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[var(--primary)] text-white rounded-full text-lg font-medium hover:bg-[var(--primary-hover)] transition-all hover:scale-105"
            >
              <Mic size={22} />
              Commencer l&apos;entretien
            </button>
          </div>
        )}

        {/* Connecting */}
        {phase === "connecting" && (
          <div>
            <div className="animate-pulse">
              <div className="w-20 h-20 rounded-full bg-[var(--primary)]/20 flex items-center justify-center mx-auto mb-6">
                <Phone size={36} className="text-[var(--primary)]" />
              </div>
            </div>
            <p className="text-[var(--foreground)] font-medium">
              Connexion en cours...
            </p>
            <p className="text-[var(--muted)] text-sm mt-1">
              Veuillez patienter quelques secondes
            </p>
          </div>
        )}

        {/* Active call */}
        {phase === "active" && (
          <div>
            {/* Audio visualizer */}
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full bg-[var(--primary)]/10 animate-ping" style={{ animationDuration: "2s" }} />
              <div className="absolute inset-2 rounded-full bg-[var(--primary)]/15 animate-ping" style={{ animationDuration: "2.5s" }} />
              <div className="relative w-32 h-32 rounded-full bg-[var(--primary)] flex items-center justify-center">
                <Mic size={40} className="text-white" />
              </div>
            </div>

            <p className="text-3xl font-mono text-[var(--foreground)] mb-2">
              {formatTime(seconds)}
            </p>
            <p className="text-[var(--muted)] text-sm mb-8">
              Entretien en cours...
            </p>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-colors ${
                  isMuted
                    ? "bg-red-100 text-red-600"
                    : "bg-[var(--surface)] text-[var(--muted)]"
                }`}
                title={isMuted ? "Réactiver le son" : "Couper le son"}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              <button
                onClick={endCall}
                className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                title="Terminer l'appel"
              >
                <PhoneOff size={24} />
              </button>
            </div>
          </div>
        )}

        {/* Ending */}
        {phase === "ending" && (
          <div>
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--primary)] border-t-transparent mx-auto mb-4" />
            <p className="text-[var(--foreground)] font-medium">
              {uploadingAudio ? "Sauvegarde de l'enregistrement..." : "Finalisation..."}
            </p>
            <p className="text-[var(--muted)] text-sm mt-1">
              Durée : {formatTime(seconds)}
            </p>
          </div>
        )}

        {/* Completed */}
        {phase === "completed" && (
          <div>
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
              Merci {candidateName} !
            </h2>
            <p className="text-[var(--muted)] mb-2">
              {isVerification
                ? "Votre qualification est terminée. Le badge « Profil qualifié » sera visible sous peu."
                : "Votre entretien a bien été enregistré."}
            </p>
            <p className="text-[var(--muted)] text-sm">
              Durée : {formatTime(seconds)}
            </p>
            <p className="text-[var(--muted)] text-sm mt-4 max-w-sm mx-auto">
              {isVerification ? (
                <a
                  href="/profils/mon-profil"
                  className="text-[var(--primary)] hover:underline"
                >
                  Retourner à mon profil
                </a>
              ) : (
                "Le porteur du projet reviendra vers vous prochainement. Vous pouvez fermer cette page."
              )}
            </p>
          </div>
        )}

        {/* Error */}
        {phase === "error" && (
          <div>
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            <h2 className="text-lg font-medium text-[var(--foreground)] mb-2">
              Une erreur est survenue
            </h2>
            <p className="text-[var(--muted)] text-sm mb-6 max-w-sm mx-auto">
              {errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Expired */}
        {phase === "expired" && (
          <div>
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} className="text-amber-500" />
            </div>
            <h2 className="text-lg font-medium text-[var(--foreground)] mb-2">
              Lien expiré
            </h2>
            <p className="text-[var(--muted)] text-sm max-w-sm mx-auto">
              {errorMessage ||
                "Ce lien n'est plus valide. Veuillez contacter l'organisateur pour obtenir un nouveau lien."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
