import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Politique de confidentialité et mentions légales de la plateforme Cohabitat Europe.",
};

export default function MentionsLegales() {
  return (
    <div className="max-w-2xl mx-auto prose prose-sm">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">
        Mentions légales &amp; Politique de confidentialité
      </h1>

      <div className="space-y-8 text-[var(--foreground)]">
        <section>
          <h2 className="text-lg font-semibold mb-2">Éditeur du site</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Cohabitat Europe est un projet personnel à but non lucratif d&apos;aide à la recherche
            d&apos;habitat groupé en Europe. Ce site n&apos;est pas une entreprise commerciale.
          </p>
          <p className="text-sm text-[var(--muted)] leading-relaxed mt-2">
            Contact : via le formulaire de contact sur le site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Hébergement</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.
            Les données utilisateur sont stockées chez Supabase Inc. (serveurs UE).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Données personnelles collectées</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Nous collectons uniquement les données que vous fournissez volontairement :
          </p>
          <ul className="text-sm text-[var(--muted)] mt-2 space-y-1 list-disc pl-5">
            <li>Adresse email (lors de la connexion)</li>
            <li>Nom d&apos;affichage, localisation, photos (lors de la création de profil)</li>
            <li>Réponses au questionnaire de recherche</li>
            <li>Données sensibles optionnelles : âge, genre, orientation (profil uniquement, avec votre consentement explicite)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Finalité du traitement</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Vos données sont utilisées exclusivement pour :
          </p>
          <ul className="text-sm text-[var(--muted)] mt-2 space-y-1 list-disc pl-5">
            <li>Personnaliser les résultats de recherche d&apos;habitat groupé</li>
            <li>Permettre aux autres utilisateurs de découvrir votre profil (si publié)</li>
            <li>Générer des résumés IA de votre profil (via Anthropic Claude)</li>
            <li>Transcrire vos enregistrements vocaux (via Groq Whisper)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Services tiers</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Nous utilisons les services tiers suivants :
          </p>
          <ul className="text-sm text-[var(--muted)] mt-2 space-y-1 list-disc pl-5">
            <li><strong>Supabase</strong> (UE) : authentification et stockage des données</li>
            <li><strong>Anthropic Claude</strong> (États-Unis) : évaluation des annonces et génération de résumés</li>
            <li><strong>Groq</strong> (États-Unis) : transcription vocale</li>
            <li><strong>Google OAuth</strong> : connexion via compte Google (optionnel)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Durée de conservation</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Vos données sont conservées tant que votre compte est actif.
            Les données locales (favoris, notes) sont stockées dans votre navigateur
            et ne sont pas envoyées à nos serveurs sauf si vous vous connectez.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Vos droits (RGPD)</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
          </p>
          <ul className="text-sm text-[var(--muted)] mt-2 space-y-1 list-disc pl-5">
            <li><strong>Droit d&apos;accès</strong> : consulter vos données depuis votre profil</li>
            <li><strong>Droit de rectification</strong> : modifier votre profil à tout moment</li>
            <li><strong>Droit à l&apos;effacement</strong> : supprimer votre profil et vos données</li>
            <li><strong>Droit à la portabilité</strong> : exporter vos données</li>
            <li><strong>Droit d&apos;opposition</strong> : vous désinscrire à tout moment</li>
          </ul>
          <p className="text-sm text-[var(--muted)] mt-2">
            Pour exercer ces droits, supprimez votre profil depuis la page « Mon profil »
            ou contactez-nous par email.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Cookies</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Ce site utilise uniquement des cookies techniques nécessaires au fonctionnement
            (authentification Supabase). Aucun cookie de traçage publicitaire n&apos;est utilisé.
            Les préférences utilisateur (favoris, thème) sont stockées dans le localStorage
            de votre navigateur.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Sources des annonces</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Les annonces affichées sur ce site proviennent de sources publiques (habitat-groupe.be,
            samenhuizen.nl, etc.) et sont agrégées automatiquement. Nous ne garantissons pas
            l&apos;exactitude ni la disponibilité des annonces. Consultez toujours la source originale.
          </p>
        </section>
      </div>
    </div>
  );
}
