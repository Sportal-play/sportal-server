import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Profile, Match } from './db';
import { updatePlayerRatings } from './services/ratingService';
import { IProfile, IMatch } from './types/models';
import expressWs from 'express-ws';
import { WebSocket } from 'ws';

const app = express();
expressWs(app);
app.use(express.json());

const router = express.Router();


// WebSocket endpoint for challenger to get notified when request to start match is accepted or
// rejected by opponent, or auto-rejected by server after 2 minutes
const startRequestConnections: { [key: string]: WebSocket } = {};

router.ws('/api/match/ws/start-req/:username', (ws, req) => {
  const { username } = req.params;
  startRequestConnections[username] = ws;

  ws.on('close', () => {
    delete startRequestConnections[username];
  });
});

// WebSocket endpoint for challenger to get notified when request to finish match is accepted or
// rejected by opponent, or auto-rejected by server after 5 minutes
const finishRequestConnections: { [key: string]: WebSocket } = {};

router.ws('/api/match/ws/finish-req/:username', (ws, req) => {
  const { username } = req.params;
  finishRequestConnections[username] = ws;

  ws.on('close', () => {
    delete finishRequestConnections[username];
  });
});

// WebSocket endpoint for opponent to get notified when request to finish match is opened by
// challenger
const startAcceptConnections: { [key: string]: WebSocket } = {};

router.ws('/api/match/ws/start-acc/:username', (ws, req) => {
  const { username } = req.params;
  startAcceptConnections[username] = ws;

  ws.on('close', () => {
    delete startAcceptConnections[username];
  });
});

// Helper function types
async function getProfileId(username: string): Promise<mongoose.Types.ObjectId> {
  const profile = await Profile.findOne({ username });
  if (!profile) {
    throw new Error(`Profile not found: ${username}`);
  }
  return profile._id;
}

async function findMatch(challenger: string, opponent: string): Promise<IMatch | null> {
  const challengerId = await getProfileId(challenger);
  const opponentId = await getProfileId(opponent);

  return await Match.findOne({
    challenger: challengerId,
    opponent: opponentId
  }).populate('challenger opponent', 'username name');
}

