"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  CheckCircle,
  ExternalLink,
  Loader2,
  ArrowUpDown,
  Users,
  Send as SendIcon,
  MessageSquare,
  FileCheck,
} from "lucide-react";
import type { Campaign, OutreachContact } from "@/lib/outreach/types";

const CONTACT_STATUS_CONFIG: Record<
  OutreachContact["status"],
  { label: string; className: string }
> = {
  pending: {
    label: "En attente",
    className: "bg-gray-100 text-gray-700",
  },
  sent: {
    label: "Envoye",
    className: "bg-blue-100 text-blue-700",
  },
  opened: {
    label: "Ouvert",
    className: "bg-amber-100 text-amber-700",
  },
  replied: {
    label: "Repondu",
    className: "bg-green-100 text-green-700",
  },
  bounced: {
    label: "Rebondi",
    className: "bg-red-100 text-red-700",
  },
  form_submitted: {
    label: "Formulaire soumis",
    className: "bg-emerald-100 text-emerald-800",
  },
};

type SortField = "venue_name" | "status" | "sent_at";
type SortOrder = "asc" | "desc";

interface CampaignDetailProps {
  campaignId: string;
}

export function CampaignDetail({ campaignId }: CampaignDetailProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [contacts, setContacts] = useState<OutreachContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("status");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [updatingContact, setUpdatingContact] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [campaignsRes, contactsRes] = await Promise.all([
        fetch("/api/outreach/campaigns"),
        fetch(`/api/outreach/contacts?campaignId=${campaignId}`),
      ]);

      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        const found = (campaignsData.campaigns as Campaign[]).find(
          (c) => c.id === campaignId
        );
        setCampaign(found || null);
      }

      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(contactsData.contacts || []);
      }
    } catch (e) {
      console.error("Erreur chargement donnees:", e);
      setError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateContactStatus = async (
    venueId: string,
    newStatus: OutreachContact["status"]
  ) => {
    setUpdatingContact(venueId);
    setError(null);

    try {
      const res = await fetch("/api/outreach/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venue_id: venueId,
          campaign_id: campaignId,
          status: newStatus,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setContacts((prev) =>
          prev.map((c) =>
            c.venue_id === venueId ? { ...c, ...data.contact } : c
          )
        );
      } else {
        const data = await res.json().catch(() => ({}));
        setError(
          (data as { error?: string }).error ||
            "Erreur lors de la mise a jour."
        );
      }
    } catch (e) {
      console.error("Erreur mise a jour contact:", e);
      setError("Erreur de connexion au serveur.");
    } finally {
      setUpdatingContact(null);
    }
  };

  const resendEmail = async (venueId: string) => {
    if (!confirm("Renvoyer l'email a ce contact ?")) return;
    setUpdatingContact(venueId);

    try {
      const res = await fetch("/api/outreach/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venue_id: venueId,
          campaign_id: campaignId,
          status: "pending",
        }),
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error("Erreur renvoi:", e);
    } finally {
      setUpdatingContact(null);
    }
  };

  // Statut de priorite pour le tri
  const statusPriority: Record<OutreachContact["status"], number> = {
    pending: 0,
    sent: 1,
    opened: 2,
    replied: 3,
    form_submitted: 4,
    bounced: 5,
  };

  // Filtrage et tri
  const filteredContacts = useMemo(() => {
    let result = contacts;

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.venue_name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query)
      );
    }

    // Tri
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "venue_name":
          comparison = a.venue_name.localeCompare(b.venue_name, "fr");
          break;
        case "status":
          comparison = statusPriority[a.status] - statusPriority[b.status];
          break;
        case "sent_at":
          const dateA = a.sent_at ? new Date(a.sent_at).getTime() : 0;
          const dateB = b.sent_at ? new Date(b.sent_at).getTime() : 0;
          comparison = dateA - dateB;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [contacts, searchQuery, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Statistiques de la campagne basees sur les contacts locaux
  const localStats = useMemo(() => {
    return {
      total: contacts.length,
      pending: contacts.filter((c) => c.status === "pending").length,
      sent: contacts.filter(
        (c) => c.status !== "pending" && c.status !== "bounced"
      ).length,
      replied: contacts.filter((c) => c.status === "replied").length,
      bounced: contacts.filter((c) => c.status === "bounced").length,
      form_submitted: contacts.filter((c) => c.status === "form_submitted")
        .length,
    };
  }, [contacts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#8B6F47] border-t-transparent" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-medium text-[var(--foreground)] mb-2">
          Campagne introuvable
        </h2>
        <p className="text-[var(--muted)] mb-4">
          Cette campagne n&apos;existe pas ou a ete supprimee.
        </p>
        <Link
          href="/admin/outreach"
          className="text-[#8B6F47] hover:underline text-sm"
        >
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <Link
        href="/admin/outreach"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
      >
        <ArrowLeft size={16} />
        Retour aux campagnes
      </Link>

      {/* En-tete campagne */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[var(--foreground)]">
          {campaign.name}
        </h1>
        <p className="text-[var(--muted)] mt-1">
          Creee le{" "}
          {new Date(campaign.created_at).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 flex items-center gap-3">
          <div className="p-2 bg-[#8B6F47]/10 text-[#8B6F47] rounded-lg">
            <Users size={18} />
          </div>
          <div>
            <div className="text-xl font-semibold text-[var(--foreground)]">
              {localStats.total}
            </div>
            <div className="text-xs text-[var(--muted)]">Contacts</div>
          </div>
        </div>
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <SendIcon size={18} />
          </div>
          <div>
            <div className="text-xl font-semibold text-[var(--foreground)]">
              {localStats.sent}
            </div>
            <div className="text-xs text-[var(--muted)]">Envoyes</div>
          </div>
        </div>
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 flex items-center gap-3">
          <div className="p-2 bg-green-50 text-green-600 rounded-lg">
            <MessageSquare size={18} />
          </div>
          <div>
            <div className="text-xl font-semibold text-[var(--foreground)]">
              {localStats.replied}
            </div>
            <div className="text-xs text-[var(--muted)]">Reponses</div>
          </div>
        </div>
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <FileCheck size={18} />
          </div>
          <div>
            <div className="text-xl font-semibold text-[var(--foreground)]">
              {localStats.form_submitted}
            </div>
            <div className="text-xs text-[var(--muted)]">Formulaires</div>
          </div>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Barre de recherche et tri */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un lieu ou un email..."
            className="w-full pl-9 pr-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47]"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toggleSort("venue_name")}
            className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
              sortField === "venue_name"
                ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47]"
                : "border-[var(--border-color)] text-[var(--muted)] hover:bg-[var(--surface)]"
            }`}
          >
            <ArrowUpDown size={14} className="inline mr-1" />
            Nom
          </button>
          <button
            onClick={() => toggleSort("status")}
            className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
              sortField === "status"
                ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47]"
                : "border-[var(--border-color)] text-[var(--muted)] hover:bg-[var(--surface)]"
            }`}
          >
            <ArrowUpDown size={14} className="inline mr-1" />
            Statut
          </button>
          <button
            onClick={() => toggleSort("sent_at")}
            className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
              sortField === "sent_at"
                ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47]"
                : "border-[var(--border-color)] text-[var(--muted)] hover:bg-[var(--surface)]"
            }`}
          >
            <ArrowUpDown size={14} className="inline mr-1" />
            Date
          </button>
        </div>
      </div>

      {/* Tableau de contacts */}
      {filteredContacts.length === 0 ? (
        <div className="text-center py-12 bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)]">
          <Users size={40} className="mx-auto text-[var(--muted-light)] mb-3" />
          <p className="text-[var(--muted)]">
            {searchQuery
              ? "Aucun contact ne correspond a votre recherche."
              : "Aucun contact dans cette campagne."}
          </p>
        </div>
      ) : (
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] overflow-hidden" style={{ boxShadow: "var(--card-shadow)" }}>
          {/* En-tete du tableau (desktop) */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-5 py-3 bg-[var(--surface)] border-b border-[var(--border-color)] text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
            <div className="col-span-3">Lieu</div>
            <div className="col-span-2">Email</div>
            <div className="col-span-1">Statut</div>
            <div className="col-span-2">Date d&apos;envoi</div>
            <div className="col-span-1">Relances</div>
            <div className="col-span-3">Actions</div>
          </div>

          {/* Lignes */}
          <div className="divide-y divide-[var(--border-light)]">
            {filteredContacts.map((contact) => {
              const statusConfig = CONTACT_STATUS_CONFIG[contact.status];
              const isUpdating = updatingContact === contact.venue_id;

              return (
                <div
                  key={`${contact.venue_id}-${contact.campaign_id}`}
                  className="px-5 py-4 sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center space-y-2 sm:space-y-0 hover:bg-[var(--surface)]/50 transition-colors"
                >
                  {/* Nom du lieu */}
                  <div className="col-span-3">
                    <span className="font-medium text-[var(--foreground)] text-sm">
                      {contact.venue_name}
                    </span>
                  </div>

                  {/* Email */}
                  <div className="col-span-2">
                    <span className="text-sm text-[var(--muted)] truncate block">
                      {contact.email}
                    </span>
                  </div>

                  {/* Statut */}
                  <div className="col-span-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig.className}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Date d'envoi */}
                  <div className="col-span-2 text-sm text-[var(--muted)]">
                    {contact.sent_at
                      ? new Date(contact.sent_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </div>

                  {/* Relances */}
                  <div className="col-span-1 text-sm text-[var(--muted)]">
                    {contact.follow_up_count}
                  </div>

                  {/* Actions */}
                  <div className="col-span-3 flex flex-wrap items-center gap-1.5">
                    {isUpdating ? (
                      <Loader2
                        size={16}
                        className="animate-spin text-[#8B6F47]"
                      />
                    ) : (
                      <>
                        <button
                          onClick={() => resendEmail(contact.venue_id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-[#8B6F47] bg-[#8B6F47]/5 hover:bg-[#8B6F47]/10 rounded transition-colors"
                          title="Renvoyer l'email"
                        >
                          <RefreshCw size={12} />
                          Renvoyer
                        </button>
                        {contact.status !== "replied" &&
                          contact.status !== "form_submitted" && (
                            <button
                              onClick={() =>
                                updateContactStatus(
                                  contact.venue_id,
                                  "replied"
                                )
                              }
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-green-700 bg-green-50 hover:bg-green-100 rounded transition-colors"
                              title="Marquer comme repondu"
                            >
                              <CheckCircle size={12} />
                              Repondu
                            </button>
                          )}
                        {contact.form_token && (
                          <button
                            onClick={() => {
                              const url = `${window.location.origin}/venue-form/${contact.form_token}`;
                              window.open(url, "_blank");
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
                            title="Voir le formulaire"
                          >
                            <ExternalLink size={12} />
                            Formulaire
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pied de tableau */}
          <div className="px-5 py-3 bg-[var(--surface)] border-t border-[var(--border-color)] text-xs text-[var(--muted)]">
            {filteredContacts.length} contact{filteredContacts.length !== 1 ? "s" : ""}{" "}
            {searchQuery && `(filtre sur ${contacts.length} total)`}
          </div>
        </div>
      )}
    </div>
  );
}
