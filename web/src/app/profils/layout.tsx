import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profils communautaires",
  description:
    "D\u00e9couvrez les personnes qui cherchent un habitat group\u00e9 en Europe. Parcourez les profils, filtrez par r\u00e9gion, valeurs et pr\u00e9f\u00e9rences pour trouver des co-habitants compatibles.",
  openGraph: {
    title: "Profils communautaires",
    description:
      "D\u00e9couvrez les personnes qui cherchent un habitat group\u00e9 en Europe. Parcourez les profils et trouvez des co-habitants compatibles.",
  },
};

export default function ProfilsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
