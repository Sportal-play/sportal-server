#!/bin/bash

# Define the API endpoint
API_URL="http://localhost:3000/api/profile"

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Process command line arguments
CLEAN_DB=false
while getopts "c" opt; do
  case $opt in
    c)
      CLEAN_DB=true
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
  esac
done

# Database cleanup confirmation and execution
if [ "$CLEAN_DB" = true ]; then
    echo -e "${YELLOW}WARNING: This will delete all existing profiles from the database.${NC}"
    echo -e "${YELLOW}Are you sure you want to continue? [y/N]${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])+$ ]]; then
        echo "Cleaning database..."
        CLEAN_RESPONSE=$(curl -s -X POST "${API_URL}/clean-db")
        if echo "$CLEAN_RESPONSE" | jq -e '.success' > /dev/null; then
            echo -e "${GREEN}Database cleaned successfully${NC}"
        else
            echo -e "${RED}Failed to clean database${NC}"
            exit 1
        fi
    else
        echo "Database cleanup cancelled"
        exit 0
    fi
fi

# Function to print section headers
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Function to validate profile structure
validate_profile() {
    local PROFILE="$1"
    local ERROR=0
    
    # Check required fields exist and have correct types
    if ! echo "$PROFILE" | jq -e '.username | type == "string"' > /dev/null; then
        echo -e "${RED}Error: username must be a string${NC}"
        ERROR=1
    fi
    if ! echo "$PROFILE" | jq -e '.name | type == "string"' > /dev/null; then
        echo -e "${RED}Error: name must be a string${NC}"
        ERROR=1
    fi
    if ! echo "$PROFILE" | jq -e '.sex | test("^[MF]$")' > /dev/null; then
        echo -e "${RED}Error: sex must be 'M' or 'F'${NC}"
        ERROR=1
    fi
    
    # Validate protected fields have correct default values for new profiles
    if echo "$PROFILE" | jq -e '.rating != 1500' > /dev/null; then
        echo -e "${RED}Error: rating must be 1500${NC}"
        ERROR=1
    fi
    if echo "$PROFILE" | jq -e '.ratingDeviation != 350' > /dev/null; then
        echo -e "${RED}Error: ratingDeviation must be 350${NC}"
        ERROR=1
    fi
    if echo "$PROFILE" | jq -e '.volatility != 0.06' > /dev/null; then
        echo -e "${RED}Error: volatility must be 0.06${NC}"
        ERROR=1
    fi
    if echo "$PROFILE" | jq -e '.wins != 0' > /dev/null; then
        echo -e "${RED}Error: wins must be 0${NC}"
        ERROR=1
    fi
    if echo "$PROFILE" | jq -e '.loss != 0' > /dev/null; then
        echo -e "${RED}Error: loss must be 0${NC}"
        ERROR=1
    fi
    
    return $ERROR
}

# Test 1: Valid Profile Creation
print_header "Test 1: Valid Profile Creation"
VALID_PROFILE='{
    "username": "johndoe",
    "name": "John Doe",
    "dob": "1990-01-01",
    "sex": "M"
}'

echo "Sending valid profile data:"
echo "$VALID_PROFILE" | json_pp

RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$VALID_PROFILE" \
    "${API_URL}/create")

echo -e "\nResponse received:"
echo "$RESPONSE" | json_pp

validate_profile "$RESPONSE"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Valid profile creation test passed${NC}"
else
    echo -e "${RED}✗ Valid profile creation test failed${NC}"
fi

# Test 2: Invalid Profile Creation (wrong sex value)
print_header "Test 2: Invalid Profile Creation"
INVALID_PROFILE='{
    "username": "janedoe",
    "name": "Jane Doe",
    "dob": "1990-01-01",
    "sex": "X"
}'

echo "Sending invalid profile data:"
echo "$INVALID_PROFILE" | json_pp

RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$INVALID_PROFILE" \
    "${API_URL}/create")

echo -e "\nResponse received:"
echo "$RESPONSE" | json_pp
if echo "$RESPONSE" | jq -e '.error' > /dev/null; then
    echo -e "${GREEN}✓ Invalid profile rejection test passed${NC}"
else
    echo -e "${RED}✗ Invalid profile rejection test failed${NC}"
