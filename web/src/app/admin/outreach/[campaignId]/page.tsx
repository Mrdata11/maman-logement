import { CampaignDetail } from "@/components/admin/outreach/CampaignDetail";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;

  return (
    <div className="max-w-6xl mx-auto">
      <CampaignDetail campaignId={campaignId} />
    </div>
  );
}
