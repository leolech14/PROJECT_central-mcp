# 🤖 AGENT SOP - REAL-TIME VOICE SYSTEMS

## 🎯 PURPOSE

This Standard Operating Procedure prevents LLM agents from getting confused when implementing real-time voice conversation systems with dynamic context injection.

## 🚨 WHY AGENTS GET CONFUSED - COMPLEXITY BREAKDOWN

### The Problem
Real-time voice systems have **5 concurrent state machines** running simultaneously:
1. **Audio Capture** (microphone permissions, VAD, audio processing)
2. **WebRTC Connection** (SDP exchange, ICE candidates, data channels)
3. **API Management** (ephemeral keys, session management, error recovery)
4. **Context Injection** (tool calls, memory recall, data summarization)
5. **UI State Management** (orb animations, transcripts, user feedback)

### Common Failure Points
- **CORS Issues**: Direct OpenAI calls from browser
- **Permission Errors**: Microphone access denied
- **Timing Issues**: Context injection breaking conversation flow
- **State Confusion**: Multiple async operations without clear coordination
- **Error Recovery**: No graceful degradation patterns

## 📋 MANDATORY STARTUP CHECKLIST

### 1. Environment Verification
```bash
# BEFORE writing any code, verify:
□ HTTPS/localhost context (microphone requires secure context)
□ /session endpoint exists and returns ek_...
□ /v1/realtime proxy exists and handles OPTIONS requests
□ Doppler API key is accessible from server
□ Server is running on correct port (3003)
```

### 2. Component Initialization
```javascript
// ALWAYS follow this exact order:
1. Check secure context
2. Request microphone permission (user gesture required)
3. Create RTCPeerConnection
4. Open DataChannel("oai-events")
5. GET /session for ephemeral key
6. Exchange SDP via /v1/realtime proxy
7. Apply session.update with instructions and VAD
```

### 3. Memory Setup
```javascript
// Initialize before first conversation:
□ Short-term scratchpad (JSON structure)
□ Long-term store connection
□ MCP server endpoints
□ Tool call budgets and timeouts
□ Error recovery handlers
```

## 🔧 IMPLEMENTATION PATTERNS

### ALWAYS Use These Patterns

#### ✅ Secure API Pattern
```javascript
// CORRECT: Local proxy for SDP exchange
const sdpResponse = await fetch('/v1/realtime?model=gpt-4o-mini-realtime-preview', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${ephemeralKey}`,
    'Content-Type': 'application/sdp',
  },
  body: offer.sdp,
});

// NEVER: Direct OpenAI calls from browser
// const sdpResponse = await fetch('https://api.openai.com/v1/realtime', {
//   // ❌ CORS issues, security risk
// });
```

#### ✅ Permission Handling Pattern
```javascript
async function requestMicAccessOnce() {
  try {
    if (!isSecure()) throw new Error("Microphone requires HTTPS or localhost.");

    const tmp = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    tmp.getTracks().forEach((t) => t.stop()); // Release immediately
    return true;
  } catch (err) {
    if (err?.name === "NotAllowedError") {
      // Show user-friendly banner with browser-specific instructions
      showMicPermissionBanner();
    }
    return false;
  }
}
```

#### ✅ Error Recovery Pattern
```javascript
const errorHandlers = {
  'NotAllowedError': () => showMicPermissionBanner(),
  '401': () => refreshEphemeralKey(),
  'ICE failed': () => retryWithTURN(),
  'TTS stalls': () => sendResponseCancel(),
  'tool timeout': () => degradeGracefully()
};

function handleError(error) {
  const handler = errorHandlers[error.name] || errorHandlers[error.status];
  if (handler) {
    handler();
  } else {
    console.error('Unhandled error:', error);
    showGenericError();
  }
}
```

#### ✅ Context Injection Pattern
```javascript
async function injectContextForTurn() {
  // Start parallel operations during user speech
  const toolPromise = startToolCalls();
  const memoryPromise = recallRelevantContext();

  // Wait for VAD to commit user speech
  await vadComplete();

  // Summarize and inject (keep under 1k tokens)
  const toolResults = await summarizeToolResults(toolPromise);
  const memoryResults = await memoryPromise;

  if (toolResults || memoryResults) {
    await session.update({
      metadata: {
        turn_injection: {
          summary: combineContexts(toolResults, memoryResults),
          sources: extractSources(toolResults, memoryResults)
        }
      }
    });
  }
}
```

### NEVER Use These Patterns

#### ❌ Direct API Key Exposure
```javascript
// NEVER expose API keys in frontend
const API_KEY = "sk-proj..."; // ❌ SECURITY RISK

