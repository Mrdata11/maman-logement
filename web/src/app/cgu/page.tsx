import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Conditions générales d'utilisation de la plateforme Cohabitat Europe.",
};

export default function CGU() {
  return (
    <div className="max-w-2xl mx-auto prose prose-sm">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">
        Conditions générales d&apos;utilisation
      </h1>

      <div className="space-y-8 text-[var(--foreground)]">
        <section>
          <h2 className="text-lg font-semibold mb-2">Objet</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Cohabitat Europe est une plateforme gratuite d&apos;aide à la recherche d&apos;habitat groupé.
            Elle agrège des annonces publiques, permet de créer un profil de recherche et de publier
            des projets d&apos;habitat groupé. L&apos;utilisation du site implique l&apos;acceptation des
            présentes conditions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Accès au service</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            La consultation des annonces est libre et gratuite, sans inscription.
            La création d&apos;un profil ou d&apos;un projet nécessite une inscription
            (par email ou via Google). Le service est fourni « en l&apos;état »,
            sans garantie de disponibilité permanente.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Contenu des annonces</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Les annonces sont collectées automatiquement depuis des sources publiques tierces.
            Cohabitat Europe ne produit pas ce contenu et ne peut garantir son exactitude, sa complétude
            ou sa disponibilité. Les évaluations IA sont fournies à titre indicatif uniquement.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Profils utilisateurs</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            En créant un profil, vous vous engagez à :
          </p>
          <ul className="text-sm text-[var(--muted)] mt-2 space-y-1 list-disc pl-5">
            <li>Fournir des informations sincères et non trompeuses</li>
            <li>Ne pas publier de contenu illicite, offensant ou discriminatoire</li>
            <li>Utiliser la plateforme uniquement dans le cadre de la recherche d&apos;habitat</li>
            <li>Respecter les autres utilisateurs dans vos échanges</li>
          </ul>
          <p className="text-sm text-[var(--muted)] mt-2">
            Nous nous réservons le droit de supprimer tout profil ne respectant pas ces règles.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Responsabilité</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Cohabitat Europe facilite la mise en relation mais n&apos;est pas partie aux échanges
            entre utilisateurs ni aux transactions liées aux annonces. Nous ne sommes pas responsables
            des conséquences des contacts établis via la plateforme. Nous vous encourageons à
            exercer votre propre jugement et vigilance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Propriété intellectuelle</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Le code source de la plateforme et son design sont protégés. Les annonces
            restent la propriété de leurs auteurs respectifs. Les résumés IA sont
            générés automatiquement et ne constituent pas un contenu éditorial.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Modification des conditions</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Ces conditions peuvent être modifiées à tout moment.
            Les utilisateurs seront informés des changements importants.
            L&apos;utilisation continue du site après modification vaut acceptation.
          </p>
        </section>

        <p className="text-xs text-[var(--muted-light)] pt-4">
          Dernière mise à jour : février 2026
        </p>
      </div>
    </div>
  );
}
