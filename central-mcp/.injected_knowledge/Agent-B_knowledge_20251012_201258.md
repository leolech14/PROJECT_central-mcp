# 🧠 Central-MCP Knowledge Package

**Agent:** Agent-B
**Template:** Full Agent Onboarding
**Generated:** Sun Oct 12 20:12:59 -03 2025

---

# 📚 Specialized Knowledge Packs (SKPs)

## 📦 SKP: ULTRATHINK Realtime Voice Mastery (v1.2.0)

**Contents:**
- voice-to-voice-realtime.html
- PROJECT_central-mcp_03Sun12Oct2025.html
- test-realtime-api.js
- realtime-chat.html
- realtime-voice-chat.html
- HOW_REALTIME_VOICE_WORKS.md
- professional-voice-chat.html
- simple-realtime-chat.html
- INVENTORY.md
- PROJECT_central-mcp_06Sun12Oct2025.html
- CENTRAL_MCP_MODULAR_ARCHITECTURE_PLAN.md
- test-image-api.js
- true-realtime-voice-chat.html
- REALTIME_VOICE_MASTERY_GUIDE.md
- README.md
- PROJECT_central-mcp_05Sun12Oct2025.html
- professional-realtime-server.js
- AGENT_SOP_VOICE_SYSTEMS.md
- PROJECT_central-mcp_04Sun12Oct2025.html
- voice-orb-webrtc.html

**Overview:**
```
# 🎤 REALTIME CONVERSATION SYSTEM - COMPLETE ARCHIVE

## 📋 **SYSTEM OVERVIEW**

This is a complete **WebRTC-based real-time voice conversation system** that integrates with OpenAI's GPT-4o-mini-realtime-preview model using Doppler for secure API key management.

### **🚀 KEY FEATURES**
- ✅ **Ultra-low latency voice conversation** via WebRTC
- ✅ **Doppler integration** for secure API key management
- ✅ **Multiple interface options** from basic to professional
- ✅ **Real-time transcription** and conversation display
- ✅ **Production-ready security** with rate limiting and validation
- ✅ **Ephemeral key generation** for secure OpenAI access

---

## 📁 **FILE INVENTORY**

### **🔧 CORE SERVER FILES**
- `professional-realtime-server.js` - **MAIN SERVER** (35KB) - Complete production server with Doppler integration
- `professional-realtime-server.js.bak` - Backup of main server
- `realtime-server.js` - Simple server (basic functionality)

### **🎤 VOICE INTERFACES**
- `voice-orb-webrtc.html` - **MAIN WEBRTC INTERFACE** (24KB) - Professional voice orb with WebRTC
- `voice-to-voice-realtime.html` - Voice-to-voice conversation (34KB)
- `true-realtime-voice-chat.html` - True real-time voice chat (47KB)
- `professional-voice-chat.html` - Professional voice interface (46KB)
- `simple-realtime-chat.html` - Simple chat interface (15KB)
- `realtime-voice-chat.html` - Basic voice chat (18KB)
- `realtime-chat.html` - Basic text chat (12KB)

### **🧪 TESTING & UTILITIES**
- `test-doppler-session.js` - Doppler integration test (2.6KB)
- `test-realtime-api.js` - OpenAI Realtime API test (2.7KB)
- `test-image-api.js` - Image generation test (4.2KB)
- `test-image-1-mini.js` - GPT-4o-mini image test (4.6KB)

### **📊 LOGS & DOCUMENTATION**
- `server.log` - Server operation logs
- Various session files and documentation

---

## 🎯 **QUICK START GUIDE**

### **1. SETUP REQUIREMENTS**
```bash
# Install Doppler CLI
npm install -g @dopplerhq/cli

# Configure Doppler project
doppler login
doppler setup --project ai-tools --config dev
```

### **2. START THE MAIN SERVER**
```bash
# Start the production server with Doppler integration
node professional-realtime-server.js
```
**Server runs on:** `http://localhost:3003`

### **3. ACCESS INTERFACES**
- **🎤 Main WebRTC Voice Orb**: `http://localhost:3003/voice-orb-webrtc.html`
- **🗣️ Voice-to-Voice Chat**: `http://localhost:3003/voice-to-voice-realtime.html`
- **💬 Simple Chat**: `http://localhost:3003/simple-realtime-chat.html`

### **4. TEST DOPPLER INTEGRATION**
```bash
# Test API key retrieval and ephemeral key generation
node test-doppler-session.js
```

---

## 🔐 **SECURITY ARCHITECTURE**

### **DOPPLER INTEGRATION**
- **API Key Management**: Securely stored in Doppler vault
- **Ephemeral Tokens**: Short-lived keys for OpenAI access
- **No Hardcoded Secrets**: All credentials managed externally

### **WEBRTC PROXY SYSTEM**
- **Local Proxy**: `/v1/realtime` endpoint handles SDP exchange
- **CORS Protection**: Controlled cross-origin access
- **Authentication**: Bearer token validation
- **Rate Limiting**: Request throttling and abuse prevention

### **PRODUCTION FEATURES**
- **Input Validation**: Comprehensive request sanitization
- **Error Handling**: Graceful failure management
- **Memory Management**: Session cleanup and resource optimization
- **Health Monitoring**: Real-time system status tracking

---

## 🌐 **API ENDPOINTS**