// ALWAYS use ephemeral keys
const ephemeralKey = await getEphemeralKey(); // ✅ SECURE
```

#### ❌ Blocking Tool Calls
```javascript
// NEVER block user input for tool calls
const weather = await getWeather(); // ❌ BLOCKS CONVERSATION

// ALWAYS start tool calls in parallel
const weatherPromise = getWeather(); // ✅ PARALLEL
```

#### ❌ Large Context Injections
```javascript
// NEVER inject large documents
await injectContext(fullDocument); // ❌ TOO SLOW

// ALWAYS summarize to <1k tokens
const summary = await summarizeToTokens(fullDocument, 1024); // ✅ FAST
```

## 🔄 PER-TURN WORKFLOW

### Standard Turn Handling
```javascript
async function handleUserTurn() {
  try {
    // 1. Start concurrent operations (DON'T AWAIT YET)
    const toolPromise = startToolCalls();
    const memoryPromise = recallRelevantContext();

    // 2. Wait for VAD to commit user speech
    const userSpeech = await vadComplete();

    // 3. Prepare context injection (parallel operations continue)
    const contextPromises = [
      summarizeToolResults(toolPromise),
      memoryPromise
    ];

    // 4. Inject context if ready (don't block response)
    injectContextIfReady(contextPromises);

    // 5. Create response with barge-in support
    const response = await createResponse();

    // 6. Setup interruption handler
    setupBargeInHandler(response);

    // 7. Log metrics for analysis
    await logTurnMetrics({
      latency: measureLatency(),
      tokens: countTokens(),
      tools: getToolResults(),
      interruptions: countInterruptions()
    });

  } catch (error) {
    handleError(error);
  }
}
```

### Barge-in Implementation
```javascript
function setupBargeInHandler(response) {
  let interruptionTimer;

  micStream.on('data', (audioData) => {
    if (isUserSpeaking(audioData)) {
      // Clear any existing timer
      if (interruptionTimer) clearTimeout(interruptionTimer);

      // Start interruption timer (debounce)
      interruptionTimer = setTimeout(() => {
        sendResponseCancel(); // Immediate stop
        setState('listening'); // Update UI
      }, 200); // 200ms debounce
    }
  });
}
```

## 📊 PERFORMANCE REQUIREMENTS

### Latency Targets
```javascript
const LATENCY_TARGETS = {
  capture_to_vad: 350,      // ms from speech start to VAD commit
  vad_to_response: 250,     // ms from VAD commit to first audio
  total_e2e: 600,          // ms from speech start to first audio
  barge_in: 150,           // ms from interruption to response cancel
  tool_call: 2000          // ms maximum for critical tools
};
```

### Budget Limits
```javascript
const BUDGETS = {
  turn_injection: 1024,    // tokens per turn
  session_policy: 2048,    // tokens for global policy
  memory_recall: 512,      // tokens for memory injection
  total_session: 8192      // tokens per conversation
};
```

## 🧪 TESTING CHECKLISTS

### Unit Tests
```javascript
describe('Voice System Components', () => {
  test('Session endpoint returns ephemeral key', async () => {
    const response = await fetch('/session');
    const { value } = await response.json();
    expect(value).toMatch(/^ek_/);
    expect(response.status).toBe(200);
  });

  test('SDP proxy handles OPTIONS request', async () => {
    const response = await fetch('/v1/realtime', { method: 'OPTIONS' });
    expect([200, 204, 405]).toContain(response.status);
  });

  test('Context injection respects budget limits', async () => {
    const context = await prepareContext(largeDocument);
    expect(tokenize(context)).toBeLessThanOrEqual(1024);
  });
});
```

### Integration Tests
```javascript
describe('E2E Voice Flow', () => {
  test('Complete conversation with barge-in', async () => {
    // Setup mock WebRTC and audio streams
    // Test full flow from connect to disconnect
    // Verify interruption timing
  });

  test('Error recovery scenarios', async () => {
    // Test microphone permission denied
    // Test network connectivity loss
    // Test ephemeral key expiry
  });
});
```

### Manual Testing
```bash
□ Test on Chrome, Firefox, Safari
□ Test with different microphones (headset, built-in, Bluetooth)
□ Test in noisy environments
□ Test with network latency simulation
□ Test context injection with real tools
□ Test barge-in reliability
□ Test memory recall accuracy
```

## 🔧 DEBUGGING PATTERNS

### Common Issues & Solutions

#### 1. "Not found" errors
```
Problem: API endpoints missing
Solution: Verify server is running and routes are registered
Debug: Check server logs, test endpoints with curl
```

#### 2. "SDP exchange failed: 401"
```
Problem: Ephemeral key expired or invalid
Solution: Refresh via /session endpoint
Debug: Check ek_expires_at timestamp
```

#### 3. Microphone permission denied
```
Problem: Browser blocked microphone access
Solution: Show browser-specific instructions
Debug: Check navigator.permissions.query('microphone')
```

#### 4. High latency
```
Problem: Tool calls or context injection too slow
Solution: Optimize tool calls, reduce context size
Debug: Add timing logs to each step
```

#### 5. Audio quality issues
```
Problem: Echo, background noise, poor quality
Solution: Enable AEC/NS/AGC, check microphone
Debug: Test with different audio configurations
```

### Debug Logging Pattern
```javascript
const DEBUG = process.env.NODE_ENV === 'development';

