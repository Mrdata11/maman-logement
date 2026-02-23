"use client";

import { useState } from "react";
import { X, Copy, Check, Link as LinkIcon } from "lucide-react";

interface ScreeningLinkGeneratorProps {
  configId: string;
  configTitle: string;
  onClose: () => void;
  onSessionCreated: () => void;
}

export function ScreeningLinkGenerator({
  configId,
  configTitle,
  onClose,
  onSessionCreated,
}: ScreeningLinkGeneratorProps) {
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!candidateName.trim()) {
      setError("Le nom du candidat est requis.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/screening/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config_id: configId,
          candidate_name: candidateName.trim(),
          candidate_email: candidateEmail.trim() || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const token = data.session?.link?.token;
        if (token) {
          const baseUrl = window.location.origin;
          setGeneratedLink(`${baseUrl}/screening/appel/${token}`);
          onSessionCreated();
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Erreur lors de la création.");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = generatedLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        className="bg-[var(--card-bg)] rounded-xl w-full max-w-md p-6"
        style={{ boxShadow: "var(--card-shadow-hover)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-medium text-[var(--foreground)]">
            Nouveau screening
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-[var(--muted)] mb-4">
          Config : <span className="font-medium">{configTitle}</span>
        </p>

        {!generatedLink ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Nom du candidat
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Ex: Jean Dupont"
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Email (optionnel)
              </label>
              <input
                type="email"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                placeholder="jean.dupont@email.com"
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <LinkIcon size={16} />
              {creating ? "Génération..." : "Générer le lien"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-sm">
              Lien créé pour{" "}
              <span className="font-medium">{candidateName}</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={generatedLink}
                readOnly
                className="flex-1 px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--surface)] text-[var(--foreground)] text-xs font-mono"
              />
              <button
                onClick={copyLink}
                className="px-3 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors shrink-0"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>

            <p className="text-xs text-[var(--muted)]">
              Ce lien expire dans 7 jours. Partagez-le avec le candidat.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCandidateName("");
                  setCandidateEmail("");
                  setGeneratedLink(null);
                }}
                className="flex-1 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Créer un autre
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 bg-[var(--surface)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--border-color)] transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
