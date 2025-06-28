const { Glicko2 } = require('glicko2');

/**
 * @typedef {Object} PlayerRating
 * @property {number} rating
 * @property {number} ratingDeviation
 * @property {number} volatility
 */

const settings = {
  tau: 0.75,
  rating: 1500,
  rd: 350,
  vol: 0.06
};

const ranking = new Glicko2(settings);

/**
 * @param {PlayerRating} challenger
 * @param {PlayerRating} opponent
 * @param {boolean} challengerWon
 * @returns {{challenger: PlayerRating, opponent: PlayerRating}}
 */
function updatePlayerRatings(challenger, opponent, challengerWon) {
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
  ranking.updateRatings([[challengerPlayer, opponentPlayer, challengerWon ? 1 : 0]]);
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