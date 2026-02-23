"use client";

import { useState, useCallback, useRef } from "react";

interface ProfileEditorModalProps {
  initialName: string;
  initialContext: string;
  onSave: (name: string, context: string) => void;
  onClose: () => void;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
}

export function ProfileEditorModal({
  initialName,
  initialContext,
  onSave,
  onClose,
  showToast,
}: ProfileEditorModalProps) {
  const [editingName, setEditingName] = useState(initialName);
  const [editingContext, setEditingContext] = useState(initialContext);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const recognitionRef = useRef<unknown>(null);

  const DEFAULT_PROFILE_CONTEXT =
    "Je cherche un habitat groupe en Europe. Je cherche une communaute avec des valeurs de bienveillance et de solidarite, des espaces partages et une vie communautaire active.";

  const startVoiceRecording = useCallback(() => {
    const SpeechRecognition = (
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    ) as (new () => { lang: string; continuous: boolean; interimResults: boolean; onresult: ((e: unknown) => void) | null; onerror: ((e: unknown) => void) | null; onend: (() => void) | null; start(): void; stop(): void }) | undefined;

    if (!SpeechRecognition) {
      showToast("La reconnaissance vocale n'est pas supportee par ce navigateur", "error");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    let finalTranscript = "";

    recognition.onresult = (event: unknown) => {
      const e = event as { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; [j: number]: { transcript: string } } } };
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript;
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      setVoiceTranscript(finalTranscript + interim);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      showToast("Erreur de reconnaissance vocale", "error");
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (finalTranscript.trim()) {
        setEditingContext((prev) => prev ? prev + "\n" + finalTranscript.trim() : finalTranscript.trim());
        setVoiceTranscript("");
      }
    };

    setIsRecording(true);
    setVoiceTranscript("");
    recognition.start();
  }, [showToast]);

  const stopVoiceRecording = useCallback(() => {
    const recognition = recognitionRef.current as { stop(): void } | null;
    if (recognition) {
      recognition.stop();
    }
    setIsRecording(false);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-2xl animate-fadeIn p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Mon profil email
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--foreground)] p-1 rounded-lg hover:bg-[var(--surface)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
              Prenom (pour la signature)
            </label>
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              placeholder="Ex: Marie"
              className="w-full px-3 py-2 text-sm border border-[var(--input-border)] rounded-md bg-[var(--input-bg)] text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-[var(--foreground)]">
                Ma situation / ce que je cherche
              </label>
              <button
                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${
                  isRecording
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
                }`}
                title={isRecording ? "Arreter l'enregistrement" : "Dicter avec le micro"}
              >
                <svg className={`w-3.5 h-3.5 ${isRecording ? "animate-recording-pulse" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                {isRecording ? "Arreter" : "Dicter"}
              </button>
            </div>
            {isRecording && voiceTranscript && (
              <div className="mb-1.5 px-3 py-2 text-xs bg-red-50 border border-red-200 rounded-md text-red-700 italic">
                {voiceTranscript}
              </div>
            )}
            <textarea
              value={editingContext}
              onChange={(e) => setEditingContext(e.target.value)}
              placeholder="Decrivez votre situation, vos besoins, ce qui est important pour vous..."
              rows={6}
              className="w-full px-3 py-2 text-sm border border-[var(--input-border)] rounded-md bg-[var(--input-bg)] text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <p className="text-xs text-[var(--muted)] mt-1">
              Ce texte sera utilise pour personnaliser tous vos emails de contact.
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onSave(editingName, editingContext)}
              className="text-sm px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-hover)] font-medium"
            >
              Sauvegarder
            </button>
            <button
              onClick={onClose}
              className="text-sm px-3 py-2 text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                setEditingName("");
                setEditingContext(DEFAULT_PROFILE_CONTEXT);
              }}
              className="text-sm px-3 py-2 text-[var(--primary)] hover:opacity-80 ml-auto"
            >
              Reinitialiser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
