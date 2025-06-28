import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (req.method === "GET") {
    try {
      const client = await clientPromise;
      const db = client.db();
      const profile = await db.collection("profiles").findOne({ _id: new ObjectId(userId as string) });
      if (!profile) return res.status(404).json({ error: "User not found" });

      // Fetch all completed matches (status: 'verified') where user is challenger or opponent
      const matches = await db.collection("matches").aggregate([
        {
          $match: {
            status: "verified",
            $or: [
              { challenger: new ObjectId(userId as string) },
              { opponent: new ObjectId(userId as string) }
            ]
          }
        },
        {
          $lookup: {
            from: "profiles",
            localField: "challenger",
            foreignField: "_id",
            as: "challengerProfile"
          }
        },
        {
          $lookup: {
            from: "profiles",
            localField: "opponent",
            foreignField: "_id",
            as: "opponentProfile"
          }
        },
        {
          $addFields: {
            challenger: { $arrayElemAt: ["$challengerProfile", 0] },
            opponent: { $arrayElemAt: ["$opponentProfile", 0] }
          }
        },
        { $sort: { scoreSubmittedAt: -1 } }
      ]).toArray();

      // Map scores, time, and final ratings for frontend compatibility
      const matchesWithScores = matches.map((match: any) => {
        // Find finish time
        const finishTime = match.time_finish || match.scoreSubmittedAt || match.challengeAcceptedAt || '';
        // Helper to get final rating after this match
        function getFinalRating(ratingHistory: any[], matchTime: any) {
          if (!Array.isArray(ratingHistory) || ratingHistory.length === 0 || !matchTime) return null;
          const sorted = [...ratingHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          let finalRating = sorted[0].rating;
          for (let i = 0; i < sorted.length; i++) {
            const entryTime = new Date(sorted[i].date).getTime();
            if (entryTime >= new Date(matchTime).getTime()) {
              finalRating = sorted[i].rating;
              break;
            }
            finalRating = sorted[i].rating;
          }
          return Math.round(finalRating);
        }
        return {
          ...match,
          challenger_score: match.challenger_score ?? match.score?.challenger ?? '-',
          opponent_score: match.opponent_score ?? match.score?.opponent ?? '-',
          time_finish: finishTime,
          challenger_final_rating: getFinalRating(match.challenger?.ratingHistory || [], finishTime),
          opponent_final_rating: getFinalRating(match.opponent?.ratingHistory || [], finishTime),
        };
      });

      // Calculate stats
      let wins = 0;
      let totalGames = matches.length;
      let maxWinStreak = 0;
      let currentWinStreak = 0;
      let currentLoseStreak = 0;
      let maxLoseStreak = 0;
      let lastResult = null;
      let highestRating = profile.ratingHistory && profile.ratingHistory.length > 0 ? profile.ratingHistory[0].rating : profile.rating;
      let biggestGain = 0;
      let biggestDrop = 0;
      let bestWin = null;
      let bestWinOpponentRating = -Infinity;
      let pointsScored = 0;
      let pointsConceded = 0;
      let matchesThisMonth = 0;
      let matchesLast7Days = 0;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      for (const match of matchesWithScores) {
        let isUserChallenger = match.challenger && match.challenger._id && match.challenger._id.toString() === userId;
        let userScore = isUserChallenger ? match.challenger_score : match.opponent_score;
        let oppScore = isUserChallenger ? match.opponent_score : match.challenger_score;
        if (typeof userScore !== 'number' || typeof oppScore !== 'number') continue;
        let didWin = userScore > oppScore;
        pointsScored += userScore;
        pointsConceded += oppScore;
        const matchDate = match.scoreSubmittedAt ? new Date(match.scoreSubmittedAt) : new Date(match.challengeAcceptedAt || match.challengeSentAt);
        if (matchDate >= startOfMonth) matchesThisMonth++;
        if (matchDate >= sevenDaysAgo) matchesLast7Days++;
        if (didWin) {
          wins++;
          if (lastResult === true || lastResult === null) {
            currentWinStreak++;
          } else {
            currentWinStreak = 1;
          }
          maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
          currentLoseStreak = 0;
          // Best win logic
          const opponent = isUserChallenger ? match.opponent : match.challenger;
          if (opponent.rating > bestWinOpponentRating) {
            bestWinOpponentRating = opponent.rating;
            bestWin = `vs. ${opponent.username} (${Math.round(opponent.rating)})`;
          }
        } else {
          currentWinStreak = 0;
          if (lastResult === false || lastResult === null) {
            currentLoseStreak++;
          } else {
            currentLoseStreak = 1;
          }
          maxLoseStreak = Math.max(maxLoseStreak, currentLoseStreak);
        }
        lastResult = didWin;
      }
      // Win rate
      let winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
      // Highest rating, biggest gain/drop
      if (profile.ratingHistory && profile.ratingHistory.length > 1) {
        highestRating = profile.ratingHistory.reduce((max: any, entry: any) => Math.max(max, entry.rating), profile.ratingHistory[0].rating);
        for (let i = 1; i < profile.ratingHistory.length; i++) {
          const diff = profile.ratingHistory[i].rating - profile.ratingHistory[i - 1].rating;
          if (diff > biggestGain) biggestGain = diff;
          if (diff < biggestDrop) biggestDrop = diff;
        }
      }
      const avgPointsScored = totalGames > 0 ? (pointsScored / totalGames) : 0;
      const avgPointsConceded = totalGames > 0 ? (pointsConceded / totalGames) : 0;
      res.json({
        ...profile,
        matches: matchesWithScores,
        statistics: {
          totalMatches: totalGames,
          totalWins: wins,
          winRate,
          highestRating,
          longestWinStreak: maxWinStreak,
          currentWinStreak: lastResult === true ? currentWinStreak : 0,
          bestWin: bestWin || '-',
          longestLosingStreak: maxLoseStreak,
          avgPointsScored: Number(avgPointsScored.toFixed(2)),
          avgPointsConceded: Number(avgPointsConceded.toFixed(2)),
          matchesThisMonth,
          matchesLast7Days,
          biggestRatingGain: biggestGain,
          biggestRatingDrop: biggestDrop,
        }
      });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
    return;
  }

  if (req.method === "POST") {
    // Create a new profile
    const { username, name, dob, gender } = req.body;
    if (!username || !name || !dob || !gender) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    try {
      const client = await clientPromise;
      const db = client.db();
      // Ensure username is unique
      const existing = await db.collection("profiles").findOne({ username });
      if (existing) {
        return res.status(409).json({ error: "Username already exists" });
      }
      const result = await db.collection("profiles").insertOne({
        _id: new ObjectId(userId as string),
        username,
        name,
        dob: new Date(dob),
        sex: gender,
        rating: 1500,
        ratingDeviation: 350,
        volatility: 0.06,
        wins: 0,
        loss: 0,
        num_unverified_matches: 0,
        ratingHistory: [],
        created_at: new Date(),
        updated_at: new Date(),
      });
      res.json({ success: true, id: result.insertedId });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
    return;
  }

  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { username, name, dob, gender } = req.body;
  if (!username || !name || !dob || !gender) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const client = await clientPromise;
    const db = client.db();
    // Ensure username is unique (not used by another user)
    const existing = await db.collection("profiles").findOne({ username, _id: { $ne: new ObjectId(userId as string) } });
    if (existing) {
      return res.status(409).json({ error: "Username already exists" });
    }
    const result = await db.collection("profiles").updateOne(
      { _id: new ObjectId(userId as string) },
      { $set: { username, name, dob: new Date(dob), sex: gender, updated_at: new Date() } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
} 