"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, X, Loader2 } from "lucide-react";

interface VerificationCTAProps {
  type: "profile" | "project";
  targetId: string;
  isVerified: boolean;
  price?: string;
}

export function VerificationCTA({
  type,
  targetId,
  isVerified,
  price = "9,90€",
}: VerificationCTAProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isVerified) return null;

  const handleStart = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/screening/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, target_id: targetId }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/screening/appel/${data.token}`);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Erreur lors du démarrage.");
        setLoading(false);
      }
    } catch {
      setError("Erreur réseau.");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <ShieldCheck size={22} className="text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-[var(--foreground)] mb-1">
              Obtenez le badge « Profil qualifié »
            </h3>
            <p className="text-sm text-[var(--muted)] mb-3">
              Passez un court entretien vocal pour certifier
              l&apos;authenticité de votre{" "}
              {type === "profile" ? "profil" : "projet"}.
              Cela renforce la confiance des autres membres.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              <ShieldCheck size={16} />
              Qualifier mon {type === "profile" ? "profil" : "projet"} — {price}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmation de paiement simulé */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div
            className="bg-[var(--card-bg)] rounded-xl w-full max-w-sm p-6"
            style={{ boxShadow: "var(--card-shadow-hover)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-[var(--foreground)]">
                Confirmation
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-[var(--muted)] hover:text-[var(--foreground)] rounded transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-[var(--surface)] rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--foreground)]">
                  Qualification{" "}
                  {type === "profile" ? "de profil" : "de projet"}
                </span>
                <span className="font-semibold text-[var(--foreground)]">
                  {price}
                </span>
              </div>
              <p className="text-xs text-[var(--muted)]">
                Entretien vocal (~5 min) + badge qualifié permanent
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 mb-3">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleStart}
                disabled={loading}
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ShieldCheck size={16} />
                )}
                {loading ? "Préparation..." : "Payer et commencer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
