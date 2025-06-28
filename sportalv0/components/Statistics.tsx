"use client"

import React, { useEffect, useState } from "react"
import { BarChart2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { useSession } from "next-auth/react"
import { StatCard } from "./StatCard"
import { formatRating } from "../lib/utils"

const FILTERS = [
  { label: "All Time", value: "all" },
  { label: "Last Year", value: "year" },
  { label: "Last 90 Days", value: "90d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 7 Days", value: "7d" },
]

export const Statistics: React.FC = () => {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<{
    totalGames: number
    gamesWon: number
    gamesLost: number
    winPercentage: number
    lossPercentage: number
    highestRating: number
    bestWin: string
    bestWinStreak: number
    ratingHistory: Array<{ rating: number; date: string }>
    currentWinStreak?: number
    longestLosingStreak?: number
    avgPointsScored?: number
    avgPointsConceded?: number
    matchesThisMonth?: number
    matchesLast7Days?: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    async function fetchStats() {
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
        if (!res.ok) throw new Error('Failed to fetch profile')
        const profile = await res.json()
        const matches = (profile.matches || []).sort((a: any, b: any) => new Date(a.time_finish || 0).getTime() - new Date(b.time_finish || 0).getTime())
        let gamesWon = 0
        let gamesLost = 0
        let highestRating = profile.rating
        let bestWin = "-"
        let bestWinOpponentRating = -Infinity
        let bestWinStreak = 0
        let currentStreak = 0
        let maxStreak = 0
        let streak = 0
        for (let i = 0; i < matches.length; i++) {
          const match = matches[i]
          const isPlayer1 = match.challenger._id?.toString() === userId
          const didWin = isPlayer1
            ? match.challenger_score > match.opponent_score
            : match.opponent_score > match.challenger_score
          if (didWin) {
            gamesWon++
            streak++
            if (streak > maxStreak) maxStreak = streak
            const opponent = isPlayer1 ? match.opponent : match.challenger
            if (opponent.rating > bestWinOpponentRating) {
              bestWinOpponentRating = opponent.rating
              bestWin = `vs. ${opponent.username} (${opponent.rating})`
            }
          } else {
            gamesLost++
            streak = 0
          }
        }
        bestWinStreak = maxStreak
        const totalGames = matches.length
        const winPercentage = totalGames > 0 ? Math.round((gamesWon / totalGames) * 100) : 0
        const lossPercentage = totalGames > 0 ? Math.round((gamesLost / totalGames) * 100) : 0
        // Prepare rating history for the graph
        const ratingHistory = (profile.ratingHistory || []).map((entry: any) => ({
          rating: entry.rating,
          date: new Date(entry.date).toISOString().slice(0, 10),
        }))
        setStats({
          totalGames,
          gamesWon,
          gamesLost,
          winPercentage,
          lossPercentage,
          highestRating,
          bestWin,
          bestWinStreak,
          ratingHistory,
          currentWinStreak: profile.statistics?.currentWinStreak ?? 0,
          longestLosingStreak: profile.statistics?.longestLosingStreak ?? 0,
          avgPointsScored: profile.statistics?.avgPointsScored ?? 0,
          avgPointsConceded: profile.statistics?.avgPointsConceded ?? 0,
          matchesThisMonth: profile.statistics?.matchesThisMonth ?? 0,
          matchesLast7Days: profile.statistics?.matchesLast7Days ?? 0,
        })
      } catch (err) {
        setError("Error loading statistics.")
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [session, status])

  if (status !== "authenticated" || error === "Please complete your profile.") {
    return null
  }

  if (loading) return <div className="p-4">Loading statistics...</div>
  if (error || !stats) return <div className="p-4">{error || "No statistics available."}</div>

  // Filter rating history for the graph
  const now = new Date()
  let filteredHistory = stats.ratingHistory
  if (filter !== "all") {
    let cutoff: Date
    if (filter === "year") cutoff = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    else if (filter === "90d") cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    else if (filter === "30d") cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    else if (filter === "7d") cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    else cutoff = new Date(0)
    filteredHistory = stats.ratingHistory.filter((entry) => new Date(entry.date) >= cutoff)
  }

  return (
    <div className="bg-card text-card-foreground rounded-lg p-4">
      <div className="flex items-center mb-4">
        <BarChart2 className="w-6 h-6 mr-2 text-primary" />
        <h2 className="text-lg font-semibold">Statistics</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Games" value={stats.totalGames} subtext={stats.totalGames === 1 ? '1 match played' : `${stats.totalGames} matches played`} color="text-primary" />
        <StatCard label="Games Won" value={stats.gamesWon} subtext={`${stats.winPercentage}% win rate`} color={stats.winPercentage > 60 ? 'text-green-500' : stats.winPercentage < 40 ? 'text-red-500' : 'text-gray-300'} />
        <StatCard label="Games Lost" value={stats.gamesLost} subtext={`${stats.lossPercentage}% loss rate`} color={stats.lossPercentage > 60 ? 'text-red-500' : stats.lossPercentage < 40 ? 'text-green-500' : 'text-gray-300'} />
        <StatCard label="Current Win Streak" value={typeof stats.currentWinStreak === 'number' ? stats.currentWinStreak : 0} subtext={(typeof stats.currentWinStreak === 'number' && stats.currentWinStreak === 1) ? '1 win' : `${typeof stats.currentWinStreak === 'number' ? stats.currentWinStreak : 0} wins`} color={typeof stats.currentWinStreak === 'number' && stats.currentWinStreak > 1 ? 'text-green-500' : 'text-gray-300'} />
        <StatCard label="Longest Losing Streak" value={typeof stats.longestLosingStreak === 'number' ? stats.longestLosingStreak : 0} subtext={(typeof stats.longestLosingStreak === 'number' && stats.longestLosingStreak === 1) ? '1 loss in a row' : `${typeof stats.longestLosingStreak === 'number' ? stats.longestLosingStreak : 0} losses in a row`} color={typeof stats.longestLosingStreak === 'number' && stats.longestLosingStreak > 2 ? 'text-red-500' : 'text-gray-300'} />
        <StatCard label="Highest Rating" value={formatRating(stats.highestRating)} subtext="All-time peak" color="text-primary" />
        <StatCard label="Best Win" value={stats.bestWin.replace(/\((\d+(?:\.\d+)?)\)/, (m, p1) => `(${formatRating(Number(p1))})`)} subtext="Highest rated opponent beaten" color="text-primary" />
        <StatCard label="Best Win Streak" value={stats.bestWinStreak} subtext={stats.bestWinStreak === 1 ? '1 win in a row' : `${stats.bestWinStreak} wins in a row`} color={stats.bestWinStreak > 2 ? 'text-green-500' : 'text-gray-300'} />
        <StatCard label="Avg Points Scored" value={typeof stats.avgPointsScored === 'number' ? stats.avgPointsScored.toFixed(2) : '-'} subtext="Per game" color="text-primary" />
        <StatCard label="Avg Points Conceded" value={typeof stats.avgPointsConceded === 'number' ? stats.avgPointsConceded.toFixed(2) : '-'} subtext="Per game" color="text-primary" />
        <StatCard label="Matches This Month" value={stats.matchesThisMonth ?? 0} subtext="Recent activity" color={stats.matchesThisMonth && stats.matchesThisMonth > 0 ? 'text-green-500' : 'text-gray-300'} />
        <StatCard label="Matches Last 7 Days" value={stats.matchesLast7Days ?? 0} subtext="Recent activity" color={stats.matchesLast7Days && stats.matchesLast7Days > 0 ? 'text-green-500' : 'text-gray-300'} />
      </div>
      <div className="mt-8">
        <div className="flex items-center mb-2 gap-2">
          <span className="font-semibold">Rating Progress:</span>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`px-2 py-1 rounded text-sm font-medium border ${filter === f.value ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-secondary-foreground border-border"}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ width: "100%", height: 250 }}>
          <ResponsiveContainer>
            <LineChart data={filteredHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey={d => formatRating(d.rating)} stroke="#03DAC6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