async function updateMatchStatus(
  challenger: string,
  opponent: string,
  currentStatus: IMatch['status'],
  newStatus: IMatch['status']
): Promise<IMatch> {
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

// Add these types/interfaces at the top of the file
type ParamValidator = (value: any) => boolean;

interface ParamValidation {
  required?: boolean;
  validator?: ParamValidator;
  message?: string;
}

interface ParamValidations {
  [key: string]: ParamValidation;
}

// Add these utility functions
function validateParams(body: any, validations: ParamValidations) {
  for (const [param, validation] of Object.entries(validations)) {
    // Check if parameter is required but missing
    if (validation.required && (body[param] === undefined || body[param] === null)) {
      throw new Error(`${param} is required`);
    }

    // If value exists and has a validator, check it
    if (body[param] !== undefined && validation.validator && !validation.validator(body[param])) {
      throw new Error(validation.message || `Invalid ${param}`);
    }
  }
}

// Common validators
const validators = {
  isString: (value: any) => typeof value === 'string',
  isNumber: (value: any) => typeof value === 'number',
  isNonNegativeInteger: (value: any) => Number.isInteger(value) && value >= 0,
};

// Profile endpoints
router.post('/api/profile/create', async (req: Request, res: Response) => {
  try {
    validateParams(req.body, {
      username: { required: true, validator: validators.isString },
      name: { required: true, validator: validators.isString }
    });

    const profileData: Partial<IProfile> = {
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
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/api/profile/get', async (req: Request, res: Response) => {
  try {
    validateParams(req.query, {
      username: { required: true, validator: validators.isString }
    });

    const { username } = req.query;
    const profile = await Profile.findOne({ username });
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json(profile);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.put('/api/profile/update', async (req, res) => {
  try {
    validateParams(req.query, {
      username: { required: true, validator: validators.isString }
    });

    const { username } = req.query;
    const profile = await Profile.findOneAndUpdate(
      { username },
      req.body,
      { new: true, runValidators: true }
    );
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json(profile);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Match endpoints
router.post('/api/match/start-req', async (req, res) => {
  try {
    validateParams(req.body, {
      challenger: { required: true, validator: validators.isString },
      opponent: { required: true, validator: validators.isString }
    });

    const { challenger, opponent } = req.body;
    const challengerId = await getProfileId(challenger);
    const opponentId = await getProfileId(opponent);

    // Check for ongoing matches between these players
    const ongoingMatch = await Match.findOne({
      $or: [
        { challenger: challengerId, opponent: opponentId },
        { challenger: opponentId, opponent: challengerId }
      ],
      status: { $in: ['start-req', 'start-acc', 'finish-req'] }
    });

    if (ongoingMatch) {
      res.status(400).json({
        error: 'An ongoing match already exists between these players'
      });
      return;
    }

    const match = new Match({
      challenger: challengerId,
      opponent: opponentId,
      status: 'start-req'
    });
    await match.save();

    // Store the ID value, not the match reference
    const matchId = match._id;

    setTimeout(async () => {
      try {
        const expiredMatch = await Match.findOne({
          _id: matchId,
          status: 'start-req'
        });

        if (expiredMatch) {
          //TODO maybe set status to start-rej instead of deleting the match
          await Match.deleteOne({ _id: matchId });
          // Notify challenger via WebSocket
          if (startRequestConnections[challenger]) {
            startRequestConnections[challenger].send(JSON.stringify({
              event: 'match-auto-rejected',
              opponent
            }));
          }
        }
      } catch (error) {
        console.error('Error cleaning up expired match:', error);
      }
    }, /* 2 minutes */ 2 * 60 * 1000);

    res.status(201).json(match);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/api/match/start-acc', async (req, res) => {
  try {
    validateParams(req.body, {
      challenger: { required: true, validator: validators.isString },
      opponent: { required: true, validator: validators.isString }
    });

    const { challenger, opponent } = req.body;
    const match = await updateMatchStatus(challenger, opponent, 'start-req', 'start-acc');
    match.time_accept_play = new Date();
    await match.save();

    // Notify challenger via WebSocket
    if (startRequestConnections[challenger]) {
      startRequestConnections[challenger].send(JSON.stringify({
        event: 'match-accepted',
        opponent
      }));
    }

    res.json(match);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/api/match/start-rej', async (req, res) => {
  try {
    validateParams(req.body, {
      challenger: { required: true, validator: validators.isString },
      opponent: { required: true, validator: validators.isString }
    });

    const { challenger, opponent } = req.body;
    const match = await updateMatchStatus(challenger, opponent, 'start-req', 'start-rej');

    // Notify challenger via WebSocket
    if (startRequestConnections[challenger]) {
      startRequestConnections[challenger].send(JSON.stringify({ event: 'match-rejected', opponent }));
    }

    res.json(match);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/api/match/finish-req', async (req, res) => {
  try {
    validateParams(req.body, {
      challenger: { required: true, validator: validators.isString },
      opponent: { required: true, validator: validators.isString },
      challenger_score: {
        required: true,
        validator: validators.isNonNegativeInteger,
        message: 'Challenger score must be a non-negative integer'
      },
      opponent_score: {
        required: true,
        validator: validators.isNonNegativeInteger,
        message: 'Opponent score must be a non-negative integer'
      }
    });

    const { challenger, opponent, challenger_score, opponent_score } = req.body;
    const match = await updateMatchStatus(challenger, opponent, 'start-acc', 'finish-req');
    match.challenger_score = challenger_score;
    match.opponent_score = opponent_score;
    await match.save();

    // Store the match ID for the timeout
    const matchId = match._id;

    // Notify opponent via WebSocket
    if (startAcceptConnections[opponent]) {
      startAcceptConnections[opponent].send(JSON.stringify({
        event: 'finish-request',
        challenger
      }));
    }

    // In the timeout, add notification for auto-rejection
    setTimeout(async () => {
      try {
        const unconfirmedMatch = await Match.findOne({
          _id: matchId,
          status: 'finish-req'
        });

        if (unconfirmedMatch) {
          unconfirmedMatch.status = 'finish-rej';
          await unconfirmedMatch.save();

          // Notify challenger of auto-rejection
          if (finishRequestConnections[challenger]) {
            finishRequestConnections[challenger].send(JSON.stringify({
              event: 'finish-auto-rejected',
              opponent
            }));
          }
        }
      } catch (error) {
        console.error('Error auto-rejecting match result:', error);
      }
    }, /* 5 minutes */ 5 * 60 * 1000);

    res.json(match);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/api/match/finish-acc', async (req, res) => {
  try {
    validateParams(req.body, {
      challenger: { required: true, validator: validators.isString },
      opponent: { required: true, validator: validators.isString }
    });

    const { challenger, opponent } = req.body;

    // Get profiles by username instead of ID
    const challengerProfile = await Profile.findOne({ username: challenger });
    const opponentProfile = await Profile.findOne({ username: opponent });

    if (!challengerProfile || !opponentProfile) {
      res.status(400).json({
        error: 'One or both players not found in database'
      });
      return;
    }

    // Find match with status 'finish-req'
    const match = await Match.findOne({
      challenger: challengerProfile._id,
      opponent: opponentProfile._id,
      status: 'finish-req'
    });

    if (!match) {
      res.status(400).json({
        error: 'No pending finish request found between these players'
      });
      return;
    }

    // Update match status
    match.status = 'finish-acc';
    match.time_finish = new Date();

    // Determine winner and update basic stats
    const challengerWon = (match.challenger_score as number) > (match.opponent_score as number);
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

    // Notify challenger that finish was accepted
    if (finishRequestConnections[challenger]) {
      finishRequestConnections[challenger].send(JSON.stringify({
        event: 'finish-accepted',
        opponent,
      }));
    }

    res.json(match);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/api/match/finish-rej', async (req, res) => {
  try {
    validateParams(req.body, {
      challenger: { required: true, validator: validators.isString },
      opponent: { required: true, validator: validators.isString }
    });

    const { challenger, opponent } = req.body;
    const match = await updateMatchStatus(challenger, opponent, 'finish-req', 'finish-rej');

    // Notify challenger that finish was rejected
    if (finishRequestConnections[challenger]) {
      finishRequestConnections[challenger].send(JSON.stringify({
        event: 'finish-rejected',
        opponent
      }));
    }

    res.json(match);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/api/match/get-match', async (req, res) => {
  try {
    validateParams(req.query, {
      challenger: { required: true, validator: validators.isString },
      opponent: { required: true, validator: validators.isString }
    });

    const { challenger, opponent } = req.query;
    const match = await findMatch(challenger as string, opponent as string);
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }
    res.json(match);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/api/match/get-matches', async (req, res) => {
  try {
    validateParams(req.query, {
      challenger: { required: true, validator: validators.isString }
    });

    const { challenger } = req.query;
    const challengerId = await getProfileId(challenger as string);
    const matches = await Match.find({
      $or: [
        { challenger: challengerId },
        { opponent: challengerId }
      ]
    }).populate('challenger opponent', 'username name');
    res.json(matches);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Add this new endpoint for database cleanup
router.post('/api/profile/clean-db', async (_, res) => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({
        error: 'Database cleanup not allowed in production'
      });
      return;
    }

    // Delete all profiles
    await Profile.deleteMany({});
    // Delete all matches
    await Match.deleteMany({});

    res.json({ success: true, message: 'Database cleaned' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.use("/", router);

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27018/sportal').then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
