"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { VenueFormWizard } from "@/components/venue-form/VenueFormWizard";
import Link from "next/link";

interface TokenValidation {
  valid: boolean;
  venue_name?: string;
  venue_id?: string;
}

export default function InscriptionLieuTokenPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [validation, setValidation] = useState<TokenValidation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function validateToken() {
      try {
        const response = await fetch(
          `/api/venue-submission/validate-token?token=${encodeURIComponent(token)}`
        );
        const data = await response.json();
        setValidation(data);
      } catch {
        setError("Impossible de valider votre lien. Veuillez reessayer.");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      validateToken();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <div className="inline-flex items-center gap-3 text-[var(--muted)]">
          <svg
            className="w-5 h-5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
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
          Verification de votre lien en cours...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8">
          <svg
            className="w-12 h-12 text-red-400 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <h2 className="font-serif text-xl font-semibold text-red-800 mb-2">
            Erreur de validation
          </h2>
          <p className="text-red-600 mb-6">{error}</p>
          <Link
            href="/inscription-lieu"
            className="inline-flex items-center gap-2 text-[#8B6F47] hover:text-[#705A39] font-medium"
          >
            Retour
          </Link>
        </div>
      </div>
    );
  }

  if (!validation?.valid) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8">
          <svg
            className="w-12 h-12 text-amber-400 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <h2 className="font-serif text-xl font-semibold text-amber-800 mb-2">
            Lien invalide ou expire
          </h2>
          <p className="text-amber-700 mb-6">
            Ce lien d&apos;inscription n&apos;est pas valide ou a deja ete
            utilise. Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur,
            veuillez nous contacter.
          </p>
          <Link
            href="/inscription-lieu"
            className="inline-flex items-center gap-2 text-[#8B6F47] hover:text-[#705A39] font-medium"
          >
            En savoir plus sur l&apos;inscription
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-2">
          Inscription de votre lieu
        </h1>
        {validation.venue_name && (
          <p className="text-lg text-[#8B6F47] font-medium">
            {validation.venue_name}
          </p>
        )}
        <p className="text-[var(--muted)] mt-2">
          Remplissez le formulaire ci-dessous pour inscrire votre lieu dans
          notre annuaire. Toutes les informations sont modifiables par la suite.
        </p>
      </div>

      <VenueFormWizard
        token={token}
        venueId={validation.venue_id}
        venueName={validation.venue_name}
      />
    </div>
  );
}
