import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username } = req.query;
  if (!username || typeof username !== 'string') return res.status(400).json({ exists: false });

  const client = await clientPromise;
  const db = client.db();
  const user = await db.collection("profiles").findOne({ username });
  res.json({ exists: !!user });
} 