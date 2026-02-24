"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Send, Loader2, X } from "lucide-react";
import type { Campaign } from "@/lib/outreach/types";
import { OutreachStats } from "./OutreachStats";
import { CampaignList } from "./CampaignList";

export function OutreachDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignCountry, setNewCampaignCountry] = useState("");
  const [creating, setCreating] = useState(false);
  const [sendingBatch, setSendingBatch] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/outreach/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      } else {
        setError("Impossible de charger les campagnes.");
      }
    } catch (e) {
      console.error("Erreur chargement campagnes:", e);
      setError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/outreach/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCampaignName.trim(),
          target_filter: newCampaignCountry.trim()
            ? { countries: [newCampaignCountry.trim().toUpperCase()] }
            : {},
        }),
      });

      if (res.ok) {
        setNewCampaignName("");
        setNewCampaignCountry("");
        setShowNewForm(false);
        await fetchCampaigns();
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de la creation.");
      }
    } catch (e) {
      console.error("Erreur creation campagne:", e);
      setError("Erreur de connexion au serveur.");
    } finally {
      setCreating(false);
    }
  };

  const handleSendBatch = async (campaignId: string) => {
    if (
      !confirm(
        "Envoyer un batch d'emails pour cette campagne ? Les contacts en attente recevront un email."
      )
    )
      return;

    setSendingBatch(campaignId);
    setError(null);

    try {
      const res = await fetch("/api/outreach/send-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(
          `Batch termine : ${data.sent} envoyes, ${data.failed} echecs.`
        );
        await fetchCampaigns();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(
          (data as { error?: string }).error ||
            "Erreur lors de l'envoi du batch."
        );
      }
    } catch (e) {
      console.error("Erreur envoi batch:", e);
      setError("Erreur de connexion au serveur.");
    } finally {
      setSendingBatch(null);
    }
  };

  // Calculer les statistiques agregees
  const aggregateStats = {
    total_venues_discovered: campaigns.reduce(
      (sum, c) => sum + c.stats.total,
      0
    ),
    contacts_extracted: campaigns.reduce(
      (sum, c) => sum + c.stats.total,
      0
    ),
    emails_sent: campaigns.reduce((sum, c) => sum + c.stats.sent, 0),
    replies: campaigns.reduce((sum, c) => sum + c.stats.replied, 0),
    form_submissions: campaigns.reduce(
      (sum, c) => sum + c.stats.form_submitted,
      0
    ),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#8B6F47] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tete */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[var(--foreground)]">
            Outreach — Lieux de Retraite
          </h1>
          <p className="text-[var(--muted)] mt-1">
            Gerez vos campagnes de prospection et suivez les conversions
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#8B6F47] text-white rounded-lg hover:bg-[#7A6140] transition-colors text-sm font-medium shrink-0"
        >
          <Plus size={18} />
          Nouvelle campagne
        </button>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 hover:text-red-900">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Formulaire de creation inline */}
      {showNewForm && (
        <div
          className="bg-[var(--card-bg)] rounded-xl border border-[#8B6F47]/30 p-5"
          style={{ boxShadow: "var(--card-shadow)" }}
        >
          <h3 className="font-medium text-[var(--foreground)] mb-4">
            Creer une nouvelle campagne
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-sm text-[var(--muted)] mb-1">
                Nom de la campagne
              </label>
              <input
                type="text"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                placeholder="Ex: Prospection France Q1 2026"
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47]"
              />
            </div>
            <div className="sm:w-32">
              <label className="block text-sm text-[var(--muted)] mb-1">
                Pays (code)
              </label>
              <input
                type="text"
                value={newCampaignCountry}
                onChange={(e) => setNewCampaignCountry(e.target.value)}
                placeholder="FR"
                maxLength={2}
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47] uppercase"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleCreateCampaign}
                disabled={creating || !newCampaignName.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#8B6F47] text-white rounded-lg hover:bg-[#7A6140] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                Creer
              </button>
              <button
                onClick={() => {
                  setShowNewForm(false);
                  setNewCampaignName("");
                  setNewCampaignCountry("");
                }}
                className="px-4 py-2 text-[var(--muted)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--surface)] transition-colors text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques agregees */}
      {campaigns.length > 0 && <OutreachStats stats={aggregateStats} />}

      {/* Liste des campagnes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-semibold text-[var(--foreground)]">
            Campagnes
          </h2>
          <span className="text-sm text-[var(--muted)]">
            {campaigns.length} campagne{campaigns.length !== 1 ? "s" : ""}
          </span>
        </div>

        <CampaignList campaigns={campaigns} />

        {/* Boutons d'action par campagne */}
        {campaigns.length > 0 && (
          <div className="mt-4 space-y-2">
            {campaigns
              .filter(
                (c) =>
                  c.status === "draft" || c.status === "active"
              )
              .map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between bg-[var(--surface)] rounded-lg px-4 py-2.5"
                >
                  <span className="text-sm text-[var(--foreground)]">
                    {campaign.name}
                  </span>
                  <button
                    onClick={() => handleSendBatch(campaign.id)}
                    disabled={sendingBatch === campaign.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#8B6F47] text-white rounded-lg hover:bg-[#7A6140] transition-colors text-xs font-medium disabled:opacity-50"
                  >
                    {sendingBatch === campaign.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    Envoyer un batch
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
