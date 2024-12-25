const { Glicko2 } = require('glicko2');

const settings = {
  tau: 0.75,          // Rate volatility constraint
  rating: 1500,      // Default rating
  rd: 350,          // Default rating deviation
  vol: 0.06         // Default volatility
};

const ranking = new Glicko2(settings);

function updatePlayerRatings(challenger, opponent, challengerWon) {
  // Create Glicko-2 players with their current ratings
  const challengerPlayer = ranking.makePlayer(
    challenger.rating || settings.rating,
    challenger.ratingDeviation || settings.rd,
    challenger.volatility || settings.vol
  );
  
  const opponentPlayer = ranking.makePlayer(
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

module.exports = {
  settings,
  updatePlayerRatings
}; 