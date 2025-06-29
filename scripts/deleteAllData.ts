// @ts-nocheck
import dotenv from 'dotenv';
dotenv.config();
console.log('MONGODB_URI:', process.env.MONGODB_URI);
import { dbConnect } from '../sportalv0/lib/mongodb';
import Match from '../sportalv0/models/Match';
import Profile from '../sportalv0/models/Profile';
import mongoose from 'mongoose';

async function main() {
  await dbConnect();
  // Delete all matches
  const matchResult = await Match.deleteMany({});
  // Delete all profiles
  const profileResult = await Profile.deleteMany({});
  // Drop all non-system collections
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const col of collections) {
    if (!['system.indexes'].includes(col.name)) {
      await mongoose.connection.db.dropCollection(col.name);
      console.log(`Dropped collection: ${col.name}`);
    }
  }
  console.log(`Deleted ${matchResult.deletedCount} matches.`);
  console.log(`Deleted ${profileResult.deletedCount} profiles.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error deleting data:', err);
  process.exit(1);
}); 