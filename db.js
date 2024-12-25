const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
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
  const update = this.getUpdate();
  const protectedFields = ['rating', 'ratingDeviation', 'volatility', 'wins', 'loss', 'num_unverified_matches'];
  
  // Check if any protected fields are being updated through the API
  const hasProtectedFields = protectedFields.some(field => field in update);
  
  if (hasProtectedFields) {
    next(new Error('Cannot modify protected fields through the API'));
  } else {
    next();
  }
});

const Profile = mongoose.model('Profile', profileSchema);

const matchSchema = new mongoose.Schema({
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
    enum: ['request-play', 'accept-play', 'decline-play', 'request-finish', 'accept-finish', 'decline-finish']
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

const Match = mongoose.model('Match', matchSchema);

module.exports = { Profile, Match };
