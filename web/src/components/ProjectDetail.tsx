"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Project, ProjectMemberWithProfile } from "@/lib/project-types";
import type { ApplicationWithProfile } from "@/lib/application-types";
import { APPLICATION_STATUS_CONFIG } from "@/lib/application-types";

interface ProjectDetailProps {
  project: Project;
  members: ProjectMemberWithProfile[];
}

export function ProjectDetail({ project, members }: ProjectDetailProps) {
  const [user, setUser] = useState<User | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(
    project.invite_token
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/rejoindre/${project.invite_token}`
      : null
  );
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [applications, setApplications] = useState<ApplicationWithProfile[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const supabase = createClient();

  const isCreator = user?.id === project.user_id;

  const loadApplications = useCallback(async () => {
    setLoadingApps(true);
    try {
      const res = await fetch(`/api/applications/project/${project.id}`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error("Error loading applications:", err);
    }
    setLoadingApps(false);
  }, [project.id]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      if (u?.id === project.user_id) {
        loadApplications();
      }
    });
  }, [supabase, project.user_id, loadApplications]);

  const handleGenerateInvite = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/projects/generate-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: project.id }),
      });
      const data = await res.json();
      if (data.invite_url) {
        setInviteUrl(data.invite_url);
      }
    } catch (err) {
      console.error("Error generating invite:", err);
    }
    setGenerating(false);
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateApplication = async (
    applicationId: string,
    status: "accepted" | "rejected"
  ) => {
    setUpdatingId(applicationId);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setApplications((prev) =>
          prev.map((a) => (a.id === applicationId ? { ...a, status } : a))
        );
      }
    } catch (err) {
      console.error("Error updating application:", err);
    }
    setUpdatingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Membres du projet */}
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8">
        <h2 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-[var(--primary)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          Membres du projet
          <span className="text-sm font-normal text-[var(--muted)]">
            ({members.length})
          </span>
        </h2>

        {members.length === 0 ? (
          <p className="text-sm text-[var(--muted)] text-center py-6">
            Aucun membre pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {members.map((member) => {
              const profile = member.profiles;
              if (!profile) return null;
              return (
                <a
                  key={member.id}
                  href={`/profils/${profile.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-color)] hover:bg-[var(--surface)] transition-colors"
                >
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-semibold text-sm">
                      {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--foreground)] truncate">
                        {profile.display_name}
                      </span>
                      {member.role === "creator" && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full font-medium">
                          Cr&eacute;ateur
                        </span>
                      )}
                      {profile.is_verified && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                          V&eacute;rifi&eacute;
                        </span>
                      )}
                    </div>
                    {profile.location && (
                      <span className="text-xs text-[var(--muted)]">
                        {profile.location}
                      </span>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Section candidatures (visible uniquement par le créateur) */}
      {isCreator && (
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-[var(--primary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
            Candidatures re&ccedil;ues
            {applications.filter((a) => a.status === "pending").length > 0 && (
              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-medium">
                {applications.filter((a) => a.status === "pending").length} en
                attente
              </span>
            )}
          </h2>

          {loadingApps ? (
            <div className="text-sm text-[var(--muted)] text-center py-6">
              Chargement...
            </div>
          ) : applications.length === 0 ? (
            <p className="text-sm text-[var(--muted)] text-center py-6">
              Aucune candidature pour le moment. Les visiteurs de votre projet
              pourront bient&ocirc;t candidater.
            </p>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const profile = app.profiles;
                const statusConfig = APPLICATION_STATUS_CONFIG[app.status];
                return (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface)]/30"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <a
                        href={`/profils/${profile?.id}`}
                        className="shrink-0"
                      >
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.display_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-semibold text-sm">
                            {profile?.display_name
                              ?.charAt(0)
                              ?.toUpperCase() || "?"}
                          </div>
                        )}
                      </a>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <a
                            href={`/profils/${profile?.id}`}
                            className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors truncate"
                          >
                            {profile?.display_name || "Profil"}
                          </a>
                          {profile?.is_verified && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                              V&eacute;rifi&eacute;
                            </span>
                          )}
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusConfig.color}`}
                          >
                            {statusConfig.label}
                          </span>
                        </div>

                        {profile?.location && (
                          <p className="text-xs text-[var(--muted)] mb-1">
                            {profile.location}
                          </p>
                        )}

                        {app.motivation && (
                          <p className="text-sm text-[var(--foreground)] mt-2 leading-relaxed bg-[var(--card-bg)] p-3 rounded-lg border border-[var(--border-light)]">
                            {app.motivation}
                          </p>
                        )}

                        {profile?.ai_tags && profile.ai_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {profile.ai_tags.slice(0, 4).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.5 bg-[var(--primary)]/5 text-[var(--primary)] rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="text-[10px] text-[var(--muted-light)] mt-2">
                          Candidature du{" "}
                          {new Date(app.created_at).toLocaleDateString(
                            "fr-FR",
                            { day: "numeric", month: "long", year: "numeric" }
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    {app.status === "pending" && (
                      <div className="flex gap-2 mt-3 ml-13">
                        <button
                          onClick={() =>
                            handleUpdateApplication(app.id, "accepted")
                          }
                          disabled={updatingId === app.id}
                          className="flex-1 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          Accepter
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateApplication(app.id, "rejected")
                          }
                          disabled={updatingId === app.id}
                          className="flex-1 py-2 bg-[var(--surface)] text-[var(--foreground)] text-xs font-medium rounded-lg border border-[var(--border-color)] hover:bg-[var(--border-light)] transition-colors disabled:opacity-50"
                        >
                          Refuser
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Section invitation (visible uniquement par le créateur) */}
      {isCreator && (
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-2">
            Inviter des membres
          </h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            Partagez ce lien avec les personnes que vous souhaitez inviter dans
            votre projet.
          </p>

          {inviteUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="flex-1 px-3 py-2 bg-[var(--surface)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--foreground)] select-all"
                />
                <button
                  onClick={handleCopy}
                  className="shrink-0 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
                >
                  {copied ? "Copi\u00e9 !" : "Copier"}
                </button>
              </div>
              <button
                onClick={handleGenerateInvite}
                disabled={generating}
                className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
              >
                {generating
                  ? "G\u00e9n\u00e9ration..."
                  : "Reg\u00e9n\u00e9rer un nouveau lien"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerateInvite}
              disabled={generating}
              className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
            >
              {generating
                ? "G\u00e9n\u00e9ration..."
                : "G\u00e9n\u00e9rer un lien d\u2019invitation"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
