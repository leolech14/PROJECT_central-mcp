# 🤖 AGENT START HERE

## ⚡ STEP 1: CONNECT

```bash
curl -X POST http://34.41.115.199:3000/api/agents/connect \
  -H 'Content-Type: application/json' \
  -d '{"agent":"A","model":"glm-4-6","project":"PROJECT_central-mcp"}'
```

**Change:**
- `"agent":"A"` → Your agent letter (A/B/C/D/E/F)
- `"model":"glm-4-6"` → Your actual model

---

## ⚡ STEP 2: READ RESPONSE

You'll get:
```
═══════════════════════════════════════════════════════════
🤖 CONNECTION ESTABLISHED
═══════════════════════════════════════════════════════════

NAME:            Agent A
PROJECT:         PROJECT_central-mcp
TASKS-PENDING:   X

YOUR TASKS:
  TASK-ID: T-XXX
  TITLE: ...

NEXT-STEP: Start with T-XXX
═══════════════════════════════════════════════════════════
```

---

## ⚡ STEP 3: START WORKING

Work on the task shown in NEXT-STEP.

---

**That's it. Central-MCP coordinates everything else.** ✅
