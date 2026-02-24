"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Project, ProjectMemberWithProfile } from "@/lib/project-types";
import type { ApplicationWithProfile } from "@/lib/application-types";
import { APPLICATION_STATUS_CONFIG } from "@/lib/application-types";
import { ProfileCard } from "@/components/ProfileCard";
import { ApplyButton } from "@/components/ApplyButton";
import type { ProfileCard as ProfileCardType } from "@/lib/profile-types";
import { deriveProfileCardData } from "@/lib/profile-types";
import type { StepSection } from "@/app/projets/[id]/page";

interface ProjectDetailProps {
  project: Project;
  members: ProjectMemberWithProfile[];
  stepSections: StepSection[];
}

type ActiveTab = "candidats" | "annonce";

interface ProjectInvitation {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

const PROFILE_STATES_KEY = "project_profile_states";

function getProfileStatesKey(projectId: string) {
  return `${PROFILE_STATES_KEY}_${projectId}`;
}

export function ProjectDetail({ project, members, stepSections }: ProjectDetailProps) {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("annonce");
  const [applications, setApplications] = useState<ApplicationWithProfile[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [profileStates, setProfileStates] = useState<Record<string, string>>({});

  // Édition de l'annonce
  const [editingVision, setEditingVision] = useState(false);
  const [visionDraft, setVisionDraft] = useState(project.vision || "");
  const [savingVision, setSavingVision] = useState(false);

  // Photos du projet
  const [projectImages, setProjectImages] = useState<string[]>(project.images || []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Invitation par email
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<ProjectInvitation[]>([]);

  // Invite link
  const [inviteUrl, setInviteUrl] = useState<string | null>(
    project.invite_token
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/rejoindre/${project.invite_token}`
      : null
  );
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const supabase = createClient();
  const isCreator = user?.id === project.user_id;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(getProfileStatesKey(project.id)) || "{}");
      setProfileStates(saved);
    } catch { /* ignore */ }
  }, [project.id]);

  const toggleFavorite = (id: string) => {
    setProfileStates((prev) => {
      const next = { ...prev };
      if (next[id] === "favorite") delete next[id];
      else next[id] = "favorite";
      localStorage.setItem(getProfileStatesKey(project.id), JSON.stringify(next));
      return next;
    });
  };

  const loadApplications = useCallback(async () => {
    setLoadingApps(true);
    try {
      const res = await fetch(`/api/applications/project/${project.id}`);
      if (res.ok) setApplications(await res.json());
    } catch (err) {
      console.error("Error loading applications:", err);
    }
    setLoadingApps(false);
  }, [project.id]);

  const loadInvitations = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/invitations?project_id=${project.id}`);
      if (res.ok) setPendingInvitations(await res.json());
    } catch (err) {
      console.error("Error loading invitations:", err);
    }
  }, [project.id]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      if (u?.id === project.user_id) {
        loadApplications();
        loadInvitations();
      }
    });
  }, [supabase, project.user_id, loadApplications, loadInvitations]);

  const handleUpdateApplication = async (applicationId: string, status: "accepted" | "rejected") => {
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

  const handleSaveVision = async () => {
    setSavingVision(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vision: visionDraft }),
      });
      if (res.ok) {
        project.vision = visionDraft;
        setEditingVision(false);
      }
    } catch (err) {
      console.error("Error saving vision:", err);
    }
    setSavingVision(false);
  };

  const handleGenerateInvite = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/projects/generate-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: project.id }),
      });
      const data = await res.json();
      if (data.invite_url) setInviteUrl(data.invite_url);
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

  const handleInviteByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteMessage(null);
    try {
      const res = await fetch("/api/projects/invite-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: project.id, email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteMessage({ type: "success", text: data.message });
        setInviteEmail("");
        loadInvitations();
        if (data.status === "added_directly") window.location.reload();
      } else {
        setInviteMessage({ type: "error", text: data.error });
      }
    } catch {
      setInviteMessage({ type: "error", text: "Erreur réseau" });
    }
    setInviting(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingPhoto(true);
    const newImages = [...projectImages];
    for (const file of Array.from(files)) {
      if (newImages.length >= 8) break;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "projects");
      try {
        const res = await fetch("/api/profiles/upload-photo", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok && data.publicUrl) {
          newImages.push(data.publicUrl);
        }
      } catch (err) {
        console.error("Error uploading photo:", err);
      }
    }
    setProjectImages(newImages);
    // Sauvegarder en DB
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images: newImages }),
    });
    setUploadingPhoto(false);
    e.target.value = "";
  };

  const handleRemovePhoto = async (index: number) => {
    const newImages = projectImages.filter((_, i) => i !== index);
    setProjectImages(newImages);
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images: newImages }),
    });
  };

  // Convertir les applications en ProfileCardType
  const applicationProfiles = useMemo(() => {
    return applications
      .filter((app) => app.profiles)
      .map((app) => {
        const p = app.profiles;
        const qa = (p as unknown as Record<string, unknown>).questionnaire_answers as Record<string, string | string[] | number> | undefined;
        const derived = deriveProfileCardData(qa || {});
        const rawIntro = ((p as unknown as Record<string, unknown>).introduction as Record<string, unknown>)?.whoAreYou;
        const introText =
          typeof rawIntro === "string"
            ? rawIntro
            : rawIntro && typeof rawIntro === "object" && "transcript" in rawIntro
              ? (rawIntro as { transcript: string }).transcript || ""
              : "";
        const intro_snippet = introText.length > 150 ? introText.slice(0, 147) + "..." : introText || undefined;
        return {
          id: p.id,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
          location: p.location,
          age: p.age ?? null,
          gender: p.gender ?? null,
          sexuality: (p as unknown as Record<string, unknown>).sexuality as string | null ?? null,
          ai_summary: p.ai_summary,
          ai_tags: p.ai_tags || [],
          ...derived,
          intro_snippet,
          is_verified: p.is_verified,
          created_at: p.created_at,
          questionnaire_answers: qa,
          appId: app.id,
          appStatus: app.status,
          motivation: app.motivation,
          appliedAt: app.created_at,
        };
      });
  }, [applications]);

  const appCount = applicationProfiles.filter(
    (p) => p.appStatus !== "rejected" && p.appStatus !== "withdrawn"
  ).length;

  // ─── HEADER ───
  const header = (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 shrink-0 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] leading-tight">
            {project.name}
          </h1>
          {project.vision && !editingVision && (
            <div className="mt-1 group">
              <p className="text-sm text-[var(--muted)] leading-relaxed italic inline">
                &laquo; {project.vision} &raquo;
              </p>
              {isCreator && (
                <button
                  onClick={() => { setVisionDraft(project.vision || ""); setEditingVision(true); }}
                  className="ml-2 opacity-0 group-hover:opacity-100 text-[var(--muted)] hover:text-[var(--primary)] transition-all inline-flex"
                  title="Modifier"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
          )}
          {editingVision && (
            <div className="mt-2 flex gap-2">
              <textarea
                value={visionDraft}
                onChange={(e) => setVisionDraft(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-[var(--input-border)] rounded-xl bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                rows={2}
              />
              <div className="flex flex-col gap-1">
                <button onClick={handleSaveVision} disabled={savingVision} className="px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg text-xs font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50">
                  {savingVision ? "..." : "OK"}
                </button>
                <button onClick={() => setEditingVision(false)} className="px-3 py-1.5 text-[var(--muted)] hover:text-[var(--foreground)] text-xs transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
        {!isCreator && (
          <div className="shrink-0">
            <ApplyButton projectId={project.id} projectName={project.name} compact />
          </div>
        )}
      </div>
    </div>
  );

  // ─── SIDEBAR (right menu) ───
  const sidebar = (
    <div className="lg:sticky lg:top-6 space-y-3">
      {/* Tab navigation */}
      <nav className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
        <button
          onClick={() => setActiveTab("candidats")}
          className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-[var(--border-color)] ${
            activeTab === "candidats"
              ? "bg-[var(--primary)]/5 text-[var(--primary)]"
              : "text-[var(--foreground)] hover:bg-[var(--surface)]"
          }`}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold">Candidats</span>
            {isCreator && appCount > 0 && (
              <span className="ml-1.5 text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] px-1.5 py-0.5 rounded-full">
                {appCount}
              </span>
            )}
          </div>
          {activeTab === "candidats" && (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
        <button
          onClick={() => setActiveTab("annonce")}
          className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
            activeTab === "annonce"
              ? "bg-[var(--primary)]/5 text-[var(--primary)]"
              : "text-[var(--foreground)] hover:bg-[var(--surface)]"
          }`}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-semibold flex-1">Annonce</span>
          {activeTab === "annonce" && (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </nav>

      {/* Quick stats */}
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Créé le {new Date(project.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <span>{members.length} cohabitant{members.length !== 1 ? "s" : ""}</span>
        </div>
        {isCreator && (
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>{appCount} candidature{appCount !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>
    </div>
  );

  // ─── TAB: CANDIDATS ───
  const candidatsContent = (
    <div>
      {isCreator ? (
        <CreatorCandidatesView
          applicationProfiles={applicationProfiles}
          loadingApps={loadingApps}
          updatingId={updatingId}
          profileStates={profileStates}
          onUpdateApplication={handleUpdateApplication}
          onToggleFavorite={toggleFavorite}
        />
      ) : (
        <PublicCandidatesView members={members} />
      )}
    </div>
  );

  // ─── TAB: ANNONCE ───
  const annonceContent = (
    <div className="space-y-6">
      {/* Photos du projet */}
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-5 sm:p-6">
        <h2 className="text-base font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Photos
        </h2>

        {projectImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {projectImages.map((url, i) => (
              <div key={i} className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-[var(--surface)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                {isCreator && (
                  <button
                    onClick={() => handleRemovePhoto(i)}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Supprimer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-[var(--muted)]">
            <svg className="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Aucune photo pour le moment</p>
          </div>
        )}

        {isCreator && projectImages.length < 8 && (
          <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-[var(--border-color)] rounded-xl text-sm text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors cursor-pointer ${uploadingPhoto ? "opacity-50 pointer-events-none" : ""}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {uploadingPhoto ? "Upload en cours..." : `Ajouter des photos (${projectImages.length}/8)`}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploadingPhoto}
            />
          </label>
        )}
      </div>

      {/* Détails du questionnaire */}
      {stepSections.length > 0 && (
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-5 sm:p-6">
          <h2 className="text-base font-bold text-[var(--foreground)] mb-5 flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Détails de l&apos;annonce
          </h2>
          <div className="space-y-5">
            {stepSections.map((section) => (
              <div key={section.id}>
                <h3 className="text-sm font-semibold text-[var(--primary)] mb-2.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full" />
                  {section.title}
                </h3>
                <div className="space-y-2 ml-3.5">
                  {section.answers.map((a) => (
                    <div key={a.id} className="flex flex-col sm:flex-row sm:gap-3">
                      <span className="text-xs text-[var(--muted)] shrink-0 sm:w-44">{a.question}</span>
                      <span className="text-sm text-[var(--foreground)] font-medium">{a.answer}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cohabitants */}
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-5 sm:p-6">
        <h2 className="text-base font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Cohabitants ({members.length})
        </h2>

        {members.length === 0 ? (
          <p className="text-sm text-[var(--muted)] text-center py-4">Aucun cohabitant pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {members.map((member) => {
              const profile = member.profiles;
              if (!profile) return null;
              return (
                <a key={member.id} href={`/profils/${profile.id}`} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-color)] hover:bg-[var(--surface)] transition-colors">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.display_name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-semibold text-sm">
                      {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--foreground)] truncate">{profile.display_name}</span>
                      {member.role === "creator" && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full font-medium">Créateur</span>
                      )}
                      {profile.is_verified && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Vérifié</span>
                      )}
                    </div>
                    {profile.location && (
                      <span className="text-xs text-[var(--muted)]">{profile.location}</span>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* Invitation (créateur uniquement) */}
        {isCreator && (
          <>
            <div className="border-t border-[var(--border-color)] pt-4 mt-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Ajouter un cohabitant
              </h3>
              <form onSubmit={handleInviteByEmail} className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email du futur cohabitant..."
                  className="flex-1 px-3 py-2 border border-[var(--input-border)] rounded-xl text-sm bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
                >
                  {inviting ? "..." : "Inviter"}
                </button>
              </form>
              {inviteMessage && (
                <p className={`text-xs mt-2 ${inviteMessage.type === "success" ? "text-green-600" : "text-red-500"}`}>
                  {inviteMessage.text}
                </p>
              )}

              {pendingInvitations.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-[var(--muted)]">Invitations en attente :</p>
                  {pendingInvitations.map((inv) => (
                    <div key={inv.id} className="flex items-center gap-2 text-xs text-[var(--muted)] bg-[var(--surface)] px-3 py-1.5 rounded-lg">
                      <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="truncate">{inv.email}</span>
                      <span className="text-[var(--muted-light)] shrink-0">
                        · {new Date(inv.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lien d'invitation */}
            <div className="border-t border-[var(--border-color)] pt-4 mt-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Lien d&apos;invitation</h3>
              {inviteUrl ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteUrl}
                    className="flex-1 px-3 py-2 bg-[var(--surface)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--foreground)] select-all"
                  />
                  <button onClick={handleCopy} className="shrink-0 px-3 py-2 bg-[var(--primary)] text-white rounded-lg text-xs font-medium hover:bg-[var(--primary-hover)] transition-colors">
                    {copied ? "Copié !" : "Copier"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGenerateInvite}
                  disabled={generating}
                  className="px-4 py-2 bg-[var(--surface)] text-[var(--foreground)] rounded-xl text-sm font-medium border border-[var(--border-color)] hover:bg-[var(--border-light)] transition-colors disabled:opacity-50"
                >
                  {generating ? "Génération..." : "Générer un lien"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
      {header}

      {/* Mobile tabs */}
      <div className="flex gap-2 mb-6 lg:hidden">
        <button
          onClick={() => setActiveTab("candidats")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === "candidats"
              ? "bg-[var(--primary)] text-white shadow-sm"
              : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border-color)]"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Candidats
          {isCreator && appCount > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              activeTab === "candidats" ? "bg-white/20" : "bg-[var(--primary)]/10 text-[var(--primary)]"
            }`}>
              {appCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("annonce")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === "annonce"
              ? "bg-[var(--primary)] text-white shadow-sm"
              : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border-color)]"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Annonce
        </button>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">
        {/* Desktop sidebar (left) */}
        <div className="hidden lg:block w-64 shrink-0">
          {sidebar}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {activeTab === "candidats" ? candidatsContent : annonceContent}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───

function CreatorCandidatesView({
  applicationProfiles,
  loadingApps,
  updatingId,
  profileStates,
  onUpdateApplication,
  onToggleFavorite,
}: {
  applicationProfiles: (ProfileCardType & { appId: string; appStatus: string; motivation: string | null; appliedAt: string })[];
  loadingApps: boolean;
  updatingId: string | null;
  profileStates: Record<string, string>;
  onUpdateApplication: (id: string, status: "accepted" | "rejected") => void;
  onToggleFavorite: (id: string) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = applicationProfiles.filter(
      (p) => p.appStatus !== "rejected" && p.appStatus !== "withdrawn"
    );
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.display_name.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.ai_summary?.toLowerCase().includes(q) ||
          p.ai_tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [applicationProfiles, search]);

  if (loadingApps) {
    return (
      <div className="text-center py-16">
        <div className="flex justify-center gap-1.5 mb-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2.5 h-2.5 bg-[var(--primary)] rounded-full" style={{ animation: `recording-pulse 1s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
        <p className="text-sm text-[var(--muted)]">Chargement des candidatures...</p>
      </div>
    );
  }

  if (applicationProfiles.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-8 text-center">
        <div className="w-16 h-16 mx-auto bg-[var(--surface)] rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-[var(--foreground)] font-medium mb-1">Pas encore de candidatures</p>
        <p className="text-sm text-[var(--muted)] mb-5 max-w-sm mx-auto">
          Partagez votre projet pour recevoir des candidatures, ou parcourez les profils disponibles.
        </p>
        <a
          href="/profils"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl text-sm font-medium hover:bg-[var(--primary)]/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Parcourir les profils
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Search bar */}
      {applicationProfiles.length > 3 && (
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, lieu, tags..."
            className="w-full pl-10 pr-4 py-2.5 border border-[var(--input-border)] rounded-xl text-sm bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
      )}

      <div className="space-y-4">
        {filtered.map((profile) => {
          const statusConfig = APPLICATION_STATUS_CONFIG[profile.appStatus as keyof typeof APPLICATION_STATUS_CONFIG];
          return (
            <div key={profile.appId} className="relative">
              {profile.appStatus === "pending" && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                  <button
                    onClick={(e) => { e.preventDefault(); onUpdateApplication(profile.appId, "accepted"); }}
                    disabled={updatingId === profile.appId}
                    className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    Accepter
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); onUpdateApplication(profile.appId, "rejected"); }}
                    disabled={updatingId === profile.appId}
                    className="px-3 py-1.5 bg-[var(--surface)] text-[var(--foreground)] text-xs font-medium rounded-lg border border-[var(--border-color)] hover:bg-[var(--border-light)] transition-colors disabled:opacity-50 shadow-sm"
                  >
                    Refuser
                  </button>
                </div>
              )}
              {profile.appStatus !== "pending" && statusConfig && (
                <div className="absolute top-3 right-3 z-10">
                  <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>
              )}
              <ProfileCard
                profile={profile}
                isFavorite={profileStates[profile.id] === "favorite"}
                onToggleFavorite={onToggleFavorite}
              />
              {profile.motivation && (
                <div className="mx-5 -mt-1 pb-4 bg-[var(--card-bg)] border-x border-b border-[var(--border-color)] rounded-b-xl px-4 pt-2">
                  <p className="text-xs text-[var(--muted)] font-medium mb-1">Message de candidature :</p>
                  <p className="text-sm text-[var(--foreground)] leading-relaxed italic">
                    &laquo; {profile.motivation} &raquo;
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && search.trim() && (
        <div className="text-center py-8">
          <p className="text-[var(--muted)]">Aucun résultat pour &laquo; {search} &raquo;</p>
          <button onClick={() => setSearch("")} className="mt-2 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors">
            Effacer la recherche
          </button>
        </div>
      )}
    </div>
  );
}

function PublicCandidatesView({ members }: { members: ProjectMemberWithProfile[] }) {
  return (
    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8">
      <h2 className="text-base font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Cohabitants ({members.length})
      </h2>
      {members.length === 0 ? (
        <div className="text-center py-6 space-y-3">
          <div className="w-14 h-14 mx-auto bg-[var(--surface)] rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm text-[var(--muted)]">Ce projet cherche ses premiers cohabitants.</p>
          <a
            href="/profils"
            className="inline-flex items-center gap-2 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors"
          >
            Découvrir les profils disponibles
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {members.map((member) => {
            const profile = member.profiles;
            if (!profile) return null;
            return (
              <a key={member.id} href={`/profils/${profile.id}`} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-color)] hover:bg-[var(--surface)] transition-colors">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.display_name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-semibold text-sm">
                    {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--foreground)] truncate">{profile.display_name}</span>
                    {member.role === "creator" && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full font-medium">Créateur</span>
                    )}
                  </div>
                  {profile.location && (
                    <span className="text-xs text-[var(--muted)]">{profile.location}</span>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
