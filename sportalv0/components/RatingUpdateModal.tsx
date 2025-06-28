"use client"
import { X, TrendingUp, TrendingDown, Trophy, Medal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { formatRating } from "../lib/utils"

interface RatingUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  matchResult: {
    playerName: string
    opponentName: string
    playerScore: number
    opponentScore: number
    playerOldRating: number
    playerNewRating: number
    opponentOldRating: number
    opponentNewRating: number
    playerWon: boolean
    playerRatingHistory?: Array<{ rating: number; date: string }>
    opponentRatingHistory?: Array<{ rating: number; date: string }>
    matchTime?: string | Date
  }
}

export function RatingUpdateModal({ isOpen, onClose, matchResult }: RatingUpdateModalProps) {
  const router = useRouter()

  // Helper to get old and new rating from ratingHistory and matchTime
  function getOldAndNewRating(ratingHistory: any[] = [], matchTime: Date) {
    if (!Array.isArray(ratingHistory) || ratingHistory.length === 0) {
      return { old: null, new: null }
    }
    const sorted = [...ratingHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    let oldRating = sorted[0].rating
    let newRating = sorted[sorted.length - 1].rating
    for (let i = 0; i < sorted.length; i++) {
      const entryTime = new Date(sorted[i].date).getTime()
      if (entryTime < matchTime.getTime()) {
        oldRating = sorted[i].rating
      }
      if (entryTime >= matchTime.getTime()) {
        newRating = sorted[i].rating
        break
      }
    }
    return { old: oldRating, new: newRating }
  }

  const matchTime = matchResult.matchTime ? new Date(matchResult.matchTime) : new Date()
  const playerRatings = getOldAndNewRating(matchResult.playerRatingHistory, matchTime)
  const opponentRatings = getOldAndNewRating(matchResult.opponentRatingHistory, matchTime)
  const playerOldRating = playerRatings.old ?? matchResult.playerOldRating
  const playerNewRating = playerRatings.new ?? matchResult.playerNewRating
  const opponentOldRating = opponentRatings.old ?? matchResult.opponentOldRating
  const opponentNewRating = opponentRatings.new ?? matchResult.opponentNewRating
  const playerRatingChange = playerNewRating - playerOldRating
  const opponentRatingChange = opponentNewRating - opponentOldRating

  const handleViewProfile = () => {
    router.push("/")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Trophy className="w-6 h-6 mr-2 text-primary" />
            Match Complete
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            The match has been verified and ratings updated
          </DialogDescription>
        </DialogHeader>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="p-4 my-2 bg-secondary rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <div className="text-center flex-1">
              <h3 className="font-semibold">You</h3>
              <div className="text-3xl font-bold">{matchResult.playerScore}</div>
              {matchResult.playerWon && (
                <div className="mt-1 text-[#03DAC6] font-medium flex items-center justify-center">
                  <Trophy className="w-4 h-4 mr-1" />
                  Winner
                </div>
              )}
            </div>
            <div className="text-xl font-bold">vs</div>
            <div className="text-center flex-1">
              <h3 className="font-semibold">{matchResult.opponentName}</h3>
              <div className="text-3xl font-bold">{matchResult.opponentScore}</div>
              {!matchResult.playerWon && (
                <div className="mt-1 text-[#03DAC6] font-medium flex items-center justify-center">
                  <Trophy className="w-4 h-4 mr-1" />
                  Winner
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="text-center font-semibold mb-3">Rating Changes</h4>
            <div className="flex justify-between items-center">
              <div className="text-center flex-1">
                <div className="flex items-center justify-center">
                  <span className="text-lg font-bold">{formatRating(playerOldRating)}</span>
                  <span
                    className={`ml-2 text-sm font-medium flex items-center ${
                      playerRatingChange > 0
                        ? "text-green-600"
                        : playerRatingChange < 0
                        ? "text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    {playerRatingChange > 0 && "+"}
                    {playerRatingChange < 0 && "–"}
                    {playerRatingChange === 0 && "±"}
                    {Math.abs(playerRatingChange)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">from {formatRating(playerOldRating)}</div>
              </div>
              <div className="text-center flex-1">
                <div className="flex items-center justify-center">
                  <span className="text-lg font-bold">{formatRating(opponentOldRating)}</span>
                  <span
                    className={`ml-2 text-sm font-medium flex items-center ${
                      opponentRatingChange > 0
                        ? "text-green-600"
                        : opponentRatingChange < 0
                        ? "text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    {opponentRatingChange > 0 && "+"}
                    {opponentRatingChange < 0 && "–"}
                    {opponentRatingChange === 0 && "±"}
                    {Math.abs(opponentRatingChange)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">from {formatRating(opponentOldRating)}</div>
              </div>
            </div>
          </div>
        </div>

        {matchResult.playerWon && (
          <div className="bg-primary/10 rounded-lg p-3 text-center text-sm">
            <div className="flex items-center justify-center text-primary mb-1">
              <Medal className="w-4 h-4 mr-1" />
              Achievement Unlocked
            </div>
            <div className="font-medium">First Win Against Higher Rated Player</div>
          </div>
        )}

        <div className="flex space-x-4 mt-4">
          <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleViewProfile}>
            View Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