function debugLog(category, message, data = null) {
  if (DEBUG) {
    console.log(`[${category}] ${message}`, data);
    // Also consider sending to logging service for production debugging
  }
}

// Usage:
debugLog('AUDIO', 'Microphone stream started', { deviceId: 'default' });
debugLog('WEBRTC', 'SDP exchange completed', { latency: 1200 });
debugLog('CONTEXT', 'Tool results received', { toolCount: 3, tokenCount: 450 });
```

## 📚 REFERENCE RESOURCES

### Documentation
- [OpenAI Realtime API Docs](https://platform.openai.com/docs/guides/realtime)
- [WebRTC MDN Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

### Tools & Libraries
- [WebRTC Troubleshooter](https://test.webrtc.org/)
- [Browser Compatibility Table](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API#browser_compatibility)
- [Audio Testing Tools](https://webaudio.github.io/web-audio-api-v2-examples/)

### Performance Monitoring
- [WebRTC Internals](chrome://webrtc-internals/) (Chrome)
- [Firefox about:webrtc](about:webrtc) (Firefox)
- [Safari WebRTC Inspector] (Safari DevTools)

## 🎯 SUCCESS METRICS

### What Success Looks Like
- **First-time setup**: <5 minutes from fresh system to working voice chat
- **Error recovery**: <95% of errors handled gracefully without user intervention
- **Performance**: <600ms median E2E latency, >90% of turns meet target
- **User satisfaction**: >4.0/5.0 rating for conversation quality

### When to Ask for Help
- Stuck on the same issue for >30 minutes
- Error messages don't match documented patterns
- Performance metrics consistently below targets
- Multiple components failing simultaneously

## 🔄 CONTINUOUS IMPROVEMENT

### Review Checklist (Weekly)
```bash
□ Review performance metrics against targets
□ Update error handling patterns based on new failures
□ Refactor complex state management
□ Add new test cases for edge cases discovered
□ Update documentation with new patterns
```

### Knowledge Sharing
- Document new patterns in this SOP
- Share successful error recovery strategies
- Contribute performance optimization techniques
- Update troubleshooting guides with new solutions

---

## 🚨 CRITICAL REMINDERS

1. **ALWAYS** use HTTPS or localhost for microphone access
2. **NEVER** expose API keys in frontend code
3. **ALWAYS** handle errors gracefully with user-friendly messages
4. **NEVER** block user input with synchronous operations
5. **ALWAYS** measure and optimize for latency first
6. **NEVER** inject more than 1k tokens per turn
7. **ALWAYS** test across multiple browsers
8. **NEVER** assume WebRTC will work without fallback options

Follow this SOP precisely and you'll avoid the common pitfalls that cause real-time voice systems to fail! 🎯