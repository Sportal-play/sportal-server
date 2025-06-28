import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db();

    if (req.method === "DELETE") {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email required" });
      const user = await db.collection("users").findOne({ email });
      if (!user) return res.status(404).json({ error: "User not found" });
      const userId = user._id;
      await db.collection("users").deleteOne({ _id: userId });
      await db.collection("accounts").deleteMany({ userId });
      await db.collection("sessions").deleteMany({ userId });
      await db.collection("profiles").deleteOne({ _id: userId });
      return res.json({ success: true });
    }

    if (req.method === "POST") {
      const { email, username, name, dob, gender } = req.body;
      if (!email || !username || !name || !dob || !gender) {
        return res.status(400).json({ error: "All fields required" });
      }
      // Check if user already exists
      const existingUser = await db.collection("users").findOne({ email });
      if (existingUser) {
        return res.status(409).json({ error: "User already exists" });
      }
      // Insert into users
      const userResult = await db.collection("users").insertOne({ email });
      const userId = userResult.insertedId;
      // Insert into profiles
      await db.collection("profiles").insertOne({
        _id: userId,
        username,
        name,
        dob: new Date(dob),
        sex: gender,
      });
      // Return updated list
      const users = await db.collection("users").find({}).toArray();
      const profiles = await db.collection("profiles").find({}).toArray();
      const userTable = users.map(user => {
        const profile = profiles.find(p => p._id?.toString() === user._id?.toString());
        return {
          email: user.email,
          name: profile?.name || '',
          username: profile?.username || '',
          dob: profile?.dob ? new Date(profile.dob).toISOString().slice(0, 10) : '',
          gender: profile?.sex || '',
        };
      });
      return res.json({ users: userTable });
    }

    if (req.method === "PUT") {
      const { email, username, name, dob, gender } = req.body;
      if (!email || !username || !name || !dob || !gender) {
        return res.status(400).json({ error: "All fields required" });
      }
      // Find user
      const user = await db.collection("users").findOne({ email });
      if (!user) return res.status(404).json({ error: "User not found" });
      const userId = user._id;
      // Update profile
      await db.collection("profiles").updateOne(
        { _id: userId },
        { $set: { username, name, dob: new Date(dob), sex: gender } }
      );
      // Return updated list
      const users = await db.collection("users").find({}).toArray();
      const profiles = await db.collection("profiles").find({}).toArray();
      const userTable = users.map(user => {
        const profile = profiles.find(p => p._id?.toString() === user._id?.toString());
        return {
          email: user.email,
          name: profile?.name || '',
          username: profile?.username || '',
          dob: profile?.dob ? new Date(profile.dob).toISOString().slice(0, 10) : '',
          gender: profile?.sex || '',
        };
      });
      return res.json({ users: userTable });
    }

    const users = await db.collection("users").find({}).toArray();
    const profiles = await db.collection("profiles").find({}).toArray();
    // Join users and profiles by _id
    const userTable = users.map(user => {
      const profile = profiles.find(p => p._id?.toString() === user._id?.toString());
      return {
        email: user.email,
        name: profile?.name || '',
        username: profile?.username || '',
        dob: profile?.dob ? new Date(profile.dob).toISOString().slice(0, 10) : '',
        gender: profile?.sex || '',
      };
    });
    res.json({ users: userTable });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
} 