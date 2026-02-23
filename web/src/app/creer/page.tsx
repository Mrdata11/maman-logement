"use client";

import { useState } from "react";
import { CreationQuestionnaire } from "@/components/CreationQuestionnaire";
import { VoiceCreation } from "@/components/VoiceCreation";

type InputMethod = null | "questionnaire" | "voice" | "text";

export default function CreerPage() {
  const [method, setMethod] = useState<InputMethod>(null);

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
        <CreationQuestionnaire />
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
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-3">
          Cr&eacute;er un habitat group&eacute;
        </h1>
        <p className="text-[var(--muted)] text-base leading-relaxed">
          Vous portez un projet d&apos;habitat group&eacute; ? D&eacute;crivez-le ici pour que
          des personnes int&eacute;ress&eacute;es puissent vous trouver et vous rejoindre.
        </p>
      </div>

      <div className="space-y-4">
        {/* Option 1: Guided questionnaire */}
        <button
          onClick={() => setMethod("questionnaire")}
          className="w-full text-left bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-5 sm:p-6 hover:border-[var(--primary)]/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[var(--primary)]/15 transition-colors">
              <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-[var(--foreground)] mb-1">
                Questionnaire guid&eacute;
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                R&eacute;pondez &eacute;tape par &eacute;tape &agrave; nos questions pour structurer votre projet :
                lieu, logement, communaut&eacute;, valeurs...
              </p>
            </div>
            <svg className="w-5 h-5 text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                Expliquez votre projet &agrave; voix haute. L&apos;IA structurera les informations
                automatiquement.
              </p>
            </div>
            <svg className="w-5 h-5 text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                D&eacute;crivez votre projet dans un champ texte libre. L&apos;IA extraira les
                informations cl&eacute;s.
              </p>
            </div>
            <svg className="w-5 h-5 text-[var(--muted)] group-hover:text-[var(--golden)] transition-colors shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
}
