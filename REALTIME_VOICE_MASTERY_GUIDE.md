# 🎤 REAL-TIME VOICE CONVERSATION MASTERY GUIDE

## 🎯 PURPOSE

This guide prevents the confusion and complexity that causes LLM agents to get lost when implementing real-time voice conversation systems with dynamic context injection.

## 📋 DEFINITION OF DONE

- ✅ **<600ms median latency** (user speech → first audio token)
- ✅ **Hands-free operation** with VAD (Voice Activity Detection)
- ✅ **Barge-in interruption** within 150ms
- ✅ **Stateful UI**: listening/thinking/speaking/web-search/error
- ✅ **Secure ephemeral keys** only (no browser API keys)
- ✅ **Parallel context injection** with bounded size + citations
- ✅ **Per-turn observability** with metrics and error tracking

## 🏗️ REFERENCE ARCHITECTURE

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend        │    │   External      │
│   (Browser)     │◄──►│   (Port 3003)    │◄──►│   Services      │
│                 │    │                  │    │                 │
│ • Voice Orb UI  │    │ • /session       │    │ • OpenAI Realtime│
│ • WebRTC        │    │ • /v1/realtime   │    │ • Doppler        │
│ • DataChannel   │    │ • Injection Ctrl │    │ • MCP Servers    │
│ • Audio Capture │    │ • Memory Layer   │    │ • Vector Stores  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔄 GOLDEN PATH API SEQUENCE

### 1. User Initiation
```javascript
user clicks "Connect"
    ↓
getUserMedia({ audio: { echoCancellation, noiseSuppression, autoGainControl }})
    ↓
```

### 2. Session Setup
```javascript
GET /session → ephemeral key (ek_...) from Doppler
    ↓
RTCPeerConnection.createOffer()
    ↓
POST /v1/realtime?model=gpt-4o-mini-realtime-preview (SDP proxy)
    ↓
setRemoteDescription(answer)
    ↓
```

### 3. Session Configuration
```javascript
session.update({
  instructions: "Be concise. Cite sources when using injected facts.",
  voice: "marin",
  audio: {
    input: {
      turn_detection: {
        type: "server_vad",
        idle_timeout_ms: 750
      }
    }
  }
})
    ↓
```

### 4. Conversation Loop
```
User speaks → Server VAD detects → Tool calls parallel → Context injection → Response starts
    ↓
User interrupts → response.cancel → Immediate return to listening
```

## 🎯 CONTEXT INJECTION PATTERNS

### A. Session-Level Policy (Persistent)
```javascript
// Global rules, persona, safety, output style
{
  "type": "session.update",
  "session": {
    "instructions": "You are a helpful, concise assistant. Cite sources when using injected facts. Stop speaking immediately if interrupted.",
    "voice": "marin",
    "metadata": {
      "app": "orchestra-voice",
      "user_tier": "pro"
    }
  }
}
```

### B. Turn-Scoped Injection (Most Common)
```javascript
// Fresh external facts for next response only
{
  "type": "session.update",
  "session": {
    "metadata": {
      "turn_injection": {
        "summary": "External: EUR/BRL 6.12 (+0.3%), Itapema weather 23°C cloudy.",
        "sources": [
          {"id":"brlfx","ts":"2025-10-12T19:06:00Z"},
          {"id":"wx_itapema","ts":"2025-10-12T19:05:30Z"}
        ]
      }
    }
  }
}
```

### C. Live Parallel Injection (During User Speech)
```javascript
// Start tool calls on VAD-start, stream partial results
// Example: "FYI: EUR/BRL ↑0.3%" as mini updates
// On turn commit, attach final summarized context
```

### D. Memory Recall Injection
```javascript
// Past items: names, preferences, prior decisions
// Retrieve from persistent store → 2-3 line summary with IDs
// Inject as preface to next turn
```

### Priority Order (Collisions)
1. Safety/policy constraints
2. Turn-critical tool results
3. Memory recall
4. FYI hints

## 🔧 AGENT STANDARD OPERATING PROCEDURES

