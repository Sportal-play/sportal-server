#!/bin/bash

# Create data directory if it doesn't exist
mkdir -p ./data/db

# Create logs directory if it doesn't exist
mkdir -p ./data/logs

# Kill any existing mongod process
pkill mongod

# Start MongoDB daemon with specified port
mongod --dbpath ./data/db --port 27017 --logpath ./data/logs/mongodb.log --fork

# Wait a few seconds for MongoDB to start
sleep 3

# Check if MongoDB is running
if pgrep mongod > /dev/null
then
    echo "MongoDB is running on port 27017"
    echo "Data directory: $(pwd)/data/db"
    echo "Log file: $(pwd)/data/logs/mongodb.log"
else
    echo "Failed to start MongoDB"
    cat ./data/logs/mongodb.log
    exit 1
fi 