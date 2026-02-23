"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { AuthButton } from "@/components/AuthButton";

interface NotificationPreferences {
  new_listings: boolean;
  contact_received: boolean;
  frequency: "daily" | "weekly";
}

const DEFAULT_PREFS: NotificationPreferences = {
  new_listings: true,
  contact_received: true,
  frequency: "weekly",
};

export default function ParametresPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
      if (user) loadPrefs(user.id);
    });
  }, [supabase]);

  const loadPrefs = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (data) {
        setPrefs({
          new_listings: data.new_listings ?? true,
          contact_received: data.contact_received ?? true,
          frequency: data.frequency ?? "weekly",
        });
      }
    } catch {
      // Table might not exist yet — use defaults
    }
  };

  const savePrefs = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from("notification_preferences").upsert({
        user_id: user.id,
        ...prefs,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Silently fail
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[var(--muted)]">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <h1 className="text-xl font-bold text-[var(--foreground)] mb-3">
          Param&egrave;tres
        </h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          Connectez-vous pour g&eacute;rer vos pr&eacute;f&eacute;rences.
        </p>
        <AuthButton redirectTo="/parametres" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">
        Param&egrave;tres
      </h1>

      {/* Account */}
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-6 mb-6">
        <h2 className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wide mb-4">
          Compte
        </h2>
        <div className="flex items-center gap-3">
          {user.user_metadata?.avatar_url && (
            <img src={user.user_metadata.avatar_url} alt="" className="w-10 h-10 rounded-full" />
          )}
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {user.user_metadata?.full_name || "Utilisateur"}
            </p>
            <p className="text-xs text-[var(--muted)]">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-6 mb-6">
        <h2 className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wide mb-4">
          Notifications par email
        </h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                Nouvelles annonces
              </p>
              <p className="text-xs text-[var(--muted)]">
                Recevez un r&eacute;sum&eacute; des nouvelles annonces correspondant &agrave; votre profil
              </p>
            </div>
            <input
              type="checkbox"
              checked={prefs.new_listings}
              onChange={(e) => setPrefs({ ...prefs, new_listings: e.target.checked })}
              className="filter-checkbox"
            />
          </label>

          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                Contacts re&ccedil;us
              </p>
              <p className="text-xs text-[var(--muted)]">
                Soyez notifi&eacute; quand quelqu&apos;un consulte vos coordonn&eacute;es
              </p>
            </div>
            <input
              type="checkbox"
              checked={prefs.contact_received}
              onChange={(e) => setPrefs({ ...prefs, contact_received: e.target.checked })}
              className="filter-checkbox"
            />
          </label>

          <div>
            <p className="text-sm font-medium text-[var(--foreground)] mb-2">
              Fr&eacute;quence
            </p>
            <div className="flex gap-2">
              {(["daily", "weekly"] as const).map((freq) => (
                <button
                  key={freq}
                  onClick={() => setPrefs({ ...prefs, frequency: freq })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    prefs.frequency === freq
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {freq === "daily" ? "Quotidien" : "Hebdomadaire"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={savePrefs}
          disabled={saving}
          className="mt-6 w-full px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
        >
          {saved ? "Enregistr\u00e9 !" : saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>

      {/* Links */}
      <div className="space-y-2 text-sm">
        <a href="/profils/mon-profil" className="block text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors">
          Mon profil
        </a>
        <a href="/mentions-legales" className="block text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          Mentions l&eacute;gales
        </a>
        <a href="/cgu" className="block text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          Conditions d&apos;utilisation
        </a>
      </div>
    </div>
  );
}
