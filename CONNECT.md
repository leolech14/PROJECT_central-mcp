# CONNECT TO CENTRAL-MCP

**Central-MCP Location:** `http://34.41.115.199:3000` (Live VM)

**Connection Command:**
```bash
curl -X POST http://34.41.115.199:3000/api/agents/connect \
  -H 'Content-Type: application/json' \
  -d '{"agent":"A","model":"YOUR_MODEL","project":"PROJECT_central-mcp"}'
```

**Replace:** `YOUR_MODEL` with your actual model (glm-4-6, claude-sonnet-4-5, etc.)

**You will receive:**
- Your agent identity
- Project status (% completion)
- Your assigned tasks
- Team status
- Clear next steps

**Then:** Start working on your assigned tasks.

---

**DO NOT** try to run Central-MCP locally - it's already live on the VM!
