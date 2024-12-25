const express = require('express');
const mongoose = require('mongoose');
const { Profile, Match } = require('./db');
const { updatePlayerRatings } = require('./services/ratingService');

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27018/sportal', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Profile endpoints
app.post('/api/profile/create', async (req, res) => {
  try {
    // Initialize protected fields with default values
    const profileData = {
      ...req.body,
      rating: 1500,
      ratingDeviation: 350,
      volatility: 0.06,
      wins: 0,
      loss: 0,
      num_unverified_matches: 0
    };
    
    const profile = new Profile(profileData);
    await profile.save();
    res.status(201).json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/profile/get', async (req, res) => {
  try {
    const { username } = req.query;
    const profile = await Profile.findOne({ username });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/profile/update', async (req, res) => {
  try {
    const { username } = req.query;
    const profile = await Profile.findOneAndUpdate(
      { username },
      req.body,
      { new: true, runValidators: true }
    );
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Match endpoints
app.post('/api/match/request-play', async (req, res) => {
  try {
    const { challenger, opponent } = req.body;
    const match = new Match({
      challenger: await getProfileId(challenger),
      opponent: await getProfileId(opponent),
      status: 'request-play'
    });
    await match.save();
    res.status(201).json(match);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/match/accept-play', async (req, res) => {
  try {
    const { challenger, opponent } = req.body;
    const match = await updateMatchStatus(challenger, opponent, 'request-play', 'accept-play');
    match.time_accept_play = new Date();
    await match.save();
    res.json(match);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/match/decline-play', async (req, res) => {
  try {
    const { challenger, opponent } = req.body;
    const match = await updateMatchStatus(challenger, opponent, 'request-play', 'decline-play');
    res.json(match);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/match/request-finish', async (req, res) => {
  try {
    const { challenger, opponent, challenger_score, opponent_score } = req.body;
    const match = await updateMatchStatus(challenger, opponent, 'accept-play', 'request-finish');
    match.challenger_score = challenger_score;
    match.opponent_score = opponent_score;
    await match.save();
    res.json(match);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/match/accept-finish', async (req, res) => {
  try {
    const { challenger, opponent } = req.body;
    const match = await updateMatchStatus(challenger, opponent, 'request-finish', 'accept-finish');
    match.time_finish = new Date();
    
    // Update player statistics
    const challengerProfile = await Profile.findById(match.challenger);
    const opponentProfile = await Profile.findById(match.opponent);
    
    // Determine winner and update basic stats
    const challengerWon = match.challenger_score > match.opponent_score;
    if (challengerWon) {
      challengerProfile.wins += 1;
      opponentProfile.loss += 1;
    } else {
      challengerProfile.loss += 1;
      opponentProfile.wins += 1;
    }
    
    // Update ratings
    const newRatings = updatePlayerRatings(challengerProfile, opponentProfile, challengerWon);
    
    // Apply new ratings to profiles
    challengerProfile.rating = newRatings.challenger.rating;
    challengerProfile.ratingDeviation = newRatings.challenger.ratingDeviation;
    challengerProfile.volatility = newRatings.challenger.volatility;
    
    opponentProfile.rating = newRatings.opponent.rating;
    opponentProfile.ratingDeviation = newRatings.opponent.ratingDeviation;
    opponentProfile.volatility = newRatings.opponent.volatility;
    
    await challengerProfile.save();
    await opponentProfile.save();
    await match.save();
    
    res.json(match);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/match/decline-finish', async (req, res) => {
  try {
    const { challenger, opponent } = req.body;
    const match = await updateMatchStatus(challenger, opponent, 'request-finish', 'decline-finish');
    res.json(match);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/match/get-match', async (req, res) => {
  try {
    const { challenger, opponent } = req.query;
    const match = await findMatch(challenger, opponent);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json(match);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/match/get-matches', async (req, res) => {
  try {
    const { challenger } = req.query;
    const challengerId = await getProfileId(challenger);
    const matches = await Match.find({ 
      $or: [
        { challenger: challengerId },
        { opponent: challengerId }
      ]
    }).populate('challenger opponent', 'username name');
    res.json(matches);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add this new endpoint for database cleanup
app.post('/api/profile/clean-db', async (req, res) => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ 
        error: 'Database cleanup not allowed in production' 
      });
    }

    // Delete all profiles
    await Profile.deleteMany({});
    // Delete all matches
    await Match.deleteMany({});
    
    res.json({ success: true, message: 'Database cleaned' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
async function getProfileId(username) {
  const profile = await Profile.findOne({ username });
  if (!profile) {
    throw new Error(`Profile not found: ${username}`);
  }
  return profile._id;
}

async function findMatch(challenger, opponent) {
  const challengerId = await getProfileId(challenger);
  const opponentId = await getProfileId(opponent);
  
  return await Match.findOne({
    challenger: challengerId,
    opponent: opponentId
  }).populate('challenger opponent', 'username name');
}

async function updateMatchStatus(challenger, opponent, currentStatus, newStatus) {
  const match = await findMatch(challenger, opponent);
  if (!match) {
    throw new Error('Match not found');
  }
  if (match.status !== currentStatus) {
    throw new Error(`Invalid match status: expected ${currentStatus}, got ${match.status}`);
  }
  match.status = newStatus;
  return await match.save();
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 