"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function useRequireProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      console.log('[useRequireProfile] status:', status, 'session:', session);
      if (status !== "authenticated" || !session?.user) {
        setLoading(false);
        return;
      }
      const userId = (session.user as any).id;
      console.log('[useRequireProfile] userId:', userId);
      const res = await fetch(`/api/user/profile/${userId}`);
      console.log('[useRequireProfile] profile fetch status:', res.status);
      if (res.status === 404) {
        if (window.location.pathname !== "/auth/new-user") {
          router.replace("/auth/new-user");
        }
        setLoading(false);
        return;
      }
      if (!res.ok) {
        await signOut({ callbackUrl: "/auth" });
        return;
      }
      const data = await res.json();
      console.log('[useRequireProfile] profile data:', data);
      setProfile(data);
      setLoading(false);
    }
    check();
  }, [session, status, router]);

  useEffect(() => {
    if (!loading) {
      console.log('[useRequireProfile] returned profile:', profile);
    }
  }, [loading, profile]);

  return { loading, profile };
} 