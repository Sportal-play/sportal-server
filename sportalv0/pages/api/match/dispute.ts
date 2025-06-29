import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import authOptions from '../auth/[...nextauth]';
import { dbConnect } from '../../../lib/mongodb';
import Match from '../../../models/Match';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions) as any;
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { matchId, disputedScore, reason, comment } = req.body;
    if (!matchId || !disputedScore) {
      return res.status(400).json({ error: 'Missing matchId or disputedScore' });
    }

    await dbConnect();
    const match = await Match.findById(matchId).populate('opponent');
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    if (match.status !== 'pending' || !match.score) {
      return res.status(400).json({ error: 'Match is not in a state to dispute' });
    }
    // Allow only opponent or admin
    const adminEmails = [process.env.ADMIN_EMAIL || 'raghavkshyp@gmail.com'];
    const isAdmin = adminEmails.includes(session.user.email);
    if (!isAdmin && match.opponent._id.toString() !== (session.user.id || session.user._id || session.user.sub)) {
      return res.status(403).json({ error: 'Forbidden: Only the opponent can dispute the score.' });
    }
    match.disputedScore = disputedScore;
    match.disputeReason = reason || null;
    match.disputeComment = comment || null;
    match.disputeState = 'pending-challenger';
    match.disputedBy = match.opponent._id;
    match.disputedAt = new Date();
    match.disputeHistory.push({ by: match.opponent._id, at: new Date(), action: 'dispute', score: disputedScore, reason, comment });
    match.status = 'disputed';
    await match.save();
    return res.status(200).json({ match });
  } catch (err) {
    console.error('[match/dispute] Error:', err);
    return res.status(500).json({ error: 'Internal server error', details: (err as Error).message });
  }
} 