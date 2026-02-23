import { getListingsWithEvals } from "@/lib/data";
import { HeroBanner } from "@/components/HeroBanner";
import { ListingCardCompact } from "@/components/ListingCardCompact";
import { HomepageProfiles } from "@/components/HomepageProfiles";
import Link from "next/link";

export default function Home() {
  const items = getListingsWithEvals();
  const evaluated = items.filter((item) => item.evaluation !== null);
  const topListings = evaluated
    .sort(
      (a, b) =>
        (b.evaluation?.quality_score ?? 0) -
        (a.evaluation?.quality_score ?? 0)
    )
    .slice(0, 6);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <HeroBanner
        alwaysVisible
        listingCount={items.length}
      />

      {/* Comment &ccedil;a marche — 3 &eacute;tapes */}
      <section>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] text-center mb-2">
          Comment &ccedil;a marche
        </h2>
        <p className="text-sm text-[var(--muted)] text-center mb-8 max-w-lg mx-auto">
          En 3 &eacute;tapes, trouvez l&apos;habitat qui vous correspond
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="relative text-center px-4 py-6">
            <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-lg font-bold text-[var(--primary)]">1</span>
            </div>
            <h3 className="font-semibold text-[var(--foreground)] mb-1.5">R&eacute;pondez au questionnaire</h3>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Vos envies, votre budget, vos valeurs &mdash; en 5 minutes, on comprend ce que vous cherchez.
            </p>
          </div>
          <div className="relative text-center px-4 py-6">
            <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-lg font-bold text-[var(--accent)]">2</span>
            </div>
            <h3 className="font-semibold text-[var(--foreground)] mb-1.5">D&eacute;couvrez des lieux &eacute;valu&eacute;s</h3>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Notre IA analyse chaque annonce et vous pr&eacute;sente les projets les plus pertinents pour vous.
            </p>
          </div>
          <div className="relative text-center px-4 py-6">
            <div className="w-12 h-12 rounded-full bg-[var(--golden)]/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-lg font-bold text-[var(--golden)]">3</span>
            </div>
            <h3 className="font-semibold text-[var(--foreground)] mb-1.5">Connectez-vous avec d&apos;autres</h3>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Cr&eacute;ez votre profil et rencontrez des personnes qui partagent votre vision de vie.
            </p>
          </div>
        </div>
      </section>

      {/* Habitats group&eacute;s &agrave; d&eacute;couvrir */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Les projets les mieux not&eacute;s
            </h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              S&eacute;lectionn&eacute;s et &eacute;valu&eacute;s par notre IA parmi {items.length}+ annonces
            </p>
          </div>
          <Link
            href="/habitats"
            className="text-sm font-medium text-[var(--primary)] hover:underline whitespace-nowrap shrink-0"
          >
            Voir tout &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {topListings.map((item) => (
            <ListingCardCompact key={item.listing.id} item={item} />
          ))}
        </div>
      </section>

      {/* Personnes qui cherchent */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Ils cherchent aussi
            </h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              Des personnes comme vous, pr&ecirc;tes &agrave; vivre autrement
            </p>
          </div>
          <Link
            href="/profils"
            className="text-sm font-medium text-[var(--primary)] hover:underline whitespace-nowrap shrink-0"
          >
            Voir tout &rarr;
          </Link>
        </div>
        <HomepageProfiles />
      </section>

      {/* CTA final */}
      <section className="rounded-2xl overflow-hidden border border-[var(--border-color)]">
        <div className="bg-[var(--primary)] px-6 py-10 sm:px-10 sm:py-14 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
            Vous n&apos;&ecirc;tes pas seul&middot;e &agrave; vouloir vivre autrement
          </h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto leading-relaxed">
            Rejoignez une communaut&eacute; de personnes qui r&ecirc;vent, cherchent et construisent des lieux de vie partag&eacute;s &agrave; travers l&apos;Europe.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/questionnaire"
              className="px-6 py-3 bg-white text-[var(--primary)] rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors shadow-sm"
            >
              Commencer ma recherche
            </Link>
            <Link
              href="/profils/creer"
              className="px-6 py-3 border border-white/40 text-white rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Cr&eacute;er mon profil
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
