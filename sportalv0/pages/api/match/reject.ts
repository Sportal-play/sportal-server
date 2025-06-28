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

    const { matchId } = req.body;
    if (!matchId) {
      return res.status(400).json({ error: 'Missing matchId' });
    }

    await dbConnect();
    const match = await Match.findById(matchId).populate('opponent');
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    if (match.status !== 'pending') {
      return res.status(400).json({ error: 'Match already handled' });
    }
    // Check for expiration
    const now = new Date();
    const sentAt = new Date(match.challengeSentAt);
    if ((now.getTime() - sentAt.getTime()) > 90 * 1000) {
      await Match.deleteOne({ _id: match._id });
      return res.status(400).json({ error: 'Challenge has expired and was deleted.' });
    }
    // Allow admin to reject any challenge
    const adminEmails = [process.env.ADMIN_EMAIL || 'raghavkshyp@gmail.com'];
    const isAdmin = adminEmails.includes(session.user.email);
    if (!isAdmin && match.opponent._id.toString() !== (session.user.id || session.user._id || session.user.sub)) {
      return res.status(403).json({ error: 'Forbidden: Only the opponent can reject this challenge.' });
    }
    match.status = 'rejected';
    await match.save();
    return res.status(200).json({ match });
  } catch (err) {
    console.error('[match/reject] Error:', err);
    return res.status(500).json({ error: 'Internal server error', details: (err as Error).message });
  }
} 