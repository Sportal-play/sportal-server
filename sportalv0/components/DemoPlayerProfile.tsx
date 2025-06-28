"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function DemoPlayerProfile() {
  const router = useRouter()

  return (
    <div className="space-y-4 mb-8">
      <h2 className="text-lg font-semibold">Demo Player Profiles</h2>
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={() => router.push(`/player/Alice456`)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          View Alice456's Profile
        </Button>
        <Button
          onClick={() => router.push(`/player/Bob789`)}
          variant="outline"
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          View Bob789's Profile
        </Button>
      </div>
    </div>
  )
}
