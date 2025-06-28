import React, { useState } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

const FILTERS = [
  { label: "All Time", value: "all" },
  { label: "Last Year", value: "year" },
  { label: "Last 90 Days", value: "90d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 7 Days", value: "7d" },
]

interface PlayerRatingGraphProps {
  ratingHistory: Array<{ rating: number; date: string }>
}

export const PlayerRatingGraph: React.FC<PlayerRatingGraphProps> = ({ ratingHistory }) => {
  const [filter, setFilter] = useState("all")

  // Filter rating history for the graph
  const now = new Date()
  let filteredHistory = ratingHistory
  if (filter !== "all") {
    let cutoff: Date
    if (filter === "year") cutoff = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    else if (filter === "90d") cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    else if (filter === "30d") cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    else if (filter === "7d") cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    else cutoff = new Date(0)
    filteredHistory = ratingHistory.filter((entry) => new Date(entry.date) >= cutoff)
  }

  return (
    <div className="bg-card text-card-foreground rounded-lg p-4">
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
            <Line type="monotone" dataKey={d => Math.round(d.rating)} stroke="#03DAC6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
} 