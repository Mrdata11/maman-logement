import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cr\u00e9er un habitat group\u00e9",
  description:
    "Lancez votre projet d\u2019habitat group\u00e9 en Europe. D\u00e9crivez votre vision par questionnaire guid\u00e9, message vocal ou texte libre, et trouvez des personnes pour vous rejoindre.",
  openGraph: {
    title: "Cr\u00e9er un habitat group\u00e9",
    description:
      "Lancez votre projet d\u2019habitat group\u00e9. D\u00e9crivez votre vision et trouvez des personnes pour vous rejoindre.",
  },
};

export default function CreerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
