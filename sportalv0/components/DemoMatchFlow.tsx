"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function DemoMatchFlow() {
  const router = useRouter()

  // For demo purposes, we'll use a fixed match ID
  const matchId = "demo-match-123"

  return (
    <div className="space-y-4 mb-8">
      <h2 className="text-lg font-semibold">Demo Match Flow</h2>
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={() => router.push(`/match/${matchId}/score-entry`)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Demo: Score Entry (Challenger View)
        </Button>
        <Button
          onClick={() => router.push(`/match/${matchId}/in-progress`)}
          variant="outline"
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          Demo: Match In Progress (Opponent View)
        </Button>
      </div>
    </div>
  )
}
