import { MetadataRoute } from "next";
import { getListingsWithEvals, getApartmentsWithEvals } from "@/lib/data";
import { getRetreatVenuesWithEvals } from "@/lib/retreats/data";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://maman-logement.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const listings = getListingsWithEvals();
  const apartments = getApartmentsWithEvals();
  const retreats = getRetreatVenuesWithEvals();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/habitats`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/profils`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/retraites`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/appartements`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/questionnaire`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/creer`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/mentions-legales`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cgu`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const safeDate = (str: string | null | undefined): Date => {
    if (!str) return new Date();
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const listingPages: MetadataRoute.Sitemap = listings.map((item) => ({
    url: `${BASE_URL}/listing/${item.listing.id}`,
    lastModified: safeDate(item.listing.date_published ?? item.listing.date_scraped),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const apartmentPages: MetadataRoute.Sitemap = apartments.map((item) => ({
    url: `${BASE_URL}/appartements/listing/${item.listing.id}`,
    lastModified: safeDate(item.listing.date_published ?? item.listing.date_scraped),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const retreatPages: MetadataRoute.Sitemap = retreats.map((item) => ({
    url: `${BASE_URL}/retraites/${item.venue.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticPages, ...listingPages, ...apartmentPages, ...retreatPages];
}
