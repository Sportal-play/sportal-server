import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query } = req.query;
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return res.status(400).json({ error: "Missing or invalid query" });
  }
  try {
    const client = await clientPromise;
    const db = client.db();
    // Case-insensitive, partial match on username
    const results = await db.collection("profiles")
      .find({ username: { $regex: query, $options: "i" } })
      .project({ username: 1, name: 1, rating: 1, _id: 1 })
      .limit(10)
      .toArray();
    res.status(200).json({ results });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
} 