"use client"

import { useState } from "react"
import { X, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface MatchScore {
  playerScore: number
  opponentScore: number
}

interface ScoreVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  matchId: string
  opponent: {
    name: string
    rating: number
  }
  score: MatchScore
  isSubmitter?: boolean
  onVerify?: () => void
  onDispute?: () => void
}

export function ScoreVerificationModal({
  isOpen,
  onClose,
  matchId,
  opponent,
  score,
  isSubmitter = false,
  onVerify,
  onDispute,
}: ScoreVerificationModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast();

  const handleVerify = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/match/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      })
      setIsLoading(false)
      if (res.ok) {
        toast({ title: 'Score verified!', description: 'The match score has been verified.', })
        onClose();
        if (onVerify) onVerify();
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to verify score', })
      }
    } catch (err) {
      toast({ title: 'Network error', description: 'Could not verify score. Please try again.' })
      setIsLoading(false)
    }
  }

  const handleDispute = async () => {
    setIsLoading(true)
    try {
      const disputedScore = {
        challenger: score.playerScore,
        opponent: score.opponentScore,
      }
      const res = await fetch('/api/match/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, disputedScore }),
      })
      setIsLoading(false)
      if (res.ok) {
        toast({ title: 'Dispute submitted!', description: 'Your dispute has been sent.' })
        onClose();
        if (onDispute) onDispute();
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to dispute score', })
      }
    } catch (err) {
      toast({ title: 'Network error', description: 'Could not submit dispute. Please try again.' })
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            {isSubmitter ? (
              <>
                <Clock className="w-6 h-6 mr-2 text-primary" />
                Verification Pending
              </>
            ) : (
              <>
                <AlertTriangle className="w-6 h-6 mr-2 text-primary" />
                Verify Match Score
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isSubmitter
              ? "Waiting for your opponent to verify the score"
              : "Please verify the match score submitted by your opponent"}
          </DialogDescription>
        </DialogHeader>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="p-4 my-2 bg-secondary rounded-lg">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <h3 className="font-semibold">{isSubmitter ? "You" : "Your Score"}</h3>
              <div className="text-3xl font-bold">{isSubmitter ? score.playerScore : score.opponentScore}</div>
            </div>
            <div className="text-xl font-bold">vs</div>
            <div className="text-center flex-1">
              <h3 className="font-semibold">{opponent.name}</h3>
              <div className="text-3xl font-bold">{isSubmitter ? score.opponentScore : score.playerScore}</div>
            </div>
          </div>
        </div>

        <div className="text-center my-2">
          {isSubmitter ? (
            <div className="flex items-center justify-center text-muted-foreground">
              <Clock className="animate-pulse w-5 h-5 mr-2" />
              Waiting for {opponent.name} to verify this score
            </div>
          ) : (
            <p>
              <span className="font-semibold">{opponent.name}</span> has submitted this score for your match. Is this
              correct?
            </p>
          )}
        </div>

        {!isSubmitter && (
          <div className="flex space-x-4 mt-4">
            <Button
              variant="outline"
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDispute}
              disabled={isLoading}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Dispute
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleVerify}
              disabled={isLoading}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Verify
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
