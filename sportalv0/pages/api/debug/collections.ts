import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collections = await db.listCollections().toArray();
    const result: Record<string, string[]> = {};

    for (const col of collections) {
      const name = col.name;
      const doc = await db.collection(name).findOne();
      result[name] = doc ? Object.keys(doc) : [];
    }

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch collections', details: (err as Error).message });
  }
} 