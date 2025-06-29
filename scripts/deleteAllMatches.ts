import dotenv from 'dotenv';
dotenv.config();
console.log('MONGODB_URI:', process.env.MONGODB_URI);
// @ts-nocheck
import { dbConnect } from '../sportalv0/lib/mongodb';
import Match from '../sportalv0/models/Match';

async function main() {
  await dbConnect();
  const result = await Match.deleteMany({});
  console.log(`Deleted ${result.deletedCount} matches.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error deleting matches:', err);
  process.exit(1);
}); 