import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions d'utilisation - Cohabitat Europe",
  description: "Conditions g\u00e9n\u00e9rales d'utilisation de Cohabitat Europe",
};

export default function CGU() {
  return (
    <div className="max-w-2xl mx-auto prose prose-sm">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">
        Conditions g&eacute;n&eacute;rales d&apos;utilisation
      </h1>

      <div className="space-y-8 text-[var(--foreground)]">
        <section>
          <h2 className="text-lg font-semibold mb-2">Objet</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Cohabitat Europe est une plateforme gratuite d&apos;aide &agrave; la recherche d&apos;habitat group&eacute;.
            Elle agr&egrave;ge des annonces publiques, permet de cr&eacute;er un profil de recherche et de publier
            des projets d&apos;habitat group&eacute;. L&apos;utilisation du site implique l&apos;acceptation des
            pr&eacute;sentes conditions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Acc&egrave;s au service</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            La consultation des annonces est libre et gratuite, sans inscription.
            La cr&eacute;ation d&apos;un profil ou d&apos;un projet n&eacute;cessite une inscription
            (par email ou via Google). Le service est fourni &laquo; en l&apos;&eacute;tat &raquo;,
            sans garantie de disponibilit&eacute; permanente.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Contenu des annonces</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Les annonces sont collect&eacute;es automatiquement depuis des sources publiques tierces.
            Cohabitat Europe ne produit pas ce contenu et ne peut garantir son exactitude, sa compl&eacute;tude
            ou sa disponibilit&eacute;. Les &eacute;valuations IA sont fournies &agrave; titre indicatif uniquement.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Profils utilisateurs</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            En cr&eacute;ant un profil, vous vous engagez &agrave; :
          </p>
          <ul className="text-sm text-[var(--muted)] mt-2 space-y-1 list-disc pl-5">
            <li>Fournir des informations sinc&egrave;res et non trompeuses</li>
            <li>Ne pas publier de contenu illicite, offensant ou discriminatoire</li>
            <li>Utiliser la plateforme uniquement dans le cadre de la recherche d&apos;habitat</li>
            <li>Respecter les autres utilisateurs dans vos &eacute;changes</li>
          </ul>
          <p className="text-sm text-[var(--muted)] mt-2">
            Nous nous r&eacute;servons le droit de supprimer tout profil ne respectant pas ces r&egrave;gles.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Responsabilit&eacute;</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Cohabitat Europe facilite la mise en relation mais n&apos;est pas partie aux &eacute;changes
            entre utilisateurs ni aux transactions li&eacute;es aux annonces. Nous ne sommes pas responsables
            des cons&eacute;quences des contacts &eacute;tablis via la plateforme. Nous vous encourageons &agrave;
            exercer votre propre jugement et vigilance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Propri&eacute;t&eacute; intellectuelle</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Le code source de la plateforme et son design sont prot&eacute;g&eacute;s. Les annonces
            restent la propri&eacute;t&eacute; de leurs auteurs respectifs. Les r&eacute;sum&eacute;s IA sont
            g&eacute;n&eacute;r&eacute;s automatiquement et ne constituent pas un contenu &eacute;ditorial.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Modification des conditions</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Ces conditions peuvent &ecirc;tre modifi&eacute;es &agrave; tout moment.
            Les utilisateurs seront inform&eacute;s des changements importants.
            L&apos;utilisation continue du site apr&egrave;s modification vaut acceptation.
          </p>
        </section>

        <p className="text-xs text-[var(--muted-light)] pt-4">
          Derni&egrave;re mise &agrave; jour : f&eacute;vrier 2026
        </p>
      </div>
    </div>
  );
}
