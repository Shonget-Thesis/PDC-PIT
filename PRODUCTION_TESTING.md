# Production Implementation Testing Guide

## Quick Start Verification

### Prerequisites
- Node.js 18+ and npm installed
- Python 3.8+ installed
- Port 3000 (frontend) and 8000 (backend) available

### Step 1: Verify Backend Enhancements

The backend now includes:
- ✅ Heartbeat message handling (`type: 'heartbeat'`)
- ✅ Rate limiting (100ms between messages)
- ✅ Connection attempt limiting (10 per 60 seconds)
- ✅ Input validation and sanitization
- ✅ Connection health monitoring

**Backend Status:** Running on `localhost:8000/ws/{user_id}`

### Step 2: Verify Frontend Enhancements

The frontend now includes:
- ✅ 30-second heartbeat ping mechanism
- ✅ Exponential backoff auto-reconnection (1s → 30s, max 5 attempts)
- ✅ Network change detection (online/offline events)
- ✅ XSS prevention (chat message sanitization)
- ✅ Nickname validation (alphanumeric + space/hyphen/underscore, max 20 chars)
- ✅ Comprehensive error handling with try-catch blocks

**Frontend Status:** Available on `localhost:3000`

---

## Feature Testing Checklist

### 1. Connection Stability Tests

#### Test 1.1: Heartbeat Mechanism
```
Expected Behavior:
- Browser should send heartbeat every 30 seconds
- Server should acknowledge with heartbeat response
- Connection should remain healthy

How to Verify:
1. Open browser DevTools (F12)
2. Go to Network tab → WS (WebSocket)
3. Look for heartbeat messages every 30 seconds
4. Each heartbeat should have server acknowledgment
```

#### Test 1.2: Auto-Reconnection (Exponential Backoff)
```
Expected Behavior:
- If connection drops, automatically attempt reconnection
- First attempt: 1 second
- Second attempt: 2 seconds
- Third attempt: 4 seconds
- Fourth attempt: 8 seconds
- Fifth attempt: 16 seconds
- After 5 failed attempts: show error message

How to Verify:
1. Open DevTools Console
2. Start a call
3. Disconnect network (DevTools → Network → Offline)
4. Watch console for: "Attempting reconnect in Xms (attempt Y/5)"
5. Error message after 5 attempts
```

#### Test 1.3: Network Change Detection
```
Expected Behavior:
- When network goes offline: error message appears
- When network comes back online: automatic reconnection
- Call should resume after reconnection

How to Verify:
1. Start a call
2. Disconnect network (DevTools → Network → Offline)
3. Verify error message: "No internet connection"
4. Reconnect network (DevTools → Network → Online)
5. Verify automatic reconnection without user action
```

### 2. Security Tests

#### Test 2.1: XSS Prevention (Chat)
```
Malicious Input Test: <script>alert('XSS')</script>
Expected Result: Safely escaped as: &lt;script&gt;alert('XSS')&lt;/script&gt;

Malicious Input Test: <img src=x onerror="alert(1)">
Expected Result: Safely escaped

Malicious Input Test: " onclick="alert(1)" foo="
Expected Result: Properly quoted as: &quot; onclick=&quot;alert(1)&quot; foo=&quot;

How to Verify:
1. Start a call
2. Send each payload in chat
3. Verify message appears escaped in both local and remote UI
4. Verify no JavaScript execution occurs
```

#### Test 2.2: Nickname Validation
```
Valid Input: "Alice-Bob_2024"
Expected: Accepted (alphanumeric + hyphen + underscore)

Invalid Input: "Alice<script></script>"
Expected: Stripped to "Alicescript"

Invalid Input: "VeryLongNicknameOver20Chars"
Expected: Truncated to 20 characters

Invalid Input: ""
Expected: Error: "Nickname must be at least 2 characters"

How to Verify:
1. Try entering various nicknames
2. Check browser console for sanitization
3. Verify errors displayed to user
```

### 3. Rate Limiting Tests

#### Test 3.1: Message Rate Limiting
```
Expected Behavior:
- Can send 1 message every 100ms minimum
- Sending faster: get rate limit error

How to Verify:
1. Start a call
2. Send messages rapidly in console:
   for(let i=0;i<10;i++) ws.send(JSON.stringify({type:'chat_message',message:'test'}))
3. Should see rate limit errors for messages faster than 100ms
```

#### Test 3.2: Connection Attempt Limiting
```
Expected Behavior:
- Cannot make more than 10 connection attempts per 60 seconds
- 11th attempt in same window: rejected

How to Verify (Advanced):
1. Close backend connection
2. Start new user session
3. Try connecting 10+ times rapidly
4. 11th connection should fail with rate limit error
```

### 4. Input Validation Tests

#### Test 4.1: Backend Sanitization
```
Field Size Limit: 100 characters
Program Size Limit: 100 characters
Year Level Size Limit: 50 characters
Nickname Size Limit: 20 characters
Interests: Max 10, each 50 characters

How to Verify:
1. Monitor backend logs for input validation
2. Try entering very long values
3. Verify all values truncated appropriately
4. Check Backend logs: "field=..., program=..."
```

---

## Manual Testing Walkthrough

### Scenario 1: Normal Call with Stability Features

