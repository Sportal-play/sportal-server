import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import authOptions from "../auth/[...nextauth]";
import { dbConnect } from "../../../lib/mongodb";
import Match from "../../../models/Match";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !(session as any).user) return res.status(401).json({ error: "Unauthorized" });
  
  console.log("[pending] Full session:", JSON.stringify(session, null, 2));
  console.log("[pending] Session user:", JSON.stringify((session as any).user, null, 2));
  
  await dbConnect();
  
  // The session should now have the user ID from the NextAuth callback
  const userId = (session as any).user.id;
  console.log("[pending] Extracted userId:", userId, "type:", typeof userId);
  
  if (!userId) {
    console.log("[pending] No userId found in session, returning empty array");
    return res.json({ matches: [] });
  }
  
  // Check if userId is a valid ObjectId
  let objectIdUserId;
  try {
    objectIdUserId = new ObjectId(userId);
    console.log("[pending] Converted to ObjectId:", objectIdUserId.toString());
  } catch (err) {
    console.log("[pending] Failed to convert userId to ObjectId:", err);
    return res.status(400).json({ error: "Invalid user ID format" });
  }
  
  // First, let's see what matches exist in the database
  const allPendingMatches = await Match.find({ status: "pending" }).populate("challenger", "username rating avatar").populate("opponent", "username rating avatar").lean();
  console.log("[pending] All pending matches in DB:", allPendingMatches.map(m => ({
    _id: m._id,
    challenger: m.challenger?.username,
    opponent: m.opponent?.username,
    opponentId: m.opponent?._id,
    status: m.status
  })));
  
  // Now query for matches where this user is the opponent
  const matches = await Match.find({
    opponent: objectIdUserId,
    status: "pending",
    challengeAcceptedAt: null,
  })
    .populate("challenger", "username rating avatar")
    .lean();
    
  console.log("[pending] Found matches for userId", userId, ":", matches.map(m => ({
    _id: m._id,
    challenger: m.challenger?.username,
    opponent: m.opponent?.username,
    status: m.status
  })));
    
  res.json({ matches });
} 