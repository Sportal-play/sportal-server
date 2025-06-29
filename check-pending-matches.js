const { MongoClient } = require('mongodb');

async function checkPendingMatches() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sportal';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Check all matches
    const allMatches = await db.collection('matches').find({}).toArray();
    console.log('All matches:', allMatches.map(m => ({
      _id: m._id,
      challenger: m.challenger,
      opponent: m.opponent,
      status: m.status,
      challengeAcceptedAt: m.challengeAcceptedAt
    })));
    
    // Check pending matches specifically
    const pendingMatches = await db.collection('matches').find({ 
      status: 'pending',
      challengeAcceptedAt: null 
    }).toArray();
    console.log('Pending matches:', pendingMatches.map(m => ({
      _id: m._id,
      challenger: m.challenger,
      opponent: m.opponent,
      status: m.status
    })));
    
    // Check users/profiles
    const users = await db.collection('users').find({}).toArray();
    console.log('Users:', users.map(u => ({
      _id: u._id,
      email: u.email,
      name: u.name
    })));
    
    const profiles = await db.collection('profiles').find({}).toArray();
    console.log('Profiles:', profiles.map(p => ({
      _id: p._id,
      username: p.username,
      email: p.email
    })));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkPendingMatches(); 