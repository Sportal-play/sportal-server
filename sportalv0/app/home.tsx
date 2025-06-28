import React from 'react';
import { Header } from '@/components/Header';
import { RecentMatches } from '@/components/RecentMatches';
import { Statistics } from '@/components/Statistics';
import { useRequireProfile } from '@/hooks/useRequireProfile';

export default function HomePage() {
  const { loading, profile } = useRequireProfile();

  // Only render when profile is loaded and available
  if (loading || !profile) return null;

  return (
    <div className="min-h-screen bg-[#121212] text-[#E0E0E0] p-4">
      <Header user={profile} />
      <RecentMatches />
      <Statistics />
    </div>
  );
}
