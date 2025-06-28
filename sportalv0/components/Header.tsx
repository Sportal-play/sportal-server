"use client";

import React from 'react';
import { Bell, Search, Swords } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatRating } from "../lib/utils";

export const Header: React.FC<{ user?: any }> = ({ user }) => {
  console.log('[Header] received user:', user);
  // Prefer username, then fallback
  const displayName = user?.username || 'User';
  const displayRating = typeof user?.rating === 'number' ? formatRating(user.rating) : '-';

  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { data: session } = useSession();
  // Try to get username from session.user, fallback to user?.username, else undefined
  const loggedInUsername = (session?.user && (session.user as any).username) || user?.username;

  const [challengeLoading, setChallengeLoading] = useState<string | null>(null);

  const handleSearch = async (val: string) => {
    setSearch(val);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!val.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/user/search?query=${encodeURIComponent(val)}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        const filteredResults = (data.results || []).filter((u: any) => u.username !== loggedInUsername);
        setResults(filteredResults);
        setShowDropdown(true);
      } catch (err) {
        toast({ title: "Search error", description: "Could not search users." });
        setResults([]);
        setShowDropdown(false);
      }
    }, 200);
  };

  const handleSelect = (username: string) => {
    setShowDropdown(false);
    setSearch("");
    setResults([]);
    router.push(`/player/${encodeURIComponent(username)}`);
  };

  const handleInlineChallenge = async (opponent: string) => {
    const challenger = loggedInUsername;
    if (!challenger || !opponent || challenger === opponent) {
      toast({ title: "Invalid challenge", description: "You cannot challenge yourself." });
      return;
    }
    setChallengeLoading(opponent);
    try {
      const res = await fetch("/api/match/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenger, opponent }),
      });
      const data = await res.json();
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
    setChallengeLoading(null);
  };

  return (
    <header className="flex justify-between items-center mb-8 relative">
      <div className="flex items-center space-x-2">
        <button
          className="text-xl font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={() => router.push('/profile')}
          style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }}
        >
          {displayName}
        </button>
        <span className="text-sm text-primary-foreground bg-primary px-2 py-1 rounded-full">{displayRating}</span>
      </div>
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <Link href="/" className="text-2xl font-bold text-primary hover:underline cursor-pointer">
          SPORTAL
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Input
            type="search"
            placeholder="Search users..."
            className="bg-secondary text-secondary-foreground placeholder-muted-foreground border-none w-48 pr-10"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            autoComplete="off"
          />
          <Search className="w-5 h-5 text-primary absolute right-3 top-1/2 transform -translate-y-1/2" />
          {showDropdown && results.length > 0 && (
            <div className="absolute z-50 mt-1 w-64 bg-card border border-border rounded shadow-lg max-h-80 overflow-auto">
              {results.map((user) => (
                <div
                  key={user.username}
                  className="px-4 py-2 flex items-center justify-between hover:bg-secondary"
                >
                  <div className="flex flex-col cursor-pointer" onMouseDown={() => handleSelect(user.username)}>
                    <div className="font-medium">{user.username}</div>
                    <div className="text-xs text-muted-foreground">{user.name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-primary font-semibold">{typeof user.rating === 'number' ? formatRating(user.rating) : 1500}</div>
                    <button
                      className="ml-2 p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      disabled={challengeLoading === user.username}
                      title="Challenge"
                      onClick={e => { e.stopPropagation(); handleInlineChallenge(user.username); }}
                    >
                      <Swords className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <Bell className="w-6 h-6 text-primary" />
          <span className="absolute -top-1 -right-1 bg-primary rounded-full w-4 h-4 flex items-center justify-center text-xs text-primary-foreground">
            3
          </span>
        </div>
      </div>
    </header>
  );
};
