import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  redFlagCount: { type: Number, default: 0 },
  disputeHistory: [{
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
    date: { type: Date },
    asChallenger: { type: Boolean },
    asOpponent: { type: Boolean }
  }],
});

export default mongoose.models.Profile || mongoose.model('Profile', profileSchema); 