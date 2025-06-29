const { MongoClient, ObjectId } = require('mongodb');

async function createTestMatch() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sportal';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Get the user IDs for ragkash and bitsian
    const ragkashProfile = await db.collection('profiles').findOne({ username: 'ragkash' });
    const bitsianProfile = await db.collection('profiles').findOne({ username: 'Bitsian' });
    
    if (!ragkashProfile || !bitsianProfile) {
      console.log('Could not find profiles:', { ragkash: !!ragkashProfile, bitsian: !!bitsianProfile });
      return;
    }
    
    console.log('Found profiles:', {
      ragkash: { _id: ragkashProfile._id, username: ragkashProfile.username },
      bitsian: { _id: bitsianProfile._id, username: bitsianProfile.username }
    });
    
    // Create a pending match
    const match = {
      challenger: ragkashProfile._id,
      opponent: bitsianProfile._id,
      status: 'pending',
      challengeSentAt: new Date(),
      challengeAcceptedAt: null,
      enteredBy: ragkashProfile._id
    };
    
    const result = await db.collection('matches').insertOne(match);
    console.log('Created test match:', result.insertedId);
    
    // Verify the match was created
    const createdMatch = await db.collection('matches').findOne({ _id: result.insertedId });
    console.log('Created match details:', {
      _id: createdMatch._id,
      challenger: createdMatch.challenger,
      opponent: createdMatch.opponent,
      status: createdMatch.status
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

createTestMatch(); 