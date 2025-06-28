import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '../../../lib/mongodb';
import Match from '../../../models/Match';
import { getServerSession } from 'next-auth/next';
import authOptions from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await getServerSession(req, res, authOptions) as any;
  if (!session || !session.user || session.user.email !== (process.env.ADMIN_EMAIL || 'raghavkshyp@gmail.com')) {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }
  try {
    await dbConnect();
    const result = await Match.deleteMany({ status: 'pending' });
    return res.status(200).json({ message: 'Deleted all pending matches', deletedCount: result.deletedCount });
  } catch (err) {
    console.error('[admin/cleanup-pending-matches] Error:', err);
    return res.status(500).json({ error: 'Internal server error', details: (err as Error).message });
  }
} 