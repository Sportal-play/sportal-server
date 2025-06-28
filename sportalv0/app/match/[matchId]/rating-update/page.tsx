"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, TrendingUp, TrendingDown, Trophy, Medal, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getMatchById } from "@/lib/api"

interface RatingUpdatePageProps {
  params: {
    matchId: string
  }
}

export default function RatingUpdatePage({ params }: RatingUpdatePageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [matchDetails, setMatchDetails] = useState<any>(null)
  const [playerProfile, setPlayerProfile] = useState<any>(null)
  const [opponentProfile, setOpponentProfile] = useState<any>(null)

  // For demo, assume current user is 'JohnDoe123'
  const currentUser = "JohnDoe123"

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const match = await getMatchById(params.matchId)
        setMatchDetails(match)
        // Determine which user is the current user and who is the opponent
        const isChallenger = match.challenger.username === currentUser
        const playerUsername = isChallenger ? match.challenger.username : match.opponent.username
        const opponentUsername = isChallenger ? match.opponent.username : match.challenger.username
        // Fetch player and opponent profiles by username
        const playerProfileRes = await fetch(`/api/user/profile/${match.challenger._id}`)
        const player = await playerProfileRes.json()
        const opponentProfileRes = await fetch(`/api/user/profile/${match.opponent._id}`)
        const opponent = await opponentProfileRes.json()
        setPlayerProfile(player)
        setOpponentProfile(opponent)
      } catch (err) {
        setError("Error loading match or player details.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.matchId])

  if (loading) return <div className="p-4">Loading match results...</div>
  if (error) return <div className="p-4">{error}</div>
  if (!matchDetails || !playerProfile || !opponentProfile) return <div className="p-4">Match or player not found.</div>

  // Determine which user is the current user and who is the opponent
  const isChallenger = matchDetails.challenger.username === currentUser
  const playerName = isChallenger ? matchDetails.challenger.username : matchDetails.opponent.username
  const opponentName = isChallenger ? matchDetails.opponent.username : matchDetails.challenger.username
  const playerScore = isChallenger ? matchDetails.challenger_score : matchDetails.opponent_score
  const opponentScore = isChallenger ? matchDetails.opponent_score : matchDetails.challenger_score
  const playerWon = playerScore > opponentScore
  const date = matchDetails.time_finish ? new Date(matchDetails.time_finish).toLocaleDateString() : "-"

  // Achievements placeholder
  const achievements = playerWon ? [
    {
      title: "Victory!",
      description: "You won the match!",
      },
  ] : []

  // Find old and new ratings using ratingHistory and match finish time
  function getOldAndNewRating(ratingHistory: any[], matchTime: Date) {
    if (!Array.isArray(ratingHistory) || ratingHistory.length === 0) {
      return { old: null, new: null }
    }
    // Sort by date ascending
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

  const matchTime = matchDetails.time_finish ? new Date(matchDetails.time_finish) : new Date()
  const playerRatings = getOldAndNewRating(playerProfile.ratingHistory || [], matchTime)
  const opponentRatings = getOldAndNewRating(opponentProfile.ratingHistory || [], matchTime)
  const playerOldRating = playerRatings.old ?? playerProfile.rating
  const playerNewRating = playerRatings.new ?? playerProfile.rating
  const opponentOldRating = opponentRatings.old ?? opponentProfile.rating
  const opponentNewRating = opponentRatings.new ?? opponentProfile.rating
  const playerRatingChange = playerNewRating - playerOldRating
  const opponentRatingChange = opponentNewRating - opponentOldRating

  return (
    <div className="min-h-screen p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Match Results</h1>
      </div>

      <div className="bg-card rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="text-center flex-1">
            <h2 className="text-xl font-bold mb-1">You</h2>
            <div className="text-sm text-muted-foreground">{playerName}</div>
          </div>
          <div className="text-xl font-bold">vs</div>
          <div className="text-center flex-1">
            <h2 className="text-xl font-bold mb-1">{opponentName}</h2>
            <div className="text-sm text-muted-foreground">Opponent</div>
          </div>
        </div>

        <div className="bg-secondary/30 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-center flex-1">
              <div className="text-3xl font-bold">{playerScore}</div>
              {playerWon && (
                <div className="mt-1 text-[#03DAC6] font-medium flex items-center justify-center">
                  <Trophy className="w-4 h-4 mr-1" />
                  Winner
                </div>
              )}
            </div>
            <div className="text-xl font-bold">-</div>
            <div className="text-center flex-1">
              <div className="text-3xl font-bold">{opponentScore}</div>
              {!playerWon && (
                <div className="mt-1 text-[#03DAC6] font-medium flex items-center justify-center">
                  <Trophy className="w-4 h-4 mr-1" />
                  Winner
                </div>
              )}
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground">Match completed on {date}</div>
        </div>

        <div className="bg-secondary/30 rounded-lg p-4 mb-6">
          <h3 className="text-center font-semibold mb-4">Rating Changes</h3>
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <div className="flex items-center justify-center">
                <span className="text-2xl font-bold">{playerNewRating}</span>
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
              <div className="text-xs text-muted-foreground">from {playerOldRating}</div>
            </div>
            <div className="text-center flex-1">
              <div className="flex items-center justify-center">
                <span className="text-2xl font-bold">{opponentNewRating}</span>
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
              <div className="text-xs text-muted-foreground">from {opponentOldRating}</div>
            </div>
          </div>
        </div>

        {achievements.length > 0 && (
          <div className="bg-primary/10 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center text-primary mb-2">
              <Medal className="w-5 h-5 mr-2" />
              <h3 className="font-semibold">Achievements Unlocked</h3>
            </div>
            {achievements.map((achievement, index) => (
              <div key={index} className="text-center mb-2 last:mb-0">
                <div className="font-medium">{achievement.title}</div>
                <div className="text-sm text-muted-foreground">{achievement.description}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex space-x-4">
          <Button
            variant="outline"
            className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90"
            onClick={() => router.push("/game-archive")}
          >
            View Archive
          </Button>
          <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
            <Share2 className="mr-2 h-4 w-4" />
            Share Result
          </Button>
        </div>
      </div>
    </div>
  )
}