fi

# Test 3: Attempt to create profile with protected fields
print_header "Test 3: Protected Fields Test"
PROTECTED_FIELDS_PROFILE='{
    "username": "hackerman",
    "name": "Hacker Man",
    "dob": "1990-01-01",
    "sex": "M",
    "rating": 2000,
    "wins": 100,
    "loss": 0
}'

echo "Sending profile with protected fields:"
echo "$PROTECTED_FIELDS_PROFILE" | json_pp

RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$PROTECTED_FIELDS_PROFILE" \
    "${API_URL}/create")

echo -e "\nResponse received:"
echo "$RESPONSE" | json_pp

validate_profile "$RESPONSE"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Protected fields test passed${NC}"
else
    echo -e "${RED}✗ Protected fields test failed${NC}"
fi

# Test 4: Get Profile
print_header "Test 4: Get Profile Test"
GET_RESPONSE=$(curl -s "${API_URL}/get?username=johndoe")

echo "GET Response:"
echo "$GET_RESPONSE" | json_pp

validate_profile "$GET_RESPONSE"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Get profile test passed${NC}"
else
    echo -e "${RED}✗ Get profile test failed${NC}"
fi

# Test 5: Get Non-existent Profile
print_header "Test 5: Get Non-existent Profile Test"
GET_RESPONSE=$(curl -s "${API_URL}/get?username=nonexistent")

echo "GET Response:"
echo "$GET_RESPONSE" | json_pp

if echo "$GET_RESPONSE" | jq -e '.error' > /dev/null; then
    echo -e "${GREEN}✓ Non-existent profile test passed${NC}"
else
    echo -e "${RED}✗ Non-existent profile test failed${NC}"
fi

# Test 6: Update Profile (valid fields)
print_header "Test 6: Valid Profile Update Test"
UPDATE_DATA='{
    "name": "John Doe Updated"
}'

echo "Sending update data:"
echo "$UPDATE_DATA" | json_pp

RESPONSE=$(curl -s -X PUT \
    -H "Content-Type: application/json" \
    -d "$UPDATE_DATA" \
    "${API_URL}/update?username=johndoe")

echo -e "\nResponse received:"
echo "$RESPONSE" | json_pp

if echo "$RESPONSE" | jq -e '.name == "John Doe Updated"' > /dev/null; then
    echo -e "${GREEN}✓ Valid update test passed${NC}"
else
    echo -e "${RED}✗ Valid update test failed${NC}"
fi

# Test 7: Update Profile (protected fields)
print_header "Test 7: Protected Fields Update Test"
PROTECTED_UPDATE='{
    "rating": 2000,
    "wins": 100
}'

echo "Sending protected fields update:"
echo "$PROTECTED_UPDATE" | json_pp

RESPONSE=$(curl -s -X PUT \
    -H "Content-Type: application/json" \
    -d "$PROTECTED_UPDATE" \
    "${API_URL}/update?username=johndoe")

echo -e "\nResponse received:"
echo "$RESPONSE" | json_pp

if echo "$RESPONSE" | jq -e '.error' > /dev/null; then
    echo -e "${GREEN}✓ Protected fields update rejection test passed${NC}"
else
    echo -e "${RED}✗ Protected fields update rejection test failed${NC}"
fi

# Test 8: Attempt to create duplicate profile
print_header "Test 8: Duplicate Profile Creation Test"
DUPLICATE_PROFILE='{
    "username": "johndoe",
    "name": "John Doe Clone",
    "dob": "1995-01-01",
    "sex": "M"
}'

echo "Attempting to create duplicate profile:"
echo "$DUPLICATE_PROFILE" | json_pp

RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$DUPLICATE_PROFILE" \
    "${API_URL}/create")

echo -e "\nResponse received:"
echo "$RESPONSE" | json_pp

if echo "$RESPONSE" | jq -e '.error | contains("duplicate key")' > /dev/null; then
    echo -e "${GREEN}✓ Duplicate profile rejection test passed${NC}"
else
    echo -e "${RED}✗ Duplicate profile rejection test failed${NC}"
fi

echo -e "\n${BLUE}=== Test Summary ===${NC}"
echo "Run all tests and check for any failures above" 