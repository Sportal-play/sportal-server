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
    required: true,
    default: 1500
  },
  rd: {
    type: Number,
    required: true,
    default: 350.0
  },
  rv: {
    type: Number,
    required: true,
    default: 0.06
  },
  wins: {
    type: Number,
    required: true,
    default: 0
  },
  loss: {
    type: Number,
    required: true,
    default: 0
  },
  num_unverified_matches: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
});

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile; 

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
