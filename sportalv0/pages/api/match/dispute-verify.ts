import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import authOptions from '../auth/[...nextauth]';
import { dbConnect } from '../../../lib/mongodb';
import Match from '../../../models/Match';
import Profile from '../../../models/Profile';
const { updatePlayerRatings } = require('../../../services/ratingService');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const session = await getServerSession(req, res, authOptions) as any;
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { matchId, action } = req.body;
    if (!matchId || !['verify', 'dispute'].includes(action)) {
      return res.status(400).json({ error: 'Missing matchId or invalid action' });
    }
    await dbConnect();
    const match = await Match.findById(matchId).populate('challenger').populate('opponent');
    if (!match || !match.disputedScore) {
      return res.status(404).json({ error: 'Match or disputed score not found' });
    }
    if (action === 'verify') {
      // Update ratings using disputedScore
      const challengerRating = {
        rating: match.challenger.rating ?? 1500,
        ratingDeviation: match.challenger.ratingDeviation ?? 350,
        volatility: match.challenger.volatility ?? 0.06,
      };
      const opponentRating = {
        rating: match.opponent.rating ?? 1500,
        ratingDeviation: match.opponent.ratingDeviation ?? 350,
        volatility: match.opponent.volatility ?? 0.06,
      };
      const challengerWon = match.disputedScore.challenger > match.disputedScore.opponent;
      const result = updatePlayerRatings(challengerRating, opponentRating, challengerWon);
      // Fetch player ratings before
      const challengerBefore = match.challenger.rating ?? 1500;
      const opponentBefore = match.opponent.rating ?? 1500;
      // Update profiles
      const matchDate = match.scoreSubmittedAt ? new Date(match.scoreSubmittedAt) : new Date();
      await Profile.findByIdAndUpdate(match.challenger._id, {
        $set: {
          rating: result.challenger.rating,
          ratingDeviation: result.challenger.ratingDeviation,
          volatility: result.challenger.volatility,
          updated_at: new Date(),
        },
        $push: {
          ratingHistory: {
            date: matchDate,
            rating: result.challenger.rating,
            deviation: result.challenger.ratingDeviation,
            volatility: result.challenger.volatility,
          },
        },
      });
      await Profile.findByIdAndUpdate(match.opponent._id, {
        $set: {
          rating: result.opponent.rating,
          ratingDeviation: result.opponent.ratingDeviation,
          volatility: result.opponent.volatility,
          updated_at: new Date(),
        },
        $push: {
          ratingHistory: {
            date: matchDate,
            rating: result.opponent.rating,
            deviation: result.opponent.ratingDeviation,
            volatility: result.opponent.volatility,
          },
        },
      });
      match.status = 'verified';
      match.disputeState = 'verified';
      match.verifiedAt = new Date();
      match.disputeHistory.push({ by: match.challenger._id, at: new Date(), action: 'verify', score: match.disputedScore });
      match.ratingChallengerBefore = challengerBefore;
      match.ratingChallengerAfter = result.challenger.rating;
      match.ratingOpponentBefore = opponentBefore;
      match.ratingOpponentAfter = result.opponent.rating;
      await match.save();
      return res.status(200).json({ match });
    } else if (action === 'dispute') {
      // Double dispute: set red flags, no rating change
      match.status = 'disputed';
      match.disputeState = 'disputed';
      match.redFlagChallenger = true;
      match.redFlagOpponent = true;
      match.disputeHistory.push({ by: match.challenger._id, at: new Date(), action: 'dispute', score: match.disputedScore });
      await match.save();
      // Increment redFlagCount for both profiles
      await Profile.findByIdAndUpdate(match.challenger._id, { $inc: { redFlagCount: 1 }, $push: { disputeHistory: { matchId: match._id, date: new Date(), asChallenger: true } } });
      await Profile.findByIdAndUpdate(match.opponent._id, { $inc: { redFlagCount: 1 }, $push: { disputeHistory: { matchId: match._id, date: new Date(), asOpponent: true } } });
      return res.status(200).json({ match });
    }
  } catch (err) {
    console.error('[match/dispute-verify] Error:', err);
    return res.status(500).json({ error: 'Internal server error', details: (err as Error).message });
  }
} 