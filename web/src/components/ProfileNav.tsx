"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase";
import { AuthModal } from "./AuthModal";
import type { User } from "@supabase/supabase-js";

export function ProfileNav() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [userProject, setUserProject] = useState<{ id: string; name: string } | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [invitationCount, setInvitationCount] = useState(0);
  const [isProfileVerified, setIsProfileVerified] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) setShowAuthModal(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Charger le projet de l'utilisateur + nombre de candidatures en attente
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", user.id)
        .eq("is_published", true)
        .limit(1);

      // Vérifier si le profil est qualifié
      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_verified")
        .eq("user_id", user.id)
        .single();
      if (profileData?.is_verified) setIsProfileVerified(true);

      if (projects && projects.length > 0) {
        setUserProject(projects[0]);
        // Charger le nombre de candidatures en attente
        const { count } = await supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("project_id", projects[0].id)
          .eq("status", "pending");
        setPendingCount(count ?? 0);
      }

      // Charger le nombre d'invitations reçues
      try {
        const res = await fetch("/api/projects/my-invitations");
        if (res.ok) {
          const invitations = await res.json();
          setInvitationCount(invitations.length);
        }
      } catch {
        // Silently fail
      }
    })();
  }, [user, supabase]);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handleClick = () => setShowMenu(false);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showMenu]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowMenu(false);
  };

  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.email || "";
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  const updateMenuPos = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, []);

  useEffect(() => {
    if (!showMenu) return;
    updateMenuPos();
    window.addEventListener("scroll", updateMenuPos, { passive: true });
    window.addEventListener("resize", updateMenuPos, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateMenuPos);
      window.removeEventListener("resize", updateMenuPos);
    };
  }, [showMenu, updateMenuPos]);

  // Loading state — small skeleton circle
  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-[var(--surface)] animate-pulse" />
    );
  }

  // Not logged in
  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowAuthModal(true)}
          className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
        >
          Se connecter
        </button>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  // Logged in
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-[var(--primary)]/30 transition-all duration-200 focus:outline-none focus:ring-[var(--primary)]/40"
        aria-label="Menu utilisateur"
        title={displayName}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {/* Dropdown menu — rendu en portal pour échapper au clipPath du header */}
      {showMenu && createPortal(
        <div
          className="fixed w-56 bg-[var(--card-bg)] rounded-2xl shadow-xl border border-[var(--border-light)] overflow-hidden animate-fadeIn"
          style={{ top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
        >
          <div className="px-4 py-3 border-b border-[var(--border-light)]">
            <p className="text-sm font-semibold text-[var(--foreground)] truncate">
              {displayName}
            </p>
            {user.email && displayName !== user.email && (
              <p className="text-xs text-[var(--muted)] truncate mt-0.5">
                {user.email}
              </p>
            )}
          </div>
          <div className="py-1">
            <a
              href="/profils/mon-profil"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
            >
              <svg
                className="w-4 h-4 text-[var(--muted)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Mon profil
            </a>
            {!isProfileVerified && (
              <a
                href="/profils/validation-ia"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
              >
                <svg
                  className="w-4 h-4 text-[var(--muted)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
                Qualifier mon profil
              </a>
            )}
            <a
              href="/profils/invitations"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
            >
              <svg
                className="w-4 h-4 text-[var(--muted)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Invitations
              {invitationCount > 0 && (
                <span className="ml-auto text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-medium">
                  {invitationCount}
                </span>
              )}
            </a>
            {userProject ? (
              <>
                <a
                  href={`/habitats/${userProject.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-[var(--muted)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  Demandes
                  {pendingCount > 0 && (
                    <span className="ml-auto text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full font-medium">
                      {pendingCount}
                    </span>
                  )}
                </a>
              </>
            ) : (
              <a
                href="/creer"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--primary)] hover:bg-[var(--surface)] transition-colors font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 4v16m8-8H4" />
                </svg>
                Créer un habitat
              </a>
            )}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Se d&eacute;connecter
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
