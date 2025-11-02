#!/bin/bash
# =====================================================
# Rate Limit Testing Script
# =====================================================

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
API_KEY="${API_KEY:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTAyODBiYzhhNDhiM2RiOTkxZTRlMjEiLCJlbWFpbCI6ImFwaUBjb21wYW55LmNvbSIsInJvbGUiOiJ1c2VyIiwibmF0aW9uYWxjb2RlIjoiMzMzMzMzMzMzMyIsInBlcnNvbmFsY29kZSI6IkFQSTAwMSIsImlhdCI6MTc2MjAyOTU5OSwiZXhwIjoxNzYyMTE1OTk5fQ.BToT8Wvg95WCYT7-PLR0EOMkqqvd18-y_6P0CiZvIk4}"
USER_ID="${USER_ID:-690280bc8a48b3db991e4e21}"

echo "==========================================="
echo "Rate Limit Testing"
echo "Base URL: ${BASE_URL}"
echo "User ID: ${USER_ID}"
echo "==========================================="

# Test 1A: Failed Login Rate Limit (counts all attempts)
echo ""
echo "==========================================="
echo "TEST 1A: Failed Login Rate Limit"
echo "Expected: Failed logins count toward limit, hit 429 after 10 attempts"
echo "==========================================="
echo ""

LOGIN_EMAIL="api@company.com"

echo "Attempting 12 failed logins with wrong password (rate limit is 10/hour)..."
for i in {1..12}; do
  echo -n "Failed login attempt $i: "
  response=$(curl -s -X POST ${BASE_URL}/auth/login \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"${LOGIN_EMAIL}\",
      \"password\": \"wrong_password_${i}\"
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
  elif [ "$http_code" = "401" ]; then
    echo "✅ Login failed as expected (wrong password)"
  else
    echo "❌ Unexpected status: $http_code"
    echo "$response" | grep -v "HTTP_STATUS"
  fi
  
  sleep 0.5
done

# Test 1B: Successful Login Rate Limit
echo ""
echo "==========================================="
echo "TEST 1B: Successful Login Rate Limit"
echo "Expected: First few attempts should succeed, then 429 Too Many Requests"
echo "==========================================="
echo ""

LOGIN_PASSWORD="ApiUser123!"

echo "Attempting 12 successful logins (rate limit is 10/hour)..."
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

