"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { ScoreVerificationModal } from "@/components/ScoreVerificationModal"
import { RatingUpdateModal } from "@/components/RatingUpdateModal"

interface MatchScore {
  playerScore: number
  opponentScore: number
}

interface Opponent {
  name: string
  rating: number
}

interface ScoreVerificationContextType {
  showSubmitterVerification: (matchId: string, opponent: Opponent, score: MatchScore) => void
  showOpponentVerification: (matchId: string, opponent: Opponent, score: MatchScore) => void
}

const ScoreVerificationContext = createContext<ScoreVerificationContextType | undefined>(undefined)

export function ScoreVerificationProvider({ children }: { children: ReactNode }) {
  const [isSubmitterModalOpen, setIsSubmitterModalOpen] = useState(false)
  const [isOpponentModalOpen, setIsOpponentModalOpen] = useState(false)
  const [isRatingUpdateModalOpen, setIsRatingUpdateModalOpen] = useState(false)

  const [currentMatchId, setCurrentMatchId] = useState("")
  const [currentOpponent, setCurrentOpponent] = useState<Opponent | null>(null)
  const [currentScore, setCurrentScore] = useState<MatchScore | null>(null)

  const showSubmitterVerification = (matchId: string, opponent: Opponent, score: MatchScore) => {
    setCurrentMatchId(matchId)
    setCurrentOpponent(opponent)
    setCurrentScore(score)
    setIsSubmitterModalOpen(true)
  }

  const showOpponentVerification = (matchId: string, opponent: Opponent, score: MatchScore) => {
    setCurrentMatchId(matchId)
    setCurrentOpponent(opponent)
    setCurrentScore(score)
    setIsOpponentModalOpen(true)
  }

  const handleVerify = () => {
    setIsOpponentModalOpen(false)

    // In a real app, you would make an API call to verify the score
    // and then show the rating update modal with the response data

    // For demo purposes, we'll just show the rating update modal with mock data
    setTimeout(() => {
      setIsRatingUpdateModalOpen(true)
    }, 500)
  }

  const handleDispute = () => {
    // In a real app, you would handle the dispute process
    setIsOpponentModalOpen(false)
  }

  return (
    <ScoreVerificationContext.Provider value={{ showSubmitterVerification, showOpponentVerification }}>
      {children}

      {currentOpponent && currentScore && (
        <>
          <ScoreVerificationModal
            isOpen={isSubmitterModalOpen}
            onClose={() => setIsSubmitterModalOpen(false)}
            matchId={currentMatchId}
            opponent={currentOpponent}
            score={currentScore}
            isSubmitter={true}
          />

          <ScoreVerificationModal
            isOpen={isOpponentModalOpen}
            onClose={() => setIsOpponentModalOpen(false)}
            matchId={currentMatchId}
            opponent={currentOpponent}
            score={currentScore}
            isSubmitter={false}
            onVerify={handleVerify}
            onDispute={handleDispute}
          />

          <RatingUpdateModal
            isOpen={isRatingUpdateModalOpen}
            onClose={() => setIsRatingUpdateModalOpen(false)}
            matchResult={{
              playerName: "JohnDoe123",
              opponentName: currentOpponent.name,
              playerScore: currentScore.playerScore,
              opponentScore: currentScore.opponentScore,
              playerOldRating: 1850,
              playerNewRating: currentScore.playerScore > currentScore.opponentScore ? 1865 : 1835,
              opponentOldRating: currentOpponent.rating,
              opponentNewRating:
                currentScore.opponentScore > currentScore.playerScore
                  ? currentOpponent.rating + 15
                  : currentOpponent.rating - 15,
              playerWon: currentScore.playerScore > currentScore.opponentScore,
            }}
          />
        </>
      )}
    </ScoreVerificationContext.Provider>
  )
}

export function useScoreVerification() {
  const context = useContext(ScoreVerificationContext)
  if (context === undefined) {
    throw new Error("useScoreVerification must be used within a ScoreVerificationProvider")
  }
  return context
}
