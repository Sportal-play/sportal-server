"use client";
import { SessionProvider } from "next-auth/react";
import { MatchRequestProvider } from "@/contexts/MatchRequestContext";
import { ScoreVerificationProvider } from "@/contexts/ScoreVerificationContext";
import { PendingMatchRequestListener } from "@/components/PendingMatchRequestListener";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MatchRequestProvider>
        <ScoreVerificationProvider>
          {children}
          <PendingMatchRequestListener />
        </ScoreVerificationProvider>
      </MatchRequestProvider>
    </SessionProvider>
  );
} 