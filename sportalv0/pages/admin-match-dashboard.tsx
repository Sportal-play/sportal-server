import React, { useEffect, useState } from 'react';
const { updatePlayerRatings } = require('../../services/ratingService');
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatRating } from '../lib/utils';

// Toast helper (simple fallback if no toast lib)
function showToast(msg: string) {
  if (typeof window !== 'undefined') alert(msg);
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-200 text-yellow-800',
  accepted: 'bg-blue-200 text-blue-800',
  verified: 'bg-green-200 text-green-800',
  disputed: 'bg-red-200 text-red-800',
};

export default function AdminMatchDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [challenger, setChallenger] = useState('');
  const [opponent, setOpponent] = useState('');
  const [sending, setSending] = useState(false);
  const [scoreInputs, setScoreInputs] = useState<Record<string, { a: string; b: string }>>({});
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeMatchId, setDisputeMatchId] = useState<string | null>(null);
  const [disputeScore, setDisputeScore] = useState<{challenger: string, opponent: string}>({challenger: '', opponent: ''});
  const [disputeReason, setDisputeReason] = useState('incorrect-score');
  const [disputeComment, setDisputeComment] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);

  // Fetch users
  useEffect(() => {
    fetch('/api/user/list')
      .then(r => r.json())
      .then(data => setUsers(data.users || []));
  }, []);

  // Fetch matches
  const fetchMatches = () => {
    setLoading(true);
    fetch('/api/matches')
      .then(r => r.json())
      .then(data => {
        let ms = data.matches || [];
        if (statusFilter !== 'all') {
          ms = ms.filter((m: any) => m.status === statusFilter);
        }
        ms = ms.sort((a: any, b: any) => {
          const aTime = new Date(a.challengeSentAt).getTime();
          const bTime = new Date(b.challengeSentAt).getTime();
          return sortBy === 'latest' ? bTime - aTime : aTime - bTime;
        });
        setMatches(ms);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchMatches(); }, [sortBy, statusFilter]);

  // Send challenge
  const sendChallenge = async () => {
    if (!challenger || !opponent || challenger === opponent) return;
    setSending(true);
    const res = await fetch('/api/match/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenger, opponent })
    });
    const data = await res.json();
    setSending(false);
    if (res.ok) {
      showToast('Challenge sent!');
      setChallenger('');
      setOpponent('');
      fetchMatches();
    } else {
      showToast(data.error || 'Error sending challenge');
    }
  };

  // Match actions
  const matchAction = async (matchId: string, action: string, extra: any = {}) => {
    let url = '';
    let body = { matchId, ...extra };
    if (action === 'accept') url = '/api/match/accept';
    if (action === 'submitScore') url = '/api/match/submit-score';
    if (action === 'verify') {
      url = '/api/match/verify';
      // Find match and players
      const match = matches.find((m) => m._id === matchId);
      if (!match || !match.challenger || !match.opponent || !match.score) {
        showToast('Missing match or player data');
        return;
      }
      // Fetch latest profiles for both players
      const challengerId = match.challenger._id ? match.challenger._id.toString() : match.challenger.id;
      const opponentId = match.opponent._id ? match.opponent._id.toString() : match.opponent.id;
      let challengerProfile, opponentProfile;
      try {
        const [challengerRes, opponentRes] = await Promise.all([
          fetch(`/api/user/profile/${challengerId}`),
          fetch(`/api/user/profile/${opponentId}`)
        ]);
        challengerProfile = challengerRes.ok ? await challengerRes.json() : null;
        opponentProfile = opponentRes.ok ? await opponentRes.json() : null;
      } catch (err) {
        showToast('Failed to fetch player profiles');
        return;
      }
      if (!challengerProfile || !opponentProfile) {
        showToast('Could not load player ratings');
        return;
      }
      // Get player ratings from latest profile
      const challengerRating = {
        rating: challengerProfile.rating ?? 1500,
        ratingDeviation: challengerProfile.ratingDeviation ?? 350,
        volatility: challengerProfile.volatility ?? 0.06,
      };
      const opponentRating = {
        rating: opponentProfile.rating ?? 1500,
        ratingDeviation: opponentProfile.ratingDeviation ?? 350,
        volatility: opponentProfile.volatility ?? 0.06,
      };
      // Determine winner
      const challengerWon = match.score.challenger > match.score.opponent;
      // Calculate new ratings
      const result = updatePlayerRatings(challengerRating, opponentRating, challengerWon);
      // Log challenger and opponent IDs for debugging
      console.log('Admin Verify: challenger._id =', challengerId, 'type:', typeof challengerId);
      console.log('Admin Verify: opponent._id =', opponentId, 'type:', typeof opponentId);
      // Ensure IDs are strings
      body = {
        matchId,
        playerA: challengerId,
        playerB: opponentId,
        newRatingA: result.challenger.rating,
        newRD_A: result.challenger.ratingDeviation,
        newVolatilityA: result.challenger.volatility,
        newRatingB: result.opponent.rating,
        newRD_B: result.opponent.ratingDeviation,
        newVolatilityB: result.opponent.volatility,
      };
    }
    if (action === 'dispute') {
      setDisputeMatchId(matchId);
      setDisputeScore({challenger: '', opponent: ''});
      setDisputeReason('incorrect-score');
      setDisputeComment('');
      setDisputeModalOpen(true);
      return;
    }
    if (action === 'reject') url = '/api/match/reject';
    if (!url) return;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`${action} complete!`);
      fetchMatches();
    } else {
      showToast(data.error || `Error: ${action}`);
    }
  };

  const handleDisputeSubmit = async () => {
    if (!disputeMatchId) return;
    const challenger = parseInt(disputeScore.challenger);
    const opponent = parseInt(disputeScore.opponent);
    if (isNaN(challenger) || isNaN(opponent)) {
      showToast('Enter valid scores');
      return;
    }
    setDisputeLoading(true);
    const res = await fetch('/api/match/dispute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId: disputeMatchId,
        disputedScore: { challenger, opponent },
        reason: disputeReason,
        comment: disputeComment
      })
    });
    setDisputeLoading(false);
    setDisputeModalOpen(false);
    setDisputeMatchId(null);
    setDisputeScore({challenger: '', opponent: ''});
    setDisputeReason('incorrect-score');
    setDisputeComment('');
    if (res.ok) {
      showToast('Dispute submitted!');
      fetchMatches();
    } else {
      const data = await res.json();
      showToast(data.error || 'Error submitting dispute');
    }
  };

  // Score input change
  const handleScoreInput = (matchId: string, who: 'a' | 'b', value: string) => {
    setScoreInputs(inputs => ({
      ...inputs,
      [matchId]: { ...inputs[matchId], [who]: value }
    }));
  };

  // Helper: get user display name
  const getUser = (email: string) => users.find(u => u.email === email);
  const getUsername = (email: string) => getUser(email)?.username || email;

  // Helper: get username/email from match user object
  const getDisplay = (user: any) => user?.username || user?.email || user;

  // Add admin cleanup button
  const handleCleanupPendingMatches = async () => {
    const res = await fetch('/api/admin/cleanup-pending-matches', { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      showToast(`Deleted all pending matches (${data.deletedCount})`);
      fetchMatches();
    } else {
      showToast(data.error || 'Error cleaning up pending matches');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-[#121212] text-[#E0E0E0] min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-primary">Admin Match Dashboard</h1>
      {/* Send Challenge */}
      <div className="mb-8 p-4 bg-card rounded shadow">
        <h2 className="text-xl font-semibold mb-2 text-primary">Send Challenge</h2>
        <div className="flex gap-2 mb-2">
          <select
            value={challenger}
            onChange={(e) => setChallenger(e.target.value)}
            className="border rounded px-2 py-1 bg-secondary text-secondary-foreground"
          >
            <option value="">Select Challenger</option>
            {users.map((user) => (
              <option key={user.username} value={user.username} className="bg-card text-card-foreground">
                {user.username}
              </option>
            ))}
          </select>
          <select
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            className="border rounded px-2 py-1 bg-secondary text-secondary-foreground"
          >
            <option value="">Select Opponent</option>
            {users.map((user) => (
              <option key={user.username} value={user.username} className="bg-card text-card-foreground">
                {user.username}
              </option>
            ))}
          </select>
          <button
            className="bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50 hover:bg-primary/90"
            onClick={sendChallenge}
            disabled={sending || !challenger || !opponent || challenger === opponent}
          >
            {sending ? 'Sending...' : 'Send Challenge'}
          </button>
        </div>
      </div>

      {/* Matches Table Controls */}
      <div className="flex flex-wrap gap-4 items-center mb-2">
        <div>
          <label className="mr-2 font-medium">Sort:</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="border rounded px-2 py-1 bg-secondary text-secondary-foreground">
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
        <div>
          <label className="mr-2 font-medium">Status:</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded px-2 py-1 bg-secondary text-secondary-foreground">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>
      </div>

      {/* Red Flag/Dispute Summary */}
      <div className="mb-6 p-4 bg-destructive/10 rounded shadow">
        <h2 className="text-lg font-semibold mb-2 text-destructive">Dispute/Red Flag Analytics</h2>
        <div className="flex flex-wrap gap-4">
          {users
            .filter(u => u.redFlagCount > 0 || (u.disputeHistory && u.disputeHistory.length > 0))
            .sort((a, b) => (b.redFlagCount || 0) - (a.redFlagCount || 0))
            .map(u => (
              <div key={u.username} className="p-2 bg-card rounded shadow text-sm text-card-foreground">
                <div className="font-bold">{u.username}</div>
                <div>Red Flags: <span className="text-destructive font-bold">{u.redFlagCount || 0}</span></div>
                <div>Disputes: <span className="text-yellow-700 font-bold">{u.disputeHistory?.length || 0}</span></div>
              </div>
            ))}
        </div>
      </div>

      {/* Matches Table */}
      <div className="bg-card rounded shadow p-4">
        <h2 className="text-xl font-semibold mb-4 text-primary">All Matches</h2>
        {loading ? <div>Loading...</div> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border text-card-foreground">
              <thead>
                <tr className="bg-secondary text-secondary-foreground">
                  <th className="py-2 px-3 border">Challenger</th>
                  <th className="py-2 px-3 border">Opponent</th>
                  <th className="py-2 px-3 border">Status</th>
                  <th className="py-2 px-3 border">Score</th>
                  <th className="py-2 px-3 border">Disputes/Flags</th>
                  <th className="py-2 px-3 border">Time</th>
                  <th className="py-2 px-3 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m: any) => {
                  // Determine action button states
                  const isPending = m.status === 'pending';
                  const isAccepted = !!m.challengeAcceptedAt && m.status === 'pending';
                  const canAccept = isPending && !m.challengeAcceptedAt;
                  const canSubmitScore = isPending && !!m.challengeAcceptedAt && !m.score;
                  const canVerify = isPending && !!m.score && !m.verifiedAt && !m.disputedAt;
                  const canDispute = (isPending && !!m.score && !m.verifiedAt) || m.status === 'verified';
                  const canReject = isPending && !m.challengeAcceptedAt;
                  return (
                    <tr key={m._id} className="border-t">
                      <td className="py-2 px-3 border">{getDisplay(m.challenger)}</td>
                      <td className="py-2 px-3 border">{getDisplay(m.opponent)}</td>
                      <td className="py-2 px-3 border">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[m.status] || 'bg-secondary text-secondary-foreground'}`}>{m.status}</span>
                      </td>
                      <td className="py-2 px-3 border">
                        {m.score ? `${m.score.challenger} - ${m.score.opponent}` : '-'}
                      </td>
                      <td className="py-2 px-3 border text-xs">
                        {m.redFlagChallenger && <span className="text-destructive font-bold">⚑A </span>}
                        {m.redFlagOpponent && <span className="text-destructive font-bold">⚑B </span>}
                        <span className="text-yellow-700">{m.disputeHistory?.length || 0} disputes</span>
                      </td>
                      <td className="py-2 px-3 border">
                        <div className="flex flex-col text-xs">
                          {m.challengeSentAt && <span>Sent: {new Date(m.challengeSentAt).toLocaleString()}</span>}
                          {m.challengeAcceptedAt && <span>Accepted: {new Date(m.challengeAcceptedAt).toLocaleString()}</span>}
                          {m.scoreSubmittedAt && <span>Score: {new Date(m.scoreSubmittedAt).toLocaleString()}</span>}
                          {m.verifiedAt && <span>Verified: {new Date(m.verifiedAt).toLocaleString()}</span>}
                          {m.disputedAt && <span>Disputed: {new Date(m.disputedAt).toLocaleString()}</span>}
                        </div>
                      </td>
                      <td className="py-2 px-3 border">
                        <div className="flex flex-col gap-1">
                          {/* Accept Challenge */}
                          <button
                            className="bg-yellow-500 text-yellow-900 px-2 py-1 rounded disabled:opacity-50 hover:bg-yellow-400"
                            onClick={() => matchAction(m._id, 'accept')}
                            disabled={!canAccept}
                          >Accept Challenge</button>
                          {/* Reject Challenge */}
                          <button
                            className="bg-secondary text-secondary-foreground px-2 py-1 rounded disabled:opacity-50 hover:bg-secondary/80"
                            onClick={() => matchAction(m._id, 'reject')}
                            disabled={!canReject}
                          >Reject</button>
                          {/* Submit Score */}
                          <div className="flex gap-1 items-center mb-1">
                            <input
                              type="number"
                              className="border w-12 px-1 py-0.5 rounded bg-card text-card-foreground"
                              placeholder="A"
                              value={scoreInputs[m._id]?.a || ''}
                              onChange={e => handleScoreInput(m._id, 'a', e.target.value)}
                              disabled={!canSubmitScore}
                            />
                            <span>-</span>
                            <input
                              type="number"
                              className="border w-12 px-1 py-0.5 rounded bg-card text-card-foreground"
                              placeholder="B"
                              value={scoreInputs[m._id]?.b || ''}
                              onChange={e => handleScoreInput(m._id, 'b', e.target.value)}
                              disabled={!canSubmitScore}
                            />
                            <button
                              className="bg-primary text-primary-foreground px-2 py-1 rounded ml-2 disabled:opacity-50 hover:bg-primary/90"
                              onClick={() => {
                                const a = parseInt(scoreInputs[m._id]?.a || '');
                                const b = parseInt(scoreInputs[m._id]?.b || '');
                                if (isNaN(a) || isNaN(b)) return showToast('Enter valid scores');
                                matchAction(m._id, 'submitScore', { challengerScore: a, opponentScore: b });
                              }}
                              disabled={!canSubmitScore}
                            >Submit Score</button>
                          </div>
                          {/* Player A verify/dispute after Player B disputes */}
                          {m.disputeState === 'pending-challenger' && (
                            <>
                              <button
                                className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                                onClick={() => matchAction(m._id, 'verify')}
                              >
                                Verify (A)
                              </button>
                              <button
                                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                onClick={() => matchAction(m._id, 'dispute')}
                              >
                                Dispute (A)
                              </button>
                            </>
                          )}
                          {/* Verify Score */}
                          <button
                            className="bg-green-600 text-white px-2 py-1 rounded disabled:opacity-50 hover:bg-green-500"
                            onClick={() => matchAction(m._id, 'verify')}
                            disabled={!canVerify}
                          >Verify</button>
                          {/* Dispute Score */}
                          <button
                            className="bg-destructive text-destructive-foreground px-2 py-1 rounded disabled:opacity-50 hover:bg-destructive/90"
                            onClick={() => matchAction(m._id, 'dispute')}
                            disabled={!canDispute}
                          >Dispute</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {matches.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-4">No matches found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Dialog open={disputeModalOpen} onOpenChange={setDisputeModalOpen}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle>Dispute Match Score</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <div className="mb-2 font-semibold">Disputed Score</div>
            <div className="flex gap-2 items-center mb-2">
              <input type="number" className="border w-16 px-2 py-1 rounded" placeholder="Challenger" value={disputeScore.challenger} onChange={e => setDisputeScore(s => ({...s, challenger: e.target.value}))} />
              <span>-</span>
              <input type="number" className="border w-16 px-2 py-1 rounded" placeholder="Opponent" value={disputeScore.opponent} onChange={e => setDisputeScore(s => ({...s, opponent: e.target.value}))} />
            </div>
          </div>
          <div className="mb-4">
            <div className="mb-2 font-semibold">Reason for Dispute</div>
            <RadioGroup value={disputeReason} onValueChange={setDisputeReason}>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="incorrect-score" id="incorrect-score" />
                <Label htmlFor="incorrect-score">Incorrect Score</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="match-not-played" id="match-not-played" />
                <Label htmlFor="match-not-played">Match Not Played</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Other Reason</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="mb-4">
            <div className="mb-2 font-semibold">Additional Comments</div>
            <Textarea placeholder="Please provide details about your dispute..." value={disputeComment} onChange={e => setDisputeComment(e.target.value)} className="min-h-[80px]" />
          </div>
          <div className="flex gap-2 mt-4">
            <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleDisputeSubmit} disabled={disputeLoading}>
              {disputeLoading ? 'Submitting...' : 'Submit Dispute'}
            </Button>
            <Button className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90" variant="outline" onClick={() => setDisputeModalOpen(false)} disabled={disputeLoading}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="mb-4">
        <Button variant="destructive" onClick={handleCleanupPendingMatches}>
          Delete All Pending Matches
        </Button>
      </div>
    </div>
  );
} 