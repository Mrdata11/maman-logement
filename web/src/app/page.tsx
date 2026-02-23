import { getListingsWithEvals } from "@/lib/data";
import { HeroBanner } from "@/components/HeroBanner";
import { ListingCardCompact } from "@/components/ListingCardCompact";
import { HomepageProfiles } from "@/components/HomepageProfiles";
import Link from "next/link";

export default function Home() {
  const items = getListingsWithEvals();
  const topListings = items
    .filter((item) => item.evaluation !== null)
    .sort(
      (a, b) =>
        (b.evaluation?.quality_score ?? 0) -
        (a.evaluation?.quality_score ?? 0)
    )
    .slice(0, 6);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <HeroBanner alwaysVisible />

      {/* Habitats groupés à découvrir */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Habitats group&eacute;s &agrave; d&eacute;couvrir
            </h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              Les annonces les mieux &eacute;valu&eacute;es selon nos crit&egrave;res
            </p>
          </div>
          <Link
            href="/habitats"
            className="text-sm font-medium text-[var(--primary)] hover:underline whitespace-nowrap shrink-0"
          >
            Voir tout &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              Personnes qui cherchent
            </h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              Des personnes comme vous, &agrave; la recherche d&apos;un habitat partag&eacute;
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
      <section className="rounded-2xl bg-[var(--surface)] border border-[var(--border-color)] px-6 py-8 sm:px-8 sm:py-10 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-2">
          Rejoignez la communaut&eacute;
        </h2>
        <p className="text-[var(--muted)] mb-6 max-w-lg mx-auto">
          Que vous cherchiez un habitat group&eacute; ou que vous souhaitiez en cr&eacute;er un, Maman Logement vous accompagne.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/questionnaire"
            className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Chercher un lieu
          </Link>
          <Link
            href="/profils/creer"
            className="px-5 py-2.5 border border-[var(--primary)] text-[var(--primary)] rounded-xl text-sm font-medium hover:bg-[var(--primary)]/5 transition-colors"
          >
            Cr&eacute;er mon profil
          </Link>
          <Link
            href="/creer"
            className="px-5 py-2.5 border border-[var(--border-color)] text-[var(--muted)] rounded-xl text-sm font-medium hover:text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors"
          >
            Proposer un projet
          </Link>
        </div>
      </section>
    </div>
  );
}
