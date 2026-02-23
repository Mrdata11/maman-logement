import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions l\u00e9gales - Cohabitat Europe",
  description: "Politique de confidentialit\u00e9 et mentions l\u00e9gales de Cohabitat Europe",
};

export default function MentionsLegales() {
  return (
    <div className="max-w-2xl mx-auto prose prose-sm">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">
        Mentions l&eacute;gales &amp; Politique de confidentialit&eacute;
      </h1>

      <div className="space-y-8 text-[var(--foreground)]">
        <section>
          <h2 className="text-lg font-semibold mb-2">&Eacute;diteur du site</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Cohabitat Europe est un projet personnel &agrave; but non lucratif d&apos;aide &agrave; la recherche
            d&apos;habitat group&eacute; en Europe. Ce site n&apos;est pas une entreprise commerciale.
          </p>
          <p className="text-sm text-[var(--muted)] leading-relaxed mt-2">
            Contact : via le formulaire de contact sur le site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">H&eacute;bergement</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Le site est h&eacute;berg&eacute; par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, &Eacute;tats-Unis.
            Les donn&eacute;es utilisateur sont stock&eacute;es chez Supabase Inc. (serveurs UE).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Donn&eacute;es personnelles collect&eacute;es</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Nous collectons uniquement les donn&eacute;es que vous fournissez volontairement :
          </p>
          <ul className="text-sm text-[var(--muted)] mt-2 space-y-1 list-disc pl-5">
            <li>Adresse email (lors de la connexion)</li>
            <li>Nom d&apos;affichage, localisation, photos (lors de la cr&eacute;ation de profil)</li>
            <li>R&eacute;ponses au questionnaire de recherche</li>
            <li>Donn&eacute;es sensibles optionnelles : &acirc;ge, genre, orientation (profil uniquement, avec votre consentement explicite)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Finalit&eacute; du traitement</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Vos donn&eacute;es sont utilis&eacute;es exclusivement pour :
          </p>
          <ul className="text-sm text-[var(--muted)] mt-2 space-y-1 list-disc pl-5">
            <li>Personnaliser les r&eacute;sultats de recherche d&apos;habitat group&eacute;</li>
            <li>Permettre aux autres utilisateurs de d&eacute;couvrir votre profil (si publi&eacute;)</li>
            <li>G&eacute;n&eacute;rer des r&eacute;sum&eacute;s IA de votre profil (via Anthropic Claude)</li>
            <li>Transcrire vos enregistrements vocaux (via Groq Whisper)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Services tiers</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Nous utilisons les services tiers suivants :
          </p>
          <ul className="text-sm text-[var(--muted)] mt-2 space-y-1 list-disc pl-5">
            <li><strong>Supabase</strong> (UE) : authentification et stockage des donn&eacute;es</li>
            <li><strong>Anthropic Claude</strong> (&Eacute;tats-Unis) : &eacute;valuation des annonces et g&eacute;n&eacute;ration de r&eacute;sum&eacute;s</li>
            <li><strong>Groq</strong> (&Eacute;tats-Unis) : transcription vocale</li>
            <li><strong>Google OAuth</strong> : connexion via compte Google (optionnel)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Dur&eacute;e de conservation</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Vos donn&eacute;es sont conserv&eacute;es tant que votre compte est actif.
            Les donn&eacute;es locales (favoris, notes) sont stock&eacute;es dans votre navigateur
            et ne sont pas envoy&eacute;es &agrave; nos serveurs sauf si vous vous connectez.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Vos droits (RGPD)</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Conform&eacute;ment au R&egrave;glement G&eacute;n&eacute;ral sur la Protection des Donn&eacute;es (RGPD), vous disposez des droits suivants :
          </p>
          <ul className="text-sm text-[var(--muted)] mt-2 space-y-1 list-disc pl-5">
            <li><strong>Droit d&apos;acc&egrave;s</strong> : consulter vos donn&eacute;es depuis votre profil</li>
            <li><strong>Droit de rectification</strong> : modifier votre profil &agrave; tout moment</li>
            <li><strong>Droit &agrave; l&apos;effacement</strong> : supprimer votre profil et vos donn&eacute;es</li>
            <li><strong>Droit &agrave; la portabilit&eacute;</strong> : exporter vos donn&eacute;es</li>
            <li><strong>Droit d&apos;opposition</strong> : vous d&eacute;sinscrire &agrave; tout moment</li>
          </ul>
          <p className="text-sm text-[var(--muted)] mt-2">
            Pour exercer ces droits, supprimez votre profil depuis la page &laquo; Mon profil &raquo;
            ou contactez-nous par email.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Cookies</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Ce site utilise uniquement des cookies techniques n&eacute;cessaires au fonctionnement
            (authentification Supabase). Aucun cookie de tra&ccedil;age publicitaire n&apos;est utilis&eacute;.
            Les pr&eacute;f&eacute;rences utilisateur (favoris, th&egrave;me) sont stock&eacute;es dans le localStorage
            de votre navigateur.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Sources des annonces</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Les annonces affich&eacute;es sur ce site proviennent de sources publiques (habitat-groupe.be,
            samenhuizen.nl, etc.) et sont agr&eacute;g&eacute;es automatiquement. Nous ne garantissons pas
            l&apos;exactitude ni la disponibilit&eacute; des annonces. Consultez toujours la source originale.
          </p>
        </section>
      </div>
    </div>
  );
}
