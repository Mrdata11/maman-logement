import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profils communautaires - Cohabitat Europe",
  description:
    "Decouvrez les personnes qui cherchent un habitat groupe en Europe. Parcourez les profils, filtrez par region, valeurs et preferences pour trouver des co-habitants compatibles.",
  openGraph: {
    title: "Profils communautaires - Cohabitat Europe",
    description:
      "Decouvrez les personnes qui cherchent un habitat groupe en Europe. Parcourez les profils et trouvez des co-habitants compatibles.",
    type: "website",
    locale: "fr_BE",
    siteName: "Cohabitat Europe",
  },
};

export default function ProfilsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
