// @ts-nocheck
import dotenv from 'dotenv';
dotenv.config();

import { dbConnect } from '../sportalv0/lib/mongodb';
import Match from '../sportalv0/models/Match';
import mongoose from 'mongoose';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Profile from '../sportalv0/models/Profile';
const { updatePlayerRatings, settings } = require('../services/ratingService');

// Parse CLI args for filtering
const argv = require('minimist')(process.argv.slice(2));
const fromDate = argv.from ? new Date(argv.from) : null;
const toDate = argv.to ? new Date(argv.to) : null;
const limit = argv.limit ? parseInt(argv.limit, 10) : null;

// Force registration on the default connection
mongoose.model('Profile', (Profile as any).schema || new mongoose.Schema({}, { strict: false }));

async function main() {
  await dbConnect();
  console.log('Connected to MongoDB');

  // Build query for matches
  const matchQuery: any = { status: { $in: ['verified', 'finish-acc', 'finish-rej'] } };
  if (fromDate || toDate) {
    matchQuery.scoreSubmittedAt = {};
    if (fromDate) matchQuery.scoreSubmittedAt.$gte = fromDate;
    if (toDate) matchQuery.scoreSubmittedAt.$lte = toDate;
  }

  // Fetch all matches in chronological order (with optional limit)
  let matchCursor = Match.find(matchQuery)
    .sort({ scoreSubmittedAt: 1, challengeSentAt: 1 })
    .populate('challenger')
    .populate('opponent');
  if (limit) matchCursor = matchCursor.limit(limit);
  const matches = await matchCursor;
  console.log(`Found ${matches.length} matches`);

  // Initialize player ratings
  const playerRatings = new Map(); // key: profile _id, value: { rating, ratingDeviation, volatility }

  // Helper to get or initialize a player's rating
  function getPlayerRating(profile: any) {
    if (!profile) return { rating: settings.rating, ratingDeviation: settings.rd, volatility: settings.vol };
    if (!playerRatings.has(profile._id.toString())) {
      playerRatings.set(profile._id.toString(), {
        rating: settings.rating,
        ratingDeviation: settings.rd,
        volatility: settings.vol
      });
    }
    return playerRatings.get(profile._id.toString());
  }

  let updated = 0;
  for (const match of matches) {
    const challenger = match.challenger;
    const opponent = match.opponent;
    if (!challenger || !opponent) continue;
    const challengerId = challenger._id.toString();
    const opponentId = opponent._id.toString();
    const challengerScore = match.score?.challenger;
    const opponentScore = match.score?.opponent;
    if (challengerScore == null || opponentScore == null) continue;
    // Get ratings before
    const challengerBefore = { ...getPlayerRating(challenger) };
    const opponentBefore = { ...getPlayerRating(opponent) };
    // Determine winner
    const challengerWon = challengerScore > opponentScore;
    // Update ratings
    const result = updatePlayerRatings(challengerBefore, opponentBefore, challengerWon);
    // Store after ratings
    playerRatings.set(challengerId, result.challenger);
    playerRatings.set(opponentId, result.opponent);
    // Update match document with all rating fields
    await Match.updateOne(
      { _id: match._id },
      {
        $set: {
          ratingChallengerBefore: challengerBefore.rating,
          ratingChallengerAfter: result.challenger.rating,
          ratingOpponentBefore: opponentBefore.rating,
          ratingOpponentAfter: result.opponent.rating,
          ratingChallengerDeviationBefore: challengerBefore.ratingDeviation,
          ratingChallengerDeviationAfter: result.challenger.ratingDeviation,
          ratingOpponentDeviationBefore: opponentBefore.ratingDeviation,
          ratingOpponentDeviationAfter: result.opponent.ratingDeviation,
          ratingChallengerVolatilityBefore: challengerBefore.volatility,
          ratingChallengerVolatilityAfter: result.challenger.volatility,
          ratingOpponentVolatilityBefore: opponentBefore.volatility,
          ratingOpponentVolatilityAfter: result.opponent.volatility
        }
      }
    );
    updated++;
    if (updated % 100 === 0) console.log(`Updated ${updated} matches...`);
  }
  console.log(`Backfill complete. Updated ${updated} matches.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error in backfill:', err);
  process.exit(1);
}); 