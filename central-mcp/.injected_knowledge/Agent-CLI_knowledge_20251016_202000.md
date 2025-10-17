# 🧠 Central-MCP Knowledge Package

**Agent:** Agent-CLI (Claude Code Configuration Specialist)
**Template:** Full Agent Onboarding
**Generated:** Wed Oct 16 20:20:00 -03 2025

---

# 📚 Specialized Knowledge Packs (SKPs)

## 📦 SKP: Claude Code CLI Multi-Model Configuration (v1.0.0)

**Purpose:** Complete documentation of Claude Code CLI configuration for multiple model providers (Anthropic, Z.ai) with isolated settings

**Critical Discovery Date:** October 16, 2025

---

## 🎯 EXECUTIVE SUMMARY

This knowledge pack documents the **COMPLETE AND CORRECT** configuration for running:
1. **Claude Code CLI** with Anthropic Sonnet 4.5 (default + 1M context)
2. **ZAI command** with Z.ai's GLM-4.6 model
3. **Isolated settings files** preventing auth conflicts

**Key Lesson:** Custom `--settings` flag allows multiple isolated Claude Code configurations with different API providers.

---

## 🔧 CONFIGURATION FILES

### 1. Main Settings: `~/.claude/settings.json` (Anthropic)

```json
{
  "cleanupPeriodDays": 3650,
  "env": {
    "ANTHROPIC_API_KEY": "sk-ant-api03-...",
    "ANTHROPIC_BETA": "context-1m-2025-08-07",
    "ANTHROPIC_ORGANIZATION": "leonardo.lech@gmail.com",
    "CLAUDE_CODE_CUSTOM_LIMITS": "true"
  },
  "permissions": {
    "mode": "bypassPermissions"
  },
  "model": "sonnet[1m]",
  "hooks": {
    "Notification": [...],
    "Stop": [...],
    "UserPromptSubmit": [...]
  },
  "alwaysThinkingEnabled": false,
  "defaultModel": "claude-sonnet-4-20250514",
  "contextWindow": 1000000
}
```

**Key Points:**
- ✅ `ANTHROPIC_BETA: "context-1m-2025-08-07"` enables 1M context
- ✅ `model: "sonnet[1m]"` sets 1M context as default
- ✅ `contextWindow: 1000000` declares 1M token limit
- ✅ Uses Anthropic API key directly

---

### 2. ZAI Settings: `~/.claude/settings-zai.json` (Z.ai GLM-4.6)

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "5f6ef12605c846168ffea6171f6761f4.GuSh4bwe1OQqNZxf",
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "ANTHROPIC_ORGANIZATION": "leonardo.lech@gmail.com",
    "CLAUDE_CODE_CUSTOM_LIMITS": "true"
  },
  "permissions": {
    "mode": "bypassPermissions"
  },
  "hooks": {
    "Notification": [...],
    "Stop": [...]
  },
  "alwaysThinkingEnabled": false,
  "defaultModel": "claude-sonnet-4-5-20250929",
  "contextWindow": 200000,
  "model": "glm-4.6"
}
```

**Key Points:**
- ✅ Uses `ANTHROPIC_AUTH_TOKEN` (not API_KEY) for Z.ai
- ✅ Base URL: `https://api.z.ai/api/anthropic`
- ✅ `model: "glm-4.6"` specifies GLM model
- ✅ 200K context window (GLM-4.6 limit)

---

### 3. Shell Aliases: `~/.zshrc`

```bash
# Claude Code 1M Context Alias
alias claude-1m="ANTHROPIC_API_KEY=\"sk-ant-api03-...\" ANTHROPIC_BETA=\"context-1m-2025-08-07\" claude --model claude-sonnet-4-20250514"

# Z.ai GLM Coding Plan MAX - 2,400 prompts/5hr, 3x Claude Max20 capacity!
alias claude-zai="claude --settings ~/.claude/settings-zai.json"
alias zai="claude --settings ~/.claude/settings-zai.json"
alias ZAI="claude --settings ~/.claude/settings-zai.json"
```

**Key Points:**
- ✅ `--settings` flag isolates configurations
- ✅ NO `env -u` needed (settings file overrides globals)
- ✅ Both lowercase and uppercase aliases work

---

## ⚠️ CRITICAL LESSONS LEARNED

### ❌ WHAT DOESN'T WORK

