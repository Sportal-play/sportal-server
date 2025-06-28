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
    // Populate challenger and opponent with username and email
    const matches = await Match.find({})
      .populate({ path: 'challenger', select: 'username email' })
      .populate({ path: 'opponent', select: 'username email' })
      .lean();
    res.status(200).json({ matches });
  } catch (err) {
    console.error('API /api/matches error:', err);
    res.status(500).json({ error: 'Server error', details: (err as Error).message });
  }
} 