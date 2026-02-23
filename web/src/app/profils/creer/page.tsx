import { ProfileCreationFlow } from "@/components/ProfileCreationFlow";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cr\u00e9er mon profil",
  robots: { index: false },
};

export default function CreerProfilPage() {
  return (
    <div className="py-4">
      <ProfileCreationFlow />
    </div>
  );
}
