"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function DemoGameArchive() {
  const router = useRouter()

  // For demo purposes, we'll use fixed match IDs and usernames
  const matchId = "demo-match-123"
  const username = "Alice456"

  return (
    <div className="space-y-4 mb-8">
      <h2 className="text-lg font-semibold">Demo Game Archive & Disputes</h2>
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={() => router.push("/game-archive")}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          View My Game Archive
        </Button>
        <Button
          onClick={() => router.push(`/game-archive/${username}`)}
          variant="outline"
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          View {username}'s Archive
        </Button>
        <Button
          onClick={() => router.push(`/match/${matchId}/rating-update`)}
          variant="outline"
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          View Rating Update
        </Button>
        <Button
          onClick={() => router.push(`/match/${matchId}/dispute`)}
          variant="outline"
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          Demo: Dispute Score
        </Button>
        <Button
          onClick={() => router.push(`/match/${matchId}/dispute-received`)}
          variant="outline"
          className="bg-destructive/70 text-destructive-foreground hover:bg-destructive/60"
        >
          Demo: Receive Dispute
        </Button>
      </div>
    </div>
  )
}
