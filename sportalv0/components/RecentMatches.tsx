"use client"

import React, { useEffect, useState } from "react"
import { Archive, ChevronRight, CheckCircle, AlertTriangle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { formatRating } from "../lib/utils"

interface Match {
  player1: string
  player2: string
  score1: number
  score2: number
  result: "Won" | "Lost"
  date: string
  verificationStatus: "verified" | "disputed" | "pending"
}

export const RecentMatches: React.FC = () => {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMatches() {
      if (status !== "authenticated" || !session?.user) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      const userId = (session.user as any).id
      try {
        const res = await fetch(`/api/user/profile/${userId}`)
        if (res.status === 404) {
          setError("Please complete your profile.")
          setLoading(false)
          return
        }
        if (!res.ok) throw new Error('Failed to fetch matches')
        const profile = await res.json()
        const matchesRes = profile.matches || []
        const formattedMatches = matchesRes.slice(0, 5).map((match: any) => {
          const isPlayer1 = match.challenger._id?.toString() === userId
          return {
            player1: match.challenger.username + ` (${typeof match.challenger_final_rating === 'number' ? formatRating(match.challenger_final_rating) : formatRating(match.challenger.rating ?? 1500)})`,
            player2: match.opponent.username + ` (${typeof match.opponent_final_rating === 'number' ? formatRating(match.opponent_final_rating) : formatRating(match.opponent.rating ?? 1500)})`,
            score1: match.challenger_score,
            score2: match.opponent_score,
            result: isPlayer1
              ? (match.challenger_score > match.opponent_score ? "Won" : "Lost")
              : (match.opponent_score > match.challenger_score ? "Won" : "Lost"),
            date: match.time_finish ? new Date(match.time_finish).toLocaleDateString() : "",
            verificationStatus: match.status === "finish-acc"
              ? "verified"
              : match.status === "finish-rej"
              ? "disputed"
              : "pending",
          }
        })
        setMatches(formattedMatches)
      } catch (err) {
        setError("Error loading matches.")
      } finally {
        setLoading(false)
      }
    }
    fetchMatches()
  }, [session, status])

  const handleViewArchive = () => {
    router.push("/game-archive")
  }

  if (status !== "authenticated" || error === "Please complete your profile.") {
    return null
  }

  if (loading) return <div className="p-4">Loading recent matches...</div>
  if (error) return <div className="p-4">{error}</div>

  return (
    <div className="bg-card text-card-foreground rounded-lg p-4 overflow-x-auto mb-8">
      <div className="flex justify-between items-center mb-4">
        <button className="text-lg font-semibold flex items-center hover:text-muted-foreground transition-colors">
          Recent Matches
          <ChevronRight className="ml-2 w-5 h-5" />
        </button>
        <Button
          variant="outline"
          className="flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleViewArchive}
        >
          <Archive className="w-5 h-5 mr-2" />
          Game Archive
        </Button>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-4">Players</th>
            <th className="text-center py-2 px-4">Score</th>
            <th className="text-center py-2 px-4">Result</th>
            <th className="text-center py-2 px-4">Date</th>
            <th className="text-center py-2 px-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match, index) => (
            <React.Fragment key={index}>
              <tr>
                <td className="py-2 px-4">{match.player1}</td>
                <td className="py-2 px-4 text-center">{match.score1}</td>
                <td className="text-center py-2 px-4" rowSpan={2}>
                  <span className={`font-bold ${match.result === "Won" ? "text-[#03DAC6]" : "text-destructive"}`}>
                    {match.result}
                  </span>
                </td>
                <td className="text-center py-2 px-4" rowSpan={2}>
                  {match.date}
                </td>
                <td className="text-center py-2 px-4" rowSpan={2}>
                  {match.verificationStatus === "verified" && (
                    <div className="flex items-center justify-center text-[#03DAC6]" title="Verified">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  )}
                  {match.verificationStatus === "disputed" && (
                    <div className="flex items-center justify-center text-amber-500" title="Disputed">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  )}
                  {match.verificationStatus === "pending" && (
                    <div
                      className="flex items-center justify-center text-muted-foreground"
                      title="Pending Verification"
                    >
                      <Clock className="w-5 h-5" />
                    </div>
                  )}
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 px-4">{match.player2}</td>
                <td className="py-2 px-4 text-center">{match.score2}</td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
