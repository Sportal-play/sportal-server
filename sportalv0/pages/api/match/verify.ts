import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import authOptions from '../auth/[...nextauth]';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import type { Session } from 'next-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = (await getServerSession(req, res, authOptions)) as Session;
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      matchId,
      playerA,
      playerB,
      newRatingA,
      newRD_A,
      newVolatilityA,
      newRatingB,
      newRD_B,
      newVolatilityB
    } = req.body;

    if (!matchId || !playerA || !playerB) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Confirm logged-in user is playerB or admin
    const adminEmails = [process.env.ADMIN_EMAIL || 'raghavkshyp@gmail.com'];
    const isAdmin = adminEmails.includes((session.user as any).email);
    const loggedInUserId = (session.user as any).id || (session.user as any)._id || (session.user as any).sub;
    if (!isAdmin && loggedInUserId !== playerB) {
      return res.status(403).json({ error: 'Forbidden: Only playerB can verify this match.' });
    }

    const client = await clientPromise;
    const db = client.db();

    // Fetch the match to get scoreSubmittedAt and player ratings before
    const matchDoc = await db.collection('matches').findOne({ _id: new ObjectId(matchId) });
    const matchDate = matchDoc?.scoreSubmittedAt ? new Date(matchDoc.scoreSubmittedAt) : new Date();

    // Fetch player ratings before
    const playerADoc = await db.collection('profiles').findOne({ _id: new ObjectId(playerA) });
    const playerBDoc = await db.collection('profiles').findOne({ _id: new ObjectId(playerB) });
    const ratingChallengerBefore = playerADoc?.rating ?? 1500;
    const ratingOpponentBefore = playerBDoc?.rating ?? 1500;

    // 4. Update the matches collection
    await db.collection('matches').updateOne(
      { _id: new ObjectId(matchId) },
      {
        $set: {
          status: 'verified',
          verifiedBy: playerB,
          updatedAt: new Date(),
          ratingChallengerBefore,
          ratingChallengerAfter: newRatingA,
          ratingOpponentBefore,
          ratingOpponentAfter: newRatingB
        }
      }
    );

    // 5. Update playerA's profile
    await db.collection('profiles').updateOne(
      { _id: new ObjectId(playerA) },
      {
        $set: {
          rating: newRatingA,
          ratingDeviation: newRD_A,
          volatility: newVolatilityA,
          updated_at: new Date()
        },
        $push: {
          ratingHistory: {
            date: matchDate,
            rating: newRatingA,
            deviation: newRD_A,
            volatility: newVolatilityA
          }
        }
      } as any
    );

    // 6. Update playerB's profile
    await db.collection('profiles').updateOne(
      { _id: new ObjectId(playerB) },
      {
        $set: {
          rating: newRatingB,
          ratingDeviation: newRD_B,
          volatility: newVolatilityB,
          updated_at: new Date()
        },
        $push: {
          ratingHistory: {
            date: matchDate,
            rating: newRatingB,
            deviation: newRD_B,
            volatility: newVolatilityB
          }
        }
      } as any
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[match/verify] Error:', err);
    return res.status(500).json({ error: 'Internal server error', details: (err as Error).message });
  }
} 