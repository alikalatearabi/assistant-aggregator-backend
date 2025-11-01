#!/bin/bash
# =====================================================
# Rate Limit Testing Script
# =====================================================

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
API_KEY="${API_KEY:-sk_9c30f5fd1bd5b69db561a4de84ca2b64bed7f89e2b1894da}"
USER_ID="${USER_ID:-690280bc8a48b3db991e4e21}"

echo "==========================================="
echo "Rate Limit Testing"
echo "Base URL: ${BASE_URL}"
echo "User ID: ${USER_ID}"
echo "==========================================="

# Test 1: Login Rate Limit
echo ""
echo "==========================================="
echo "TEST 1: Login Rate Limit"
echo "Expected: First few attempts should succeed, then 429 Too Many Requests"
echo "==========================================="
echo ""

# Get the password from the seeded user (assuming we know it)
LOGIN_EMAIL="api@company.com"
LOGIN_PASSWORD="ApiUser123!"

echo "Attempting 12 login attempts (rate limit is 10/hour)..."
for i in {1..12}; do
  echo -n "Login attempt $i: "
  response=$(curl -s -X POST ${BASE_URL}/auth/login \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"${LOGIN_EMAIL}\",
      \"password\": \"${LOGIN_PASSWORD}\"
    }" \
    -w "\nHTTP_STATUS:%{http_code}")
  
  http_code=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
  echo "Status: $http_code"
  
  if [ "$http_code" = "429" ]; then
    echo "✅ Rate limit hit! Attempt $i returned 429"
    echo ""
    echo "Response:"
    echo "$response" | grep -v "HTTP_STATUS" | jq '.' 2>/dev/null || echo "$response" | grep -v "HTTP_STATUS"
    break
  elif [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo "✅ Login successful"
  else
    echo "❌ Unexpected status: $http_code"
    echo "$response" | grep -v "HTTP_STATUS"
  fi
  
  sleep 0.5
done

# Test 2: Message Rate Limit
echo ""
echo "==========================================="
echo "TEST 2: Message Rate Limit"
echo "Expected: First few attempts should succeed, then 429 Too Many Requests"
echo "==========================================="
echo ""

echo "Attempting 52 chat messages (rate limit is 50/hour)..."
for i in {1..52}; do
  echo -n "Message attempt $i: "
  response=$(curl -s -X POST ${BASE_URL}/chats/chat-messages \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${API_KEY}" \
    -d "{
      \"query\": \"سلام - test message $i\",
      \"inputs\": {
        \"similarityThreshold\": \"0.10\",
        \"contextCount\": 6
      },
      \"think_level\": \"standard\",
      \"user\": \"${USER_ID}\",
      \"response_mode\": \"blocking\"
    }" \
    -w "\nHTTP_STATUS:%{http_code}")
  
  http_code=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
  echo "Status: $http_code"
  
  if [ "$http_code" = "429" ]; then
    echo "✅ Rate limit hit! Attempt $i returned 429"
    echo ""
    echo "Response:"
    echo "$response" | grep -v "HTTP_STATUS" | jq '.' 2>/dev/null || echo "$response" | grep -v "HTTP_STATUS"
    break
  elif [ "$http_code" = "200" ]; then
    echo "✅ Message sent successfully"
  else
    echo "❌ Unexpected status: $http_code"
    echo "$response" | grep -v "HTTP_STATUS"
  fi
  
  sleep 0.5
done

echo ""
echo "==========================================="
echo "Rate Limit Testing Complete"
echo "==========================================="
echo ""
echo "Notes:"
echo "- To reset rate limits, wait for the time window to expire"
echo "- Current windows: 1 hour (3600 seconds)"
echo "- To test immediately, modify rate limit window in .env file"
echo ""

