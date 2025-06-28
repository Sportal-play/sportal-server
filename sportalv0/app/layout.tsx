import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import ClientProviders from "@/components/ClientProviders"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "Sportal - Badminton Match Tracking",
  description: "Connect with badminton players, log matches, and track your progress.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <ClientProviders>{children}</ClientProviders>
        <Toaster />
      </body>
    </html>
  )
}
