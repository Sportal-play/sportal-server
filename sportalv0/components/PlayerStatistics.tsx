import type React from "react"
import { BarChart2 } from "lucide-react"
import { StatCard } from "./StatCard"

interface StatisticsProps {
  statistics: {
    totalMatches: number
    totalWins: number
    winRate: number
    highestRating: number
    longestWinStreak: number
    currentWinStreak: number
    bestWin: string
    longestLosingStreak: number
    avgPointsScored: number
    avgPointsConceded: number
    matchesThisMonth: number
    matchesLast7Days: number
    biggestRatingGain: number
    biggestRatingDrop: number
  }
}

export const PlayerStatistics: React.FC<StatisticsProps> = ({ statistics }) => {
  const statCards = [
    {
      label: 'Total Matches',
      value: statistics.totalMatches,
      subtext: statistics.totalMatches === 1 ? '1 match played' : `${statistics.totalMatches} matches played`,
      color: 'text-primary',
    },
    {
      label: 'Total Wins',
      value: statistics.totalWins,
      subtext: `${statistics.winRate}% win rate`,
      color: statistics.winRate > 60 ? 'text-green-500' : statistics.winRate < 40 ? 'text-red-500' : 'text-gray-300',
    },
    {
      label: 'Highest Rating',
      value: Math.round(statistics.highestRating),
      subtext: 'All-time peak',
      color: 'text-primary',
    },
    {
      label: 'Longest Win Streak',
      value: statistics.longestWinStreak,
      subtext: statistics.longestWinStreak === 1 ? '1 win in a row' : `${statistics.longestWinStreak} wins in a row`,
      color: statistics.longestWinStreak > 2 ? 'text-green-500' : 'text-gray-300',
    },
    {
      label: 'Current Win Streak',
      value: statistics.currentWinStreak,
      subtext: statistics.currentWinStreak === 1 ? '1 win' : `${statistics.currentWinStreak} wins`,
      color: statistics.currentWinStreak > 1 ? 'text-green-500' : 'text-gray-300',
    },
    {
      label: 'Best Win',
      value: statistics.bestWin.replace(/\((\d+(?:\.\d+)?)\)/, (m, p1) => `(${Math.round(Number(p1))})`),
      subtext: 'Highest rated opponent beaten',
      color: 'text-primary',
    },
    {
      label: 'Longest Losing Streak',
      value: statistics.longestLosingStreak,
      subtext: statistics.longestLosingStreak === 1 ? '1 loss in a row' : `${statistics.longestLosingStreak} losses in a row`,
      color: statistics.longestLosingStreak > 2 ? 'text-red-500' : 'text-gray-300',
    },
    {
      label: 'Avg Points Scored',
      value: typeof statistics.avgPointsScored === 'number' ? statistics.avgPointsScored.toFixed(2) : '-',
      subtext: 'Per game',
      color: 'text-primary',
    },
    {
      label: 'Avg Points Conceded',
      value: typeof statistics.avgPointsConceded === 'number' ? statistics.avgPointsConceded.toFixed(2) : '-',
      subtext: 'Per game',
      color: 'text-primary',
    },
    {
      label: 'Matches This Month',
      value: statistics.matchesThisMonth,
      subtext: 'Recent activity',
      color: statistics.matchesThisMonth > 0 ? 'text-green-500' : 'text-gray-300',
    },
    {
      label: 'Matches Last 7 Days',
      value: statistics.matchesLast7Days,
      subtext: 'Recent activity',
      color: statistics.matchesLast7Days > 0 ? 'text-green-500' : 'text-gray-300',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <BarChart2 className="w-7 h-7 mr-2 text-[#03DAC6]" />
        <h2 className="text-2xl font-bold text-white">Statistics</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            subtext={card.subtext}
            color={card.color}
          />
        ))}
      </div>
    </div>
  )
}
