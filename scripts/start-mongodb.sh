#!/bin/bash

echo "Starting MongoDB with Docker Compose..."
docker-compose up mongodb -d

echo "Waiting for MongoDB to be ready..."
sleep 10

echo "MongoDB is running!"
echo "Connection string: mongodb://admin:password123@localhost:27017/assistant_aggregator?authSource=admin"
echo ""
echo "You can now start the application with:"
echo "npm run start:dev"
