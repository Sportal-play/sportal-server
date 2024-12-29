import { Document, Types } from 'mongoose';

export interface IProfile extends Document {
  username: string;
  name: string;
  dob: Date;
  sex: 'M' | 'F';
  rating: number;
  ratingDeviation: number;
  volatility: number;
  wins: number;
  loss: number;
  num_unverified_matches: number;
  created_at: Date;
  updated_at: Date;
}

export interface IMatch extends Document {
  challenger: Types.ObjectId | IProfile;
  opponent: Types.ObjectId | IProfile;
  status: 'start-req' | 'start-acc' | 'start-rej' | 'finish-req' | 'finish-acc' | 'finish-rej';
  time_accept_play?: Date;
  time_finish?: Date;
  challenger_score?: number;
  opponent_score?: number;
}

export interface PlayerRating {
  rating: number;
  ratingDeviation: number;
  volatility: number;
}

export interface RatingResult {
  challenger: PlayerRating;
  opponent: PlayerRating;
} 