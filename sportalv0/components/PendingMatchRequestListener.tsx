"use client";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useMatchRequest } from "@/contexts/MatchRequestContext";

export function PendingMatchRequestListener() {
  const { data: session } = useSession();
  const { showMatchRequest } = useMatchRequest();
  const seenMatchIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!session?.user) {
      console.log('[PendingMatchRequestListener] No session user, skipping poll.');
      return;
    }
    console.log('[PendingMatchRequestListener] Mounted for user:', session.user);
    const poll = async () => {
      try {
        console.log('[PendingMatchRequestListener] Polling /api/matches...');
        const res = await fetch("/api/matches");
        if (!res.ok) {
          console.log('[PendingMatchRequestListener] Response not ok:', res.status);
          return;
        }
        const data = await res.json();
        const allMatches = data.matches || [];
        
        // Filter for pending matches where current user is the opponent
        const userId = (session.user as any).id;
        const pendingMatches = allMatches.filter((match: any) => {
          const isPending = match.status === 'pending';
          const isOpponent = match.opponent?._id === userId || match.opponent?.id === userId;
          const notAccepted = !match.challengeAcceptedAt;
          return isPending && isOpponent && notAccepted;
        });
        
        console.log('[PendingMatchRequestListener] All matches:', allMatches.length, 'Pending matches for user:', pendingMatches.length);
        console.log('[PendingMatchRequestListener] pendingMatches:', pendingMatches.map((m: any) => ({_id: m._id, challenger: m.challenger?.username, opponent: m.opponent?.username, status: m.status})));
        
        for (const match of pendingMatches) {
          if (!seenMatchIds.current.has(match._id)) {
            console.log('[PendingMatchRequestListener] Calling showMatchRequest for match:', match._id, 'challenger:', match.challenger?.username, 'opponent:', match.opponent?.username);
            showMatchRequest({
              name: match.challenger.username,
              rating: match.challenger.rating,
              avatar: match.challenger.avatar,
              matchId: match._id,
            });
            seenMatchIds.current.add(match._id);
          } else {
            console.log('[PendingMatchRequestListener] Already seen match:', match._id);
          }
        }
      } catch (err) {
        console.log('[PendingMatchRequestListener] Polling error:', err);
      }
    };
    const interval = setInterval(poll, 5000);
    poll(); // initial call
    return () => clearInterval(interval);
  }, [session, showMatchRequest]);
  return null;
} 