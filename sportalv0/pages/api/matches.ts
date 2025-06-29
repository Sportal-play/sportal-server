import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '../../lib/mongodb';
import Match from '../../models/Match';
import mongoose from 'mongoose';

const Profile = mongoose.models.Profile || mongoose.model('Profile', new mongoose.Schema({}, { strict: false }));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    await dbConnect();
    const { username } = req.query;
    let query = {};
    if (username) {
      // Find the profile for the username
      const profile = await Profile.findOne({ username });
      if (!profile) return res.status(404).json({ error: 'User not found' });
      query = { $or: [{ challenger: profile._id }, { opponent: profile._id }] };
    }
    const matches = await Match.find(query)
      .populate({ path: 'challenger', select: 'username email rating' })
      .populate({ path: 'opponent', select: 'username email rating' })
      .lean();
    // Map scores to challenger_score and opponent_score for frontend compatibility
    const mappedMatches = matches.map(match => ({
      ...match,
      challenger_score: match.score?.challenger ?? null,
      opponent_score: match.score?.opponent ?? null,
      ratingChallengerBefore: match.ratingChallengerBefore ?? null,
      ratingChallengerAfter: match.ratingChallengerAfter ?? null,
      ratingOpponentBefore: match.ratingOpponentBefore ?? null,
      ratingOpponentAfter: match.ratingOpponentAfter ?? null,
    }));
    res.status(200).json({ matches: mappedMatches });
  } catch (err) {
    console.error('API /api/matches error:', err);
    res.status(500).json({ error: 'Server error', details: (err as Error).message });
  }
} 