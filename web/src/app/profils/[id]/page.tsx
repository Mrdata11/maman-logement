"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Profile } from "@/lib/profile-types";
import { ProfileDetail } from "@/components/ProfileDetail";

export default function ProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setProfile(data as Profile);
      }
      setLoading(false);
    }
    if (id) load();
  }, [id, supabase]);

  if (loading) {
    return (
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
        <p className="text-sm text-[var(--muted)]">Chargement du profil...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-12 space-y-4">
        <h1 className="text-xl font-bold text-[var(--foreground)]">
          Profil introuvable
        </h1>
        <p className="text-[var(--muted)]">
          Ce profil n&apos;existe pas ou n&apos;est plus publi&eacute;.
        </p>
        <a
          href="/profils"
          className="inline-block px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          Retour &agrave; la librairie
        </a>
      </div>
    );
  }

  if (!profile) return null;

  return <ProfileDetail profile={profile} />;
}
