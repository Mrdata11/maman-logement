import { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://maman-logement.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/parametres",
          "/profils/mon-profil",
          "/profils/creer",
          "/creer/apercu",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
