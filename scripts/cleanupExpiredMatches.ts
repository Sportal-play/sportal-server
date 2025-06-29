import 'dotenv/config';
import mongoose from 'mongoose';
mongoose.set('strictQuery', false);
import Match from '../sportalv0/models/Match';

async function cleanupExpiredPendingMatches() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const now = new Date();
  const cutoff = new Date(now.getTime() - 90 * 1000);
  
  // Only delete pending matches that have NOT been accepted
  // This preserves accepted matches that are waiting for score entry
  const result = await Match.deleteMany({ 
    status: 'pending', 
    challengeSentAt: { $lt: cutoff },
    challengeAcceptedAt: null  // Only delete if challenge was never accepted
  });
  
  console.log(`Deleted ${result.deletedCount} expired unaccepted pending matches.`);
  mongoose.connection.close();
}

cleanupExpiredPendingMatches().catch(err => {
  console.error('Cleanup failed:', err);
  mongoose.connection.close();
}); 