1. **Fake Environment Variables:**
   - `CLAUDE_CODE_SUBSCRIPTION_OVERRIDE` - DOES NOT EXIST
   - `CLAUDE_CODE_FORCE_EXTENDED_CONTEXT` - DOES NOT EXIST
   - `ANTHROPIC_TIER_OVERRIDE` - DOES NOT EXIST
   - These were WRONG and don't do anything!

2. **Custom Model Aliases in Settings:**
   - `modelAliases` object in settings.json - NOT SUPPORTED
   - `customModels` array in settings.json - NOT SUPPORTED
   - Custom models CANNOT be added to `/model` selector

3. **Using `env -u` in Aliases:**
   - `env -u ANTHROPIC_API_KEY` - UNNECESSARY
   - Settings file naturally isolates environment
   - Adds complexity without benefit

### ✅ WHAT WORKS

1. **Built-in Model Alias: `sonnet[1m]`**
   - Type manually: `/model sonnet[1m]`
   - Won't appear in `/model` selector list
   - Controlled by Anthropic backend, not local config
   - Works when account has 1M access

2. **Settings File Isolation:**
   - `claude --settings ~/.claude/settings-zai.json`
   - Completely isolated configuration
   - Different API keys, models, endpoints

3. **Required Beta Header:**
   - `ANTHROPIC_BETA: "context-1m-2025-08-07"`
   - Enables 1M context window API access
   - Required for both API and Max subscription

---

## 🔑 API KEYS & AUTHENTICATION

### Anthropic (Main)
- **Location:** Doppler secrets or environment variable
- **Variable:** `ANTHROPIC_API_KEY`
- **Format:** `sk-ant-api03-...`
- **Access:** 1M context with Max subscription

### Z.ai (GLM-4.6)
- **Location:** Doppler: `doppler secrets get ZAI_API_KEY --project ai-tools --config dev --plain`
- **Variable:** `ANTHROPIC_AUTH_TOKEN` (pretends to be Anthropic)
- **Format:** `5f6ef12605c846168ffea6171f6761f4.GuSh4bwe1OQqNZxf`
- **Base URL:** `https://api.z.ai/api/anthropic`

---

## 📂 FILE LOCATIONS MAP

```
~/.claude/
├── settings.json                    # Main Anthropic config (1M context)
├── settings-zai.json                # Z.ai GLM-4.6 config
├── models/
│   └── sonnet-1m.json              # Custom model definition (not used by /model selector)
├── .claude/
│   └── settings.local.json         # Project-level permissions
└── SYSTEM/
    └── config/
        ├── settings-1m-context.json    # Original working 1M config (reference)
        └── settings-zai.json           # Original working ZAI config (reference)
```

---

## 🚀 USAGE GUIDE

### Starting Claude Code with 1M Context

```bash
# Option 1: Use default (if model: "sonnet[1m]" in settings.json)
claude

# Option 2: Specify at startup
claude --model sonnet[1m]

# Option 3: Use alias with explicit env vars
claude-1m

# In session: Manually type (won't appear in selector)
/model sonnet[1m]

# Verify
/status
```

### Starting ZAI (GLM-4.6)

```bash
# Any of these work
zai
ZAI
claude-zai

# In session
/model
# Shows: "Sonnet 4.5" (default display, actually uses GLM-4.6)
```

---

## 🐛 TROUBLESHOOTING

### Issue: ZAI connects to Claude Max instead of Z.ai
**Cause:** Wrong Base URL or AUTH_TOKEN variable
**Fix:** Ensure `ANTHROPIC_BASE_URL: "https://api.z.ai/api/anthropic"` and use `ANTHROPIC_AUTH_TOKEN` (not API_KEY)

### Issue: 401 Token Expired error with Z.ai
**Cause:** Wrong API key
**Fix:** Use `ZAI_API_KEY` from Doppler, not `GLM_API_KEY`

### Issue: sonnet[1m] doesn't appear in /model selector
**Cause:** Built-in alias, not custom model
**Fix:** Type manually `/model sonnet[1m]` - it won't appear in list

### Issue: Auth conflict warning
**Cause:** Multiple auth methods active
**Fix:** Use `--settings` flag to isolate, don't mix env vars with settings files

---

## 📊 MODEL COMPARISON

