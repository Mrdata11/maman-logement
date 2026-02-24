"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ProfileRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnTo: string;
}

export function ProfileRequiredModal({
  isOpen,
  onClose,
  returnTo,
}: ProfileRequiredModalProps) {
  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md mx-4 bg-[var(--card-bg)] rounded-3xl shadow-2xl animate-modalIn overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--surface)] hover:bg-[var(--border-color)] transition-all duration-200 z-10"
          aria-label="Fermer"
        >
          <X className="w-4 h-4 text-[var(--foreground)]" />
        </button>

        <div className="px-8 pt-10 pb-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[var(--primary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
            Profil requis
          </h2>
          <p className="text-sm text-[var(--muted)] mb-6 leading-relaxed">
            Pour candidater, vous devez d&apos;abord cr&eacute;er votre profil.
            Il permettra aux cr&eacute;ateurs de projets de mieux vous
            conna&icirc;tre.
          </p>

          <a
            href={`/profils/creer?returnTo=${encodeURIComponent(returnTo)}`}
            className="inline-block w-full py-3.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-2xl hover:bg-[var(--primary-hover)] transition-all duration-200 shadow-lg shadow-[var(--primary)]/20"
          >
            Cr&eacute;er mon profil
          </a>

          <button
            onClick={onClose}
            className="mt-3 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
