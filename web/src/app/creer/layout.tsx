import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creer un habitat groupe - Maman Logement",
  description:
    "Lancez votre projet d'habitat groupe en Belgique. Decrivez votre vision par questionnaire guide, message vocal ou texte libre, et trouvez des personnes pour vous rejoindre.",
  openGraph: {
    title: "Creer un habitat groupe - Maman Logement",
    description:
      "Lancez votre projet d'habitat groupe. Decrivez votre vision et trouvez des personnes pour vous rejoindre.",
    type: "website",
    locale: "fr_BE",
    siteName: "Maman Logement",
  },
};

export default function CreerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
