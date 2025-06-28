import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  // 🧍 Players
  challenger: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true }, // Player A
  opponent: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },   // Player B

  // 📅 Challenge lifecycle
  challengeSentAt: { type: Date, required: true },                    // When Player A sent the challenge
  challengeAcceptedAt: { type: Date, default: null },                 // When Player B accepted (null if expired)

  // 🏸 Score (always 1 game to 21)
  score: {
    challenger: { type: Number, min: 0, max: 21 },
    opponent: { type: Number, min: 0, max: 21 }
  },

  // ✅ Match flow and outcome
  status: {
    type: String,
    enum: ['pending', 'verified', 'disputed', 'rejected', 'expired'], // 'pending' = waiting for Player B, 'verified' = agreed score, 'disputed' = both disagreed, 'rejected' = challenge rejected, 'expired' = challenge expired
    default: 'pending'
  },

  // 📤 Who entered what
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },    // Always challenger (Player A)
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', default: null },    // Player B if they verify
  disputedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', default: null },    // Player B if they dispute

  // 📌 Score timestamps
  scoreSubmittedAt: { type: Date, default: null },
  verifiedAt: { type: Date, default: null },
  updatedAt: { type: Date, default: Date.now },

  // ⚠️ Red flag tracking for disputed matches
  redFlagChallenger: { type: Boolean, default: false },
  redFlagOpponent: { type: Boolean, default: false },

  disputedScore: {
    challenger: { type: Number, min: 0, max: 21 },
    opponent: { type: Number, min: 0, max: 21 }
  },
  disputeReason: { type: String, default: null },
  disputeComment: { type: String, default: null },
  disputeState: {
    type: String,
    enum: ['none', 'pending-opponent', 'pending-challenger', 'disputed', 'verified'],
    default: 'none',
    description: 'Tracks the current state of the dispute flow.'
  },
  disputedAt: { type: Date, default: null },
  disputeHistory: [{
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
    at: { type: Date },
    action: { type: String },
    score: { challenger: Number, opponent: Number },
    reason: { type: String },
    comment: { type: String }
  }]
});

// Ensure updatedAt always updates
matchSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Unique index: only one pending match per challenger
matchSchema.index(
  { challenger: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

export default mongoose.models.Match || mongoose.model('Match', matchSchema); 