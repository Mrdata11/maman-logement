import { ScreeningSessionDetail } from "@/components/screening/ScreeningSessionDetail";

export default async function ScreeningSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="max-w-4xl mx-auto">
      <ScreeningSessionDetail sessionId={id} />
    </div>
  );
}
