import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Inscrivez votre lieu de retraite",
  description:
    "Rejoignez notre annuaire gratuit de lieux de retraite. Augmentez votre visibilite aupres d'organisateurs de yoga, meditation et bien-etre.",
};

export default function InscriptionLieuPage() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* En-tete */}
      <div className="text-center mb-12">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-4">
          Inscrivez votre lieu de retraite
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
          Rejoignez notre annuaire gratuit et connectez votre lieu avec des
          organisateurs de retraites qualifies du monde entier.
        </p>
      </div>

      {/* Avantages */}
      <div className="grid gap-6 sm:grid-cols-3 mb-12">
        <div className="bg-[var(--card-bg)] rounded-xl p-6 shadow-[var(--card-shadow)]">
          <div className="w-10 h-10 rounded-lg bg-[#8B6F47]/10 flex items-center justify-center mb-4">
            <svg
              className="w-5 h-5 text-[#8B6F47]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>
          <h3 className="font-serif text-lg font-semibold text-[var(--foreground)] mb-2">
            Visibilite
          </h3>
          <p className="text-sm text-[var(--muted)]">
            Votre lieu est presente a des organisateurs de yoga, meditation et
            bien-etre qui recherchent activement des espaces.
          </p>
        </div>

        <div className="bg-[var(--card-bg)] rounded-xl p-6 shadow-[var(--card-shadow)]">
          <div className="w-10 h-10 rounded-lg bg-[#8B6F47]/10 flex items-center justify-center mb-4">
            <svg
              className="w-5 h-5 text-[#8B6F47]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="font-serif text-lg font-semibold text-[var(--foreground)] mb-2">
            Communaute
          </h3>
          <p className="text-sm text-[var(--muted)]">
            Faites partie d&apos;un reseau de lieux partageant les memes valeurs
            de bien-etre, respect et authenticite.
          </p>
        </div>

        <div className="bg-[var(--card-bg)] rounded-xl p-6 shadow-[var(--card-shadow)]">
          <div className="w-10 h-10 rounded-lg bg-[#8B6F47]/10 flex items-center justify-center mb-4">
            <svg
              className="w-5 h-5 text-[#8B6F47]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="font-serif text-lg font-semibold text-[var(--foreground)] mb-2">
            100% Gratuit
          </h3>
          <p className="text-sm text-[var(--muted)]">
            L&apos;inscription et la presence dans l&apos;annuaire sont
            entierement gratuites. Aucun frais cache ni commission.
          </p>
        </div>
      </div>

      {/* Comment ca marche */}
      <div className="bg-[var(--card-bg)] rounded-xl p-8 shadow-[var(--card-shadow)] mb-12">
        <h2 className="font-serif text-2xl font-semibold text-[var(--foreground)] mb-6 text-center">
          Comment ca marche
        </h2>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#8B6F47] text-white flex items-center justify-center text-sm font-semibold">
              1
            </div>
            <div>
              <h4 className="font-semibold text-[var(--foreground)] mb-1">
                Remplissez le formulaire
              </h4>
              <p className="text-sm text-[var(--muted)]">
                Decrivez votre lieu en 6 etapes simples : informations
                generales, espaces, restauration, tarifs, photos et details.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#8B6F47] text-white flex items-center justify-center text-sm font-semibold">
              2
            </div>
            <div>
              <h4 className="font-semibold text-[var(--foreground)] mb-1">
                Nous validons votre profil
              </h4>
              <p className="text-sm text-[var(--muted)]">
                Notre equipe verifie les informations et cree une fiche
                detaillee pour votre lieu dans l&apos;annuaire.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#8B6F47] text-white flex items-center justify-center text-sm font-semibold">
              3
            </div>
            <div>
              <h4 className="font-semibold text-[var(--foreground)] mb-1">
                Recevez des demandes
              </h4>
              <p className="text-sm text-[var(--muted)]">
                Les organisateurs de retraites vous contactent directement pour
                organiser des sejours dans votre lieu.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA - si pas de token, inviter a nous contacter */}
      <div className="text-center bg-[#8B6F47]/5 rounded-xl p-8">
        <h3 className="font-serif text-xl font-semibold text-[var(--foreground)] mb-3">
          Vous avez recu une invitation ?
        </h3>
        <p className="text-[var(--muted)] mb-6">
          Si vous avez recu un email avec un lien d&apos;inscription, cliquez
          directement sur le lien dans l&apos;email pour acceder au formulaire.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#8B6F47] hover:text-[#705A39] font-medium transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Retour a l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
