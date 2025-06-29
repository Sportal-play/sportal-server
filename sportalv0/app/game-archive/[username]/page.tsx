"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Filter, Search, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRequireProfile } from "@/hooks/useRequireProfile"
import { formatRating } from "@/lib/utils"

interface GameArchivePageProps {
  params: {
    username: string
  }
}

interface Match {
  id: string
  player1: string
  player2: string
  score1: number
  score2: number
  result: "Won" | "Lost"
  date: string
  rating1Before: number
  rating1After: number
  rating2Before: number
  rating2After: number
  verificationStatus: "verified" | "disputed" | "pending"
}

// Type for match object returned by API
interface APIMatch {
  _id: string;
  challenger: { username: string; rating: number };
  opponent: { username: string; rating: number };
  challenger_score: number;
  opponent_score: number;
  status: string;
  time_finish?: string;
  ratingChallengerBefore?: number;
  ratingChallengerAfter?: number;
  ratingOpponentBefore?: number;
  ratingOpponentAfter?: number;
}

export default function PlayerGameArchivePage({ params }: GameArchivePageProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { loading: profileLoading, profile } = useRequireProfile()

  // Use the username param directly
  const playerName = decodeURIComponent(params.username || '')

  useEffect(() => {
    async function fetchMatches() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/matches?username=${encodeURIComponent(playerName)}`)
        if (!res.ok) throw new Error("Failed to fetch matches")
        const matchesRes = await res.json()
        const formattedMatches = (matchesRes.matches || []).map((match: APIMatch) => {
          const isPlayer1 = match.challenger.username === playerName
          return {
            id: match._id,
            player1: match.challenger.username + ` (${formatRating(match.ratingChallengerBefore ?? match.challenger.rating)})`,
            player2: match.opponent.username + ` (${formatRating(match.ratingOpponentBefore ?? match.opponent.rating)})`,
            score1: match.challenger_score,
            score2: match.opponent_score,
            result: isPlayer1
              ? (match.challenger_score > match.opponent_score ? "Won" : "Lost")
              : (match.opponent_score > match.challenger_score ? "Won" : "Lost"),
            date: match.time_finish ? new Date(match.time_finish).toLocaleDateString() : "",
            rating1Before: formatRating(match.ratingChallengerBefore ?? match.challenger.rating),
            rating1After: formatRating(match.ratingChallengerAfter ?? match.challenger.rating),
            rating2Before: formatRating(match.ratingOpponentBefore ?? match.opponent.rating),
            rating2After: formatRating(match.ratingOpponentAfter ?? match.opponent.rating),
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
  }, [playerName])

  // Filter and search matches
  const filteredMatches = matches.filter((match) => {
    const matchesFilter =
      filter === "all" || (filter === "won" && match.result === "Won") || (filter === "lost" && match.result === "Lost")

    const matchesSearch =
      searchQuery === "" ||
      match.player1.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.player2.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesFilter && matchesSearch
  })

  // Pagination
  const itemsPerPage = 5
  const totalPages = Math.ceil(filteredMatches.length / itemsPerPage)
  const paginatedMatches = filteredMatches.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleViewMatchDetails = (matchId: string) => {
    // In a real app, navigate to match details page
    console.log(`Viewing match details for ${matchId}`)
  }

  if (profileLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!profile) return null

  if (loading) return <div className="p-4">Loading matches...</div>
  if (error) return <div className="p-4">{error}</div>

  return (
    <div className="min-h-screen p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">{playerName}'s Game Archive</h1>
      </div>

      <div className="bg-card rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Input
              type="search"
              placeholder="Search opponents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter matches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Matches</SelectItem>
                <SelectItem value="won">Matches Won</SelectItem>
                <SelectItem value="lost">Matches Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-4">Date</th>
                <th className="text-left py-2 px-4">Players</th>
                <th className="text-center py-2 px-4">Score</th>
                <th className="text-center py-2 px-4">Result</th>
                <th className="text-center py-2 px-4">Rating Change</th>
                <th className="text-center py-2 px-4">Status</th>
                <th className="text-center py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMatches.map((match) => (
                <tr key={match.id} className="border-b border-border">
                  <td className="py-3 px-4">{match.date}</td>
                  <td className="py-3 px-4">
                    <div>{match.player1}</div>
                    <div className="text-muted-foreground">vs</div>
                    <div>{match.player2}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div>{match.score1}</div>
                    <div className="text-muted-foreground">-</div>
                    <div>{match.score2}</div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`font-bold ${match.result === "Won" ? "text-[#03DAC6]" : "text-destructive"}`}>
                      {match.result}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <div
                      className={`font-medium ${
                        match.rating1After > match.rating1Before ? "text-[#03DAC6]" : "text-destructive"
                      }`}
                    >
                      {match.rating1After > match.rating1Before ? "+" : ""}
                      {match.rating1After - match.rating1Before}
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
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
                  <td className="text-center py-3 px-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewMatchDetails(match.id)}
                      className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredMatches.length)} of {filteredMatches.length} matches
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
