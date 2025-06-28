"use client";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useMatchRequest } from "@/contexts/MatchRequestContext";

export function PendingMatchRequestListener() {
  const { data: session } = useSession();
  const { showMatchRequest } = useMatchRequest();
  const lastShownMatchId = useRef<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    const poll = async () => {
      try {
        const res = await fetch("/api/matches/pending");
        if (!res.ok) return;
        const data = await res.json();
        const pending = data.matches?.[0];
        console.log("pending", pending);
        if (pending && pending._id !== lastShownMatchId.current) {
          showMatchRequest({
            name: pending.challenger.username,
            rating: pending.challenger.rating,
            avatar: pending.challenger.avatar,
            matchId: pending._id,
          });
          lastShownMatchId.current = pending._id;
        }
      } catch {}
    };
    const interval = setInterval(poll, 5000);
    poll(); // initial call
    return () => clearInterval(interval);
  }, [session, showMatchRequest]);
  return null;
} 