import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profils communautaires",
  description:
    "Découvrez les personnes qui cherchent un habitat groupé en Europe. Parcourez les profils, filtrez par région, valeurs et préférences pour trouver des co-habitants compatibles.",
  openGraph: {
    title: "Profils communautaires",
    description:
      "Découvrez les personnes qui cherchent un habitat groupé en Europe. Parcourez les profils et trouvez des co-habitants compatibles.",
  },
};

export default function ProfilsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
