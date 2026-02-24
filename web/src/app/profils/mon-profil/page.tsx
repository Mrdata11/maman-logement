"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  Profile,
  PROFILE_VOICE_QUESTIONS,
  EMPTY_INTRODUCTION,
  deriveProfileCardData,
  getIntroText,
  isIntroAnswer,
} from "@/lib/profile-types";
import { AuthButton } from "@/components/AuthButton";
import { ProfileCreationFlow } from "@/components/ProfileCreationFlow";
import type { ApplicationWithProject } from "@/lib/application-types";
import { APPLICATION_STATUS_CONFIG } from "@/lib/application-types";

/* ─── Completion logic ─── */

interface CompletionItem {
  key: string;
  label: string;
  done: boolean;
  hint: string;
  action: "edit" | "publish" | "verify";
}

function getCompletionItems(profile: Profile, introFilledCount: number, questionnaireCount: number): CompletionItem[] {
  return [
    {
      key: "avatar",
      label: "Photo de profil",
      done: !!profile.avatar_url,
      hint: "Ajoute une photo pour inspirer confiance",
      action: "edit",
    },
    {
      key: "photos",
      label: "Photos de pr\u00e9sentation",
      done: (profile.photos || []).length > 0,
      hint: "Montre ton cadre de vie ou tes passions",
      action: "edit",
    },
    {
      key: "intro",
      label: "Pr\u00e9sentation personnelle",
      done: introFilledCount >= 2,
      hint: `${introFilledCount}/4 sections remplies`,
      action: "edit",
    },
    {
      key: "questionnaire",
      label: "Questionnaire compl\u00e9t\u00e9",
      done: questionnaireCount >= 8,
      hint: `${questionnaireCount} r\u00e9ponses donn\u00e9es`,
      action: "edit",
    },
    {
      key: "published",
      label: "Profil publi\u00e9",
      done: profile.is_published,
      hint: "Rends ton profil visible par la communaut\u00e9",
      action: "publish",
    },
    {
      key: "verified",
      label: "Profil qualifi\u00e9",
      done: profile.is_verified,
      hint: "Obtiens le badge de confiance",
      action: "verify",
    },
  ];
}

/* ─── Main page ─── */

