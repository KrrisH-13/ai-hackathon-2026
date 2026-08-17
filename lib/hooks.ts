"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/db/types";

/** Current auth user + profile, loaded client-side. */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) return;
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (isMounted) setProfile(data);
      }

      if (isMounted) setLoading(false);
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading };
}

function subscribeToOnlineStatus(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

/** Tracks browser online/offline status. */
export function useOnlineStatus() {
  return useSyncExternalStore(
    subscribeToOnlineStatus,
    () => navigator.onLine,
    () => true
  );
}
