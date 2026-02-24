"use client";

import { useState, useEffect } from "react";
import { CreationQuestionnaire } from "@/components/CreationQuestionnaire";
import { VoiceCreation } from "@/components/VoiceCreation";
import { CreationLivePreview } from "@/components/CreationLivePreview";
import {
  CreationProjectState,
  CREATION_STORAGE_KEY,
} from "@/lib/creation-questionnaire-types";
import { QuestionnaireAnswers } from "@/lib/questionnaire-types";
import { CREATION_TEMPLATES } from "@/lib/creation-templates";
import Link from "next/link";

type InputMethod = null | "questionnaire" | "voice" | "text";

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "il y a quelques secondes";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} jour${days > 1 ? "s" : ""}`;
}

export default function CreerPage() {
  const [method, setMethod] = useState<InputMethod>(null);
  const [draft, setDraft] = useState<CreationProjectState | null>(null);
  const [draftDismissed, setDraftDismissed] = useState(false);
  const [liveAnswers, setLiveAnswers] = useState<QuestionnaireAnswers>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CREATION_STORAGE_KEY);
      if (saved) {
        const parsed: CreationProjectState = JSON.parse(saved);
        if (!parsed.completedAt && Object.keys(parsed.answers).length > 0) {
          setDraft(parsed);
        }
      }
    } catch {}
  }, []);

  const handleResumeDraft = () => {
    if (draft?.inputMethod === "voice" || draft?.inputMethod === "text") {
      setMethod(draft.inputMethod === "voice" ? "voice" : "text");
    } else {
      setMethod("questionnaire");
    }
  };

  const handleUseTemplate = (template: typeof CREATION_TEMPLATES[number]) => {
    const state: CreationProjectState = {
      answers: template.answers,
      currentStep: 0,
      completedAt: null,
      lastEditedAt: new Date().toISOString(),
      version: 1,
      inputMethod: "manual",
    };
    localStorage.setItem(CREATION_STORAGE_KEY, JSON.stringify(state));
    setLiveAnswers(template.answers);
    setMethod("questionnaire");
  };

  if (method === "questionnaire") {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => setMethod(null)}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Changer de m&eacute;thode
          </button>
        </div>
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <CreationQuestionnaire onAnswersChange={setLiveAnswers} />
          </div>
          <div className="hidden lg:block w-72 xl:w-80 shrink-0">
            <div className="sticky top-6">
              <CreationLivePreview answers={liveAnswers} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (method === "voice" || method === "text") {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => setMethod(null)}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Changer de m&eacute;thode
          </button>
        </div>
        <VoiceCreation initialMode={method === "text" ? "text" : "voice"} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero section */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 mx-auto mb-5 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center">
          <svg className="w-10 h-10 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-3 leading-tight">
          Donnez vie &agrave; votre r&ecirc;ve<br className="hidden sm:block" /> d&apos;habitat partag&eacute;
        </h1>
        <p className="text-[var(--muted)] text-base leading-relaxed max-w-lg mx-auto">
          D&eacute;crivez votre projet en quelques minutes.
          Des personnes qui partagent vos valeurs pourront vous trouver et vous rejoindre.
        </p>
      </div>

      {/* Draft resume banner */}
      {draft && !draftDismissed && (
        <div className="mb-6 bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-xl p-4 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Brouillon en cours
              </p>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                {Object.keys(draft.answers).length} r&eacute;ponse{Object.keys(draft.answers).length > 1 ? "s" : ""} enregistr&eacute;e{Object.keys(draft.answers).length > 1 ? "s" : ""} &middot; {formatRelativeTime(draft.lastEditedAt)}
              </p>
            </div>
            <button
              onClick={() => setDraftDismissed(true)}
              className="shrink-0 p-1 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              aria-label="Fermer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <button
            onClick={handleResumeDraft}
            className="mt-3 w-full px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
          >
            Reprendre mon brouillon
          </button>
        </div>
      )}

      {/* Method selection */}
      <div className="space-y-3">
        {/* Option 1: Guided questionnaire (recommended) */}
        <button
          onClick={() => setMethod("questionnaire")}
          className="w-full text-left bg-[var(--card-bg)] rounded-xl border-2 border-[var(--primary)]/20 p-5 sm:p-6 hover:border-[var(--primary)]/50 hover:shadow-md transition-all group relative"
        >
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-full">
              Recommand&eacute;
            </span>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[var(--primary)]/15 transition-colors">
              <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0 pr-16 sm:pr-20">
              <h2 className="font-semibold text-[var(--foreground)] mb-1">
                Questionnaire guid&eacute;
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                24 questions simples, une &agrave; la fois. Le plus complet pour attirer les bons profils.
              </p>
              <p className="text-xs text-[var(--muted-light)] mt-1.5">
                ~ 5 minutes
              </p>
            </div>
            <svg className="w-5 h-5 text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors shrink-0 mt-1 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* Option 2: Voice */}
        <button
          onClick={() => setMethod("voice")}
          className="w-full text-left bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-5 sm:p-6 hover:border-[var(--primary)]/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[var(--accent)]/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[var(--accent)]/15 transition-colors">
              <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-[var(--foreground)] mb-1">
                Racontez en vocal
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Parlez naturellement de votre projet. L&apos;IA structure tout pour vous.
              </p>
              <p className="text-xs text-[var(--muted-light)] mt-1.5">
                ~ 3 minutes
              </p>
            </div>
            <svg className="w-5 h-5 text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors shrink-0 mt-1 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* Option 3: Free text */}
        <button
          onClick={() => setMethod("text")}
          className="w-full text-left bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-5 sm:p-6 hover:border-[var(--primary)]/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[var(--golden)]/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[var(--golden)]/15 transition-colors">
              <svg className="w-6 h-6 text-[var(--golden)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-[var(--foreground)] mb-1">
                &Eacute;crire librement
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                D&eacute;crivez votre projet en texte libre. L&apos;IA extraira les informations cl&eacute;s.
              </p>
              <p className="text-xs text-[var(--muted-light)] mt-1.5">
                ~ 3 minutes
              </p>
            </div>
            <svg className="w-5 h-5 text-[var(--muted)] group-hover:text-[var(--golden)] transition-colors shrink-0 mt-1 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>

      {/* Quick-start templates */}
      <div className="mt-8">
        <p className="text-xs font-medium text-[var(--muted)] text-center mb-3">
          D&eacute;marrer avec un mod&egrave;le
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          {CREATION_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => handleUseTemplate(tpl)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border-color)] rounded-full text-xs font-medium text-[var(--foreground)] hover:border-[var(--primary)]/50 hover:text-[var(--primary)] transition-colors"
            >
              {tpl.icon === "tree" && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              )}
              {tpl.icon === "building" && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )}
              {tpl.icon === "heart" && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inspiration link */}
      <div className="mt-6 text-center">
        <Link
          href="/habitats"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
        >
          Voir les habitats existants
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
