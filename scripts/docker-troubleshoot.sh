#!/bin/bash

# Docker Compose Troubleshooting Script for Assistant Aggregator Backend
# This script provides alternative solutions if the main docker-compose fails

echo "=== Docker Compose Troubleshooting ==="
echo

# Function to check network connectivity
check_connectivity() {
    echo "1. Checking network connectivity..."
    
    echo "   - Testing DNS resolution for docker.io..."
    if nslookup registry-1.docker.io > /dev/null 2>&1; then
        echo "     ✓ DNS resolution working"
    else
        echo "     ✗ DNS resolution failed"
    fi
    
    echo "   - Testing connectivity to Docker Hub..."
    if curl -s --connect-timeout 10 https://registry-1.docker.io/v2/ > /dev/null; then
        echo "     ✓ Docker Hub accessible"
    else
        echo "     ✗ Docker Hub not accessible"
    fi
    
    echo
}

# Function to pull images individually
pull_images_individually() {
    echo "2. Pulling Docker images individually..."
    
    images=("mongo:7.0" "minio/minio:latest" "elasticsearch:8.11.0")
    
    for image in "${images[@]}"; do
        echo "   - Pulling $image..."
        if docker pull "$image"; then
            echo "     ✓ Successfully pulled $image"
        else
            echo "     ✗ Failed to pull $image"
        fi
    done
    
    echo
}

# Function to start services in stages
start_services_staged() {
    echo "3. Starting services in stages..."
    
    echo "   - Stage 1: Starting MongoDB..."
    docker compose up -d mongodb
    sleep 10
    
    echo "   - Stage 2: Starting MinIO..."
    docker compose up -d minio
    sleep 10
    
    echo "   - Stage 3: Starting Elasticsearch..."
    docker compose up -d elasticsearch
    sleep 15
    
    echo "   - Stage 4: Starting Application..."
    docker compose up -d app
    
    echo
}

# Function to use alternative Elasticsearch image
use_alternative_elasticsearch() {
    echo "4. Alternative: Using OpenSearch instead of Elasticsearch..."
    
    # Create a backup of the original docker-compose.yml
    cp docker-compose.yml docker-compose.yml.backup
    
    # Create alternative docker-compose with OpenSearch
    cat > docker-compose.opensearch.yml << 'EOF'
services:
  mongodb:
    image: mongo:7.0
    container_name: assistant-aggregator-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: assistant_aggregator
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init:/docker-entrypoint-initdb.d
    networks:
      - assistant-aggregator-network

  minio:
    image: minio/minio:latest
    container_name: assistant-aggregator-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
      MINIO_DEFAULT_BUCKETS: assistant-aggregator,documents,images,uploads
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    networks:
      - assistant-aggregator-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  opensearch:
    image: opensearchproject/opensearch:2.11.0
    container_name: assistant-aggregator-opensearch
    restart: unless-stopped
    environment:
      - cluster.name=assistant-aggregator-cluster
      - node.name=opensearch
      - discovery.type=single-node
      - bootstrap.memory_lock=true
      - "OPENSEARCH_JAVA_OPTS=-Xms1g -Xmx1g"
      - "DISABLE_INSTALL_DEMO_CONFIG=true"
      - "DISABLE_SECURITY_PLUGIN=true"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    ports:
      - "9200:9200"
      - "9600:9600"
    volumes:
      - opensearch_data:/usr/share/opensearch/data
    networks:
      - assistant-aggregator-network
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5

  app:
    build: .
    container_name: assistant-aggregator-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:password123@mongodb:27017/assistant_aggregator?authSource=admin
      - MINIO_ENDPOINT=minio
      - MINIO_PORT=9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin123
      - MINIO_USE_SSL=false
      - MINIO_BUCKET_NAME=assistant-aggregator
      - ELASTICSEARCH_NODE=http://opensearch:9200
      - ELASTICSEARCH_INDEX_PREFIX=assistant_aggregator
    depends_on:
      - mongodb
      - minio
      - opensearch
    networks:
      - assistant-aggregator-network
    volumes:
      - .:/usr/src/app
      - /usr/src/app/node_modules

volumes:
  mongodb_data:
  minio_data:
  opensearch_data:

networks:
  assistant-aggregator-network:
    driver: bridge
    driver_opts:
      com.docker.network.driver.mtu: 1450
EOF
    
    echo "   - Created docker-compose.opensearch.yml as alternative"
    echo "   - To use OpenSearch: docker compose -f docker-compose.opensearch.yml up -d"
    echo
}

# Function to configure Docker daemon for better connectivity
configure_docker_daemon() {
    echo "5. Docker daemon configuration suggestions..."
    
    echo "   - Add these settings to /etc/docker/daemon.json:"
    cat << 'EOF'
{
  "registry-mirrors": [
    "https://mirror.gcr.io"
  ],
  "dns": ["8.8.8.8", "8.8.4.4"],
  "max-concurrent-downloads": 3,
  "max-concurrent-uploads": 3
}
EOF
    echo "   - Then restart Docker: sudo systemctl restart docker"
    echo
}

# Main execution
main() {
    echo "Choose an option:"
    echo "1. Run connectivity checks"
    echo "2. Pull images individually"
    echo "3. Start services in stages"
    echo "4. Create OpenSearch alternative"
    echo "5. Show Docker daemon config suggestions"
    echo "6. Run full troubleshooting sequence"
    echo
    
    read -p "Enter option (1-6): " option
    
    case $option in
        1) check_connectivity ;;
        2) pull_images_individually ;;
        3) start_services_staged ;;
        4) use_alternative_elasticsearch ;;
        5) configure_docker_daemon ;;
        6) 
            check_connectivity
            pull_images_individually
            start_services_staged
            use_alternative_elasticsearch
            configure_docker_daemon
            ;;
        *) echo "Invalid option" ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
