import { ScreeningConfigForm } from "@/components/screening/ScreeningConfigForm";

export default async function ScreeningEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="max-w-3xl mx-auto">
      <ScreeningConfigForm configId={id} />
    </div>
  );
}
