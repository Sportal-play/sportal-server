const { settings, updatePlayerRatings } = require('./services/ratingService');

// Helper function to format player stats
function formatPlayerStats(label, stats) {
  console.log(`${label}:`);
  console.log(`  Rating: ${stats.rating}`);
  console.log(`  Rating Deviation: ${stats.ratingDeviation}`);
  console.log(`  Volatility: ${stats.volatility.toFixed(6)}`);
}

// Test function to simulate matches and rating updates
function testRatingCalculation() {
  // Test Case 1: Two new players, challenger wins
  console.log('\nTest Case 1: New players, challenger wins');
  const player1 = {
    rating: settings.rating,
    ratingDeviation: settings.rd,
    volatility: settings.vol
  };
  const player2 = {
    rating: settings.rating,
    ratingDeviation: settings.rd,
    volatility: settings.vol
  };
  
  const result1 = updatePlayerRatings(player1, player2, true);
  formatPlayerStats('Challenger new stats', result1.challenger);
  formatPlayerStats('Opponent new stats', result1.opponent);

  // Test Case 2: Higher rated player wins against lower rated
  console.log('\nTest Case 2: Higher rated wins against lower rated');
  const strongerPlayer = {
    rating: 1000,
    ratingDeviation: 80,
    volatility: 0.06
  };
  const weakerPlayer = {
    rating: 1500,
    ratingDeviation: 350,
    volatility: 0.06
  };
  
  const result2 = updatePlayerRatings(strongerPlayer, weakerPlayer, true);
  formatPlayerStats('Stronger player new stats', result2.challenger);
  formatPlayerStats('Weaker player new stats', result2.opponent);

  // Test Case 3: Upset - Lower rated player wins against higher rated
  console.log('\nTest Case 3: Upset - Lower rated wins against higher rated');
  const result3 = updatePlayerRatings(weakerPlayer, strongerPlayer, true);
  formatPlayerStats('Weaker player new stats', result3.challenger);
  formatPlayerStats('Stronger player new stats', result3.opponent);
}

// Run the tests
testRatingCalculation(); 