```
1. Open localhost:3000 in two browser windows (Window A & B)
2. Both windows:
   - Select field (e.g., "Engineering")
   - Select program (e.g., "Computer Science")
   - Select year level (e.g., "2nd Year")
   - Enter nickname (e.g., "Alice", "Bob")
3. Window A: Click "Start Call"
4. Wait for match with Window B
5. Both windows should show buddy info
6. Chat back and forth:
   - Window A sends: "Hello from A"
   - Window B receives and sends back: "Hi from B"
7. In DevTools Console (both windows):
   - Watch for heartbeat messages every 30 seconds
   - See: "Heartbeat acknowledged"
8. Test disconnection:
   - DevTools → Network → Offline (Window A)
   - Error message appears: "No internet connection"
   - DevTools → Network → Online
   - Connection restores, call continues
9. End call in either window
   - Other window receives: "partner_disconnected"
   - Chat auto-deletes after 5 minutes
```

### Scenario 2: Security Testing - XSS Prevention

```
1. Start a call between two windows
2. Window A sends malicious chat: '<script>alert("XSS")</script>'
3. Window B displays: &lt;script&gt;alert("XSS")&lt;/script&gt;
4. No JavaScript alert appears (XSS prevented)
5. Window A sends HTML: '<img src=x onerror="alert(1)">'
6. Window B displays: &lt;img src=x onerror="alert(1)"&gt;
7. No alert appears (XSS prevented)
```

### Scenario 3: Rate Limiting

```
1. Start a call
2. Open DevTools Console in Window A
3. Run rapid chat sends:
   ws.send(JSON.stringify({type:'chat_message',message:'msg1'}));
   ws.send(JSON.stringify({type:'chat_message',message:'msg2'}));
   ws.send(JSON.stringify({type:'chat_message',message:'msg3'}));
   // Send all three rapidly
4. Check console output:
   - First message: sent successfully
   - Second/third: rate limit error
   - Shows: "Message rate limit exceeded"
```

---

## Production Deployment Checklist

- [ ] Test all connection stability features
- [ ] Verify XSS prevention works
- [ ] Test rate limiting enforcement
- [ ] Verify input validation
- [ ] Test network disconnection recovery
- [ ] Verify heartbeat mechanism
- [ ] Load test with multiple concurrent users
- [ ] Monitor backend resource usage
- [ ] Set up monitoring and alerting
- [ ] Configure rate limits appropriately
- [ ] Set up logging and error tracking
- [ ] Document production deployment procedure

---

## Monitoring & Debugging

### Frontend Debugging

```javascript
// Check connection state
console.log(connectionState);  // 'connected', 'disconnected', 'waiting', 'connecting'

// Check last error
console.log(error);  // Display any current error messages

// Monitor WebSocket
console.log(wsRef.current?.readyState);
// 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED

// Check reconnection status
console.log(`Attempts: ${reconnectAttemptsRef.current} / 5`);
```

### Backend Debugging

```bash
# Start backend with verbose logging
cd Backend
python main.py 2>&1 | tee backend.log

# Monitor real-time
tail -f backend.log | grep -E "(heartbeat|rate limit|error|connected)"

# Check active connections
curl http://localhost:8000/
```

---

## Troubleshooting

### Issue: "Connection failed after maximum attempts"
**Cause:** Backend unreachable or network issue  
**Solution:**
1. Verify backend is running: `curl http://localhost:8000/`
2. Check firewall rules
3. Verify WebSocket port 8000 is open
4. Check browser console for CORS errors

### Issue: Rapid message spam causes rate limit errors
**Cause:** Expected behavior - rate limiting working  
**Solution:** Users should send messages > 100ms apart

### Issue: Heartbeat not appearing in Network tab
**Cause:** May be hidden or batched  
**Solution:**
1. Filter by message type in DevTools
2. Look for messages with `"type":"heartbeat"`
3. Check every ~30 seconds

### Issue: Connection doesn't auto-reconnect
**Cause:** Max reconnection attempts exceeded or network error  
**Solution:**
1. Check error message displayed
2. Refresh page to reset connection attempts
3. Verify network connectivity
4. Check backend logs for errors

---

## Performance Baselines

| Metric | Baseline | Target |
|--------|----------|--------|
| Heartbeat Overhead | ~0.1KB per 30s | <1KB per minute |
| Message Latency | <100ms | <200ms |
| Reconnection Time | <5 seconds | <10 seconds |
| Memory per Connection | ~5MB | <20MB |
| CPU per Connection | <1% | <5% |

---

## Next Steps

1. **Testing Phase:**
   - Run all test scenarios
   - Verify rate limiting
   - Test network failure recovery

2. **Monitoring Setup:**
   - Set up backend logging
   - Create monitoring dashboard
   - Set up alerting for errors

3. **Production Deployment:**
   - Configure rate limits for production load
   - Set up load balancing if needed
   - Deploy to production environment

4. **Post-Deployment:**
   - Monitor for errors and issues
   - Gather user feedback
   - Optimize rate limits based on usage patterns

---

## Support & Documentation

For issues or questions:
1. Check browser console for error messages
2. Check backend logs: `Backend/main.py` output
3. Review PRODUCTION_ENHANCEMENTS.md for feature details
4. Monitor Network tab in DevTools for WebSocket messages
