"use client"
import { ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ScoreSelectorProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

export function ScoreSelector({ value, onChange, min = 0, max = 30 }: ScoreSelectorProps) {
  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1)
    }
  }

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleIncrement}
        disabled={value >= max}
        className="text-primary hover:text-primary hover:bg-primary/10"
      >
        <ChevronUp className="h-8 w-8" />
      </Button>

      <div className="text-5xl font-bold my-2 min-w-[60px] text-center">{value}</div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleDecrement}
        disabled={value <= min}
        className="text-primary hover:text-primary hover:bg-primary/10"
      >
        <ChevronDown className="h-8 w-8" />
      </Button>
    </div>
  )
}
