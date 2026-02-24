import { MetadataRoute } from "next";
import { getListingsWithEvals } from "@/lib/data";
import { getRetreatVenuesWithEvals } from "@/lib/retreats/data";
import { createClient } from "@supabase/supabase-js";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://maman-logement.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = getListingsWithEvals();
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

  const retreatPages: MetadataRoute.Sitemap = retreats.map((item) => ({
    url: `${BASE_URL}/retraites/${item.venue.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // Supabase habitats (projects)
  let habitatPages: MetadataRoute.Sitemap = [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const supabase = createClient(url, key);
    const { data: projects } = await supabase
      .from("projects")
      .select("id, created_at")
      .eq("is_published", true);
    if (projects) {
      habitatPages = projects.map((p) => ({
        url: `${BASE_URL}/habitats/${p.id}`,
        lastModified: safeDate(p.created_at),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  }

  return [...staticPages, ...listingPages, ...retreatPages, ...habitatPages];
}
