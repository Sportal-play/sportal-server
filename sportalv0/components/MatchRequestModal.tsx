"use client"

import { useState } from "react"
import { X, CheckCircle, XCircle, Swords } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatRating } from "../lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface MatchRequestModalProps {
  isOpen: boolean
  onClose: () => void
  challenger: {
    name: string
    rating: number
    avatar?: string
    matchId?: string
  }
  onAccept: () => void
  onReject: () => void
}

export function MatchRequestModal({ isOpen, onClose, challenger, onAccept, onReject }: MatchRequestModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast();

  const handleAccept = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/match/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: challenger.matchId || challenger.name }),
      })
      setIsLoading(false)
      if (res.ok) {
        toast({ title: 'Match accepted!', description: 'You have accepted the match challenge.' });
        setTimeout(() => {
          onAccept();
          onClose();
        }, 400);
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to accept match', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Network error', description: 'Could not accept match. Please try again.', variant: 'destructive' });
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/match/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: challenger.matchId || challenger.name }),
      })
      setIsLoading(false)
      if (res.ok) {
        onReject()
        onClose()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to reject match')
      }
    } catch (err) {
      alert('Network error')
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Swords className="w-6 h-6 mr-2 text-primary" />
            Match Challenge
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">You have received a match challenge</DialogDescription>
        </DialogHeader>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="p-4 my-2 bg-secondary rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
              {challenger.avatar || challenger.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{challenger.name}</h3>
              <p className="text-muted-foreground">Rating: {formatRating(challenger.rating)}</p>
            </div>
          </div>
        </div>

        <div className="text-center my-2">
          <p>
            <span className="font-semibold">{challenger.name}</span> has challenged you to a badminton match!
          </p>
        </div>

        <div className="flex space-x-4 mt-4">
          <Button
            variant="outline"
            className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleReject}
            disabled={isLoading}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Decline
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleAccept}
            disabled={isLoading}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Accept
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
