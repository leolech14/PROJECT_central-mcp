# 🧪 CHROME MCP TESTING GUIDE

## 🎯 PURPOSE
Complete guide for testing the realtime voice system using Chrome's built-in MCP capabilities.

---

## 📋 CHROME MCP SETUP

### **Step 1: Enable Chrome MCP (Model Context Protocol)**

#### **Enable Experimental Features**
1. Open Chrome
2. Navigate to: `chrome://flags/`
3. Search for: "Enable Model Context Protocol"
4. Set to: **Enabled**
5. Relaunch Chrome

#### **Access MCP Settings**
1. Open Chrome Settings
2. Navigate to: `chrome://settings/ai` (or `chrome://settings/mcp`)
3. Enable "Model Context Protocol"
4. Add MCP server configuration

### **Step 2: Configure MCP Server**

#### **MCP Server Configuration**
```json
{
  "name": "Realtime Voice System",
  "description": "WebRTC-based real-time voice conversation with context injection",
  "version": "1.0.0",
  "serverUrl": "http://localhost:3003",
  "authentication": {
    "type": "none"
  },
  "capabilities": [
    "text_generation",
    "voice_conversation",
    "context_injection"
  ]
}
```

#### **Add to Chrome MCP**
1. In Chrome MCP settings, click "Add server"
2. Paste the configuration above
3. Save and restart Chrome

---

## 🧪 TESTING PROCEDURES

### **Test 1: Basic MCP Connection**

#### **Start the Server**
```bash
cd realtime-voice-system
node server.js
```

#### **Verify MCP Connection**
1. Open Chrome DevTools
2. Go to "Model Context Protocol" tab
3. Check server status
4. Expected: "Connected" status

#### **Test MCP Tools**
```javascript
// In Chrome DevTools Console
const mcp = await chrome.experimental.modelContextProtocol;

// Test server status
const status = await mcp.callTool('server_status');
console.log('Server Status:', status);

// Test session creation
const session = await mcp.callTool('create_session');
console.log('Session:', session);
```

### **Test 2: Voice Conversation Flow**

#### **WebRTC Connection Test**
```javascript
// Test WebRTC capabilities
const rtcTest = await mcp.callTool('test_webrtc_connection');
console.log('WebRTC Test:', rtcTest);
```

#### **Microphone Permission Test**
```javascript
// Test microphone access
const micTest = await mcp.callTool('test_microphone');
console.log('Microphone Test:', micTest);
```

#### **Voice Conversation Test**
```javascript
// Start voice conversation
const conversation = await mcp.callTool('start_voice_conversation', {
  voice: 'maple',
  instructions: 'Be helpful and concise'
});
console.log('Conversation Started:', conversation);
```

### **Test 3: Context Injection**

#### **Context Injection Test**
```javascript
// Inject context into conversation
const context = await mcp.callTool('inject_context', {
  facts: [
    { id: 'weather', text: 'Current temperature is 22°C', timestamp: Date.now() },
    { id: 'news', text: 'Tech stocks are up 2.3%', timestamp: Date.now() }
  ],
  maxTokens: 1000
});
console.log('Context Injected:', context);
```

#### **Verify Context Usage**
```javascript
// Check if context was used
const contextCheck = await mcp.callTool('verify_context_usage');
console.log('Context Usage:', contextCheck);
```

### **Test 4: Barge-in Functionality**

#### **Interruption Test**
```javascript
// Test barge-in capabilities
const bargeTest = await mcp.callTool('test_barge_in', {
  simulateInterruption: true,
  interruptionTiming: 'mid-sentence'
});
console.log('Barge-in Test:', bargeTest);
```

---

## 🔍 EXPECTED RESULTS

### **Successful Test Indicators**
- ✅ **MCP Connection**: Chrome shows "Connected" status
- ✅ **Server Status**: Returns `{"status":"healthy","version":"1.0.0"}`
- ✅ **Session Creation**: Returns valid `ek_...` ephemeral key
- ✅ **WebRTC Connection**: Establishes peer connection
- ✅ **Voice Recognition**: Detects user speech
- ✅ **Context Injection**: Successfully injects and summarizes facts
- ✅ **Barge-in**: Responds to interruption with `{"type":"response.cancel"}`