### **Core Endpoints**
- `GET /session` - Generate ephemeral OpenAI API key
- `POST /v1/realtime` - WebRTC SDP exchange proxy
- `POST /chat-completion` - GPT-4 chat completion
- `POST /voice-streaming` - Real-time voice streaming
- `POST /text-to-speech` - OpenAI TTS synthesis
- `GET /status` - System health check

### **Response Format**
```json
{
  "value": "ek_68ec0e9029388191aa3fbc9c106f06b3",
  "client_secret": {
    "value": "ek_68ec0e9029388191aa3fbc9c106f06b3",
    "expires_at": 1760301288
  },
  "expires_at": 1760301288
}
```

---

## 🎮 **INTERFACE COMPARISON**

| Interface | Features | Complexity | Use Case |
|-----------|----------|------------|----------|
| **voice-orb-webrtc.html** | WebRTC, Professional UI, Diagnostics | ⭐⭐⭐⭐⭐ | Production |
| **voice-to-voice-realtime.html** | Voice-to-Voice, TTS Integration | ⭐⭐⭐⭐ | Advanced |
| **simple-realtime-chat.html** | Basic Chat, Easy Setup | ⭐⭐ | Testing |
| **realtime-chat.html** | Text Only, Minimal | ⭐ | Development |

---

## 🔧 **TECHNICAL SPECIFICATIONS**

### **Audio Configuration**
- **Format**: PCM16
- **Sample Rate**: 24kHz
- **Channels**: Mono
- **Buffer Size**: 4096 bytes
- **Codecs**: Opus, G.711

### **WebRTC Features**
- **Data Channels**: Real-time event communication
- **Media Streams**: Low-latency audio transport
- **ICE Candidates**: NAT traversal support
- **SDP Exchange**: Session description protocol

### **Performance Metrics**
- **Latency**: <100ms round-trip
- **Connection Time**: <2 seconds
- **Memory Usage**: <50MB per session
- **Concurrent Users**: 100+ (scalable)

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**
1. **"SDP exchange failed: 401"** → Check Doppler API key configuration
2. **"Not found" errors** → Ensure server is running on port 3003
3. **Microphone permission denied** → Grant browser microphone access
4. **Connection timeout** → Check internet connectivity and OpenAI API status

### **Debug Commands**
```bash
# Test Doppler integration
node test-doppler-session.js

# Check server logs
tail -f server.log

# Test OpenAI API directly
node test-realtime-api.js

# Verify ephemeral key generation
curl http://localhost:3003/session
```

---

## 📈 **SYSTEM ARCHITECTURE**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Voice Orb     │    │   Local Server   │    │   OpenAI API    │
│   (Browser)      │◄──►│  (port 3003)     │◄──►│  Realtime API   │
│                 │    │                  │    │                 │
│ • WebRTC        │    │ • Doppler Auth   │    │ • GPT-4o-mini   │
│ • Audio Stream  │    │ • SDP Proxy      │    │ • Voice Synthesis│
│ • UI/UX         │    │ • Rate Limiting  │    │ • Real-time     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## 🎯 **READY FOR CHATGPT-5 ANALYSIS**

This complete archive contains:
- ✅ **Production-ready server** with Doppler integration
- ✅ **Multiple voice interfaces** from basic to professional
- ✅ **Comprehensive testing suite** for all components
- ✅ **Complete documentation** and setup guides
- ✅ **Security best practices** and production features
- ✅ **Scalable architecture** ready for enterprise deployment

**Total Archive Size**: ~200KB of optimized, production-ready code

Perfect for analysis by ChatGPT-5 or any advanced AI system! 🚀
```


# 📋 Specifications

## 📋 SPEC: Auto-Proactive Intelligence Architecture [P0]

**Category:** SCAFFOLD | **Status:** ACTIVE


## 📋 SPEC: Specbase Construction Orchestrated Workflow [P0]

**Category:** GOVERNANCE | **Status:** ACTIVE


## 📋 SPEC: Atomic Project Categorization and Task Consolidation [P1]

**Category:** GOVERNANCE | **Status:** ACTIVE


# 🛠️ Available Tools

## 🛠️ TOOL: SKP Ingestion Pipeline

**Category:** central-mcp

**Description:** Specialized Knowledge Pack (SKP) ingestion, versioning, and management system

**Location:** `central-mcp/scripts/update-skp.sh`

**Capabilities:**


## 🛠️ TOOL: Backend Connections Registry

**Category:** central-mcp

**Description:** Real-time backend API and React component discovery engine

**Location:** `central-mcp/registry_discovery_engine.py`

**Capabilities:**


## 🛠️ TOOL: MR.FIX-MY-PROJECT(PLEASE!)

**Category:** universal

**Description:** Universal project intelligence analyzer with adaptive strategy (13,100 LOC megalith)

**Location:** `LocalBrain/mr-fix-my-project-please.py`

**Capabilities:**


## 🛠️ TOOL: Multi-Indexer Sniper Tagger Query Gun

**Category:** universal

**Description:** Surgical code querying and editing with semantic tags

**Location:** `LocalBrain/04_AGENT_FRAMEWORK/mcp-integration/SniperGunClient.ts`

**Deployed URL:** https://sniper-gun-mcp-635198490463.us-central1.run.app

**Capabilities:**


---

**End of Knowledge Package**
