import type { Metadata } from "next";
import { ScreeningCallInterface } from "@/components/screening/ScreeningCallInterface";

export const metadata: Metadata = {
  title: "Entretien vocal",
  robots: { index: false },
};

export default async function ScreeningCallPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ScreeningCallInterface token={token} />;
}