### **Chrome MCP Integration Points**
- **Tool Discovery**: Chrome discovers available tools via MCP
- **Text Generation**: Uses Chrome's built-in text generation
- **Voice Integration**: Leverages Chrome's WebRTC capabilities
- **Context Management**: Uses Chrome's context injection system

---

## 🐛 TROUBLESHOOTING

### **Common Issues & Solutions**

#### **Issue 1: MCP Not Connecting**
```
Problem: Chrome shows "Failed to connect" error
Solution:
1. Verify server is running: node server.js
2. Check port: curl http://localhost:3003/status
3. Ensure Chrome MCP is enabled in flags
4. Check firewall settings
```

#### **Issue 2: WebRTC Not Working**
```
Problem: WebRTC connection fails
Solution:
1. Check HTTPS requirement (localhost allowed)
2. Verify microphone permissions
3. Test with different browser
4. Check TURN server configuration
```

#### **Issue 3: Context Injection Failing**
```
Problem: Context not being injected
Solution:
1. Verify context injection endpoint exists
2. Check token counting (<1000 tokens)
3. Test with smaller context
4. Verify JSON format
```

#### **Issue 4: Barge-in Not Working**
```
Problem: Interruption not working
Solution:
1. Verify response.cancel implementation
2. Check timing of speech detection
3. Test with longer AI responses
4. Verify VAD settings
```

---

## 📊 PERFORMANCE MONITORING

### **Chrome MCP Metrics**
```javascript
// Monitor MCP performance
const metrics = await mcp.callTool('get_metrics');
console.log('MCP Metrics:', metrics);
```

### **Expected Performance**
- **Connection Time**: <2 seconds
- **Tool Response**: <500ms
- **Context Injection**: <200ms
- **Voice Latency**: <600ms (as designed)

---

## 🎯 SUCCESS CRITERIA

### **Complete Success Indicators**
- ✅ Chrome MCP connects successfully
- ✅ All tools discovered and functional
- ✅ Voice conversation works end-to-end
- ✅ Context injection successful
- ✅ Barge-in functionality working
- ✅ Performance targets met

### **Partial Success (Acceptable)**
- ⚠️ Basic MCP connection works
- ⚠️ Some tools functional
- ⚠️ Voice conversation with limitations
- ⚠️ Context injection works partially

### **Failure (Needs Investigation)**
- ❌ MCP connection fails
- ❌ No tools discovered
- ❌ Voice conversation not working
- ❌ Context injection failing

---

## 🚀 ADVANCED TESTING

### **Stress Testing**
```javascript
// Multiple concurrent conversations
const stressTest = await mcp.callTool('stress_test', {
  concurrent_sessions: 5,
  duration_seconds: 60,
  context_injection_rate: 'high'
});
```

### **Cross-Browser Testing**
Test with:
- ✅ Chrome (Primary MCP support)
- ⚠️ Edge (Limited MCP support)
- ❌ Firefox (No MCP support)

### **Real-time Monitoring**
```javascript
// Monitor system health during testing
setInterval(async () => {
  const health = await mcp.callTool('system_health');
  console.log('System Health:', health);
}, 5000);
```

---

## 📋 TEST CHECKLIST

### **Pre-Test Checklist**
- [ ] Server running on port 3003
- [ ] Chrome MCP enabled in flags
- [ ] MCP server configured in Chrome
- [ ] Microphone permissions granted
- [ ] HTTPS or localhost context

### **During Test Checklist**
- [ ] MCP connection established
- [ ] Tools discovered successfully
- [ ] Voice conversation initiated
- [ ] Context injection working
- [ ] Barge-in functionality verified
- [ ] Performance metrics collected

### **Post-Test Checklist**
- [ ] Results documented
- [ ] Issues identified and resolved
- [ ] Performance metrics analyzed
- [ ] Chrome MCP logs reviewed
- [ ] System health confirmed

---

## 🎯 DEFINITION OF DONE

**Chrome MCP testing is complete when:**

✅ **MCP Integration**: Chrome successfully connects to the voice system
✅ **Tool Discovery**: All available tools discovered and functional
✅ **Voice Conversation**: End-to-end voice conversation working
✅ **Context Injection**: External facts successfully injected
✅ **Barge-in**: Interruption functionality verified
✅ **Performance**: All targets met or documented
✅ **Troubleshooting**: Common issues resolved

**Result: The realtime voice system is fully validated through Chrome MCP and ready for production use!** 🚀