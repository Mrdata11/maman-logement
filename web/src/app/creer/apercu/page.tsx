import { CreationPreview } from "@/components/CreationPreview";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aper\u00e7u du projet",
  robots: { index: false },
};

export default function ApercuPage() {
  return <CreationPreview />;
}
