import { Questionnaire } from "@/components/Questionnaire";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mon profil de recherche",
  description:
    "R\u00e9pondez au questionnaire pour d\u00e9finir votre profil de recherche d\u2019habitat group\u00e9 et recevoir des recommandations personnalis\u00e9es.",
  openGraph: {
    title: "Mon profil de recherche",
    description:
      "D\u00e9finissez votre profil de recherche d\u2019habitat group\u00e9 en quelques minutes.",
  },
};

export default function QuestionnairePage() {
  return <Questionnaire />;
}
