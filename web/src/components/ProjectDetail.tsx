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
import { CREATION_STEPS } from "@/lib/creation-questionnaire-data";
import type { QuestionDefinition } from "@/lib/questionnaire-types";

interface ProjectDetailProps {
  project: Project;
  members: ProjectMemberWithProfile[];
  stepSections: StepSection[];
}

type ActiveTab = "annonce" | "candidats" | "cohabitants" | "preselection";

interface ProjectInvitation {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

interface InterviewConfig {
  enabled: boolean;
  questions: string[];
  tone: "bienveillant" | "neutre" | "exigeant";
  duration: number;
  autoScreen: boolean;
}

const DEFAULT_QUESTIONS = [
  "Qu'est-ce qui vous attire dans notre projet d'habitat groupé ?",
  "Quelle est votre expérience de la vie en communauté ?",
  "Quelles valeurs sont essentielles pour vous dans un lieu de vie partagé ?",
  "Comment gérez-vous les conflits au quotidien ?",
  "Quelle contribution souhaitez-vous apporter à la communauté ?",
];

const TONE_OPTIONS = [
  { id: "bienveillant" as const, label: "Bienveillant", description: "Chaleureux et encourageant" },
  { id: "neutre" as const, label: "Neutre", description: "Factuel et objectif" },
  { id: "exigeant" as const, label: "Exigeant", description: "Approfondi et précis" },
];

const PROFILE_STATES_KEY = "project_profile_states";

function getProfileStatesKey(projectId: string) {
  return `${PROFILE_STATES_KEY}_${projectId}`;
}

const TAB_CONFIG: { id: ActiveTab; label: string; creatorOnly?: boolean; icon: React.ReactNode }[] = [
  {
    id: "candidats",
    label: "Candidats",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    id: "annonce",
    label: "Annonce",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "cohabitants",
    label: "Cohabitants",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    id: "preselection",
    label: "Pré-sélection IA",
    creatorOnly: true,
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
  },
];

export function ProjectDetail({ project, members, stepSections }: ProjectDetailProps) {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("candidats");
  const [applications, setApplications] = useState<ApplicationWithProfile[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [profileStates, setProfileStates] = useState<Record<string, string>>({});

  // Édition du nom et de la vision
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(project.name);
  const [savingName, setSavingName] = useState(false);
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

  // Publication / pause
  const [isPublished, setIsPublished] = useState(project.is_published);
  const [togglingPause, setTogglingPause] = useState(false);

  // Invite link
  const [inviteUrl, setInviteUrl] = useState<string | null>(
    project.invite_token
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/rejoindre/${project.invite_token}`
      : null
  );
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Pré-sélection IA config
  const [interviewConfig, setInterviewConfig] = useState<InterviewConfig>({
    enabled: false,
    questions: [...DEFAULT_QUESTIONS],
    tone: "bienveillant",
    duration: 15,
    autoScreen: false,
  });
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [newQuestion, setNewQuestion] = useState("");

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

  const handleSaveName = async () => {
    if (!nameDraft.trim()) return;
    setSavingName(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameDraft.trim() }),
      });
      if (res.ok) {
        project.name = nameDraft.trim();
        setEditingName(false);
      }
    } catch (err) {
      console.error("Error saving name:", err);
    }
    setSavingName(false);
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

  const handleShareProject = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    await navigator.clipboard.writeText(url);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleTogglePause = async () => {
    setTogglingPause(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !isPublished }),
      });
      if (res.ok) setIsPublished(!isPublished);
    } catch (err) {
      console.error("Error toggling pause:", err);
    }
    setTogglingPause(false);
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

  // Édition inline des réponses du questionnaire
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [answersDraft, setAnswersDraft] = useState<Record<string, string | string[] | number>>(project.answers || {});
  const [savingAnswer, setSavingAnswer] = useState(false);

  const allQuestions = useMemo(() => {
    const map: Record<string, QuestionDefinition> = {};
    for (const step of CREATION_STEPS) {
      for (const q of step.questions) {
        map[q.id] = q;
      }
    }
    return map;
  }, []);

  const handleSaveAnswer = async (questionId: string, value: string | string[] | number) => {
    setSavingAnswer(true);
    const newAnswers = { ...answersDraft, [questionId]: value };
    setAnswersDraft(newAnswers);
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: newAnswers }),
      });
      project.answers = newAnswers;
    } catch (err) {
      console.error("Error saving answer:", err);
    }
    setSavingAnswer(false);
    setEditingAnswerId(null);
  };

  const formatAnswerValue = (questionId: string, value: string | string[] | number): string => {
    const q = allQuestions[questionId];
    if (!q) return String(value);
    if (Array.isArray(value)) {
      return value.map((v) => q.options?.find((o) => o.id === v)?.label || v).join(", ");
    }
    if (typeof value === "number" && q.sliderConfig) {
      return `${value}${q.sliderConfig.unit || ""}`;
    }
    if (typeof value === "string" && q.options) {
      return q.options.find((o) => o.id === value)?.label || value;
    }
    return String(value);
  };

  // Pré-sélection IA handlers
  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    setInterviewConfig((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion.trim()],
    }));
    setNewQuestion("");
  };

  const removeQuestion = (index: number) => {
    setInterviewConfig((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const updateQuestion = (index: number, value: string) => {
    setInterviewConfig((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? value : q)),
    }));
    setEditingQuestion(null);
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    setInterviewConfig((prev) => {
      if (target < 0 || target >= prev.questions.length) return prev;
      const questions = [...prev.questions];
      [questions[index], questions[target]] = [questions[target], questions[index]];
      return { ...prev, questions };
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

  const pendingCount = applicationProfiles.filter((p) => p.appStatus === "pending").length;

  const visibleTabs = TAB_CONFIG.filter((t) => !t.creatorOnly || isCreator);

  // ─── HEADER ───
  const header = (
    <div className="mb-6">
      {/* Back + Share row */}
      <div className="flex items-center justify-between mb-4">
        <a
          href="/habitats"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Retour aux habitats
        </a>
        <div className="flex items-center gap-1">
          {isCreator && (
            <button
              onClick={handleTogglePause}
              disabled={togglingPause}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-50 ${
                isPublished
                  ? "text-amber-600 hover:bg-amber-50"
                  : "text-emerald-600 hover:bg-emerald-50"
              }`}
            >
              {isPublished ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
              )}
              {togglingPause ? "..." : isPublished ? "Mettre en pause" : "Réactiver"}
            </button>
          )}
          <button
            onClick={handleShareProject}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
            {copiedShare ? "Lien copié !" : "Partager"}
          </button>
        </div>
      </div>

      {/* Title + Vision */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 shrink-0 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2 mb-1">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                className="flex-1 text-xl sm:text-2xl font-bold px-2 py-0.5 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                autoFocus
              />
              <button onClick={handleSaveName} disabled={savingName} className="px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg text-xs font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50">
                {savingName ? "..." : "OK"}
              </button>
              <button onClick={() => { setEditingName(false); setNameDraft(project.name); }} className="px-2 py-1.5 text-[var(--muted)] hover:text-[var(--foreground)] text-xs transition-colors">
                Annuler
              </button>
            </div>
          ) : (
            <div className="group flex items-center gap-2 mb-0.5">
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] leading-tight">
                {project.name}
              </h1>
              {isCreator && (
                <button
                  onClick={() => { setNameDraft(project.name); setEditingName(true); }}
                  className="opacity-0 group-hover:opacity-100 text-[var(--muted)] hover:text-[var(--primary)] transition-all p-1"
                  title="Modifier le nom"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
          )}
          {project.vision && !editingVision && (
            <div className="group">
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
          {!project.vision && !editingVision && isCreator && (
            <button
              onClick={() => { setVisionDraft(""); setEditingVision(true); }}
              className="text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-colors italic"
            >
              + Ajouter une vision / description...
            </button>
          )}
          {editingVision && (
            <div className="mt-2 flex gap-2">
              <textarea
                value={visionDraft}
                onChange={(e) => setVisionDraft(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-[var(--input-border)] rounded-xl bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                rows={2}
                placeholder="Décrivez la vision de votre projet..."
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

      {/* Stats cards (creator only) */}
      {isCreator && (
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-lg font-bold text-[var(--foreground)]">{project.view_count || 0}</span>
            </div>
            <p className="text-xs text-[var(--muted)]">Vues</p>
          </div>
          <button
            onClick={() => setActiveTab("candidats")}
            className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] px-4 py-3 text-left hover:border-[var(--primary)]/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <span className="text-lg font-bold text-[var(--foreground)]">{appCount}</span>
              {pendingCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                  {pendingCount} nouveau{pendingCount > 1 ? "x" : ""}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--muted)]">Candidatures</p>
          </button>
          <button
            onClick={() => setActiveTab("cohabitants")}
            className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] px-4 py-3 text-left hover:border-[var(--primary)]/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <span className="text-lg font-bold text-[var(--foreground)]">{members.length}</span>
            </div>
            <p className="text-xs text-[var(--muted)]">Cohabitants</p>
          </button>
        </div>
      )}

    </div>
  );

  // ─── SIDEBAR ───
  const sidebar = (
    <div className="lg:sticky lg:top-6 space-y-3">
      <nav className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
        {visibleTabs.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
              i < visibleTabs.length - 1 ? "border-b border-[var(--border-color)]" : ""
            } ${
              activeTab === tab.id
                ? "bg-[var(--primary)]/5 text-[var(--primary)]"
                : "text-[var(--foreground)] hover:bg-[var(--surface)]"
            }`}
          >
            <span className="shrink-0">{tab.icon}</span>
            <span className="text-sm font-semibold flex-1">{tab.label}</span>
            {tab.id === "candidats" && isCreator && pendingCount > 0 && (
              <span className="text-xs font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
            {tab.id === "cohabitants" && (
              <span className="text-xs text-[var(--muted)]">{members.length}</span>
            )}
            {activeTab === tab.id && (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        ))}
      </nav>

      {/* Quick info */}
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <svg className="w-4 h-4 text-[var(--primary)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span>Créé le {new Date(project.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isPublished ? "bg-emerald-500" : "bg-amber-500"}`} />
          <span className={isPublished ? "text-emerald-600" : "text-amber-600"}>
            {isPublished ? "En ligne" : "En pause"}
          </span>
        </div>
      </div>
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
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Détails de l&apos;annonce
            </h2>
            {isCreator && (
              <a
                href={`/creer?edit=${project.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--primary)] bg-[var(--primary)]/5 rounded-lg hover:bg-[var(--primary)]/10 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Tout modifier
              </a>
            )}
          </div>
          <div className="space-y-5">
            {CREATION_STEPS.filter((step) =>
              step.questions.some((q) => answersDraft[q.id] !== undefined)
            ).map((step) => (
              <div key={step.id}>
                <h3 className="text-sm font-semibold text-[var(--primary)] mb-2.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full" />
                  {step.title}
                </h3>
                <div className="space-y-2 ml-3.5">
                  {step.questions.filter((q) => answersDraft[q.id] !== undefined).map((q) => {
                    const rawValue = answersDraft[q.id];
                    const isEditing = editingAnswerId === q.id;

                    return (
                      <div key={q.id} className="flex flex-col sm:flex-row sm:gap-3 group">
                        <span className="text-xs text-[var(--muted)] shrink-0 sm:w-44 sm:pt-0.5">{q.text}</span>
                        <div className="flex-1 min-w-0">
                          {isEditing && isCreator ? (
                            <InlineAnswerEditor
                              question={q}
                              value={rawValue}
                              saving={savingAnswer}
                              onSave={(val) => handleSaveAnswer(q.id, val)}
                              onCancel={() => setEditingAnswerId(null)}
                            />
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm text-[var(--foreground)] font-medium">
                                {formatAnswerValue(q.id, rawValue)}
                              </span>
                              {isCreator && (
                                <button
                                  onClick={() => setEditingAnswerId(q.id)}
                                  className="opacity-0 group-hover:opacity-100 text-[var(--muted)] hover:text-[var(--primary)] transition-all p-0.5"
                                  title="Modifier"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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

  // ─── TAB: COHABITANTS ───
  const cohabitantsContent = (
    <div className="space-y-6">
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-5 sm:p-6">
        <h2 className="text-base font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
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
                    // eslint-disable-next-line @next/next/no-img-element
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
                        <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">Qualifié</span>
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
                Inviter par email
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

  // ─── TAB: PRÉ-SÉLECTION IA ───
  const interviewContent = (
    <div className="space-y-4">
      {/* Activation */}
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Activer la pré-sélection IA</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Les candidats passeront un entretien automatique après leur candidature
            </p>
          </div>
          <button
            onClick={() => setInterviewConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              interviewConfig.enabled ? "bg-[var(--primary)]" : "bg-[var(--input-border)]"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                interviewConfig.enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {interviewConfig.enabled && (
        <>
          {/* Ton de la pré-sélection */}
          <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-5">
            <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">Ton de l&apos;entretien</h2>
            <div className="grid grid-cols-3 gap-2">
              {TONE_OPTIONS.map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => setInterviewConfig((prev) => ({ ...prev, tone: tone.id }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    interviewConfig.tone === tone.id
                      ? "border-[var(--primary)] bg-[var(--primary)]/5"
                      : "border-[var(--border-light)] hover:border-[var(--border-color)]"
                  }`}
                >
                  <p className={`text-sm font-medium ${interviewConfig.tone === tone.id ? "text-[var(--primary)]" : "text-[var(--foreground)]"}`}>
                    {tone.label}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{tone.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Durée estimée */}
          <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-5">
            <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">Durée estimée</h2>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={5}
                max={30}
                step={5}
                value={interviewConfig.duration}
                onChange={(e) => setInterviewConfig((prev) => ({ ...prev, duration: Number(e.target.value) }))}
                className="flex-1 accent-[var(--primary)]"
              />
              <span className="text-sm font-medium text-[var(--foreground)] w-16 text-right">
                {interviewConfig.duration} min
              </span>
            </div>
          </div>

          {/* Questions */}
          <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-light)]">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Questions ({interviewConfig.questions.length})
              </h2>
            </div>
            <div className="divide-y divide-[var(--border-light)]">
              {interviewConfig.questions.map((q, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3 group">
                  <div className="shrink-0 flex flex-col items-center gap-0.5 mt-0.5">
                    <button
                      onClick={() => moveQuestion(i, -1)}
                      disabled={i === 0}
                      className="text-[var(--muted)] hover:text-[var(--primary)] disabled:opacity-20 disabled:cursor-default transition-colors p-0.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                      </svg>
                    </button>
                    <span className="w-6 h-6 rounded-full bg-[var(--surface)] text-[var(--muted)] text-xs flex items-center justify-center">
                      {i + 1}
                    </span>
                    <button
                      onClick={() => moveQuestion(i, 1)}
                      disabled={i === interviewConfig.questions.length - 1}
                      className="text-[var(--muted)] hover:text-[var(--primary)] disabled:opacity-20 disabled:cursor-default transition-colors p-0.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                  </div>
                  {editingQuestion === i ? (
                    <input
                      autoFocus
                      defaultValue={q}
                      onBlur={(e) => updateQuestion(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") updateQuestion(i, e.currentTarget.value);
                        if (e.key === "Escape") setEditingQuestion(null);
                      }}
                      className="flex-1 text-sm text-[var(--foreground)] bg-[var(--surface)] px-3 py-1.5 rounded-lg border border-[var(--input-border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                    />
                  ) : (
                    <p
                      className="flex-1 text-sm text-[var(--foreground)] cursor-pointer hover:text-[var(--primary)] transition-colors"
                      onClick={() => setEditingQuestion(i)}
                    >
                      {q}
                    </p>
                  )}
                  <button
                    onClick={() => removeQuestion(i)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-[var(--muted)] hover:text-red-500 transition-all p-1"
                    title="Supprimer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-[var(--border-light)]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addQuestion()}
                  placeholder="Ajouter une question..."
                  className="flex-1 text-sm bg-[var(--surface)] px-3 py-2 rounded-lg border border-[var(--border-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 placeholder:text-[var(--muted-light)]"
                />
                <button
                  onClick={addQuestion}
                  disabled={!newQuestion.trim()}
                  className="shrink-0 px-3 py-2 bg-[var(--primary)] text-white text-sm rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-30"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>

          {/* Pré-filtrage automatique */}
          <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[var(--foreground)]">Pré-filtrage automatique</h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  L&apos;IA génère un score de compatibilité et recommande les meilleurs profils
                </p>
              </div>
              <button
                onClick={() => setInterviewConfig((prev) => ({ ...prev, autoScreen: !prev.autoScreen }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  interviewConfig.autoScreen ? "bg-[var(--primary)]" : "bg-[var(--input-border)]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    interviewConfig.autoScreen ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );

  // ─── Render active tab content ───
  const renderContent = () => {
    switch (activeTab) {
      case "annonce": return annonceContent;
      case "candidats": return candidatsContent;
      case "cohabitants": return cohabitantsContent;
      case "preselection": return interviewContent;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      {header}

      {/* Mobile tabs */}
      <div className="flex gap-1.5 mb-6 lg:hidden overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border-color)]"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === "candidats" && isCreator && pendingCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                activeTab === "candidats" ? "bg-white/20" : "bg-amber-100 text-amber-700"
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">
        {/* Desktop sidebar (left) */}
        <div className="hidden lg:block w-60 shrink-0">
          {sidebar}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {renderContent()}
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
  const [statusFilter, setStatusFilter] = useState<string>("active");

  const filtered = useMemo(() => {
    let result = applicationProfiles;

    // Status filter
    if (statusFilter === "active") {
      result = result.filter((p) => p.appStatus !== "rejected" && p.appStatus !== "withdrawn");
    } else if (statusFilter !== "all") {
      result = result.filter((p) => p.appStatus === statusFilter);
    }

    // Search
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
  }, [applicationProfiles, search, statusFilter]);

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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
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

  const statusCounts = {
    active: applicationProfiles.filter((p) => p.appStatus !== "rejected" && p.appStatus !== "withdrawn").length,
    pending: applicationProfiles.filter((p) => p.appStatus === "pending").length,
    accepted: applicationProfiles.filter((p) => p.appStatus === "accepted").length,
    rejected: applicationProfiles.filter((p) => p.appStatus === "rejected").length,
    all: applicationProfiles.length,
  };

  return (
    <div>
      {/* Status filter tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {[
          { id: "active", label: "Actifs", count: statusCounts.active },
          { id: "pending", label: "En attente", count: statusCounts.pending },
          { id: "accepted", label: "Acceptés", count: statusCounts.accepted },
          { id: "rejected", label: "Refusés", count: statusCounts.rejected },
          { id: "all", label: "Tous", count: statusCounts.all },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === f.id
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border-color)] hover:text-[var(--foreground)]"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

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

      {filtered.length === 0 && (
        <div className="text-center py-8">
          <p className="text-[var(--muted)]">
            {search.trim()
              ? `Aucun résultat pour « ${search} »`
              : "Aucune candidature dans cette catégorie"
            }
          </p>
          {search.trim() && (
            <button onClick={() => setSearch("")} className="mt-2 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors">
              Effacer la recherche
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function InlineAnswerEditor({
  question,
  value,
  saving,
  onSave,
  onCancel,
}: {
  question: QuestionDefinition;
  value: string | string[] | number;
  saving: boolean;
  onSave: (val: string | string[] | number) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(value);

  if (question.type === "single_choice" && question.options) {
    return (
      <div className="flex items-center gap-2">
        <select
          value={String(draft)}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1 px-2 py-1.5 text-sm border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        >
          {question.options.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
        <button onClick={() => onSave(draft)} disabled={saving} className="px-2.5 py-1.5 bg-[var(--primary)] text-white rounded-lg text-xs font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50">
          {saving ? "..." : "OK"}
        </button>
        <button onClick={onCancel} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          Annuler
        </button>
      </div>
    );
  }

  if (question.type === "multi_choice" && question.options) {
    const selected = Array.isArray(draft) ? draft : [];
    return (
      <div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {question.options.map((o) => {
            const isSelected = selected.includes(o.id);
            return (
              <button
                key={o.id}
                onClick={() => {
                  setDraft(
                    isSelected
                      ? selected.filter((s) => s !== o.id)
                      : [...selected, o.id]
                  );
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border-color)] hover:text-[var(--foreground)]"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onSave(draft)} disabled={saving} className="px-2.5 py-1.5 bg-[var(--primary)] text-white rounded-lg text-xs font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50">
            {saving ? "..." : "OK"}
          </button>
          <button onClick={onCancel} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
            Annuler
          </button>
        </div>
      </div>
    );
  }

  if (question.type === "slider" && question.sliderConfig) {
    const cfg = question.sliderConfig;
    return (
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={cfg.min}
          max={cfg.max}
          step={cfg.step}
          value={Number(draft)}
          onChange={(e) => setDraft(Number(e.target.value))}
          className="flex-1 accent-[var(--primary)]"
        />
        <span className="text-sm font-medium text-[var(--foreground)] w-12 text-right">
          {draft}{cfg.unit || ""}
        </span>
        <button onClick={() => onSave(draft)} disabled={saving} className="px-2.5 py-1.5 bg-[var(--primary)] text-white rounded-lg text-xs font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50">
          {saving ? "..." : "OK"}
        </button>
        <button onClick={onCancel} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          Annuler
        </button>
      </div>
    );
  }

  // open_text default
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={String(draft)}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onSave(draft); if (e.key === "Escape") onCancel(); }}
        className="flex-1 px-2 py-1.5 text-sm border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        autoFocus
        placeholder={question.placeholder}
      />
      <button onClick={() => onSave(draft)} disabled={saving} className="px-2.5 py-1.5 bg-[var(--primary)] text-white rounded-lg text-xs font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50">
        {saving ? "..." : "OK"}
      </button>
      <button onClick={onCancel} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
        Annuler
      </button>
    </div>
  );
}

function PublicCandidatesView({ members }: { members: ProjectMemberWithProfile[] }) {
  return (
    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8">
      <h2 className="text-base font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
        Cohabitants ({members.length})
      </h2>
      {members.length === 0 ? (
        <div className="text-center py-6 space-y-3">
          <div className="w-14 h-14 mx-auto bg-[var(--surface)] rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
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
                  // eslint-disable-next-line @next/next/no-img-element
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
