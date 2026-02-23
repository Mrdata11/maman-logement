"use client";

import { useState, useEffect, useRef } from "react";

interface ListingEmailPanelProps {
  email: string;
  profileName: string;
  emailGenerating: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
  onEditableChange: (text: string) => void;
  onOpenProfileEditor: () => void;
  onClose: () => void;
  copied: boolean;
}

export function ListingEmailPanel({
  email,
  profileName,
  emailGenerating,
  onCopy,
  onRegenerate,
  onEditableChange,
  onOpenProfileEditor,
  onClose,
  copied,
}: ListingEmailPanelProps) {
  const [editableEmail, setEditableEmail] = useState(email);
  const emailTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditableEmail(email);
  }, [email]);

  useEffect(() => {
    const ta = emailTextareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  }, [editableEmail]);

  const handleChange = (text: string) => {
    setEditableEmail(text);
    onEditableChange(text);
  };

  return (
    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg animate-fadeIn">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-green-800 flex items-center gap-1.5">
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
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          Email generé
          {profileName && (
            <span className="text-xs font-normal text-green-600">
              (de {profileName})
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenProfileEditor}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border-color)] hover:bg-[var(--border-light)] shadow-sm transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Mon profil
          </button>
          <button
            onClick={onClose}
            className="text-green-400 hover:text-green-600 ml-1"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
      <textarea
        ref={emailTextareaRef}
        value={editableEmail}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-green-300 rounded-md bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-green-400 leading-relaxed resize-none overflow-hidden"
      />

      <p className="text-xs text-green-600 text-center mt-3">
        Vous pouvez modifier le texte avant de le copier
      </p>

      <div className="flex gap-3 mt-3">
        <button
          onClick={onRegenerate}
          disabled={emailGenerating}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold border border-green-300 text-green-700 hover:bg-green-100 disabled:opacity-50 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Regenerer
        </button>
        <button
          onClick={onCopy}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
            copied
              ? "bg-green-100 text-green-700 ring-2 ring-green-300"
              : "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-md hover:shadow-lg"
          }`}
        >
          {copied ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copié !
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copier l&apos;email
            </>
          )}
        </button>
      </div>
    </div>
  );
}
