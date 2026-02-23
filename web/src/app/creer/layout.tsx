import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un habitat groupé",
  description:
    "Lancez votre projet d’habitat groupé en Europe. Décrivez votre vision par questionnaire guidé, message vocal ou texte libre, et trouvez des personnes pour vous rejoindre.",
  openGraph: {
    title: "Créer un habitat groupé",
    description:
      "Lancez votre projet d’habitat groupé. Décrivez votre vision et trouvez des personnes pour vous rejoindre.",
  },
};

export default function CreerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
