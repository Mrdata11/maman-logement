import { CreationPreview } from "@/components/CreationPreview";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aperçu du projet",
  robots: { index: false },
};

export default function ApercuPage() {
  return <div className="max-w-6xl mx-auto"><CreationPreview /></div>;
}