### Startup Checklist
```bash
# 1. Environment Verification
□ HTTPS/localhost context
□ /session returns ek_... under 300ms
□ /v1/realtime proxy responds correctly
□ Doppler API key accessible

# 2. Component Initialization
□ RTCPeerConnection established
□ DataChannel "oai-events" opened
□ Audio permissions granted
□ Session.update applied (instructions, voice, VAD)

# 3. Memory Setup
□ Short-term scratchpad initialized
□ Long-term store connection verified
□ MCP server endpoints reachable
```

### Per-Turn Workflow
```javascript
async function handleUserTurn() {
  // A. Start concurrent operations
  const toolPromise = startToolCalls(); // Parallel with user speech
  const memoryPromise = recallRelevantContext();

  // B. Wait for VAD commit
  await vadComplete();

  // C. Summarize and inject context
  const context = await summarizeToolResults(toolPromise);
  const memory = await memoryPromise;
  await injectContext({ context, memory });

  // D. Generate response
  await createResponse();

  // E. Handle interruption
  setupBargeInHandler();

  // F. Log metrics
  await logTurnMetrics();
}
```

### Error Recovery Playbook
```javascript
const errorHandlers = {
  'NotAllowedError': showMicPermissionBanner,
  '401': refreshEphemeralKey,
  'ICE failed': retryWithTURN,
  'TTS stalls': sendResponseCancel,
  'tool timeout': degradeGracefully
};
```

## 📊 PERFORMANCE OPTIMIZATION

### Latency Budget
```
• Capture + VAD commit: 200-350ms
• Network + SDP pipeline: <100ms
• First audio delta: 250-400ms
• TOTAL TARGET: <600ms median, <1200ms p95
```

### Tuning Levers
```javascript
// Faster VAD detection
idle_timeout_ms: 600-900 (watch false-cuts)

// Smaller context injection
context_limit: 512-1024 tokens (longer = slower)

// Pre-warm connections
reuse RTCPeerConnection, avoid renegotiations

// Optimize tool calls
return brief partial, refine next turn
```

## 🔐 SECURITY ARCHITECTURE

### Key Management
```javascript
// ✅ CORRECT: Ephemeral only in browser
GET /session → ek_... (expires in minutes)

// ❌ WRONG: Never expose normal API keys
API_KEY = "sk-proj..." // NEVER in frontend
```

### Injection Guardrails
```javascript
// Respect privacy flags
// Never inject restricted PII unless policy allows
// Always include source citations
// Size limits: <1k tokens per injection
```

## 🧪 TESTING STRATEGY

### Contract Tests
```javascript
describe('Realtime Voice System', () => {
  test('Session endpoint returns ek_...', async () => {
    const response = await fetch('/session');
    const { value } = await response.json();
    expect(value).toMatch(/^ek_/);
  });

  test('SDP proxy forwards correctly', async () => {
    const sdpResponse = await fetch('/v1/realtime', {
      method: 'OPTIONS'
    });
    expect([200, 204, 405]).toContain(sdpResponse.status);
  });

  test('Barge-in interrupts within 150ms', async () => {
    // Test interruption timing
  });
});
```

### Manual Testing Checklist
```bash
□ Mic permission flow works on all browsers
□ Ephemeral key refresh on expiry
□ Context injection doesn't break conversation
□ Barge-in works reliably
□ Error recovery is graceful
□ Audio quality is acceptable
□ Latency meets targets
```

## 🚀 ADVANCED PATTERNS

### Multi-Modal Injection
```javascript
// Inject images, documents, structured data
{
  "type": "session.update",
  "session": {
    "metadata": {
      "turn_injection": {
        "type": "multimodal",
        "summary": "User shared a chart showing...",
        "images": ["chart_url"],
        "data": {"market_data": {...}}
      }
    }
  }
}
```

### Memory Architecture
```javascript
// Short-term (conversation scratchpad)
const shortTerm = {
  agenda: [],
  people: new Set(),
  places: new Set(),
  last_decisions: [],
  todos: []
};

// Long-term (persistent store)
const longTerm = {
  embeddings: vectorStore,
  graph: knowledgeGraph,
  preferences: userSettings
};
```

