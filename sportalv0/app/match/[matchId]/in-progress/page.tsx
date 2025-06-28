"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getMatchById } from "@/lib/api"

interface MatchInProgressPageProps {
  params: {
    matchId: string
  }
}

export default function MatchInProgressPage({ params }: MatchInProgressPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [matchDetails, setMatchDetails] = useState<any>(null)

  // For demo, assume current user is 'JohnDoe123'
  const currentUser = "JohnDoe123"

  useEffect(() => {
    async function fetchMatch() {
      setLoading(true)
      setError(null)
      try {
        const match = await getMatchById(params.matchId)
        setMatchDetails(match)
      } catch (err) {
        setError("Error loading match details.")
      } finally {
        setLoading(false)
      }
    }
    fetchMatch()
  }, [params.matchId])

  if (loading) return <div className="p-4">Loading match details...</div>
  if (error) return <div className="p-4">{error}</div>
  if (!matchDetails) return <div className="p-4">Match not found.</div>

  // Determine challenger and opponent info
  const isChallenger = matchDetails.challenger.username === currentUser
  const you = isChallenger ? matchDetails.challenger : matchDetails.opponent
  const opponent = isChallenger ? matchDetails.opponent : matchDetails.challenger
  const startTime = matchDetails.time_accept_play ? new Date(matchDetails.time_accept_play) : new Date()
  const formattedTime = startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const formattedDate = startTime.toLocaleDateString([], { month: "short", day: "numeric" })

  return (
    <div className="min-h-screen p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Match In Progress</h1>
      </div>

      <div className="bg-card rounded-lg p-6 mb-6">
        <div className="flex justify-center mb-6">
          <div className="bg-secondary/50 rounded-full p-6">
            <Clock className="h-16 w-16 text-primary animate-pulse" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-center mb-6">
          Your match with {opponent.username} is in progress
        </h2>

        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h3 className="text-lg font-bold mb-1">You</h3>
            <div className="text-sm text-muted-foreground">{you.username}</div>
            <div className="text-primary font-medium">{you.rating}</div>
          </div>
          <div className="text-xl font-bold">vs</div>
          <div className="text-center flex-1">
            <h3 className="text-lg font-bold mb-1">{opponent.username}</h3>
            <div className="text-sm text-muted-foreground">Opponent</div>
            <div className="text-primary font-medium">{opponent.rating}</div>
          </div>
        </div>

        <div className="bg-secondary/30 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-muted-foreground">Match started</div>
              <div className="font-medium">
                {formattedTime} on {formattedDate}
              </div>
            </div>
            <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">In Progress</div>
          </div>
        </div>

        <div className="text-center text-muted-foreground">
          <p>The challenger will enter the score when the match is complete.</p>
          <p>You'll be notified to confirm the results.</p>
        </div>
      </div>

      <div className="bg-card rounded-lg p-4">
        <h3 className="font-semibold mb-2">What happens next?</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Play your match with {opponent.username}</li>
          <li>• They will enter the final score</li>
          <li>• You'll receive a notification to confirm the score</li>
          <li>• Once confirmed, ratings will be updated</li>
        </ul>
      </div>
    </div>
  )
}
