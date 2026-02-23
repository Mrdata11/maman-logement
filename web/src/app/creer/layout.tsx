import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creer un habitat groupe - Cohabitat Europe",
  description:
    "Lancez votre projet d'habitat groupe en Europe. Decrivez votre vision par questionnaire guide, message vocal ou texte libre, et trouvez des personnes pour vous rejoindre.",
  openGraph: {
    title: "Creer un habitat groupe - Cohabitat Europe",
    description:
      "Lancez votre projet d'habitat groupe. Decrivez votre vision et trouvez des personnes pour vous rejoindre.",
    type: "website",
    locale: "fr_BE",
    siteName: "Cohabitat Europe",
  },
};

export default function CreerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
