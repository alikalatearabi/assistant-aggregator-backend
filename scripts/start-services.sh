#!/bin/bash

echo "Starting MongoDB, MinIO, and Elasticsearch services with Docker Compose..."
docker-compose up mongodb minio elasticsearch -d

echo "Waiting for services to be ready..."
sleep 20

echo "Services are running!"
echo ""
echo "MongoDB:"
echo "  Connection: mongodb://admin:password123@localhost:27017/assistant_aggregator?authSource=admin"
echo "  Port: 27017"
echo ""
echo "MinIO:"
echo "  API Endpoint: http://localhost:9000"
echo "  Console: http://localhost:9001"
echo "  Access Key: minioadmin"
echo "  Secret Key: minioadmin123"
echo ""
echo "Elasticsearch:"
echo "  API Endpoint: http://localhost:9200"
echo "  Cluster Health: http://localhost:9200/_cluster/health"
echo "  Index Prefix: assistant_aggregator"
echo ""
echo "You can now start the application with:"
echo "npm run start:dev"
