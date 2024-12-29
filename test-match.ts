import axios from 'axios';
import readline from 'readline';

const API_URL = 'http://localhost:3000/api';

interface Profile {
  username: string;
  name: string;
  dob: string;
  sex: 'M' | 'F';
}


// Test profiles
const profiles: Profile[] = [
  {
    username: 'player1',
    name: 'Player One',
    dob: '1990-01-01',
    sex: 'M'
  },
  {
    username: 'player2',
    name: 'Player Two',
    dob: '1992-02-02',
    sex: 'F'
  },
  {
    username: 'player3',
    name: 'Player Three',
    dob: '1995-03-03',
    sex: 'M'
  }
];

async function createProfile(profile: Profile) {
  try {
    const response = await axios.post(`${API_URL}/profile/create`, profile);
    console.log(`✓ Created profile: ${profile.username}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      console.log(`Profile ${profile.username} already exists`);
    } else {
      console.error(`✗ Failed to create profile ${profile.username}:`, error);
    }
  }
}

async function confirmDatabaseCleanup(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('\n⚠️  WARNING: This script will delete all profiles and matches multiple times. Continue? (y/N) ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

async function cleanDatabase() {
  try {
    const response = await axios.post(`${API_URL}/profile/clean-db`);
    if (response.data.success) {
      console.log('✓ Database cleaned successfully');
    }
  } catch (error) {
    console.error('Failed to clean database:', error);
    process.exit(1);
  }
}

type MatchStatus = 'start-req' | 'start-acc' | 'start-rej' | 'finish-req' | 'finish-acc' | 'finish-rej';

interface MatchRequest {
  challenger: string;
  opponent: string;
  challenger_score?: number;
  opponent_score?: number;
}

// Helper function to transition to a desired state
async function transitionToState(
  matchRequest: MatchRequest,
  targetState: MatchStatus
): Promise<void> {
  const baseRequest = {
    challenger: matchRequest.challenger,
    opponent: matchRequest.opponent,
  };

  switch (targetState) {
    case 'start-req':
      await axios.post(`${API_URL}/match/start-req`, baseRequest);
      break;
    case 'start-acc':
      await transitionToState(matchRequest, 'start-req');
      await axios.post(`${API_URL}/match/start-acc`, baseRequest);
      break;
    case 'start-rej':
      await transitionToState(matchRequest, 'start-req');
      await axios.post(`${API_URL}/match/start-rej`, baseRequest);
      break;
    case 'finish-req':
      await transitionToState(matchRequest, 'start-acc');
      await axios.post(`${API_URL}/match/finish-req`, {
        ...baseRequest,
        challenger_score: 21,
        opponent_score: 15,
      });
      break;
    case 'finish-acc':
      await transitionToState(matchRequest, 'finish-req');
      await axios.post(`${API_URL}/match/finish-acc`, baseRequest);
      break;
    case 'finish-rej':
      await transitionToState(matchRequest, 'finish-req');
      await axios.post(`${API_URL}/match/finish-rej`, baseRequest);
      break;
  }
}

// Global test results
let totalTests = 0;
let successfulTests = 0;
let failedTests = 0;
let expectedSuccesses = 0;
let expectedFailures = 0;

async function testStateTransition(
  matchRequest: MatchRequest,
  fromState: MatchStatus,
  toState: MatchStatus,
  shouldSucceed: boolean
): Promise<void> {
  try {
    await cleanDatabase();
    for (const profile of profiles) {
      await createProfile(profile);
    }
    
    await transitionToState(matchRequest, fromState);
    
    const endpoint = `${API_URL}/match/${toState}`;
    const payload = toState === 'finish-req' 
      ? { ...matchRequest, challenger_score: 21, opponent_score: 15 }
      : matchRequest;

    totalTests++;
    try {
      await axios.post(endpoint, payload);
      if (shouldSucceed) {
        console.log(`✓ Successfully transitioned from ${fromState} to ${toState}`);
        successfulTests++;
        expectedSuccesses++;
      } else {
        console.log(`✗ Transition from ${fromState} to ${toState} should have failed but succeeded`);
        failedTests++;
      }
    } catch (error) {
      if (!shouldSucceed) {
        console.log(`✓ Correctly rejected transition from ${fromState} to ${toState}`);
        successfulTests++;
        expectedFailures++;
      } else {
        console.log(`✗ Transition from ${fromState} to ${toState} should have succeeded but failed`);
        failedTests++;
      }
    }
  } catch (error) {
    console.error(`Error testing transition from ${fromState} to ${toState}:`, error);
    failedTests++;
    totalTests++;
  }
}

async function testAllTransitions() {
  const states: MatchStatus[] = ['start-req', 'start-acc', 'start-rej', 'finish-req', 'finish-acc', 'finish-rej'];
  const validTransitions = {
    'start-req': ['start-acc', 'start-rej'],
    'start-acc': ['finish-req'],
    'start-rej': ['start-req'],
    'finish-req': ['finish-acc', 'finish-rej'],
    'finish-acc': ['start-req'],
    'finish-rej': ['start-req']
  };

  const matchRequest: MatchRequest = {
    challenger: 'player1',
    opponent: 'player2'
  };

  console.log('\n=== Testing All State Transitions ===');
  
  for (const fromState of states) {
    for (const toState of states) {
      const isValid = validTransitions[fromState]?.includes(toState);
      console.log(`\nTesting ${fromState} -> ${toState} (Should ${isValid ? 'succeed' : 'fail'})`);
      await testStateTransition(matchRequest, fromState, toState, isValid);
    }
  }

  // Log test results summary
  console.log('\n=== Test Results Summary ===');
  console.log(`Total tests run: ${totalTests}`);
  console.log(`Tests succeeded: ${successfulTests}/${totalTests}`);
  console.log(`Tests failed: ${failedTests}/${totalTests}`);
  console.log(`Expected successes: ${expectedSuccesses}`);
  console.log(`Expected failures: ${expectedFailures}`);
}

// Update the main function
async function testMatchFlow() {
  try {
    const confirmed = await confirmDatabaseCleanup();
    if (!confirmed) {
      console.log('Test cancelled');
      process.exit(0);
    }
    
    await testAllTransitions();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Test failed:', error.response?.data || error.message);
    } else {
      console.error('Test failed:', error);
    }
  }
}

// Run the tests
testMatchFlow(); 