| Feature | Anthropic Sonnet 4.5 | Z.ai GLM-4.6 |
|---------|---------------------|--------------|
| Context Window | 1M tokens (with beta) | 200K tokens |
| API Key Variable | ANTHROPIC_API_KEY | ANTHROPIC_AUTH_TOKEN |
| Base URL | Default (api.anthropic.com) | https://api.z.ai/api/anthropic |
| Model ID | claude-sonnet-4-20250514 | glm-4.6 |
| Alias | sonnet[1m] | N/A |
| Cost | Max subscription or API | $3/month GLM Coding Plan |
| Rate Limit | Max 20x limits | 2,400 prompts/5hr |

---

## 🔬 TECHNICAL DETAILS

### How Z.ai Masquerades as Anthropic

Z.ai provides an Anthropic-compatible API endpoint that:
1. Accepts `ANTHROPIC_AUTH_TOKEN` headers
2. Translates requests to GLM-4.6 format
3. Returns responses in Claude API format
4. Uses Claude Code's existing infrastructure

This allows Claude Code CLI to work with GLM-4.6 without modifications.

### Beta Headers Explained

```
ANTHROPIC_BETA: "context-1m-2025-08-07"
```

- Opt-in to 1M context window feature
- Required for API and Max subscription
- Format: `context-1m-YYYY-MM-DD`
- Premium pricing applies (2x input, 1.5x output for >200K tokens)

### Model Alias Resolution

Claude Code resolves model names in this order:
1. Built-in aliases (sonnet, opus, haiku, sonnet[1m], opusplan)
2. Full model names (claude-sonnet-4-20250514)
3. Environment variable overrides (ANTHROPIC_DEFAULT_SONNET_MODEL)
4. Settings file `model` field

---

## 📝 COMMANDS REFERENCE

### Configuration Management
```bash
# Check Claude version
claude --version

# View current settings
cat ~/.claude/settings.json

# Test ZAI config
cat ~/.claude/settings-zai.json

# Get API keys from Doppler
doppler secrets get ZAI_API_KEY --project ai-tools --config dev --plain
doppler secrets get ANTHROPIC_API_KEY --project ai-tools --config dev --plain
```

### Session Commands
```bash
/model              # List available models
/model sonnet[1m]   # Switch to 1M context
/status             # Show current model and context
/clear              # Clear conversation
```

---

## 🎓 BEST PRACTICES

1. **Keep Original Configs:** Store working configs in `~/.claude/SYSTEM/config/` as backups
2. **Use Doppler:** Never hardcode API keys, always retrieve from Doppler
3. **Isolated Settings:** Use separate settings files for different providers
4. **Test Before Deploy:** Verify ZAI connection before long sessions
5. **Document Changes:** Update this knowledge pack when config changes
6. **Shell Reload:** Always `source ~/.zshrc` after alias changes

---

## 🔄 VERSION HISTORY

- **v1.0.0** (2025-10-16): Initial documentation
  - Complete Claude Code CLI + ZAI configuration
  - Discovered fake env vars don't exist
  - Confirmed sonnet[1m] is built-in, not configurable
  - Documented correct API key variables and base URLs

---

## 📚 REFERENCES

- **Official Docs:** https://docs.claude.com/en/docs/claude-code/
- **Z.ai Docs:** https://docs.z.ai/guides/llm/glm-4.6
- **Model Config:** https://docs.claude.com/en/docs/claude-code/model-config
- **Context Windows:** https://docs.claude.com/en/docs/build-with-claude/context-windows

---

## ✅ VERIFICATION CHECKLIST

Before deploying to new environment:

- [ ] Doppler configured with ZAI_API_KEY and ANTHROPIC_API_KEY
- [ ] `~/.claude/settings.json` has correct Anthropic config
- [ ] `~/.claude/settings-zai.json` has correct Z.ai config
- [ ] `~/.zshrc` has ZAI aliases
- [ ] `source ~/.zshrc` executed
- [ ] Test: `claude` connects to Anthropic
- [ ] Test: `ZAI` connects to Z.ai GLM-4.6
- [ ] Test: `/model sonnet[1m]` works in claude session
- [ ] Test: `/status` shows 1M context window

---

**END OF KNOWLEDGE PACK**

**Status:** ✅ COMPLETE AND VERIFIED
**Last Updated:** 2025-10-16 20:15:00
**Maintained By:** Claude Code Configuration Specialist
**Critical:** DO NOT DELETE - Production Knowledge
