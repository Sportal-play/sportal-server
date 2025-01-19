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

async function confirmLongTest(testName: string, duration: number): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`\n⚠️  ${testName} will take ${duration} minutes to complete. Run this test? (y/N) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

async function testAutoRejectStartRequest() {
  console.log('\n=== Testing Auto-Rejection of Start Request ===');

  try {
    await cleanDatabase();
    for (const profile of profiles) {
      await createProfile(profile);
    }

    const matchRequest: MatchRequest = {
      challenger: 'player1',
      opponent: 'player2'
    };

    console.log('Creating start request...');
    await axios.post(`${API_URL}/match/start-req`, matchRequest);

    console.log(`Connecting to ws wait endpoint ${API_URL}/match/ws/start-req/player2`);
    // TODO here

    console.log('Waiting for auto-rejection (2 minutes + buffer)...');
    await new Promise(resolve => setTimeout(resolve, 2.1 * 60 * 1000));

    // Get all matches for the challenger
    const response = await axios.get(`${API_URL}/match/find-matches`, {
      params: {
        challenger: matchRequest.challenger,
        opponent: matchRequest.opponent,
      }
    });

    // Check if any match between these players is still in 'start-req' status
    const activeStartRequests = response.data.filter((match: any) =>
      match.status === 'start-req' &&
      ((match.challenger.username === matchRequest.challenger && match.opponent.username === matchRequest.opponent) ||
        (match.challenger.username === matchRequest.opponent && match.opponent.username === matchRequest.challenger))
    );

    if (activeStartRequests.length === 0) {
      console.log('✓ No active start requests found after timeout');
      successfulTests++;
    } else {
      console.log('✗ Found active start requests after timeout');
      failedTests++;
    }

  } catch (error) {
    console.error('Error testing auto-rejection:', error);
    failedTests++;
  }
  totalTests++;
}

async function testAutoRejectFinishRequest() {
  console.log('\n=== Testing Auto-Rejection of Finish Request ===');

  try {
    await cleanDatabase();
    for (const profile of profiles) {
      await createProfile(profile);
    }

    const matchRequest: MatchRequest = {
      challenger: 'player1',
      opponent: 'player2'
    };

    await axios.post(`${API_URL}/match/start-req`, matchRequest);
    await axios.post(`${API_URL}/match/start-acc`, matchRequest);
    await axios.post(`${API_URL}/match/finish-req`, {
      ...matchRequest,
      challenger_score: 21,
      opponent_score: 15,
    });

    console.log('Waiting for auto-rejection (5 minutes + buffer)...');
    await new Promise(resolve => setTimeout(resolve, 5.1 * 60 * 1000));

    // Get all matches for the challenger
    const response = await axios.get(`${API_URL}/match/find-matches`, {
      params: {
        challenger: matchRequest.challenger,
        opponent: matchRequest.opponent,
      }
    });

    // Check if any match between these players is still in 'finish-req' status
    const activeFinishRequests = response.data.filter((match: any) =>
      match.status === 'finish-req' &&
      ((match.challenger.username === matchRequest.challenger && match.opponent.username === matchRequest.opponent) ||
        (match.challenger.username === matchRequest.opponent && match.opponent.username === matchRequest.challenger))
    );

    if (activeFinishRequests.length === 0) {
      console.log('✓ No active finish requests found after timeout');
      successfulTests++;
    } else {
      console.log('✗ Found active finish requests after timeout');
      failedTests++;
    }

  } catch (error) {
    console.error('Error testing auto-rejection:', error);
    failedTests++;
  }
  totalTests++;
}

async function testGetMatchById() {
  console.log('\n=== Testing Get Match By ID ===');

  try {
    await cleanDatabase();
    for (const profile of profiles) {
      await createProfile(profile);
    }

    const matchRequest: MatchRequest = {
      challenger: 'player1',
      opponent: 'player2'
    };

    // Create a match and get its ID
    const createResponse = await axios.post(`${API_URL}/match/start-req`, matchRequest);
    const matchId = createResponse.data._id;

    // Test 1: Valid match ID
    try {
      await axios.get(`${API_URL}/match/get-by-id`, {
        params: { matchId }
      });
      console.log('✓ Successfully retrieved match by ID');
      successfulTests++;
    } catch (error) {
      console.log('✗ Failed to retrieve match by ID');
      failedTests++;
    }

    // Test 2: Invalid match ID format
    try {
      await axios.get(`${API_URL}/match/get-by-id`, {
        params: { matchId: 'invalid-id' }
      });
      console.log('✗ Should reject invalid match ID format');
      failedTests++;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        console.log('✓ Correctly rejected invalid match ID format');
        successfulTests++;
      } else {
        throw error;
      }
    }

    // Test 3: Non-existent match ID
    try {
      await axios.get(`${API_URL}/match/get-by-id`, {
        params: { matchId: '507f1f77bcf86cd799439011' }
      });
      console.log('✗ Should reject non-existent match ID');
      failedTests++;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log('✓ Correctly rejected non-existent match ID');
        successfulTests++;
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('Error testing get match by ID:', error);
    failedTests++;
  }
  totalTests += 3;
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
    await testGetMatchById();

    // Add confirmations for long-running tests
    const runStartReject = await confirmLongTest('Auto-reject start request test', 2);
    if (runStartReject) {
      await testAutoRejectStartRequest();
    } else {
      console.log('Skipping auto-reject start request test');
    }

    const runFinishReject = await confirmLongTest('Auto-reject finish request test', 5);
    if (runFinishReject) {
      await testAutoRejectFinishRequest();
    } else {
      console.log('Skipping auto-reject finish request test');
    }

    // Log final test results
    console.log('\n=== Final Test Results ===');
    console.log(`Total tests run: ${totalTests}`);
    console.log(`Tests succeeded: ${successfulTests}/${totalTests}`);
    console.log(`Tests failed: ${failedTests}/${totalTests}`);
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
