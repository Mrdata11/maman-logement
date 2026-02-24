"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { AuthModal } from "@/components/AuthModal";
import { ApplyModal } from "@/components/ApplyModal";
import { ProfileRequiredModal } from "@/components/ProfileRequiredModal";
import { APPLICATION_STATUS_CONFIG } from "@/lib/application-types";
import type { ApplicationStatus } from "@/lib/application-types";
import type { User } from "@supabase/supabase-js";

interface ApplyButtonProps {
  projectId: string;
  projectName: string;
  compact?: boolean;
}

type ButtonState =
  | "loading"
  | "not-auth"
  | "no-profile"
  | "already-applied"
  | "ready"
  | "success";

export function ApplyButton({
  projectId,
  projectName,
  compact = false,
}: ApplyButtonProps) {
  const [state, setState] = useState<ButtonState>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [applicationStatus, setApplicationStatus] =
    useState<ApplicationStatus | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const supabase = createClient();

  const checkState = useCallback(
    async (currentUser: User | null) => {
      if (!currentUser) {
        setState("not-auth");
        return;
      }

      // V\u00e9rifier le profil
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, is_published")
        .eq("user_id", currentUser.id)
        .single();

      if (!profile || !profile.is_published) {
        setState("no-profile");
        return;
      }

      // V\u00e9rifier si d\u00e9j\u00e0 candidat\u00e9
      const { data: application } = await supabase
        .from("applications")
        .select("id, status")
        .eq("profile_id", profile.id)
        .eq("project_id", projectId)
        .single();

      if (application && application.status !== "withdrawn") {
        setApplicationStatus(application.status as ApplicationStatus);
        setState("already-applied");
        return;
      }

      setState("ready");
    },
    [supabase, projectId]
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      checkState(u);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      checkState(newUser);
    });

    return () => subscription.unsubscribe();
  }, [supabase, checkState]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    switch (state) {
      case "not-auth":
        setShowAuthModal(true);
        break;
      case "no-profile":
        setShowProfileModal(true);
        break;
      case "ready":
        setShowApplyModal(true);
        break;
    }
  };

  const handleApplySuccess = () => {
    setApplicationStatus("pending");
    setState("already-applied");
  };

  // Loading
  if (state === "loading") {
    return (
      <div
        className={`${compact ? "h-8 w-24" : "h-11 w-full"} bg-gray-100 rounded-xl animate-pulse`}
      />
    );
  }

  // D\u00e9j\u00e0 candidat\u00e9 — afficher le badge statut
  if (state === "already-applied" && applicationStatus) {
    const config = APPLICATION_STATUS_CONFIG[applicationStatus];
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${compact ? "text-xs px-2.5 py-1" : "text-sm px-4 py-2"} rounded-xl font-medium ${config.color}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {applicationStatus === "pending" && (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {applicationStatus === "accepted" && (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {applicationStatus === "rejected" && (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {config.label}
      </span>
    );
  }

  // Bouton "Candidater"
  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-200 ${
          compact
            ? "text-xs px-3 py-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20"
            : "text-sm px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-lg shadow-[var(--primary)]/20 hover:shadow-xl active:scale-[0.98]"
        }`}
      >
        <svg
          className={compact ? "w-3.5 h-3.5" : "w-4 h-4"}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
        Candidater
      </button>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      <ProfileRequiredModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        returnTo={`/projets/${projectId}`}
      />
      <ApplyModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        projectId={projectId}
        projectName={projectName}
        onSuccess={handleApplySuccess}
      />
    </>
  );
}
