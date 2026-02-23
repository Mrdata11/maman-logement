import { ProfileCreationFlow } from "@/components/ProfileCreationFlow";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer mon profil",
  robots: { index: false },
};

export default function CreerProfilPage() {
  return (
    <div className="max-w-6xl mx-auto py-4">
      <ProfileCreationFlow />
    </div>
  );
}