## 📋 QUICK CONFIGURATION TEMPLATES

### Session Defaults
```javascript
const defaultSession = {
  instructions: "Be concise. Cite sources when using injected facts. Stop speaking immediately if interrupted.",
  voice: "marin",
  audio: {
    input: {
      turn_detection: {
        type: "server_vad",
        idle_timeout_ms: 750
      }
    }
  },
  metadata: {
    app: "orchestra-voice",
    user_tier: "pro",
    injection_budget: 1024 // tokens
  }
};
```

### Injection Limits
```javascript
const injectionLimits = {
  turn_scoped: 1024,    // tokens per turn
  session_policy: 2048, // tokens for global policy
  memory_recall: 512,   // tokens for memory injection
  live_hints: 256       // tokens for real-time hints
};
```

### Error Messages
```javascript
const errorMessages = {
  'mic_denied': "Microphone permission denied. Please enable in browser settings.",
  'session_expired': "Session expired. Reconnecting...",
  'network_error': "Connection lost. Attempting to reconnect...",
  'tool_timeout': "Information temporarily unavailable. Continuing conversation..."
};
```

## 🎯 SUCCESS METRICS

### Technical Metrics
- **E2E Latency**: <600ms median, <1200ms p95
- **Barge-in Time**: <150ms from speech start to response cancel
- **Tool Call Latency**: <2s for critical tools
- **Session Success Rate**: >95% connections succeed
- **Audio Quality**: MOS >4.0 user satisfaction

### User Experience Metrics
- **Time to First Response**: <3s from page load
- **Conversation Flow**: Natural turn-taking, minimal delays
- **Context Relevance**: >80% of injected context used appropriately
- **Error Recovery**: <5% of sessions require manual intervention

## 🔄 CONTINUOUS IMPROVEMENT

### Monitoring
```javascript
const metricsToTrack = {
  perTurn: {
    latency: ['vad_start', 'commit', 'first_audio', 'total_speak'],
    tokens: ['in', 'out', 'injection_budget_used'],
    tools: ['calls', 'latency', 'errors'],
    interactions: ['barge_ins', 'interruptions', 'recovery_time']
  },
  perSession: {
    connection: ['setup_time', 'ek_refreshes', 'ice_failures'],
    quality: ['audio_mos', 'conversation_rating'],
    performance: ['turns_per_minute', 'context_injection_success']
  }
};
```

### A/B Testing
```javascript
const experiments = {
  voice_options: ['marin', 'cedar', 'verse'],
  vad_settings: [600, 750, 900], // idle_timeout_ms
  injection_sizes: [512, 768, 1024], // tokens
  tool_strategies: ['parallel', 'sequential', 'hybrid']
};
```

## 📚 REFERENCE IMPLEMENTATIONS

### Your Current System
- ✅ **WebRTC Voice Orb**: Complete React interface with animated states
- ✅ **Professional Server**: Doppler integration + SDP proxy
- ✅ **Test Suite**: API validation and diagnostics
- ✅ **Documentation**: Complete setup and troubleshooting guides

### Next Steps
1. **Add Injection Controller**: Module for parallel context fetching
2. **Implement Memory Layer**: Short-term scratchpad + long-term store
3. **Enhance Observability**: Per-turn metrics and error tracking
4. **Add Telephony Support**: SIP integration for phone calls

## 🎯 CONCLUSION

This mastery guide provides the **complete playbook** for implementing real-time voice conversation systems that avoid the common pitfalls that cause LLM agents to get confused. By following these patterns and procedures, you can achieve production-ready systems with sub-600ms latency, robust error handling, and seamless context injection.

**Key Success Factors:**
- Start with the golden path and add complexity incrementally
- Always measure and optimize for latency first
- Use ephemeral keys and secure proxy patterns
- Implement comprehensive error recovery
- Track metrics and iterate based on performance data

Your current implementation is already 80% complete - use this guide to add the injection layer and optimize for production performance! 🚀