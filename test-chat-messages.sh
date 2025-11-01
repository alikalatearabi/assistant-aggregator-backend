#!/bin/bash
# =====================================================
# Curl commands for testing /chats/chat-messages API
# =====================================================

# Replace these with your actual values:
BASE_URL="${BASE_URL:-http://localhost:3000}"
API_KEY="${API_KEY:-sk_9c30f5fd1bd5b69db561a4de84ca2b64bed7f89e2b1894da}"
VALID_USER_ID="${VALID_USER_ID:-68f7fe616ae7c25ddea0c4ea}"
INVALID_USER_ID="INVALID_USER"

echo "==========================================="
echo "Testing /chats/chat-messages API"
echo "Base URL: ${BASE_URL}"
echo "==========================================="

echo ""
echo "1. Testing with INVALID user ID format (INVALID_USER)"
echo "Expected: 401 - Invalid user ID format"
curl -X POST ${BASE_URL}/chats/chat-messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${API_KEY}" \
  -w "\nHTTP Status: %{http_code}\n" \
  -d '{
    "query": "سلام",
    "inputs": {},
    "user": "INVALID_USER"
  }'

echo ""
echo "==========================================="
echo "2. Testing with valid user ID"
echo "Expected: 200 or internal error"
curl -X POST ${BASE_URL}/chats/chat-messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${API_KEY}" \
  -w "\nHTTP Status: %{http_code}\n" \
  -d '{
    "query": "سلام",
    "inputs": {
      "similarityThreshold": "0.10",
      "contextCount": 6
    },
    "think_level": "standard",
    "user": "'${VALID_USER_ID}'"
  }'

echo ""
echo "==========================================="
echo "3. Testing with non-existent but valid ObjectId"
echo "Expected: 401 - User does not exist"
curl -X POST ${BASE_URL}/chats/chat-messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${API_KEY}" \
  -w "\nHTTP Status: %{http_code}\n" \
  -d '{
    "query": "سلام",
    "inputs": {
      "similarityThreshold": "0.10",
      "contextCount": 6
    },
    "think_level": "standard",
    "user": "507f1f77bcf86cd799439999"
  }'

echo ""
echo "==========================================="
echo "4. Testing with missing API key"
echo "Expected: 401 - API key is missing"
curl -X POST ${BASE_URL}/chats/chat-messages \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -d '{
    "query": "سلام",
    "inputs": {
      "similarityThreshold": "0.10",
      "contextCount": 6
    },
    "think_level": "standard",
    "user": "'${VALID_USER_ID}'"
  }'

echo ""
echo "==========================================="
