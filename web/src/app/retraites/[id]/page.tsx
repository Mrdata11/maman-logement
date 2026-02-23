import { notFound } from "next/navigation";
import { getRetreatVenueById, getRetreatVenuesWithEvals } from "@/lib/retreats/data";
import { RetreatVenueDetail } from "@/components/retreats/RetreatVenueDetail";
import type { Metadata } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://maman-logement.vercel.app";

export function generateStaticParams() {
  const items = getRetreatVenuesWithEvals();
  return items.map((item) => ({ id: item.venue.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = getRetreatVenueById(id);
  if (!item) return { title: "Lieu non trouvé" };

  const { venue, evaluation } = item;
  const title = `${venue.name}${venue.city || venue.region ? ` — ${venue.city || venue.region}` : ""}`;
  const description = evaluation?.ai_description || venue.description.slice(0, 160);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/retraites/${venue.id}`,
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function RetreatVenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getRetreatVenueById(id);

  if (!item) {
    notFound();
  }

  const { venue, evaluation } = item;
  const title = `${venue.name}${venue.city || venue.region ? ` — ${venue.city || venue.region}` : ""}`;
  const description = evaluation?.ai_description || venue.description.slice(0, 160);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LodgingBusiness",
        name: venue.name,
        description,
        url: `${BASE_URL}/retraites/${venue.id}`,
        ...(venue.city || venue.region || venue.country ? {
          address: {
            "@type": "PostalAddress",
            ...(venue.city && { addressLocality: venue.city }),
            ...(venue.region && { addressRegion: venue.region }),
            ...(venue.country && { addressCountry: venue.country }),
          },
        } : {}),
        ...(venue.capacity_max && {
          amenityFeature: {
            "@type": "LocationFeatureSpecification",
            name: "Capacité maximale",
            value: venue.capacity_max,
          },
        }),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Accueil",
            item: BASE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Retraites",
            item: `${BASE_URL}/retraites`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: venue.name,
            item: `${BASE_URL}/retraites/${venue.id}`,
          },
        ],
      },
    ],
  };

  return (
    <article className="max-w-6xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RetreatVenueDetail item={item} />
    </article>
  );
}
