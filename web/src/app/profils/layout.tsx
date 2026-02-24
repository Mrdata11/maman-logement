import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profils communautaires",
  description:
    "Rencontre ceux et celles qui veulent vivre autrement. Parcours les profils, filtre par région, valeurs et préférences pour trouver tes futurs co-habitants.",
  openGraph: {
    title: "Profils communautaires",
    description:
      "Rencontre ceux et celles qui veulent vivre autrement. Trouve tes futurs co-habitants en Europe.",
  },
};

export default function ProfilsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
