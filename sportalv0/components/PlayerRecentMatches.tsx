"use client"

import React from "react"
import { Archive, ChevronRight, CheckCircle, AlertTriangle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface Match {
  player1: string
  player2: string
  score1: number
  score2: number
  result: "Won" | "Lost"
  date: string
  verificationStatus: "verified" | "disputed" | "pending"
}

interface PlayerRecentMatchesProps {
  playerName: string
  matches: Match[]
}

export const PlayerRecentMatches: React.FC<PlayerRecentMatchesProps> = ({ playerName, matches }) => {
  const router = useRouter()

  // Navigate to the player-specific game archive
  const handleViewArchive = () => {
    // Encode the player name for the URL
    const encodedPlayerName = encodeURIComponent(playerName)
    router.push(`/game-archive/${encodedPlayerName}`)
  }

  return (
    <div className="bg-card text-card-foreground rounded-lg p-4 overflow-x-auto mb-8">
      <div className="flex justify-between items-center mb-4">
        <button className="text-lg font-semibold flex items-center hover:text-muted-foreground transition-colors">
          {playerName}'s Recent Matches
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
