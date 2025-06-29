"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from "@/components/Header"
import { RecentMatches } from "@/components/RecentMatches"
import { Statistics } from "@/components/Statistics"
import { DemoMatchRequest } from "@/components/DemoMatchRequest"
import { DemoMatchFlow } from "@/components/DemoMatchFlow"
import { DemoScoreVerification } from "@/components/DemoScoreVerification"
import { DemoPlayerProfile } from "@/components/DemoPlayerProfile"
import { DemoGameArchive } from "@/components/DemoGameArchive"
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { useSession, signOut } from "next-auth/react";
import { useRequireProfile } from "@/hooks/useRequireProfile";
import { PlayerProfileHeader } from "@/components/PlayerProfileHeader";
import { PlayerStatistics } from "@/components/PlayerStatistics";
import { PlayerRecentMatches } from "@/components/PlayerRecentMatches";
import { PlayerRatingGraph } from "@/components/PlayerRatingGraph";

export default function HomePage() {
  const { loading, profile } = useRequireProfile();
  const { data: session, status } = useSession() as { data: any, status: 'loading' | 'authenticated' | 'unauthenticated' };
  const router = useRouter();

  if (status === "loading" || loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GoogleSignInButton />
      </div>
    );
  }
  if (!profile && status === "authenticated") return null;

  const isAdmin = session?.user?.email === 'raghavkshyp@gmail.com';

  return (
    <div className="min-h-screen p-4">
      <div className="flex justify-end gap-2 mb-2">
        {isAdmin && (
          <a
            href="/admin-match-dashboard"
            className="bg-gray-900 text-white rounded px-4 py-2 font-semibold shadow hover:bg-gray-700 transition"
          >
            Admin
          </a>
        )}
          <button
            onClick={() => signOut()}
            className="bg-[#49C5B6] border border-[#49C5B6] text-white rounded px-4 py-2 font-semibold shadow hover:bg-[#38b0a3] transition"
          >
            Log out
          </button>
      </div>
      <Header user={profile} />
      {/* <PlayerProfileHeader
        playerName={profile.username}
        playerRating={profile.rating}
        isFriend={false}
        headToHead={{ wins: 0, losses: 0 }}
        isOwnProfile={true}
        loggedInUsername={profile.username}
      /> */}
      <PlayerRecentMatches
        playerName={profile.username}
        matches={(profile.matches || []).slice(0, 5).map((match: any) => {
          const isPlayer1 = match.challenger?.username === profile.username;
          return {
            player1: match.challenger?.username
              ? `${match.challenger.username} (${typeof match.challenger_final_rating === 'number' ? match.challenger_final_rating : Math.round(match.challenger.rating ?? 1500)})`
              : '-',
            player2: match.opponent?.username
              ? `${match.opponent.username} (${typeof match.opponent_final_rating === 'number' ? match.opponent_final_rating : Math.round(match.opponent.rating ?? 1500)})`
              : '-',
            score1: match.challenger_score ?? match.score?.challenger ?? '-',
            score2: match.opponent_score ?? match.score?.opponent ?? '-',
            result: isPlayer1
              ? (match.challenger_score > match.opponent_score ? "Won" : "Lost")
              : (match.opponent_score > match.challenger_score ? "Won" : "Lost"),
            date: match.time_finish
              ? new Date(match.time_finish).toLocaleDateString()
              : match.scoreSubmittedAt
              ? new Date(match.scoreSubmittedAt).toLocaleDateString()
              : '',
            verificationStatus:
              match.status === "finish-acc"
                ? "verified"
                : match.status === "finish-rej"
                ? "disputed"
                : "verified",
          };
        })}
      />
      <PlayerStatistics statistics={profile.statistics || {
        totalMatches: 0,
        totalWins: 0,
        winRate: 0,
        highestRating: Math.round(profile.rating),
        longestWinStreak: 0,
        currentWinStreak: 0,
        bestWin: '-',
        longestLosingStreak: 0,
        avgPointsScored: 0,
        avgPointsConceded: 0,
        matchesThisMonth: 0,
        matchesLast7Days: 0,
        biggestRatingGain: 0,
        biggestRatingDrop: 0,
      }} />
      <div className="mt-8">
        <PlayerRatingGraph ratingHistory={profile.ratingHistory || []} />
      </div>
    </div>
  )
}
