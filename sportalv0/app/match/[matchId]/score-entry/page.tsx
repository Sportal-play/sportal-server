"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScoreSelector } from "@/components/ScoreSelector"
import { useScoreVerification } from "@/contexts/ScoreVerificationContext"
import { getMatchById, submitMatchResult } from "@/lib/api"
import React from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"

interface ScoreEntryPageProps {
  params: {
    matchId: string
  }
}

export default function ScoreEntryPage({ params }: ScoreEntryPageProps) {
  const router = useRouter()
  const { showSubmitterVerification } = useScoreVerification()
  const [playerScores, setPlayerScores] = useState({
    you: 0,
    opponent: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [matchDetails, setMatchDetails] = useState<any>(null)
  const { data: session, status } = useSession()
  const { toast } = useToast()

  // Unwrap params if it's a Promise (Next.js App Router)
  // @ts-ignore
  const paramsObj = typeof params.then === 'function' ? React.use(params) as { matchId: string } : params;

  useEffect(() => {
    async function fetchMatch() {
      setLoading(true)
      setError(null)
      try {
        const match = await getMatchById(paramsObj.matchId)
        setMatchDetails(match)
      } catch (err) {
        setError("Error loading match details.")
      } finally {
        setLoading(false)
      }
    }
    fetchMatch()
  }, [paramsObj.matchId])

  const handleScoreChange = (player: "you" | "opponent", score: number) => {
    setPlayerScores((prev) => ({
      ...prev,
      [player]: score,
    }))
  }

  const handleSubmit = async () => {
    if (!matchDetails) return
    setIsSubmitting(true)
    try {
      // Determine challenger and opponent usernames
      const challenger = matchDetails.challenger.username
      const opponent = matchDetails.opponent.username
      // Submit the score
      await submitMatchResult(
        matchDetails._id,
        challenger === (session?.user as any)?.username ? playerScores.you : playerScores.opponent,
        challenger === (session?.user as any)?.username ? playerScores.opponent : playerScores.you
      )
      // Show a toast and redirect to homepage
      toast({ title: "Scores submitted!", description: "Your scores have been submitted successfully." });
      setTimeout(() => {
        router.replace("/");
      }, 400);
      // Optionally, show the verification pending modal for the submitter (if you want to keep it)
      // showSubmitterVerification(paramsObj.matchId, matchDetails.opponent, {
      //   playerScore: playerScores.you,
      //   opponentScore: playerScores.opponent,
      // })
    } catch (err) {
      setError("Error submitting scores.");
      toast({ title: "Error", description: "Error submitting scores.", variant: "destructive" });
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || status === "loading") return <div className="p-4">Loading match details...</div>
  if (error) return <div className="p-4">{error}</div>
  if (!matchDetails) return <div className="p-4">Match not found.</div>
  if (!session || !session.user) return <div className="p-4">Not authenticated.</div>

  // Only allow the challenger to enter the score, and only if match is pending, accepted, and has no score
  const isChallenger = matchDetails.challenger.username === (session.user as any).username
  const isPendingAccepted = matchDetails.status === 'pending' && matchDetails.challengeAcceptedAt && !matchDetails.score
  if (!isChallenger || !isPendingAccepted) {
    // Redirect to match in-progress page
    if (typeof window !== 'undefined') {
      router.replace(`/match/${paramsObj.matchId}/in-progress`)
    }
    return null
  }

  const opponent = matchDetails.opponent

  return (
    <div className="min-h-screen p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Enter Match Score</h1>
      </div>

      <div className="bg-card rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h2 className="text-xl font-bold mb-1">You</h2>
            <div className="text-sm text-muted-foreground">{(session.user as any).username}</div>
            <div className="text-primary font-medium">
              {matchDetails.challenger?.rating ? Math.round(matchDetails.challenger.rating) : '-'}
            </div>
          </div>
          <div className="text-xl font-bold">vs</div>
          <div className="text-center flex-1">
            <h2 className="text-xl font-bold mb-1">Opponent</h2>
            <div className="text-sm text-muted-foreground">{opponent.username}</div>
            <div className="text-primary font-medium">
              {opponent.rating ? Math.round(opponent.rating) : '-'}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex-1 flex justify-center">
            <ScoreSelector value={playerScores.you} onChange={(value) => handleScoreChange("you", value)} />
          </div>
          <div className="text-xl font-bold px-4">-</div>
          <div className="flex-1 flex justify-center">
            <ScoreSelector value={playerScores.opponent} onChange={(value) => handleScoreChange("opponent", value)} />
          </div>
        </div>

        <Button
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            "Submitting..."
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Score
            </>
          )}
        </Button>
      </div>

      <div className="bg-card rounded-lg p-4">
        <h3 className="font-semibold mb-2">Match Rules</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Enter the final score for both players</li>
          <li>• Scores must be entered accurately</li>
          <li>• Your opponent will need to confirm the score</li>
          <li>• Ratings will be updated after confirmation</li>
        </ul>
      </div>
    </div>
  )
}
