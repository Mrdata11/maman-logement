"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Listing,
  Evaluation,
  ListingStatus,
  STATUS_CONFIG,
} from "@/lib/types";

interface ListingDetailActionsProps {
  listing: Listing;
  evaluation: Evaluation | null;
}

type Toast = {
  message: string;
  type: "success" | "info" | "error";
};

const DEFAULT_PROFILE_CONTEXT =
  "Je suis une maman qui cherche un habitat groupe en Belgique. Je pratique la biodanza et je cherche une communaute d'environ 50 personnes, avec des valeurs de bienveillance et de solidarite. Mon budget est de 500 a 750 euros charges comprises, idealement proche de Bruxelles (30-45 min). Je cherche un studio ou petit appartement. J'aimerais une communaute avec des repas partages et une grande salle pour la biodanza.";

const PROFILE_STORAGE_KEY = "user_email_profile";

export function ListingDetailActions({
  listing,
  evaluation,
}: ListingDetailActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ListingStatus>("new");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState("");
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
  const [editingName, setEditingName] = useState("");
  const [editingContext, setEditingContext] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const recognitionRef = useRef<unknown>(null);
  const emailTextareaRef = useRef<HTMLTextAreaElement>(null);

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
        setLocalNotes(savedNotes[listing.id]);
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
      // Notify nav heart icon
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
  const handleNotesSave = () => {
    setNotes(localNotes);
    const savedNotes = JSON.parse(
      localStorage.getItem("listing_notes") || "{}"
    );
    savedNotes[listing.id] = localNotes;
    localStorage.setItem("listing_notes", JSON.stringify(savedNotes));
    setShowNotes(false);
    showToast("Notes sauvegardees");
  };

  // Voice recording for profile
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

  // Save profile
  const handleProfileSave = useCallback(() => {
    const profile = { name: editingName, context: editingContext };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    setProfileName(editingName);
    setProfileContext(editingContext);
    setShowProfileEditor(false);
    showToast("Profil sauvegarde");
    // Clear generated email so it regenerates with new profile
    setGeneratedEmail(null);
    setEditableEmail(null);
  }, [editingName, editingContext, showToast]);

  // Generate email
  const handleAutoEmail = useCallback(async () => {
    if (!listing.contact || !listing.contact.includes("@")) {
      showToast("Pas d'adresse email disponible", "error");
      return;
    }

    if (generatedEmail) {
      // Already generated - email is visible below
      return;
    }

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
  }, [listing, evaluation, generatedEmail, editableEmail, profileName, profileContext, showToast]);

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
      lines.push(`## Évaluation IA — ${evaluation.overall_score}/100`);
      lines.push("");
      lines.push(evaluation.match_summary);
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

  // Regenerate email
  const handleRegenerateEmail = useCallback(() => {
    setGeneratedEmail(null);
    setEditableEmail(null);
  }, []);

  // Auto-resize email textarea to fit content
  useEffect(() => {
    const ta = emailTextareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  }, [editableEmail]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
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
        setLocalNotes(notes);
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
    notes,
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

        {/* Notes toggle */}
        <button
          onClick={() => {
            setShowNotes(!showNotes);
            setLocalNotes(notes);
          }}
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-600 hover:bg-green-100:bg-green-900/40 transition-all"
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
                {(Object.keys(STATUS_CONFIG) as ListingStatus[])
                  .filter((s) => s !== status)
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

      {/* Profile editor (centered modal popup) */}
      {showProfileEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowProfileEditor(false)}
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
                onClick={() => setShowProfileEditor(false)}
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
                  onClick={handleProfileSave}
                  className="text-sm px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-hover)] font-medium"
                >
                  Sauvegarder
                </button>
                <button
                  onClick={() => setShowProfileEditor(false)}
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
      )}

      {/* Notes panel (collapsible) */}
      {showNotes && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-amber-800">
              Mes notes
            </h3>
            <button
              onClick={() => setShowNotes(false)}
              className="text-amber-400 hover:text-amber-600:text-amber-200"
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
          <textarea
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            placeholder="Tes impressions, questions, points importants..."
            rows={3}
            autoFocus
            className="w-full px-3 py-2 text-sm border border-amber-300 rounded-md bg-[var(--input-bg)] text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleNotesSave}
              className="text-sm px-4 py-1.5 bg-amber-600 text-white rounded-md hover:bg-amber-700 font-medium"
            >
              Sauvegarder
            </button>
            <button
              onClick={() => setShowNotes(false)}
              className="text-sm px-3 py-1.5 text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Existing notes preview */}
      {notes && !showNotes && (
        <div
          onClick={() => {
            setShowNotes(true);
            setLocalNotes(notes);
          }}
          className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100:bg-amber-900/30 transition-colors"
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

      {/* Generated email preview (editable) */}
      {generatedEmail && (
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
              Email genere
              {profileName && (
                <span className="text-xs font-normal text-green-600">
                  (de {profileName})
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowProfileEditor(true);
                  setEditingName(profileName);
                  setEditingContext(profileContext);
                }}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border-color)] hover:bg-[var(--border-light)] shadow-sm transition-colors font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Mon profil
              </button>
              <button
                onClick={() => {
                  setGeneratedEmail(null);
                  setEditableEmail(null);
                }}
                className="text-green-400 hover:text-green-600:text-green-200 ml-1"
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
            value={editableEmail ?? ""}
            onChange={(e) => setEditableEmail(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-green-300 rounded-md bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-green-400 leading-relaxed resize-none overflow-hidden"
          />

          <p className="text-xs text-green-600 text-center mt-3">
            Vous pouvez modifier le texte avant de le copier
          </p>

          <div className="flex gap-3 mt-3">
            <button
              onClick={handleRegenerateEmail}
              disabled={emailGenerating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold border border-green-300 text-green-700 hover:bg-green-100 disabled:opacity-50 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerer
            </button>
            <button
              onClick={handleCopyEmail}
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
                  Copie !
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
