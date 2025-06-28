"use client";
import { useRequireProfile } from "@/hooks/useRequireProfile";
import { Header } from "@/components/Header";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export default function ProfilePage() {
  const { loading, profile } = useRequireProfile();

  if (loading) return null;
  if (!profile) return <div className="p-8">Profile not found.</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-[#E0E0E0] p-4">
      <Header user={profile} />
      <div className="max-w-2xl mx-auto bg-card text-card-foreground rounded-lg shadow p-8 mt-8">
        <h1 className="text-3xl font-bold mb-8 text-primary">My Profile</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Username</div>
            <div className="text-lg font-semibold">{profile.username}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Name</div>
            <div className="text-lg font-semibold">{profile.name}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Rating</div>
            <div className="text-lg font-semibold">{Math.round(profile.rating ?? 1500)}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
              Rating Deviation
              <Popover>
                <PopoverTrigger asChild>
                  <span className="ml-1 cursor-pointer align-middle" tabIndex={0} role="button">
                    <Info className="w-4 h-4 text-primary" />
                  </span>
                </PopoverTrigger>
                <PopoverContent side="top">
                  <span>Shows how confident the system is in your rating. Lower RD = more confidence. Play more matches to reduce your RD!</span>
                </PopoverContent>
              </Popover>
            </div>
            <div className="text-lg font-semibold">{Math.round(profile.ratingDeviation ?? 350)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Gender</div>
            <div className="text-lg font-semibold">{profile.sex || profile.gender || "-"}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Date of Birth</div>
            <div className="text-lg font-semibold">{profile.dob ? new Date(profile.dob).toLocaleDateString() : "-"}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Member Since</div>
            <div className="text-lg font-semibold">{profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "-"}</div>
          </div>
        </div>
      </div>
    </div>
  );
} 