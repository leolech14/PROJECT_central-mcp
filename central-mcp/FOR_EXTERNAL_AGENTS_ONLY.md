# 🌐 FOR EXTERNAL AGENTS ONLY (GLM, GPT, etc.)

**If you're a Claude Code agent, IGNORE this file - you already have context!**

---

## ⚡ External Agent Connection

**For agents running on:**
- Z.AI (GLM-4.6)
- OpenAI Platform (ChatGPT-5)
- Google AI (Gemini)
- Other platforms

**Connect via HTTP:**
```bash
curl -X POST http://34.41.115.199:3001/api/agents/connect \
  -H 'Content-Type: application/json' \
  -d '{"agent":"A","model":"glm-4-6","project":"PROJECT_central-mcp"}'
```

**You'll receive:**
- Agent identity
- Project status
- Assigned tasks
- Next steps

---

**Claude Code agents: Don't use this - you have CLAUDE.md!**
