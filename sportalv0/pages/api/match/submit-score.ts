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

    const { matchId, challengerScore, opponentScore } = req.body;
    if (!matchId || typeof challengerScore !== 'number' || typeof opponentScore !== 'number') {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    await dbConnect();
    const match = await Match.findById(matchId).populate('challenger');
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    if (match.status !== 'pending' || !match.challengeAcceptedAt) {
      return res.status(400).json({ error: 'Match is not in a state to submit score' });
    }
    // Allow only challenger or admin
    const adminEmails = [process.env.ADMIN_EMAIL || 'raghavkshyp@gmail.com'];
    const isAdmin = adminEmails.includes(session.user.email);
    if (!isAdmin && match.challenger._id.toString() !== (session.user.id || session.user._id || session.user.sub)) {
      return res.status(403).json({ error: 'Forbidden: Only the challenger can submit the score.' });
    }
    // Block Player B if they have unresolved verifications
    const unresolved = await Match.findOne({
      opponent: match.challenger._id,
      status: 'pending',
      score: { $exists: true },
      verifiedBy: null,
      disputedBy: null
    });
    if (unresolved && unresolved._id.toString() !== match._id.toString()) {
      return res.status(400).json({ error: 'You must verify or dispute your previous match before submitting a score for a new match.' });
    }
    match.score = { challenger: challengerScore, opponent: opponentScore };
    match.scoreSubmittedAt = new Date();
    await match.save();
    return res.status(200).json({ match });
  } catch (err) {
    console.error('[match/submit-score] Error:', err);
    return res.status(500).json({ error: 'Internal server error', details: (err as Error).message });
  }
} 