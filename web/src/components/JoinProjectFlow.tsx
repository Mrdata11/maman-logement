"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { AuthButton } from "@/components/AuthButton";
import type { User } from "@supabase/supabase-js";

interface JoinProjectFlowProps {
  inviteToken: string;
  projectId: string;
  projectName: string;
}

export function JoinProjectFlow({
  inviteToken,
  projectId,
  projectName,
}: JoinProjectFlowProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Vérifier si l'utilisateur a un profil
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        setHasProfile(!!profile);

        if (profile) {
          // Vérifier s'il est déjà membre
          const { data: membership } = await supabase
            .from("project_members")
            .select("id")
            .eq("project_id", projectId)
            .eq("profile_id", profile.id)
            .single();

          setAlreadyMember(!!membership);
        }
      }

      setLoading(false);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        // Re-check profile after auth change
        setLoading(true);
        supabase
          .from("profiles")
          .select("id")
          .eq("user_id", newUser.id)
          .single()
          .then(({ data: profile }) => {
            setHasProfile(!!profile);
            if (profile) {
              supabase
                .from("project_members")
                .select("id")
                .eq("project_id", projectId)
                .eq("profile_id", profile.id)
                .single()
                .then(({ data: membership }) => {
                  setAlreadyMember(!!membership);
                  setLoading(false);
                });
            } else {
              setLoading(false);
            }
          });
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, projectId]);

  const handleJoin = async () => {
    setJoining(true);
    setError(null);

    try {
      const res = await fetch("/api/projects/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_token: inviteToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'inscription");
        setJoining(false);
        return;
      }

      router.push(`/habitats/${data.project_id}`);
    } catch {
      setError("Erreur de connexion. Veuillez réessayer.");
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-[var(--muted)] py-4">Chargement...</div>
    );
  }

  // Déjà membre
  if (alreadyMember) {
    return (
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-800">
            Vous faites d&eacute;j&agrave; partie de ce projet.
          </p>
        </div>
        <a
          href={`/habitats/${projectId}`}
          className="inline-block px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          Voir le projet
        </a>
      </div>
    );
  }

  // Pas connecté
  if (!user) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--muted)]">
          Connectez-vous pour rejoindre ce projet.
        </p>
        <AuthButton redirectTo={`/rejoindre/${inviteToken}`} />
      </div>
    );
  }

  // Pas de profil
  if (!hasProfile) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--muted)]">
          Vous devez d&apos;abord cr&eacute;er votre profil avant de rejoindre
          un projet.
        </p>
        <a
          href={`/profils/creer?returnTo=/rejoindre/${inviteToken}`}
          className="inline-block px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          Cr&eacute;er mon profil
        </a>
      </div>
    );
  }

  // Prêt à rejoindre
  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      <button
        onClick={handleJoin}
        disabled={joining}
        className="w-full px-5 py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          />
        </svg>
        {joining ? "Inscription..." : "Rejoindre ce projet"}
      </button>
    </div>
  );
}
