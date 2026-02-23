"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase";

/**
 * Hook that syncs state between localStorage and Supabase.
 * - Reads localStorage immediately for fast initial render
 * - If user is connected, fetches from Supabase in background
 * - Writes to both localStorage AND Supabase when state changes
 * - On first login, merges localStorage data into Supabase
 */
export function useUserState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch {}
    return defaultValue;
  });

  const [loading, setLoading] = useState(false);
  const supabaseRef = useRef(createClient());
  const initialSyncDone = useRef(false);

  // Sync from Supabase on mount if user is logged in
  useEffect(() => {
    if (initialSyncDone.current) return;

    const supabase = supabaseRef.current;

    const syncFromSupabase = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setLoading(true);
      try {
        const { data } = await supabase
          .from("user_state")
          .select("value, updated_at")
          .eq("user_id", user.id)
          .eq("key", key)
          .single();

        if (data?.value !== undefined) {
          // Supabase has data — use it (server wins)
          setValue(data.value as T);
          localStorage.setItem(key, JSON.stringify(data.value));
        } else {
          // No Supabase data — push localStorage to Supabase (first sync)
          const localValue = localStorage.getItem(key);
          if (localValue) {
            await supabase.from("user_state").upsert({
              user_id: user.id,
              key,
              value: JSON.parse(localValue),
              updated_at: new Date().toISOString(),
            }, { onConflict: "user_id,key" });
          }
        }
      } catch {
        // Supabase might not have the table yet — gracefully degrade
      }
      setLoading(false);
      initialSyncDone.current = true;
    };

    syncFromSupabase();
  }, [key]);

  const updateValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof newValue === "function"
          ? (newValue as (prev: T) => T)(prev)
          : newValue;

        // Write to localStorage immediately
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {}

        // Write to Supabase in background
        const supabase = supabaseRef.current;
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            supabase.from("user_state").upsert({
              user_id: user.id,
              key,
              value: resolved,
              updated_at: new Date().toISOString(),
            }, { onConflict: "user_id,key" }).then(() => {
              // Success or error — both fine, localStorage is the fallback
            });
          }
        });

        return resolved;
      });
    },
    [key]
  );

  return [value, updateValue, loading];
}
