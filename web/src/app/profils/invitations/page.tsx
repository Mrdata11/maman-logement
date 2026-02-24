"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface InvitationProject {
  id: string;
  name: string;
  vision: string | null;
  images: string[] | null;
  location: string | null;
  province: string | null;
  country: string | null;
}

interface Inviter {
  display_name: string;
  avatar_url: string | null;
}

interface Invitation {
  id: string;
  project_id: string;
  email: string;
  status: string;
  created_at: string;
  project: InvitationProject | null;
  inviter: Inviter | null;
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [user, setUser] = useState<boolean>(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) {
        setLoading(false);
        return;
      }
      setUser(true);
      loadInvitations();
    });
  }, [supabase]);

  const loadInvitations = async () => {
    try {
      const res = await fetch("/api/projects/my-invitations");
      if (res.ok) {
        const data = await res.json();
        setInvitations(data);
      }
    } catch {
      // Silently fail
    }
    setLoading(false);
  };

  const handleRespond = async (invitationId: string, action: "accept" | "decline") => {
    setRespondingId(invitationId);
    try {
      const res = await fetch("/api/projects/invitations/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitation_id: invitationId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        if (action === "accept" && data.project_id) {
          router.push(`/habitats/${data.project_id}`);
        } else {
          setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
        }
      }
    } catch {
      // Silently fail
    }
    setRespondingId(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Mes invitations
        </h1>
        <p className="text-[var(--muted)] mt-1">
          Les habitats qui souhaitent t&apos;accueillir.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="flex justify-center gap-1.5 mb-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 bg-[var(--primary)] rounded-full"
                style={{
                  animation: `recording-pulse 1s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
          <p className="text-sm text-[var(--muted)]">
            Chargement des invitations...
          </p>
        </div>
      )}

      {/* Not logged in */}
      {!loading && !user && (
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 mx-auto bg-[var(--surface)] rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-[var(--foreground)] font-medium">
            Connectez-vous pour voir vos invitations
          </p>
          <p className="text-sm text-[var(--muted)]">
            Vous devez &ecirc;tre connect&eacute;(e) pour acc&eacute;der &agrave; cette page.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && user && invitations.length === 0 && (
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 mx-auto bg-[var(--surface)] rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <p className="text-[var(--foreground)] font-medium">
            Aucune invitation pour le moment
          </p>
          <p className="text-sm text-[var(--muted)]">
            Quand un habitat t&apos;invitera, tu le verras ici.
          </p>
          <a
            href="/habitats"
            className="inline-block px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
          >
            Explorer les habitats
          </a>
        </div>
      )}

      {/* Invitation cards */}
      {!loading && invitations.length > 0 && (
        <div className="space-y-4">
          {invitations.map((invitation) => {
            const project = invitation.project;
            const inviter = invitation.inviter;
            const firstImage = project?.images?.[0];

            return (
              <div
                key={invitation.id}
                className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Image header */}
                {firstImage && (
                  <div className="h-40 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={firstImage}
                      alt={project?.name || ""}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-5 space-y-4">
                  {/* Project info */}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-lg text-[var(--foreground)] truncate">
                          {project?.name || "Projet inconnu"}
                        </h3>
                        {project?.vision && (
                          <p className="text-sm text-[var(--muted)] italic mt-1 line-clamp-2">
                            &laquo; {project.vision} &raquo;
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                        Invitation
                      </span>
                    </div>

                    {/* Location */}
                    {(project?.location || project?.province) && (
                      <p className="text-sm text-[var(--muted)] flex items-center gap-1 mt-2">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {[project.location, project.province, project.country].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>

                  {/* Inviter info */}
                  <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    {inviter?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={inviter.avatar_url}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-[var(--primary)]">
                          {inviter?.display_name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                    <span>
                      Invit&eacute;(e) par <strong className="text-[var(--foreground)]">{inviter?.display_name || "Quelqu'un"}</strong>
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      &middot; {new Date(invitation.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleRespond(invitation.id, "accept")}
                      disabled={respondingId === invitation.id}
                      className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      Accepter
                    </button>
                    <button
                      onClick={() => handleRespond(invitation.id, "decline")}
                      disabled={respondingId === invitation.id}
                      className="flex-1 px-4 py-2.5 bg-[var(--surface)] text-[var(--foreground)] rounded-xl text-sm font-medium border border-[var(--border-color)] hover:bg-[var(--border-light)] transition-colors disabled:opacity-50"
                    >
                      D&eacute;cliner
                    </button>
                    <a
                      href={`/habitats/${invitation.project_id}`}
                      className="px-4 py-2.5 text-[var(--primary)] text-sm font-medium hover:text-[var(--primary-hover)] transition-colors"
                    >
                      Voir le projet
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
