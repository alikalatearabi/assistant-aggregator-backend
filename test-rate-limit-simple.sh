#!/bin/bash
# =====================================================
# Simple Rate Limit Testing - Single Request
# =====================================================

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
API_KEY="${API_KEY:-sk_9c30f5fd1bd5b69db561a4de84ca2b64bed7f89e2b1894da}"
USER_ID="${USER_ID:-690280bc8a48b3db991e4e21}"

echo "==========================================="
echo "Single Rate Limit Test"
echo "==========================================="
echo ""

# Test Message Rate Limit
echo "Sending a single chat message to test rate limiting..."
echo ""

response=$(curl -s -X POST ${BASE_URL}/chats/chat-messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${API_KEY}" \
  -w "\nHTTP_STATUS:%{http_code}" \
  -d "{
    \"query\": \"سلام\",
    \"inputs\": {
      \"similarityThreshold\": \"0.10\",
      \"contextCount\": 6
    },
    \"think_level\": \"standard\",
    \"user\": \"${USER_ID}\",
    \"response_mode\": \"blocking\"
  }")

http_code=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)

echo "HTTP Status: $http_code"
echo ""

if [ "$http_code" = "200" ]; then
  echo "✅ Request successful"
  echo "Response body:"
  echo "$response" | grep -v "HTTP_STATUS" | jq '.' 2>/dev/null || echo "$response" | grep -v "HTTP_STATUS"
elif [ "$http_code" = "429" ]; then
  echo "⛔ Rate limit exceeded!"
  echo "Response body:"
  echo "$response" | grep -v "HTTP_STATUS" | jq '.' 2>/dev/null || echo "$response" | grep -v "HTTP_STATUS"
elif [ "$http_code" = "401" ]; then
  echo "❌ Authentication failed"
  echo "Response body:"
  echo "$response" | grep -v "HTTP_STATUS" | jq '.' 2>/dev/null || echo "$response" | grep -v "HTTP_STATUS"
else
  echo "⚠️  Unexpected status code"
  echo "Response body:"
  echo "$response" | grep -v "HTTP_STATUS" | jq '.' 2>/dev/null || echo "$response" | grep -v "HTTP_STATUS"
fi

echo ""
echo "==========================================="

