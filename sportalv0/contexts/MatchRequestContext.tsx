"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { MatchRequestModal } from "@/components/MatchRequestModal"

interface Challenger {
  name: string
  rating: number
  avatar?: string
  matchId?: string
}

interface MatchRequestContextType {
  showMatchRequest: (challenger: Challenger) => void
}

const MatchRequestContext = createContext<MatchRequestContextType | undefined>(undefined)

export function MatchRequestProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [challenger, setChallenger] = useState<Challenger | null>(null)
  const [lastMatchId, setLastMatchId] = useState<string | null>(null)

  const showMatchRequest = (newChallenger: Challenger) => {
    if (newChallenger.matchId && newChallenger.matchId === lastMatchId) return;
    setChallenger(newChallenger)
    setIsOpen(true)
    if (newChallenger.matchId) setLastMatchId(newChallenger.matchId)
  }

  const handleAccept = () => {
    console.log("Match accepted")
    // In a real app, you would handle the match acceptance logic here
  }

  const handleReject = () => {
    console.log("Match rejected")
    // In a real app, you would handle the match rejection logic here
  }

  return (
    <MatchRequestContext.Provider value={{ showMatchRequest }}>
      {children}
      {challenger && (
        <MatchRequestModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          challenger={challenger}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}
    </MatchRequestContext.Provider>
  )
}

export function useMatchRequest() {
  const context = useContext(MatchRequestContext)
  if (context === undefined) {
    throw new Error("useMatchRequest must be used within a MatchRequestProvider")
  }
  return context
}
