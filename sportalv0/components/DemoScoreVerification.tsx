"use client"

import { Button } from "@/components/ui/button"
import { useScoreVerification } from "@/contexts/ScoreVerificationContext"

export function DemoScoreVerification() {
  const { showSubmitterVerification, showOpponentVerification } = useScoreVerification()

  // For demo purposes, we'll use fixed data
  const matchId = "demo-match-123"
  const opponent = {
    name: "Alice456",
    rating: 1820,
  }
  const score = {
    playerScore: 21,
    opponentScore: 18,
  }

  return (
    <div className="space-y-4 mb-8">
      <h2 className="text-lg font-semibold">Demo Score Verification</h2>
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={() => showSubmitterVerification(matchId, opponent, score)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Demo: Submitter Verification View
        </Button>
        <Button
          onClick={() => showOpponentVerification(matchId, opponent, score)}
          variant="outline"
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          Demo: Opponent Verification View
        </Button>
      </div>
    </div>
  )
}
