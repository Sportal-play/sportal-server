"use client"

import { Button } from "@/components/ui/button"
import { useMatchRequest } from "@/contexts/MatchRequestContext"

export function DemoMatchRequest() {
  const { showMatchRequest } = useMatchRequest()

  const handleShowDemo = () => {
    showMatchRequest({
      name: "Alice456",
      rating: 1820,
    })
  }

  return (
    <Button onClick={handleShowDemo} className="bg-primary text-primary-foreground hover:bg-primary/90">
      Demo: Show Match Request
    </Button>
  )
}
