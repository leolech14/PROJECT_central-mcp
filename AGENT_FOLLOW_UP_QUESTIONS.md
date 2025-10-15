# Agent Follow-Up Questions - Evidence-Based Interrogation

**Generated:** 2025-10-14 22:08
**Methodology:** Trust evidence, not vibes. Demand artifacts for all claims.
**Dashboard:** 🎯 **Reality Check Dashboard LIVE** at http://localhost:8080

---

## 📋 QUESTIONS FOR AGENT 1 (VM Infrastructure Analysis)

### **CRITICAL ARTIFACT DEMANDS**

1. **Connectivity Contradiction Resolution**
   - **Artifact Required:** Raw outputs from:
     ```bash
     systemctl status central-mcp --no-pager
     curl -fsS http://localhost:3000/health
     journalctl -u central-mcp -n 200 --no-pager
     ```
   - **Question:** "You claimed server was 'offline' but proved working WebSocket. Provide exact timestamps and logs showing both states."

2. **Database Evidence Gap**
   - **Artifact Required:** Complete schema dump:
     ```bash
     sqlite3 /opt/central-mcp/data/registry.db ".schema"
     sqlite3 /opt/central-mcp/data/registry.db ".tables"
     sqlite3 /opt/central-mcp/data/registry.db "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
     ```
   - **Question:** "List the MISSING 112 tables (156-44) by name and purpose. Are these TODOs or fictional?"

3. **Loop Investigation Protocol**
   - **Artifact Required:** Code entrypoints and process trees:
     ```bash
     find /opt/central-mcp -name "*loop*" -type f
     ps aux | grep -E "(loop|auto)" | grep -v grep
     ls -la /opt/central-mcp/dist/auto-proactive/
     ```
   - **Question:** "Show the EXACT code files that would make the 9 loops operational. If they don't exist, label them as TODOs."

4. **MCP Integration Evidence**
   - **Artifact Required:** WebSocket connection logs:
     ```bash
     journalctl -u central-mcp | grep -i "websocket\|mcp\|connection"
     ss -tulpn | grep :3000
     curl -sS http://localhost:3000/mcp || echo "No MCP endpoint"
     ```
   - **Question:** "Your WebSocket test worked - show the persistent logs proving continuous operation vs one-time success."

5. **Performance Impact Validation**
   - **Artifact Required:** Resource usage before/after:
     ```bash
     ps aux | grep -E "(PhotonServer|photon)" | head -5
     free -h
     df -h /opt/central-mcp/
     ```
   - **Question:** "You claimed 455MB waste but found no processes. Show evidence of actual vs theoretical waste."

---

## 📋 QUESTIONS FOR AGENT 2 (Implementation Status & Priorities)

### **STRATEGY VALIDATION DEMANDS**

1. **Dashboard First - Scope Lock**
   - **Evidence Required:** V0 dashboard showing exactly 4 facts:
     - Systemd unit state (`systemctl is-active central-mcp`)
     - Health endpoint result (`curl -fsS localhost:3000/health`)
     - Database table count (`sqlite3 ... ".tables" | wc -l`)
     - Tasks record count (`sqlite3 ... "SELECT COUNT(*) FROM tasks;"`)
   - **Question:** "Confirm the dashboard shows these exact 4 metrics. Timebox: 2 hours maximum."

2. **Cleanup vs Build Priority Evidence**
   - **Evidence Required:** Process listing without killing:
     ```bash
     ps aux | egrep '(node|python|http.server|snapshot-zsh)' | head -10
     lsof -i :3000 -i :8000 -i :8001 | head -5
     ```
   - **Question:** "Agent 1 found no PhotonServer processes. Show current resource waste evidence vs theoretical claims."

3. **7-Day Target Definition**
   - **Evidence Required:** Pass/fail metrics for "85% usable":
     - What specific buttons/tiles must be green?
     - What user workflows must complete end-to-end?
     - What response time thresholds constitute "usable"?
   - **Question:** "Define measurable success criteria, not vague percentages."

4. **Risk Assessment Contradiction**
   - **Evidence Required:** Actual failure rates:
     ```bash
     journalctl -b | grep -i "error\|fail" | wc -l
     ping -c 3 136.112.123.243
     curl -sS http://136.112.123.243:3000/health || echo "VM health check failed"
     ```
   - **Question:** "You claim 10% catastrophic failure vs Agent 1's 25%. Provide evidence supporting lower risk."

5. **Success Rate Reality Check**
   - **Evidence Required:** Current working features:
     ```bash
     find /opt/central-mcp -name "*.js" -exec node -c {} \; 2>/dev/null && echo "Syntax OK"
     npm test 2>/dev/null || echo "No tests - manual verification needed"
     ```
   - **Question:** "With working MCP integration and verified database, shouldn't solo dev success rate be higher than 40-60%?"

---

## 🎯 **DASHBOARD VALIDATION FRAMEWORK**

### **Live Evidence URL:** http://localhost:8080

**What the Dashboard PROVES:**
- ✅ **MCP Bridge Status:** WebSocket connection verified working
- ✅ **Database Reality:** 44 tables, 19 tasks (Agent 1 verified)
- ✅ **Git State:** Commit 9c61ff4a (current baseline)
- ✅ **System Assessment:** 40% real, 30% theoretical

**What Agents MUST Address:**
1. **Contradiction Resolution:** Why different connectivity assessments?
2. **Evidence Gap:** 112 missing tables vs 44 verified
3. **Loop Reality:** Code files vs theoretical features
4. **Performance Reality:** Actual waste vs theoretical claims

---

## 🚨 **ACCEPTANCE CRITERIA FOR AGENT RESPONSES**

### **Agent 1 Must Provide:**
- [ ] Raw command outputs (not summaries)
- [ ] Exact file paths for loop implementations
- [ ] Timestamped logs showing connectivity states
- [ ] Database schema evidence for missing tables

### **Agent 2 Must Provide:**
- [ ] Measurable 7-day success criteria
- [ ] Current resource usage evidence
- [ ] Risk assessment with supporting data
- [ ] Validation of dashboard accuracy

### **Both Agents Must:**
- [ ] Acknowledge dashboard findings as ground truth
- [ ] Resolve contradictions in their assessments
- [ ] Provide actionable next steps based on evidence
- [ ] Commit to specific, measurable deliverables

---

## 📊 **CURRENT GROUND TRUTH (Dashboard Verified)**

```json
{
  "timestamp": "2025-10-14T22:08:53.417Z",
  "system": {
    "unit": "active",
    "health": "down",
    "gitCommit": "9c61ff4a",
    "vmUptime": "2 days"
  },
  "database": {
    "tables": 44,
    "tasks": 19,
    "reality": "44 tables verified by Agent 1 (not 156 theoretical)"
  },
  "integration": {
    "mcpBridge": "connected",
    "evidence": "WebSocket connects to ws://136.112.123.243:3000/mcp"
  },
  "assessment": {
    "implementationStatus": "40% real, 30% theoretical",
    "biggestGap": "Frontend visibility - backend power invisible",
    "nextPriority": "Dashboard for showing what actually works"
  }
}
```

---

**Next Step:** Send these questions to the respective agents with the requirement that they reference the live dashboard at http://localhost:8080 as the ground truth for all claims.

**No more theoretical assessments - evidence only!** 🎯