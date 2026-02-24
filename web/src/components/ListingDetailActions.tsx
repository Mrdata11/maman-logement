"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Listing,
  Evaluation,
  ListingStatus,
  STATUS_CONFIG,
} from "@/lib/types";
import { ProfileEditorModal } from "./ProfileEditorModal";
import { ListingNotesPanel } from "./ListingNotesPanel";
import { ListingEmailPanel } from "./ListingEmailPanel";

interface ListingDetailActionsProps {
  listing: Listing;
  evaluation: Evaluation | null;
}

type Toast = {
  message: string;
  type: "success" | "info" | "error";
};

const DEFAULT_PROFILE_CONTEXT =
  "Je cherche un habitat groupe en Europe. Je cherche une communaute avec des valeurs de bienveillance et de solidarite, des espaces partages et une vie communautaire active.";

const PROFILE_STORAGE_KEY = "user_email_profile";

export function ListingDetailActions({
  listing,
  evaluation,
}: ListingDetailActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ListingStatus>("new");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [emailGenerating, setEmailGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<string | null>(null);
  const [editableEmail, setEditableEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedListing, setCopiedListing] = useState(false);

  // User profile for email generation
  const [profileName, setProfileName] = useState("");
  const [profileContext, setProfileContext] = useState(DEFAULT_PROFILE_CONTEXT);
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  const isFavorite = status === "favorite";

  // Load status, notes & profile from localStorage
  useEffect(() => {
    try {
      const savedStates = JSON.parse(
        localStorage.getItem("listing_states") || "{}"
      );
      const savedNotes = JSON.parse(
        localStorage.getItem("listing_notes") || "{}"
      );
      if (savedStates[listing.id]) {
        setStatus(savedStates[listing.id] as ListingStatus);
      }
      if (savedNotes[listing.id]) {
        setNotes(savedNotes[listing.id]);
      }
    } catch {
      // Ignore parse errors
    }

    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setProfileName(parsed.name || "");
        setProfileContext(parsed.context || DEFAULT_PROFILE_CONTEXT);
      }
    } catch {
      // Ignore parse errors
    }
  }, [listing.id]);

  // Show toast helper
  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Status change
  const handleStatusChange = useCallback(
    (newStatus: ListingStatus) => {
      const prevStatus = status;
      setStatus(newStatus);
      const savedStates = JSON.parse(
        localStorage.getItem("listing_states") || "{}"
      );
      savedStates[listing.id] = newStatus;
      localStorage.setItem("listing_states", JSON.stringify(savedStates));
      setShowStatusMenu(false);
      showToast(
        `Statut: ${STATUS_CONFIG[newStatus].label}`,
        newStatus === "favorite" ? "success" : "info"
      );
      if (newStatus === "favorite" && prevStatus !== "favorite") {
        window.dispatchEvent(new CustomEvent("favorite-added"));
      } else if (newStatus !== "favorite" && prevStatus === "favorite") {
        window.dispatchEvent(new CustomEvent("favorite-removed"));
      }
    },
    [listing.id, showToast, status]
  );

  // Toggle favorite
  const toggleFavorite = useCallback(() => {
    handleStatusChange(isFavorite ? "new" : "favorite");
  }, [isFavorite, handleStatusChange]);

  // Notes save
  const handleNotesSave = useCallback((newNotes: string) => {
    setNotes(newNotes);
    const savedNotes = JSON.parse(
      localStorage.getItem("listing_notes") || "{}"
    );
    savedNotes[listing.id] = newNotes;
    localStorage.setItem("listing_notes", JSON.stringify(savedNotes));
    setShowNotes(false);
    showToast("Notes sauvegardees");
  }, [listing.id, showToast]);

  // Save profile
  const handleProfileSave = useCallback((name: string, context: string) => {
    const profile = { name, context };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    setProfileName(name);
    setProfileContext(context);
    setShowProfileEditor(false);
    showToast("Profil sauvegarde");
    setGeneratedEmail(null);
    setEditableEmail(null);
  }, [showToast]);

  // Generate email
  const handleAutoEmail = useCallback(async () => {
    if (!listing.contact || !listing.contact.includes("@")) {
      showToast("Pas d'adresse email disponible", "error");
      return;
    }

    if (generatedEmail) return;

    setEmailGenerating(true);
    try {
      const response = await fetch("/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing,
          evaluation,
          userProfile: { name: profileName, context: profileContext },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data?.error || "Erreur API";
        if (msg.includes("ANTHROPIC_API_KEY")) {
          showToast("Cle API non configuree. Ajoutez ANTHROPIC_API_KEY dans web/.env.local", "error");
        } else {
          showToast(`Erreur: ${msg}`, "error");
        }
        return;
      }

      const emailText = data.email;
      setGeneratedEmail(emailText);
      setEditableEmail(emailText);
      showToast("Email genere ! Verifiez et modifiez si besoin avant d'envoyer.");
    } catch {
      showToast("Erreur reseau lors de la generation de l'email", "error");
    } finally {
      setEmailGenerating(false);
    }
  }, [listing, evaluation, generatedEmail, profileName, profileContext, showToast]);

  // Copy email to clipboard
  const handleCopyEmail = useCallback(async () => {
    const emailToSend = editableEmail ?? generatedEmail;
    if (!emailToSend) return;
    try {
      await navigator.clipboard.writeText(emailToSend);
      setCopied(true);
      showToast("Email copie dans le presse-papier");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Impossible de copier", "error");
    }
  }, [editableEmail, generatedEmail, showToast]);

  // Copy listing content as Markdown
  const handleCopyListing = useCallback(async () => {
    const lines: string[] = [];
    lines.push(`# ${listing.title}`);
    lines.push("");

    const meta: string[] = [];
    if (listing.location) meta.push(`**Localisation :** ${listing.location}`);
    if (listing.province && listing.province !== listing.location)
      meta.push(`**Province :** ${listing.province}`);
    if (listing.price) meta.push(`**Prix :** ${listing.price}`);
    if (listing.listing_type) meta.push(`**Type :** ${listing.listing_type}`);
    if (listing.date_published)
      meta.push(`**Publié le :** ${listing.date_published}`);
    if (meta.length > 0) {
      lines.push(meta.join("  \n"));
      lines.push("");
    }

    if (listing.contact) {
      lines.push(`**Contact :** ${listing.contact}`);
      lines.push("");
    }

    if (evaluation) {
      lines.push(`## Évaluation IA — ${evaluation.quality_score}/100`);
      lines.push("");
      lines.push(evaluation.quality_summary);
      lines.push("");

      if (evaluation.highlights.length > 0) {
        lines.push("**Points forts :**");
        evaluation.highlights.forEach((h) => lines.push(`- ${h}`));
        lines.push("");
      }
      if (evaluation.concerns.length > 0) {
        lines.push("**Points d'attention :**");
        evaluation.concerns.forEach((c) => lines.push(`- ${c}`));
        lines.push("");
      }
    }

    lines.push("## Description");
    lines.push("");
    lines.push(listing.description);
    lines.push("");
    lines.push(`---`);
    lines.push(`Source : ${listing.source_url}`);

    const markdown = lines.join("\n");
    try {
      await navigator.clipboard.writeText(markdown);
      setCopiedListing(true);
      showToast("Contenu copié en Markdown");
      setTimeout(() => setCopiedListing(false), 2000);
    } catch {
      showToast("Impossible de copier", "error");
    }
  }, [listing, evaluation, showToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        toggleFavorite();
      }
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        handleAutoEmail();
      }
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setShowNotes(true);
      }
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        handleCopyListing();
      }
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        window.open(listing.source_url, "_blank");
      }
      if (e.key === "Escape") {
        if (showProfileEditor) {
          setShowProfileEditor(false);
        } else if (showNotes) {
          setShowNotes(false);
        } else if (showStatusMenu) {
          setShowStatusMenu(false);
        } else {
          router.back();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    toggleFavorite,
    handleAutoEmail,
    handleCopyListing,
    listing.source_url,
    showNotes,
    showStatusMenu,
    showProfileEditor,
    router,
  ]);

  return (
    <>
      {/* Sticky action bar */}
      <div className="sticky top-0 z-30 -mx-4 px-4 sm:-mx-6 sm:px-6 py-3 bg-[var(--card-bg)]/95 backdrop-blur-sm border-b border-[var(--border-color)]/80 flex items-center gap-2 flex-wrap">
        {/* Favorite toggle */}
        <button
          onClick={toggleFavorite}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            isFavorite
              ? "bg-pink-50 text-pink-600 ring-1 ring-pink-200"
              : "bg-[var(--surface)] text-[var(--muted)] hover:bg-pink-50 hover:text-pink-500"
          }`}
          title="Ajouter aux favoris (A)"
        >
          <svg
            className="w-5 h-5"
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          {isFavorite ? "Favori" : "Favoris"}
          <kbd className="hidden sm:inline-block text-[10px] px-1 py-0.5 rounded bg-[var(--surface)] text-[var(--muted)] ml-1">
            A
          </kbd>
        </button>

        {/* Auto email */}
        {listing.contact && listing.contact.includes("@") && (
          <button
            onClick={handleAutoEmail}
            disabled={emailGenerating}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              generatedEmail
                ? "bg-green-50 text-green-600 ring-1 ring-green-200"
                : "bg-[var(--surface)] text-[var(--muted)] hover:bg-green-50 hover:text-green-600"
            } disabled:opacity-50`}
            title="Generer un email personnalise (E)"
          >
            {emailGenerating ? (
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
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
            )}
            {emailGenerating
              ? "Generation..."
              : generatedEmail
                ? "Email genere"
                : "Generer l'email"}
            <kbd className="hidden sm:inline-block text-[10px] px-1 py-0.5 rounded bg-[var(--surface)] text-[var(--muted)] ml-1">
              E
            </kbd>
          </button>
        )}

        {/* Archive toggle */}
        <button
          onClick={() => handleStatusChange(status === "archived" ? "new" : "archived")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            status === "archived"
              ? "bg-stone-100 text-stone-600 ring-1 ring-stone-300"
              : "bg-[var(--surface)] text-[var(--muted)] hover:bg-stone-100 hover:text-stone-600"
          }`}
          title="Archiver"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          {status === "archived" ? "Archivé" : "Archiver"}
        </button>

        {/* Notes toggle */}
        <button
          onClick={() => setShowNotes(!showNotes)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            notes
              ? "bg-amber-50 text-amber-600 ring-1 ring-amber-200"
              : "bg-[var(--surface)] text-[var(--muted)] hover:bg-amber-50 hover:text-amber-600"
          }`}
          title="Ajouter / modifier des notes (N)"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          {notes ? "Notes" : "Note"}
          <kbd className="hidden sm:inline-block text-[10px] px-1 py-0.5 rounded bg-[var(--surface)] text-[var(--muted)] ml-1">
            N
          </kbd>
        </button>

        {/* Source link */}
        <a
          href={listing.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--primary)] transition-all"
          title="Voir l'annonce originale (S)"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          Source
          <kbd className="hidden sm:inline-block text-[10px] px-1 py-0.5 rounded bg-[var(--surface)] text-[var(--muted)] ml-1">
            S
          </kbd>
        </a>

        {/* Copy listing as Markdown */}
        <button
          onClick={handleCopyListing}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            copiedListing
              ? "bg-violet-50 text-violet-600 ring-1 ring-violet-200"
              : "bg-[var(--surface)] text-[var(--muted)] hover:bg-violet-50 hover:text-violet-600"
          }`}
          title="Copier le contenu en Markdown (C)"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {copiedListing ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            )}
          </svg>
          {copiedListing ? "Copié !" : "Copier l'offre"}
          <kbd className="hidden sm:inline-block text-[10px] px-1 py-0.5 rounded bg-[var(--surface)] text-[var(--muted)] ml-1">
            C
          </kbd>
        </button>

        {/* Contact direct */}
        {listing.contact && !listing.contact.includes("@") && (
          <a
            href={`tel:${listing.contact.replace(/\s/g, "")}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            Appeler
          </a>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Status dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${STATUS_CONFIG[status].color}`}
          >
            <span className="text-xs opacity-60 font-normal">Statut</span>
            {STATUS_CONFIG[status].label}
            <svg
              className={`w-3 h-3 transition-transform ${showStatusMenu ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {showStatusMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowStatusMenu(false)}
              />
              <div className="absolute right-0 z-20 mt-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-lg py-1 min-w-[180px]">
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Changer le statut
                </div>
                {(Object.keys(STATUS_CONFIG) as ListingStatus[])
                  .filter((s) => s !== status && s !== "archived" && s !== "rejected")
                  .map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className="w-full text-left px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface)] flex items-center gap-2"
                    >
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${STATUS_CONFIG[s].color}`}
                      >
                        {STATUS_CONFIG[s].label}
                      </span>
                    </button>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Profile editor modal */}
      {showProfileEditor && (
        <ProfileEditorModal
          initialName={profileName}
          initialContext={profileContext}
          onSave={handleProfileSave}
          onClose={() => setShowProfileEditor(false)}
          showToast={showToast}
        />
      )}

      {/* Notes panel */}
      {showNotes && (
        <ListingNotesPanel
          notes={notes}
          onSave={handleNotesSave}
          onClose={() => setShowNotes(false)}
        />
      )}

      {/* Existing notes preview */}
      {notes && !showNotes && (
        <div
          onClick={() => setShowNotes(true)}
          className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <svg
              className="w-4 h-4 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span className="text-xs font-medium text-amber-700">
              Mes notes (cliquer pour modifier)
            </span>
          </div>
          <p className="text-sm text-amber-900 whitespace-pre-wrap">
            {notes}
          </p>
        </div>
      )}

      {/* Generated email preview */}
      {generatedEmail && (
        <ListingEmailPanel
          email={generatedEmail}
          profileName={profileName}
          emailGenerating={emailGenerating}
          onCopy={handleCopyEmail}
          onRegenerate={() => {
            setGeneratedEmail(null);
            setEditableEmail(null);
          }}
          onEditableChange={setEditableEmail}
          onOpenProfileEditor={() => setShowProfileEditor(true)}
          onClose={() => {
            setGeneratedEmail(null);
            setEditableEmail(null);
          }}
          copied={copied}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium animate-slideUp ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : toast.type === "error"
                ? "bg-red-600 text-white"
                : "bg-gray-800 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </>
  );
}
