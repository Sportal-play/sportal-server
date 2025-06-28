import type React from "react"
import { UserPlus, Users, Swords } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"

interface PlayerProfileHeaderProps {
  playerName: string
  playerRating: number
  isFriend: boolean
  headToHead: {
    wins: number
    losses: number
  }
  isOwnProfile: boolean
  loggedInUsername: string
}

export const PlayerProfileHeader: React.FC<PlayerProfileHeaderProps> = ({
  playerName,
  playerRating,
  isFriend,
  headToHead,
  isOwnProfile,
  loggedInUsername,
}) => {
  const router = useRouter();
  const { toast } = useToast();

  const handleChallenge = async () => {
    const challenger = loggedInUsername;
    const opponent = playerName;
    console.log("DEBUG: challenger =", challenger, "opponent =", opponent, "playerName =", playerName);
    if (!challenger || !opponent || challenger === opponent) {
      toast({ title: "Invalid challenge", description: "You cannot challenge yourself." });
      return;
    }
    try {
      const res = await fetch("/api/match/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenger, opponent }),
      });
      const data = await res.json();
      console.log('DEBUG: API response', res.status, data);
      if (res.status === 201 && data.match) {
        toast({
          title: `Challenge sent to @${opponent}!`,
          description: `Check your matches page to view it.`,
        });
      } else if (data.error && data.error.toLowerCase().includes("pending challenge")) {
        toast({ title: "Challenge already pending", description: data.error });
      } else {
        toast({ title: "Error", description: data.error || "Could not send challenge." });
      }
    } catch (err) {
      toast({ title: "Network error", description: "Could not send challenge. Please try again." });
    }
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold">{playerName}</h2>
          <span className="text-sm text-primary-foreground bg-primary px-2 py-1 rounded-full">{Math.round(typeof playerRating === 'number' && !isNaN(playerRating) ? playerRating : 1500)}</span>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          {(!isOwnProfile) && (
            <>
              <Button
                variant="outline"
                className={`flex items-center ${isFriend ? "bg-secondary" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
              >
                {isFriend ? (
                  <>
                    <Users className="w-5 h-5 mr-2" />
                    Friends
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Add Friend
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="flex items-center bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleChallenge}
              >
                <Swords className="w-5 h-5 mr-2" />
                Challenge
              </Button>

              <div className="flex items-center bg-card rounded-lg px-4 py-2">
                <span className="font-semibold mr-2">Me vs {playerName.split(" ")[0]}:</span>
                <span className="text-[#03DAC6] font-semibold mr-1">{headToHead.wins}W</span>
                <span className="text-destructive font-semibold">{headToHead.losses}L</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
