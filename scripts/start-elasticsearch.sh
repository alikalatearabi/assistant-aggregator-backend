#!/bin/bash

echo "Starting Elasticsearch with Docker Compose..."
docker-compose up elasticsearch -d

echo "Waiting for Elasticsearch to be ready..."
sleep 15

echo "Elasticsearch is running!"
echo "API Endpoint: http://localhost:9200"
echo "Cluster Health: http://localhost:9200/_cluster/health"
echo ""
echo "Testing connection..."
curl -s http://localhost:9200/_cluster/health?pretty

echo ""
echo "You can now start the application with:"
echo "npm run start:dev"
