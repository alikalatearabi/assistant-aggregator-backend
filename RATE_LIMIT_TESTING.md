# Rate Limit Testing Guide

This guide explains how to test the rate limiting functionality in the backend.

## Configuration

Rate limits are configured in `.env`:

```bash
RATE_LIMIT_LOGIN_MAX=10              # Max login attempts per window
RATE_LIMIT_LOGIN_WINDOW_HOURS=1      # Time window in hours
RATE_LIMIT_MESSAGE_MAX=50            # Max messages per window
RATE_LIMIT_MESSAGE_WINDOW_HOURS=1    # Time window in hours
```

## Testing Scripts

### 1. Quick Single Test

Test a single request to see current rate limit status:

```bash
./test-rate-limit-simple.sh
```

This will send one chat message and show if it succeeds, hits rate limit, or fails for another reason.

### 2. Full Rate Limit Test

Test hitting the rate limit by sending multiple requests:

```bash
./test-rate-limit.sh
```

This script will:
- Attempt 12 login attempts (rate limit is 10)
- Attempt 52 chat messages (rate limit is 50)
- Show which request hits the 429 Too Many Requests error

### 3. Manual Testing with Curl

#### Test Login Rate Limit

```bash
# Try to login 11 times (rate limit is 10)
for i in {1..11}; do
  echo "Login attempt $i"
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "api@company.com",
      "password": "ApiUser123!"
    }' \
    -w "\nHTTP Status: %{http_code}\n\n"
  sleep 0.5
done
```

#### Test Message Rate Limit

```bash
# Try to send 51 messages (rate limit is 50)
API_KEY="sk_9c30f5fd1bd5b69db561a4de84ca2b64bed7f89e2b1894da"
USER_ID="690280bc8a48b3db991e4e21"

for i in {1..51}; do
  echo "Message attempt $i"
  curl -X POST http://localhost:3000/chats/chat-messages \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${API_KEY}" \
    -d "{
      \"query\": \"سلام - test $i\",
      \"inputs\": {
        \"similarityThreshold\": \"0.10\",
        \"contextCount\": 6
      },
      \"think_level\": \"standard\",
      \"user\": \"${USER_ID}\",
      \"response_mode\": \"blocking\"
    }" \
    -w "\nHTTP Status: %{http_code}\n\n"
  sleep 0.5
done
```

## Expected Responses

### Success (200 OK)
```json
{
  "event": "message",
  "task_id": "...",
  "id": "...",
  "message_id": "...",
  "conversation_id": "...",
  "mode": "blocking",
  "answer": "...",
  "metadata": {
    "retriever_resources": []
  },
  "created_at": 1234567890
}
```

### Rate Limit Exceeded (429 Too Many Requests)
```json
{
  "status": 429,
  "code": "too_many_requests",
  "message": "Rate limit exceeded. Please try again in 59 minute(s)."
}
```

## Reset Rate Limits

Rate limits automatically reset after the time window expires. For testing, you have a few options:

### Option 1: Wait for Reset
- Rate limits reset after 1 hour by default
- Modify `RATE_LIMIT_MESSAGE_WINDOW_HOURS` in `.env` to test faster

### Option 2: Restart with Different Settings

1. Modify `.env` to set lower limits temporarily:
   ```bash
   RATE_LIMIT_LOGIN_MAX=3
   RATE_LIMIT_LOGIN_WINDOW_HOURS=1
   RATE_LIMIT_MESSAGE_MAX=5
   RATE_LIMIT_MESSAGE_WINDOW_HOURS=1
   ```

2. Restart the application

3. Test with the new limits

### Option 3: Clear User Rate Limit Data (Manual)

Connect to MongoDB and manually reset rate limit counters:

```javascript
// In MongoDB shell or MongoDB Compass
use assistant_aggregator

// Reset a specific user's rate limits
db.users.updateOne(
  { _id: ObjectId("690280bc8a48b3db991e4e21") },
  { 
    $set: { 
      loginRateLimit: { count: 0, resetAt: new Date() },
      messageRateLimit: { count: 0, resetAt: new Date() }
    }
  }
)

// Or reset all users
db.users.updateMany(
  {},
  { 
    $set: { 
      loginRateLimit: { count: 0, resetAt: new Date() },
      messageRateLimit: { count: 0, resetAt: new Date() }
    }
  }
)
```

## Testing Tips

1. **Start with low limits** for testing:
   ```bash
   RATE_LIMIT_MESSAGE_MAX=3
   RATE_LIMIT_MESSAGE_WINDOW_HOURS=1
   ```

2. **Use monitoring** to see rate limit data:
   - Check MongoDB for user rate limit fields
   - Watch application logs for rate limit messages

3. **Test both endpoints**:
   - `/auth/login` for login rate limiting
   - `/chats/chat-messages` for message rate limiting

4. **Verify error messages** include remaining time

5. **Test edge cases**:
   - First request (should succeed)
   - Last allowed request before limit (should succeed)
   - First request after limit (should return 429)
   - Request after window expires (should succeed)

## Checking Current Rate Limit Status

You can query MongoDB to see current rate limit status:

```javascript
use assistant_aggregator

// Check a specific user's rate limit status
db.users.findOne(
  { _id: ObjectId("690280bc8a48b3db991e4e21") },
  { loginRateLimit: 1, messageRateLimit: 1 }
)
```

Output:
```json
{
  "_id": ObjectId("690280bc8a48b3db991e4e21"),
  "loginRateLimit": {
    "count": 8,
    "resetAt": ISODate("2024-01-01T12:00:00.000Z")
  },
  "messageRateLimit": {
    "count": 45,
    "resetAt": ISODate("2024-01-01T12:00:00.000Z")
  }
}
```

## Troubleshooting

### Rate limit not working?

1. Check `.env` file has the rate limit variables set
2. Restart the application after changing `.env`
3. Verify `ConfigService` is being used in `RateLimitService`
4. Check MongoDB connection and user document structure

### Rate limit too strict?

1. Increase limits in `.env`:
   ```bash
   RATE_LIMIT_LOGIN_MAX=100
   RATE_LIMIT_MESSAGE_MAX=1000
   ```

2. Decrease time windows:
   ```bash
   RATE_LIMIT_LOGIN_WINDOW_HOURS=0.5  # 30 minutes
   ```

### Need to test immediately?

1. Set very short windows:
   ```bash
   RATE_LIMIT_MESSAGE_WINDOW_HOURS=0.016  # 1 minute
   ```

2. Or reset user data manually (see Option 3 above)

