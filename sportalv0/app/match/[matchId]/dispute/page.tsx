"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, AlertTriangle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ScoreSelector } from "@/components/ScoreSelector"
import { useToast } from "@/hooks/use-toast"

interface DisputePageProps {
  params: {
    matchId: string
  }
}

export default function DisputePage({ params }: DisputePageProps) {
  const router = useRouter()
  const [disputeReason, setDisputeReason] = useState("incorrect-score")
  const [comment, setComment] = useState("")
  const [correctScores, setCorrectScores] = useState({
    you: 21,
    opponent: 18,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast();

  // In a real app, you would fetch match details based on the matchId
  const matchDetails = {
    opponent: {
      name: "Alice456",
      rating: 1820,
    },
    submittedScores: {
      player: 18,
      opponent: 21,
    },
  }

  const handleScoreChange = (player: "you" | "opponent", score: number) => {
    setCorrectScores((prev) => ({
      ...prev,
      [player]: score,
    }))
  }

  const handleSubmitDispute = async () => {
    setIsSubmitting(true)
    const disputedScore = {
      challenger: correctScores.you,
      opponent: correctScores.opponent,
    }
    try {
      const res = await fetch('/api/match/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: params.matchId,
          disputedScore,
          reason: disputeReason,
          comment,
        }),
      })
      if (res.ok) {
        toast({ title: 'Dispute submitted!', description: 'Your dispute has been sent.' })
        router.push('/')
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to submit dispute' })
        setIsSubmitting(false)
      }
    } catch (err) {
      toast({ title: 'Network error', description: 'Could not submit dispute. Please try again.' })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Dispute Match Score</h1>
      </div>

      <div className="bg-card rounded-lg p-6 mb-6">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-destructive/10 rounded-full p-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold mb-2">Submitted Score</h2>
          <div className="flex justify-center items-center">
            <div className="text-center mx-4">
              <div className="text-sm text-muted-foreground">You</div>
              <div className="text-2xl font-bold">{matchDetails.submittedScores.player}</div>
            </div>
            <div className="text-xl font-bold">-</div>
            <div className="text-center mx-4">
              <div className="text-sm text-muted-foreground">{matchDetails.opponent.name}</div>
              <div className="text-2xl font-bold">{matchDetails.submittedScores.opponent}</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Reason for Dispute</h3>
            <RadioGroup value={disputeReason} onValueChange={setDisputeReason}>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="incorrect-score" id="incorrect-score" />
                <Label htmlFor="incorrect-score">Incorrect Score</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="match-not-played" id="match-not-played" />
                <Label htmlFor="match-not-played">Match Not Played</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Other Reason</Label>
              </div>
            </RadioGroup>
          </div>

          {disputeReason === "incorrect-score" && (
            <div>
              <h3 className="font-semibold mb-3">Correct Score</h3>
              <div className="flex justify-center items-center mb-4">
                <div className="flex-1 flex justify-center">
                  <ScoreSelector value={correctScores.you} onChange={(value) => handleScoreChange("you", value)} />
                </div>
                <div className="text-xl font-bold px-4">-</div>
                <div className="flex-1 flex justify-center">
                  <ScoreSelector
                    value={correctScores.opponent}
                    onChange={(value) => handleScoreChange("opponent", value)}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-3">Additional Comments</h3>
            <Textarea
              placeholder="Please provide details about your dispute..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center"
            onClick={handleSubmitDispute}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Dispute
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg p-4">
        <h3 className="font-semibold mb-2">What happens next?</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Your dispute will be sent to {matchDetails.opponent.name}</li>
          <li>• They will have the opportunity to respond</li>
          <li>• If they agree, the score will be corrected</li>
          <li>• If they disagree, the match may be reviewed by an admin</li>
        </ul>
      </div>
    </div>
  )
}
