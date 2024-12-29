import { Glicko2, Player } from 'glicko2';
import { PlayerRating, RatingResult } from '../types/models';

interface Settings {
  tau: number;
  rating: number;
  rd: number;
  vol: number;
}

const settings: Settings = {
  tau: 0.75,
  rating: 1500,
  rd: 350,
  vol: 0.06
};

const ranking = new Glicko2(settings);

function updatePlayerRatings(
  challenger: PlayerRating,
  opponent: PlayerRating,
  challengerWon: boolean
): RatingResult {
  const challengerPlayer: Player = ranking.makePlayer(
    challenger.rating || settings.rating,
    challenger.ratingDeviation || settings.rd,
    challenger.volatility || settings.vol
  );
  
  const opponentPlayer: Player = ranking.makePlayer(
    opponent.rating || settings.rating,
    opponent.ratingDeviation || settings.rd,
    opponent.volatility || settings.vol
  );
  
  // Update ratings based on match result
  ranking.updateRatings([[challengerPlayer, opponentPlayer, challengerWon ? 1 : 0]]);
  
  // Return updated ratings
  return {
    challenger: {
      rating: challengerPlayer.getRating(),
      ratingDeviation: challengerPlayer.getRd(),
      volatility: challengerPlayer.getVol()
    },
    opponent: {
      rating: opponentPlayer.getRating(),
      ratingDeviation: opponentPlayer.getRd(),
      volatility: opponentPlayer.getVol()
    }
  };
}

export {
  settings,
  updatePlayerRatings,
  Settings,
}; 