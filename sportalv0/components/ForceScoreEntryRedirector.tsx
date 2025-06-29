"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

export default function ForceScoreEntryRedirector() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkForPendingScoreEntry() {
      if (status !== "authenticated" || !(session?.user && (session.user as any).username)) return;
      try {
        const username = (session.user as any).username;
        const res = await fetch(`/api/matches?username=${encodeURIComponent(username)}`);
        if (!res.ok) throw new Error('Failed to fetch matches');
        const data = await res.json();
        const matches = data.matches || [];
        console.log('[ForceScoreEntryRedirector] user:', username, 'matches:', matches);
        
        let pendingScoreMatch: any = undefined;
        
        matches.forEach((m: any) => {
          const isChallenger = m.challenger?.username === username;
          const isPending = typeof m.status === "string" && m.status.trim().toLowerCase() === "pending";
          const hasAcceptedChallenge = !!m.challengeAcceptedAt;
          const noScore = !m.challenger_score && !m.opponent_score;

          console.log(
            `[ForceScoreEntryRedirector] match ${m._id} raw status:`, 
            m.status, 
            'type:', typeof m.status
          );

          console.log(
            `[ForceScoreEntryRedirector] match ${m._id} {isChallenger: ${isChallenger}, isPending: ${isPending}, hasAcceptedChallenge: ${hasAcceptedChallenge}, noScore: ${noScore}, challenger: '${m.challenger?.username}', status: '${m.status}'}`
          );

          // Check if this is a pending match where the challenger needs to submit a score
          if (isChallenger && isPending && hasAcceptedChallenge && noScore) {
            pendingScoreMatch = m;
          }
        });
        console.log('[ForceScoreEntryRedirector] pendingScoreMatch:', pendingScoreMatch);
        if (pendingScoreMatch) {
          const scoreEntryPath = `/match/${pendingScoreMatch._id}/score-entry`;
          if (pathname !== scoreEntryPath) {
            router.replace(scoreEntryPath);
          }
        }
      } catch (error) {
        console.error('[ForceScoreEntryRedirector] Error:', error);
      }
    }

    const interval = setInterval(checkForPendingScoreEntry, 5000);
    checkForPendingScoreEntry(); // initial call
    return () => clearInterval(interval);
  }, [session, status, pathname, router]);

  return null;
} 