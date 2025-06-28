// API utility functions for demo UIs

export async function getMatchById(matchId: string) {
  const res = await fetch(`/api/matches?matchId=${encodeURIComponent(matchId)}`)
  if (!res.ok) throw new Error('Failed to fetch match')
  const data = await res.json()
  // If matches is an array, find the one with the correct _id
  if (Array.isArray(data.matches)) {
    return data.matches.find((m: any) => m._id === matchId) || null
  }
  return null
}

export async function submitMatchResult(
  matchId: string,
  challengerScore: number,
  opponentScore: number
) {
  const res = await fetch('/api/match/submit-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId, challengerScore, opponentScore }),
  })
  if (!res.ok) throw new Error('Failed to submit match result')
  return res.json()
}

export async function acceptMatch(matchId: string) {
  const res = await fetch('/api/match/accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId }),
  })
  if (!res.ok) throw new Error('Failed to accept match')
  return res.json()
}

export async function rejectMatch(matchId: string) {
  const res = await fetch('/api/match/reject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId }),
  })
  if (!res.ok) throw new Error('Failed to reject match')
  return res.json()
}

export async function verifyMatch(matchId: string) {
  const res = await fetch('/api/match/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId }),
  })
  if (!res.ok) throw new Error('Failed to verify match')
  return res.json()
}

export async function disputeMatch(matchId: string, disputedScore: { challenger: number; opponent: number }) {
  const res = await fetch('/api/match/dispute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId, disputedScore }),
  })
  if (!res.ok) throw new Error('Failed to dispute match')
  return res.json()
} 