import mongoose, { Schema } from 'mongoose';
import { IProfile, IMatch } from './types/models';

const profileSchema = new Schema<IProfile>({
  username: {
    type: String,
    required: true,
    unique: true,
    maxLength: 50
  },
  name: {
    type: String,
    required: true,
    maxLength: 255
  },
  dob: {
    type: Date,
    required: true
  },
  sex: {
    type: String,
    required: true,
    enum: ['M', 'F'],
    maxLength: 1
  },
  rating: {
    type: Number,
    default: 1500
  },
  ratingDeviation: {
    type: Number,
    default: 350
  },
  volatility: {
    type: Number,
    default: 0.06
  },
  wins: {
    type: Number,
    default: 0
  },
  loss: {
    type: Number,
    default: 0
  },
  num_unverified_matches: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
});

// Middleware to prevent updates to protected fields through the API
profileSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() as Partial<IProfile>;
  const protectedFields: (keyof IProfile)[] = ['rating', 'ratingDeviation', 'volatility', 'wins', 'loss', 'num_unverified_matches'];
  
  // Check if any protected fields are being updated through the API
  const hasProtectedFields = protectedFields.some(field => field in update);
  
  if (hasProtectedFields) {
    next(new Error('Cannot modify protected fields through the API'));
  } else {
    next();
  }
});

const Profile = mongoose.model<IProfile>('Profile', profileSchema);

const matchSchema = new Schema<IMatch>({
  challenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  opponent: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Profile',
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['start-req', 'start-acc', 'start-rej', 'finish-req', 'finish-acc', 'finish-rej']
  },
  time_accept_play: {
    type: Date
  },
  time_finish: {
    type: Date
  },
  challenger_score: {
    type: Number
  },
  opponent_score: {
    type: Number
  }
});

const Match = mongoose.model<IMatch>('Match', matchSchema);

export { Profile, Match };
