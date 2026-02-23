import { Questionnaire } from "@/components/Questionnaire";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mon profil de recherche",
  description:
    "Répondez au questionnaire pour définir votre profil de recherche d’habitat groupé et recevoir des recommandations personnalisées.",
  openGraph: {
    title: "Mon profil de recherche",
    description:
      "Définissez votre profil de recherche d’habitat groupé en quelques minutes.",
  },
};

export default function QuestionnairePage() {
  return <div className="max-w-6xl mx-auto"><Questionnaire /></div>;
}
