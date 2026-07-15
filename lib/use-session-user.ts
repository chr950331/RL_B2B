"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getAuthToken } from "@/lib/api";
import type { Buyer } from "@/lib/types";

export function useSessionUser() {
  const router = useRouter();
  const [user, setUser] = useState<Buyer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!getAuthToken()) {
        router.push("/login");
        return;
      }
      try {
        const me = await api<Buyer>("/me");
        if (mounted) setUser(me);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "无法读取用户");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [router]);

  return { user, loading, error };
}
