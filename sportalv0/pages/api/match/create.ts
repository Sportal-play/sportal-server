import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '../../../lib/mongodb';
import Match from '../../../models/Match';
import mongoose from 'mongoose';

const Profile = mongoose.models.Profile || mongoose.model('Profile', new mongoose.Schema({}, { strict: false }));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    await dbConnect();
    const { challenger, opponent } = req.body;
    if (!challenger || !opponent || challenger === opponent) {
      return res.status(400).json({ error: 'Invalid challenger or opponent' });
    }
    // Find user/profile IDs by email or username
    let challengerProfile = await Profile.findOne({ $or: [{ email: challenger }, { username: challenger }] });
    let opponentProfile = await Profile.findOne({ $or: [{ email: opponent }, { username: opponent }] });
    if (!challengerProfile || !opponentProfile) {
      return res.status(404).json({ error: 'Challenger or opponent not found' });
    }
    // Limit to 1 outgoing challenge per user
    const existingOutgoing = await Match.findOne({
      challenger: challengerProfile._id,
      status: 'pending'
    });
    if (existingOutgoing) {
      return res.status(400).json({ error: 'You already have a pending challenge. Please resolve it before sending another.' });
    }
    // Also block if there is a pending match that was accepted but not completed (score not submitted)
    const acceptedButNotCompleted = await Match.findOne({
      challenger: challengerProfile._id,
      opponent: opponentProfile._id,
      status: 'pending',
      challengeAcceptedAt: { $ne: null },
      score: { $exists: false }
    });
    if (acceptedButNotCompleted) {
      return res.status(400).json({ error: 'You cannot send another challenge until the previous match score is submitted.' });
    }
    // Create match
    const match = await Match.create({
      challenger: challengerProfile._id,
      opponent: opponentProfile._id,
      status: 'pending',
      challengeSentAt: new Date(),
      enteredBy: challengerProfile._id
    });
    res.status(201).json({ match });
  } catch (err) {
    if (err && (err as any).code === 11000) {
      // Duplicate key error from unique index
      return res.status(400).json({ error: 'You already have a pending challenge. Please resolve it before sending another.' });
    }
    console.error('API /api/match/create error:', err);
    res.status(500).json({ error: 'Server error', details: (err as Error).message });
  }
} 