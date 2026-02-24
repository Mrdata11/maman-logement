"use client";

import { useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  Send,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import type { Campaign } from "@/lib/outreach/types";

const CAMPAIGN_STATUS_CONFIG: Record<
  Campaign["status"],
  { label: string; className: string }
> = {
  draft: {
    label: "Brouillon",
    className: "bg-gray-100 text-gray-700",
  },
  active: {
    label: "Active",
    className: "bg-green-100 text-green-700",
  },
  paused: {
    label: "En pause",
    className: "bg-amber-100 text-amber-700",
  },
  completed: {
    label: "Terminee",
    className: "bg-blue-100 text-blue-700",
  },
};

interface CampaignListProps {
  campaigns: Campaign[];
  onSelect?: (campaignId: string) => void;
}

export function CampaignList({ campaigns, onSelect }: CampaignListProps) {
  const router = useRouter();

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12 bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)]">
        <Send
          size={48}
          className="mx-auto text-[var(--muted-light)] mb-4"
        />
        <h2 className="text-lg font-medium text-[var(--foreground)] mb-2">
          Aucune campagne
        </h2>
        <p className="text-[var(--muted)] max-w-md mx-auto">
          Creez votre premiere campagne d&apos;outreach pour commencer a contacter
          des lieux de retraite.
        </p>
      </div>
    );
  }

  const handleClick = (campaignId: string) => {
    if (onSelect) {
      onSelect(campaignId);
    } else {
      router.push(`/admin/outreach/${campaignId}`);
    }
  };

  return (
    <div className="space-y-3">
      {campaigns.map((campaign) => {
        const statusConfig = CAMPAIGN_STATUS_CONFIG[campaign.status];

        return (
          <div
            key={campaign.id}
            onClick={() => handleClick(campaign.id)}
            className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-5 cursor-pointer hover:border-[#8B6F47]/30 hover:shadow-md transition-all"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-medium text-[var(--foreground)] truncate">
                    {campaign.name}
                  </h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusConfig.className}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    {new Date(campaign.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users size={14} />
                    {campaign.stats.total} contacts
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Send size={14} />
                    {campaign.stats.sent} envoyes
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare size={14} />
                    {campaign.stats.replied} reponses
                  </span>
                </div>

                {/* Mini barre de progression */}
                {campaign.stats.total > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 bg-[var(--surface)] rounded-full h-2 overflow-hidden">
                      <div className="h-full flex">
                        {campaign.stats.form_submitted > 0 && (
                          <div
                            className="bg-emerald-500 h-full"
                            style={{
                              width: `${(campaign.stats.form_submitted / campaign.stats.total) * 100}%`,
                            }}
                          />
                        )}
                        {campaign.stats.replied > 0 && (
                          <div
                            className="bg-green-400 h-full"
                            style={{
                              width: `${(campaign.stats.replied / campaign.stats.total) * 100}%`,
                            }}
                          />
                        )}
                        {campaign.stats.sent > 0 && (
                          <div
                            className="bg-blue-400 h-full"
                            style={{
                              width: `${((campaign.stats.sent - campaign.stats.replied - campaign.stats.form_submitted) / campaign.stats.total) * 100}%`,
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-[var(--muted)] shrink-0">
                      {campaign.stats.total > 0
                        ? `${Math.round(
                            (campaign.stats.sent / campaign.stats.total) * 100
                          )}% envoyes`
                        : "0%"}
                    </span>
                  </div>
                )}
              </div>

              <ChevronRight
                size={20}
                className="text-[var(--muted)] shrink-0 mt-1"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
