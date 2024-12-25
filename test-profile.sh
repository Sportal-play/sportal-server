#!/bin/bash

# Define the API endpoint
API_URL="http://localhost:3000/api/profile"

# Sample profile data
PROFILE_DATA='{
    "username": "johndoe",
    "name": "John Doe",
    "dob": "1990-01-01",
    "sex": "M",
    "rating": 1500,
    "rd": 350.0,
    "rv": 0.06
}'

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Testing Profile Creation API..."
echo "Sending profile data:"
echo "$PROFILE_DATA" | json_pp

# Send POST request to create profile
RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$PROFILE_DATA" \
    "${API_URL}/create")

# Check if curl command was successful
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}Response received:${NC}"
    echo "$RESPONSE" | json_pp
else
    echo -e "\n${RED}Error: Failed to connect to the server${NC}"
    exit 1
fi

# Verify profile was created by trying to get it
echo -e "\nVerifying profile creation..."
GET_RESPONSE=$(curl -s "${API_URL}/get?username=johndoe")

if [ $? -eq 0 ]; then
    echo -e "${GREEN}GET Response:${NC}"
    echo "$GET_RESPONSE" | json_pp
else
    echo -e "${RED}Error: Failed to verify profile creation${NC}"
    exit 1
fi 