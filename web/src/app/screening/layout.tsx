import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Screening vocal",
  description:
    "Configurez et gérez vos entretiens de pré-sélection vocaux par IA.",
  robots: { index: false },
};

export default function ScreeningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
