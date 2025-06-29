import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import authOptions from '../auth/[...nextauth]';
import { dbConnect } from '../../../lib/mongodb';
import Match from '../../../models/Match';
import { getToken } from "next-auth/jwt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !(token.id || token.sub)) {
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
    const now = new Date();
    const sentAt = new Date(match.challengeSentAt);
    if ((now.getTime() - sentAt.getTime()) > 90 * 1000) {
      await Match.deleteOne({ _id: match._id });
      return res.status(400).json({ error: 'Challenge has expired and was deleted.' });
    }
    // Allow admin to accept any challenge
    const adminEmails = [process.env.ADMIN_EMAIL || 'raghavkshyp@gmail.com'];
    const isAdmin = token.email && adminEmails.includes(token.email);
    const userId = token.id || token.sub;
    if (!isAdmin && !match.opponent._id.equals(userId)) {
      return res.status(403).json({ message: "Only the opponent can accept this challenge." });
    }
    // Block Player B if they have unresolved verifications
    const unresolved = await Match.findOne({
      opponent: match.opponent._id,
      status: 'pending',
      score: { $exists: true },
      verifiedBy: null,
      disputedBy: null
    });
    if (unresolved && unresolved._id.toString() !== match._id.toString()) {
      return res.status(400).json({ error: 'You must verify or dispute your previous match before accepting a new challenge.' });
    }
    match.challengeAcceptedAt = now;
    await match.save();
    return res.status(200).json({ match });
  } catch (err) {
    console.error('[match/accept] Error:', err);
    return res.status(500).json({ error: 'Internal server error', details: (err as Error).message });
  }
} 