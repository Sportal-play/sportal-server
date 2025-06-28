"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface DisputeReceivedPageProps {
  params: {
    matchId: string
  }
}

export default function DisputeReceivedPage({ params }: DisputeReceivedPageProps) {
  const router = useRouter()
  const [response, setResponse] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast();

  // In a real app, you would fetch match and dispute details based on the matchId
  const disputeDetails = {
    opponent: {
      name: "JohnDoe123",
      rating: 1850,
    },
    submittedScores: {
      player: 21,
      opponent: 18,
    },
    disputedScores: {
      player: 18,
      opponent: 21,
    },
    reason: "incorrect-score",
    comment: "I believe there was a mistake in the score entry. The actual score was 21-18 in my favor.",
  }

  const handleAcceptDispute = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/match/dispute-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: params.matchId, action: 'verify' }),
      })
      if (res.ok) {
        toast({ title: 'Dispute accepted', description: 'The dispute was accepted and ratings updated.' })
        router.push(`/match/${params.matchId}/rating-update`)
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to accept dispute' })
        setIsSubmitting(false)
      }
    } catch (err) {
      toast({ title: 'Network error', description: 'Could not accept dispute. Please try again.' })
      setIsSubmitting(false)
    }
  }

  const handleRejectDispute = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/match/dispute-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: params.matchId, action: 'dispute' }),
      })
      if (res.ok) {
        toast({ title: 'Dispute rejected', description: 'The dispute was rejected. Both players flagged.' })
        router.push(`/`)
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to reject dispute' })
        setIsSubmitting(false)
      }
    } catch (err) {
      toast({ title: 'Network error', description: 'Could not reject dispute. Please try again.' })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Match Score Disputed</h1>
      </div>

      <div className="bg-card rounded-lg p-6 mb-6">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-destructive/10 rounded-full p-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold mb-2">{disputeDetails.opponent.name} has disputed your submitted score</h2>
        </div>

        <div className="bg-secondary/30 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3 text-center">Score Comparison</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-center text-sm text-muted-foreground mb-2">Your Submission</h4>
              <div className="flex justify-center items-center">
                <div className="text-center mx-2">
                  <div className="text-xs text-muted-foreground">You</div>
                  <div className="text-xl font-bold">{disputeDetails.submittedScores.player}</div>
                </div>
                <div className="text-lg font-bold">-</div>
                <div className="text-center mx-2">
                  <div className="text-xs text-muted-foreground">{disputeDetails.opponent.name}</div>
                  <div className="text-xl font-bold">{disputeDetails.submittedScores.opponent}</div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-center text-sm text-muted-foreground mb-2">Their Claim</h4>
              <div className="flex justify-center items-center">
                <div className="text-center mx-2">
                  <div className="text-xs text-muted-foreground">{disputeDetails.opponent.name}</div>
                  <div className="text-xl font-bold">{disputeDetails.disputedScores.player}</div>
                </div>
                <div className="text-lg font-bold">-</div>
                <div className="text-center mx-2">
                  <div className="text-xs text-muted-foreground">You</div>
                  <div className="text-xl font-bold">{disputeDetails.disputedScores.opponent}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-secondary/30 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">Dispute Reason</h3>
          <p className="text-sm mb-4">
            {disputeDetails.reason === "incorrect-score"
              ? "Incorrect score was submitted"
              : disputeDetails.reason === "match-not-played"
                ? "Match was not played"
                : "Other reason"}
          </p>

          <h3 className="font-semibold mb-2">Additional Comments</h3>
          <p className="text-sm">{disputeDetails.comment}</p>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-3">Your Response</h3>
          <Textarea
            placeholder="Add your response to this dispute..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <div className="flex space-x-4">
          <Button
            variant="outline"
            className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center justify-center"
            onClick={handleRejectDispute}
            disabled={isSubmitting}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Reject Dispute
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center"
            onClick={handleAcceptDispute}
            disabled={isSubmitting}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Accept Dispute
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg p-4">
        <h3 className="font-semibold mb-2">What happens next?</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• If you accept the dispute, the score will be corrected</li>
          <li>• If you reject the dispute, it may be reviewed by an admin</li>
          <li>• Ratings will be updated based on the final decision</li>
        </ul>
      </div>
    </div>
  )
}
