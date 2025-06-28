"use client"

import { Header } from "@/components/Header"
import { PlayerProfileHeader } from "@/components/PlayerProfileHeader"
import { PlayerRecentMatches } from "@/components/PlayerRecentMatches"
import { PlayerStatistics } from "@/components/PlayerStatistics"
import { PlayerRatingGraph } from "@/components/PlayerRatingGraph"
import { useEffect, useState } from "react"
import { useRequireProfile } from "@/hooks/useRequireProfile"
import { Button } from "@/components/ui/button"

interface PlayerProfilePageProps {
  params: {
    username: string
  }
}

export default function PlayerProfilePage({ params }: PlayerProfilePageProps) {
  const [profile, setProfile] = useState<any>(null)
  const [fullProfile, setFullProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const playerName = decodeURIComponent(params.username)
  const { loading: userLoading, profile: userProfile } = useRequireProfile()

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/user/search?query=${encodeURIComponent(playerName)}`)
        if (!res.ok) throw new Error('Failed to fetch profile')
        const data = await res.json()
        const user = (data.results || []).find((u: any) => u.username.toLowerCase() === playerName.toLowerCase())
        if (!user) throw new Error('User not found')
        setProfile(user)
        // Fetch full profile by _id for matches and stats
        const fullRes = await fetch(`/api/user/profile/${user._id}`)
        if (!fullRes.ok) throw new Error('Failed to fetch full profile')
        const fullData = await fullRes.json()
        setFullProfile(fullData)
      } catch (err: any) {
        setError(err.message || 'Error loading profile')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [playerName])

  if (loading || userLoading) return <div className="p-4">Loading profile...</div>
  if (error) return <div className="p-4">{error}</div>
  if (!profile || !userProfile) return <div className="p-4">Profile not found.</div>

  return (
    <div className="min-h-screen p-4">
      <Header user={userProfile} />
      <PlayerProfileHeader
        playerName={profile.username}
        playerRating={profile.rating}
        isFriend={false}
        headToHead={{ wins: 0, losses: 0 }}
        isOwnProfile={profile.username === userProfile.username}
        loggedInUsername={userProfile.username}
      />
      {/* Show recent matches and statistics for the visited user */}
      {fullProfile && (
        <>
          <PlayerRecentMatches
            playerName={profile.username}
            matches={(fullProfile.matches || []).slice(0, 5).map((match: any) => {
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
          <PlayerStatistics statistics={fullProfile.statistics || {
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
          }} />
          <div className="mt-8">
            <PlayerRatingGraph ratingHistory={fullProfile.ratingHistory || []} />
          </div>
        </>
      )}
    </div>
  )
}
