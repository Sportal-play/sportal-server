import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import authOptions from "../auth/[...nextauth]";
import { dbConnect } from "../../../lib/mongodb";
import Match from "../../../models/Match";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !(session as any).user) return res.status(401).json({ error: "Unauthorized" });
  await dbConnect();
  const userId = (session as any).user.id || (session as any).user._id || (session as any).user.sub;
  console.log("userId:", userId, typeof userId);
  const matches = await Match.find({
    opponent: new ObjectId(userId),
    status: "pending",
    challengeAcceptedAt: null,
  })
    .populate("challenger", "username rating avatar")
    .lean();
    console.log("Found matches:", matches);
  res.json({ matches });
} 