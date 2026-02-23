import { MetadataRoute } from "next";
import { getListingsWithEvals } from "@/lib/data";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://maman-logement.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const listings = getListingsWithEvals();

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

  const safeDate = (str: string | null): Date => {
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

  return [...staticPages, ...listingPages];
}