export default function MonProfilPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [applications, setApplications] = useState<ApplicationWithProject[]>([]);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const supabase = createClient();

  const loadProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (data) setProfile(data as Profile);
      setLoading(false);
    },
    [supabase]
  );

  const loadApplications = useCallback(async () => {
    try {
      const res = await fetch("/api/applications");
      if (res.ok) setApplications(await res.json());
    } catch (err) {
      console.error("Error loading applications:", err);
    }
  }, []);

  const handleWithdraw = useCallback(async (applicationId: string) => {
    setWithdrawingId(applicationId);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "withdrawn" }),
      });
      if (res.ok) {
        setApplications((prev) =>
          prev.map((a) => (a.id === applicationId ? { ...a, status: "withdrawn" } : a))
        );
      }
    } catch (err) {
      console.error("Error withdrawing application:", err);
    }
    setWithdrawingId(null);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        loadProfile(user.id);
        loadApplications();
      } else {
        setLoading(false);
      }
    });
  }, [supabase, loadProfile, loadApplications]);

  const handleDelete = useCallback(async () => {
    if (!profile || !confirm("Supprimer d\u00e9finitivement ton profil ?")) return;
    setDeleting(true);
    await supabase.from("profiles").delete().eq("id", profile.id);
    setProfile(null);
    setDeleting(false);
  }, [profile, supabase]);

  const togglePublished = useCallback(async () => {
    if (!profile) return;
    const newStatus = !profile.is_published;
    await supabase
      .from("profiles")
      .update({ is_published: newStatus, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    setProfile({ ...profile, is_published: newStatus });
  }, [profile, supabase]);

  /* ─── Derived data ─── */

  const profileData = useMemo(() => {
    if (!profile) return null;

    const display = deriveProfileCardData(profile.questionnaire_answers);
    const intro = profile.introduction || EMPTY_INTRODUCTION;
    const photos = profile.photos || [];

    const initials = profile.display_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const GENDER_LABELS: Record<string, string> = {
      homme: "Homme",
      femme: "Femme",
      "non-binaire": "Non-binaire",
      autre: "Autre",
    };

    const demographicParts: string[] = [];
    if (profile.age) demographicParts.push(`${profile.age} ans`);
    if (profile.gender) demographicParts.push(GENDER_LABELS[profile.gender] || profile.gender);

    const introFilledCount = PROFILE_VOICE_QUESTIONS.filter((q) => {
      const val = intro[q.id];
      if (!val) return false;
      if (typeof val === "string") return val.trim().length > 0;
      return isIntroAnswer(val);
    }).length;

    // Count non-empty questionnaire answers
    const questionnaireCount = Object.values(profile.questionnaire_answers || {}).filter(
      (v) => v !== undefined && v !== null && v !== ""
    ).length;

    const completionItems = getCompletionItems(profile, introFilledCount, questionnaireCount);
    const completionDone = completionItems.filter((c) => c.done).length;
    const completionPercent = Math.round((completionDone / completionItems.length) * 100);

    return {
      display,
      photos,
      initials,
      demographicParts,
      introFilledCount,
      questionnaireCount,
      completionItems,
      completionDone,
      completionPercent,
    };
  }, [profile]);

  /* ─── Loading state ─── */

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center gap-1.5 mb-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 bg-[var(--primary)] rounded-full"
              style={{ animation: `recording-pulse 1s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
        <p className="text-sm text-[var(--muted)]">Chargement...</p>
      </div>
    );
  }

  /* ─── Not logged in ─── */

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Mon profil</h1>
          <p className="text-[var(--muted)]">Connecte-toi pour acc&eacute;der &agrave; ton profil.</p>
        </div>
        <div className="max-w-xs mx-auto">
          <AuthButton />
        </div>
      </div>
    );
  }

  /* ─── No profile yet ─── */

  if (!profile) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Mon profil</h1>
          <p className="text-[var(--muted)]">
            Tu n&apos;as pas encore de profil. Cr&eacute;e-le pour te pr&eacute;senter &agrave; la communaut&eacute;.
          </p>
        </div>
        <a
          href="/profils/creer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Cr&eacute;er mon profil
        </a>
      </div>
    );
  }

  /* ─── Editing mode ─── */

  if (editing) {
    return (
      <div className="py-4">
        <div className="max-w-2xl mx-auto mb-4">
          <button
            onClick={() => setEditing(false)}
            className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour &agrave; mon profil
          </button>
        </div>
        <ProfileCreationFlow existingProfile={profile} />
      </div>
    );
  }

  const { display, photos, initials, demographicParts, completionItems, completionDone, completionPercent } =
    profileData!;

  const pendingApps = applications.filter((a) => a.status === "pending").length;
  const acceptedApps = applications.filter((a) => a.status === "accepted").length;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* ═══ HEADER : Statut + titre ═══ */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Mon profil</h1>
        <span
          className={`text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 ${
            profile.is_published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${profile.is_published ? "bg-emerald-500" : "bg-amber-500"}`}
          />
          {profile.is_published ? "Publi\u00e9" : "Brouillon"}
        </span>
      </div>

      {/* ═══ CARTE D'IDENTITÉ ═══ */}
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-[var(--primary)]">{initials}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
              {profile.display_name}
              {profile.is_verified && (
                <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                  Qualifi\u00e9
                </span>
              )}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-sm text-[var(--muted)]">
              {demographicParts.length > 0 && <span>{demographicParts.join(" \u00b7 ")}</span>}
              {profile.location && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {profile.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {profile.ai_summary && (
          <p className="text-[var(--foreground)]/80 leading-relaxed italic mt-4 text-sm">
            &laquo;&nbsp;{profile.ai_summary}&nbsp;&raquo;
          </p>
        )}

        {/* AI Tags */}
        {profile.ai_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {profile.ai_tags.map((tag, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 bg-[var(--primary)]/8 text-[var(--primary)] rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Quick stats */}
        {(display.budget_range || display.preferred_regions.length > 0 || display.core_values.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[var(--border-color)]">
            {display.budget_range && (
              <span className="text-xs px-2.5 py-1 bg-[var(--surface)] text-[var(--foreground)] rounded-lg">
                {display.budget_range}
              </span>
            )}
            {display.preferred_regions.map((r, i) => (
              <span key={i} className="text-xs px-2.5 py-1 bg-[var(--surface)] text-[var(--foreground)] rounded-lg">
                {r}
              </span>
            ))}
            {display.core_values.map((v, i) => (
              <span key={i} className="text-xs px-2.5 py-1 bg-[var(--surface)] text-[var(--foreground)] rounded-lg">
                {v}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ═══ COMPLÉTION DU PROFIL ═══ */}
      {completionPercent < 100 && (
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Compl\u00e9tion du profil</h3>
            <span className="text-sm font-bold text-[var(--primary)]">{completionPercent}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-[var(--surface)] rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>

          {/* Missing items */}
          <div className="space-y-2">
            {completionItems
              .filter((item) => !item.done)
              .map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    if (item.action === "edit") setEditing(true);
                    else if (item.action === "publish") togglePublished();
                    else if (item.action === "verify") window.location.href = "/profils/validation-ia";
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--surface)] transition-colors text-left group"
                >
                  <div className="w-7 h-7 rounded-full border-2 border-dashed border-[var(--border-color)] flex items-center justify-center shrink-0 group-hover:border-[var(--primary)] transition-colors">
                    <svg className="w-3.5 h-3.5 text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)]">{item.label}</p>
                    <p className="text-xs text-[var(--muted)]">{item.hint}</p>
                  </div>
                  <svg className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
          </div>

          {/* Done items count */}
          {completionDone > 0 && (
            <p className="text-xs text-[var(--muted)] mt-3 pt-3 border-t border-[var(--border-color)]">
              {completionDone} \u00e9tape{completionDone > 1 ? "s" : ""} compl\u00e9t\u00e9e{completionDone > 1 ? "s" : ""}
              {completionItems
                .filter((item) => item.done)
                .map((item, i) => (
                  <span key={item.key}>
                    {i === 0 ? " : " : ", "}
                    <span className="text-emerald-600">{item.label}</span>
                  </span>
                ))}
            </p>
          )}
        </div>
      )}

      {/* ═══ ACTIONS RAPIDES ═══ */}
      <div className="grid grid-cols-2 gap-3">
        {/* Modifier */}
        <button
          onClick={() => setEditing(true)}
          className="flex flex-col items-center gap-2 p-4 bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] hover:border-[var(--primary)]/40 hover:shadow-sm transition-all text-center group"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center group-hover:bg-[var(--primary)]/15 transition-colors">
            <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-[var(--foreground)]">Modifier</span>
        </button>

        {/* Publier / Dépublier */}
        <button
          onClick={togglePublished}
          className="flex flex-col items-center gap-2 p-4 bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] hover:border-[var(--primary)]/40 hover:shadow-sm transition-all text-center group"
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              profile.is_published
                ? "bg-amber-50 group-hover:bg-amber-100"
                : "bg-emerald-50 group-hover:bg-emerald-100"
            }`}
          >
            {profile.is_published ? (
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </div>
          <span className="text-sm font-medium text-[var(--foreground)]">
            {profile.is_published ? "D\u00e9publier" : "Publier"}
          </span>
        </button>

        {/* Voir profil public */}
        {profile.is_published && (
          <a
            href={`/profils/${profile.id}`}
            className="flex flex-col items-center gap-2 p-4 bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] hover:border-[var(--primary)]/40 hover:shadow-sm transition-all text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
            <span className="text-sm font-medium text-[var(--foreground)]">Voir public</span>
          </a>
        )}

        {/* Badge qualifié */}
        {!profile.is_verified && (
          <a
            href="/profils/validation-ia"
            className="flex flex-col items-center gap-2 p-4 bg-[var(--card-bg)] rounded-2xl border border-emerald-200 hover:border-emerald-300 hover:shadow-sm transition-all text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-emerald-700">Qualifier</span>
          </a>
        )}
      </div>

      {/* ═══ MES CANDIDATURES ═══ */}
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
            <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            Mes candidatures
          </h3>
          {applications.length > 0 && (
            <div className="flex items-center gap-2">
              {pendingApps > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                  {pendingApps} en attente
                </span>
              )}
              {acceptedApps > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                  {acceptedApps} accept\u00e9e{acceptedApps > 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto rounded-full bg-[var(--surface)] flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <p className="text-sm text-[var(--muted)] mb-2">Aucune candidature pour le moment</p>
            <a
              href="/habitats"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors"
            >
              D\u00e9couvrir les habitats
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            {applications.map((app) => {
              const statusConfig = APPLICATION_STATUS_CONFIG[app.status];
              const project = app.projects;
              return (
                <div
                  key={app.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border-color)] hover:bg-[var(--surface)]/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <a
                      href={`/habitats/${project?.id}`}
                      className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors truncate block"
                    >
                      {project?.name || "Projet"}
                    </a>
                    <p className="text-xs text-[var(--muted-light)] mt-0.5">
                      {new Date(app.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                    {app.status === "pending" && (
                      <button
                        onClick={() => handleWithdraw(app.id)}
                        disabled={withdrawingId === app.id}
                        className="text-xs text-[var(--muted)] hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Retirer ma candidature"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ FOOTER ═══ */}
      <p className="text-xs text-[var(--muted)] text-center">
        Profil cr\u00e9\u00e9 le{" "}
        {new Date(profile.created_at).toLocaleDateString("fr-BE", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

      <div className="pt-2 border-t border-[var(--border-color)]">
        <details>
          <summary className="text-xs text-[var(--muted)] cursor-pointer hover:text-red-500 transition-colors list-none">
            Zone de suppression
          </summary>
          <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700 mb-3">
              Cette action est irr&eacute;versible. Ton profil sera d&eacute;finitivement supprim&eacute;.
            </p>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? "Suppression..." : "Supprimer d\u00e9finitivement"}
            </button>
          </div>
        </details>
      </div>
    </div>
  );
}
