import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profils communautaires - Maman Logement",
  description:
    "Decouvrez les personnes qui cherchent un habitat groupe en Belgique. Parcourez les profils, filtrez par region, valeurs et preferences pour trouver des co-habitants compatibles.",
  openGraph: {
    title: "Profils communautaires - Maman Logement",
    description:
      "Decouvrez les personnes qui cherchent un habitat groupe en Belgique. Parcourez les profils et trouvez des co-habitants compatibles.",
    type: "website",
    locale: "fr_BE",
    siteName: "Maman Logement",
  },
};

export default function ProfilsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
