---
spec_id: SPEC_0021
title: AI Model Integration & Subscription Management
status: IN_PROGRESS
priority: P0-CRITICAL
author: User + Agent B (Sonnet 4.5)
created_at: 2025-10-11
updated_at: 2025-10-11

# USER REQUIREMENTS (Captured from conversation):
# "WE MUST GET ANTHROPIC'S ENTERPRISE ACCOUNT LIMITS AND GET THE SONNET 4.5 1M CONTEXT WINDOW!"
# "AI IS SOMETHING THAT MUST BE STICKED TO ANYTHING IN ANY PLACE DEEP INTO ITS CORE!"
# "TOP OF THE CLASS MODELS RUNNING THIS THING DEEPLY!"

validation:
  spec_structure:
    required_sections:
      - Overview
      - Requirements
      - Model Registry Architecture
      - LLM Orchestration
      - Integration Points
      - Anthropic Enterprise Setup
      - Cost Management
      - Success Criteria
    min_words: 1200
    max_words: 4000

  implementation:
    required_files:
      - src/ai/ModelRegistry.ts
      - src/ai/LLMOrchestrator.ts
      - src/ai/AnthropicClient.ts
      - src/database/migrations/010_ai_models_subscriptions.sql
    required_tests:
      - tests/ai/ModelRegistry.test.ts
      - tests/ai/LLMOrchestrator.test.ts
    min_coverage: 80
    git_requirements:
      conventional_commits: true

  runtime_performance:
    metrics:
      - name: model_selection_time
        target: 100
        unit: ms
        operator: lt
      - name: llm_response_time
        target: 5000
        unit: ms
        operator: lt
      - name: cost_per_request
        target: 0.10
        unit: usd
        operator: lt
    health_check:
      url: http://localhost:3000/api/ai/health
      expected_status: 200

  browser_testing:
    enabled: false
---

# SPEC_0021: AI Model Integration & Subscription Management

## Overview

Central-MCP requires **DEEP AI INTEGRATION** at every layer of the system. This is not about adding AI as a helper - it's about making AI **THE CORE INTELLIGENCE** that powers:

- Message understanding
- Spec generation
- Task breakdown
- Code generation
- Validation
- Strategic planning

### The Vision

"AI is something that must be sticked to anything in any place deep into its core!" - User

Central-MCP uses **TOP OF THE CLASS** AI models:

**CURRENT STACK (Available Now):**
- **Claude Sonnet 4.5** (200K context) - PRIMARY
- **Gemini 2.5 Pro** (1M context) - LARGE CONTEXT
- **GLM-4.6** (200K context, free) - FALLBACK
- **ChatGPT-5 Pro** - CLOUD SUPERVISOR

**FUTURE GOALS:**
- **Claude Sonnet 4.5** (1M context) - When Enterprise available
- **Claude Opus 4** - Maximum intelligence

### Key Requirements

1. **Model Registry System** ✅ IMPLEMENTED
   - Track all available models
   - Manage subscriptions and API keys
   - Monitor usage and costs
   - Health check models

2. **Intelligent Routing** ✅ IMPLEMENTED
   - Select optimal model for each task
   - Consider context size, cost, capabilities
   - Fallback on failures
   - Rate limit management

3. **Deep Integration** 🎯 PLANNED
   - IntelligenceEngine uses LLMs
   - SpecGenerationLoop uses LLMs
   - TaskGenerator uses LLMs
   - Validation uses LLMs
   - Every decision point has AI

4. **Anthropic Enterprise Account** 🎯 FUTURE GOAL
   - Sonnet 4.5 with **1M context window**
   - Higher rate limits (4000 req/min)
   - Priority access
   - Enterprise support

---

## Requirements

### Functional Requirements

**FR-01: Model Registry**
- System shall track all available AI models
- System shall store model capabilities (context window, cost, speed)
- System shall manage multiple subscriptions
- System shall enable/disable models based on subscription tier

**FR-02: LLM Orchestration**
- System shall route requests to optimal model
- System shall consider: purpose, context size, cost, availability
- System shall provide fallback models
- System shall handle streaming responses

**FR-03: Subscription Management**
- System shall support multiple providers (Anthropic, OpenAI, Google, Z.AI)
- System shall track account tiers (Free, Pro, Team, Enterprise)
- System shall monitor rate limits
- System shall track monthly budgets and spending

**FR-04: Usage Tracking**
- System shall log every LLM request
- System shall track tokens used (input + output)
- System shall calculate costs
- System shall generate usage reports

**FR-05: Deep Integration**
- IntelligenceEngine shall use LLMs for insight extraction
- SpecGenerationLoop shall use LLMs for spec creation
- IntelligentTaskGenerator shall use LLMs for task breakdown
- SpecLifecycleValidator shall use LLMs for validation

### Non-Functional Requirements

**NFR-01: Performance**
- Model selection: <100ms
- LLM response: <5 seconds average
- Rate limit enforcement: <10ms

**NFR-02: Cost Management**
- Track spending in real-time
- Alert when budget exceeded
- Optimize model selection for cost

**NFR-03: Reliability**
- Automatic fallback on failures
- Retry logic with exponential backoff
- Health monitoring

**NFR-04: Security**
- API keys encrypted at rest
- Secure transmission
- No key leakage in logs

---

## Model Registry Architecture

### Core Components

```typescript
// ModelDefinition - Each AI model
interface ModelDefinition {
  id: string;
  provider: 'anthropic' | 'openai' | 'google' | 'z.ai';
  modelId: string;
  displayName: string;
  tier: 'free' | 'pro' | 'team' | 'enterprise';

  // Capabilities
  contextWindow: number;             // 1000000 for 1M context!
  maxOutputTokens: number;
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  supportsVision: boolean;

  // Performance & Cost
  costPer1MInputTokens: number;
  costPer1MOutputTokens: number;
  tokensPerSecond: number;

  // Rate Limits
  requestsPerMinute: number;
  tokensPerMinute: number;
  requestsPerDay: number;

  // Specializations
  bestFor: string[];                 // What this model excels at
}

// Subscription - Account management
interface Subscription {
  id: string;
  provider: string;
  accountTier: 'free' | 'pro' | 'team' | 'enterprise';
  apiKey: string;                    // Encrypted
  monthlyBudget?: number;
  currentSpend: number;
  active: boolean;
}
```

### Registered Models

---

## 🟢 CURRENT AVAILABLE MODELS (2025-10-11)

**PRIMARY MODEL:**

1. **Claude Sonnet 4.5 (200K Context)** ✅ AVAILABLE NOW
   - Model ID: `claude-sonnet-4-20241022`
   - Context: **200,000 tokens**
   - Cost: $3/1M input, $15/1M output
   - Rate Limit: 1000 req/min (Pro tier)
   - Best For: Spec generation, task breakdown, code generation, validation
   - Status: ✅ PRIMARY - Available now

**FALLBACK MODELS:**

2. **GLM-4.6 (200K Context, FREE)** ✅ AVAILABLE NOW
   - Model ID: `glm-4-6`
   - Context: **200,000 tokens**
   - Cost: **$0** (FREE!)
   - Rate Limit: 60 req/min
   - Best For: Experimentation, high-volume, cost-sensitive workloads
   - Status: ✅ Available now

3. **Gemini 2.5 Pro (1M Context)** ✅ AVAILABLE NOW
   - Model ID: `gemini-2.5-pro`
   - Context: **1,000,000 tokens** (LARGEST AVAILABLE!)
   - Cost: $0 (free tier)
   - Rate Limit: 1500 req/min
   - Best For: Full project context, large documents, multimodal
   - Status: ✅ Available now with 1M context!

4. **Gemini 2.0 Flash (1M Context)** ✅ AVAILABLE NOW
   - Model ID: `gemini-2.0-flash-exp`
   - Context: 1,000,000 tokens
   - Cost: $0 (free tier)
   - Rate Limit: 1500 req/min
   - Best For: Fast processing, high-volume, multimodal

5. **ChatGPT-5 Pro (Cloud Supervisor)** ✅ AVAILABLE NOW
   - Model ID: `gpt-5`
   - Context: 200,000 tokens (estimated)
   - Cost: $10/1M input, $30/1M output (estimated)
   - Rate Limit: 1000 req/min
   - Best For: Strategic planning, supervision, high-level decisions, coordination
   - Status: ✅ Cloud Supervisor role

---

## 🔵 FUTURE GOALS (Not Yet Available)

**ANTHROPIC ENTERPRISE:**

6. **Claude Sonnet 4.5 (1M Context)** 🎯 FUTURE GOAL
   - Model ID: `claude-sonnet-4.5-20250929`
   - Context: **1,000,000 tokens** (REVOLUTIONARY!)
   - Cost: $3/1M input, $15/1M output
   - Rate Limit: 4000 req/min (Enterprise tier)
   - Best For: Full project context, architecture, complex reasoning
   - Status: 🎯 Requires Anthropic Enterprise subscription

7. **Claude Opus 4 (Maximum Intelligence)** 🎯 FUTURE GOAL
   - Model ID: `claude-opus-4-20250514`
   - Context: 200,000 tokens
   - Cost: $15/1M input, $75/1M output
   - Rate Limit: 2000 req/min (Enterprise)
   - Best For: Critical decisions, strategic planning, maximum intelligence
   - Status: 🎯 Requires Anthropic Enterprise subscription

---

## LLM Orchestration

### Request Flow

```
User Request → LLM Orchestrator
  ↓
ModelRegistry.selectModel({
  purpose: 'spec-generation',
  contextSize: 50000,
  requiresVision: false
})
  ↓
Selection Logic:
  1. Filter available models
  2. Check context window
  3. Check capabilities
  4. Check cost constraints
  5. Sort by preference
  6. Return optimal + fallbacks
  ↓
Rate Limit Check
  ↓
API Call (Anthropic/OpenAI/Google/Z.AI)
  ↓
Response + Usage Tracking
  ↓
Update Subscription (spend, tokens)
```

### Model Selection Strategy

```typescript
// Purpose-Based Selection (CURRENT STACK)
const MODEL_PURPOSE_MAP = {
  'spec-generation': 'gemini-2-5-pro-1m',         // Full context (1M, free!)
  'task-breakdown': 'claude-sonnet-4-5-200k',     // Reasoning
  'code-generation': 'claude-sonnet-4-5-200k',    // Implementation
  'validation': 'claude-sonnet-4-5-200k',         // Review
  'insight-extraction': 'gemini-2-5-pro-1m',      // Understanding (1M)
  'strategic-planning': 'chatgpt-5-pro',          // Cloud Supervisor
  'fast-processing': 'gemini-2-flash',            // Speed
  'experimentation': 'glm-4-6-200k'               // Free tier
};

// Fallback Chain (CURRENT STACK)
Primary: Claude Sonnet 4.5 (200K)
  ↓ (if unavailable)
Secondary: Gemini 2.5 Pro (1M, free!)
  ↓ (if unavailable)
Tertiary: GLM-4.6 (200K, free)
  ↓ (if unavailable)
Error: No models available

// FUTURE: When Enterprise available
Primary: Claude Sonnet 4.5 (1M)
  ↓ (if unavailable)
Secondary: Claude Sonnet 4.5 (200K)
  ↓ (if unavailable)
Tertiary: Gemini 2.5 Pro (1M)
```

---

## Integration Points

### 1. IntelligenceEngine (Message Understanding)

```typescript
// Extract insights from user messages using LLM
async extractInsights(message: string): Promise<Insight[]> {
  const response = await llmOrchestrator.complete({
    purpose: 'insight-extraction',
    contextSize: message.length,
    systemPrompt: `
      You are an expert at understanding user requirements.
      Extract actionable insights from the following message.
      Identify: requirements, preferences, constraints, decisions.
    `,
    userPrompt: message
  });

  return parseInsights(response.content);
}
```

### 2. SpecGenerationLoop (Spec Creation)

```typescript
// Generate technical spec from user insights
async generateSpec(insights: Insight[]): Promise<Spec> {
  const response = await llmOrchestrator.complete({
    purpose: 'spec-generation',
    contextSize: estimateSize(insights),
    systemPrompt: `
      You are a senior technical architect.
      Generate a complete technical specification from these insights.
      Include: architecture, API design, database schema, validation criteria.
    `,
    userPrompt: formatInsights(insights)
  });

  return parseSpec(response.content);
}
```

### 3. IntelligentTaskGenerator (Task Breakdown)

```typescript
// Break spec into intelligent tasks
async generateTasks(spec: Spec): Promise<Task[]> {
  const response = await llmOrchestrator.complete({
    purpose: 'task-breakdown',
    contextSize: spec.content.length,
    systemPrompt: `
      You are an expert project manager.
      Break this specification into atomic, well-defined tasks.
      For each task: determine dependencies, estimate effort, assign agent.
    `,
    userPrompt: spec.content
  });

  return parseTasks(response.content);
}
```

### 4. SpecLifecycleValidator (Validation)

```typescript
// Validate implementation against spec
async validateImplementation(spec: Spec, code: string): Promise<ValidationResult> {
  const response = await llmOrchestrator.complete({
    purpose: 'validation',
    contextSize: spec.content.length + code.length,
    systemPrompt: `
      You are a senior code reviewer.
      Compare this implementation against the specification.
      Check: completeness, correctness, quality, best practices.
    `,
    userPrompt: `SPEC:\n${spec.content}\n\nCODE:\n${code}`
  });

  return parseValidation(response.content);
}
```

### 5. CuratedContentManager (Curation)

```typescript
// Intelligently curate files for VM agents
async curateWorkSet(spec: Spec, allFiles: string[]): Promise<CuratedFile[]> {
  const response = await llmOrchestrator.complete({
    purpose: 'strategic-planning',
    contextSize: spec.content.length + allFiles.join('\n').length,
    systemPrompt: `
      You are an expert at project organization.
      Select the MINIMAL set of files needed for this work.
      Only include files directly relevant to the specification.
    `,
    userPrompt: `SPEC:\n${spec.content}\n\nAVAILABLE FILES:\n${allFiles.join('\n')}`
  });

  return parseCuratedFiles(response.content);
}
```

---

## Current Setup (OPERATIONAL)

### Active Configuration

**1. Current API Keys (via Doppler)**
```bash
# Anthropic (Pro tier - 200K context)
doppler secrets set --project central-mcp --config prod ANTHROPIC_API_KEY="sk-ant-..."
doppler secrets set --project central-mcp --config prod ANTHROPIC_ACCOUNT_TIER="pro"

# Google (Free tier - 1M context!)
doppler secrets set --project central-mcp --config prod GOOGLE_API_KEY="..."

# Z.AI (Free tier - 200K context)
doppler secrets set --project central-mcp --config prod ZAI_API_KEY="..."

# OpenAI (Pro tier - ChatGPT-5)
doppler secrets set --project central-mcp --config prod OPENAI_API_KEY="sk-..."
```

**2. Register Current Subscriptions**
```typescript
// Anthropic Pro (200K context - PRIMARY)
llmOrchestrator.registerSubscription({
  provider: 'anthropic',
  accountTier: 'pro',
  apiKey: process.env.ANTHROPIC_API_KEY!,
  monthlyBudget: 2000 // $2000/month budget
});

// Google (1M context - FREE!)
llmOrchestrator.registerSubscription({
  provider: 'google',
  accountTier: 'free',
  apiKey: process.env.GOOGLE_API_KEY!
});

// Z.AI (200K context - FREE!)
llmOrchestrator.registerSubscription({
  provider: 'z.ai',
  accountTier: 'free',
  apiKey: process.env.ZAI_API_KEY!
});

// OpenAI (ChatGPT-5 - Cloud Supervisor)
llmOrchestrator.registerSubscription({
  provider: 'openai',
  accountTier: 'pro',
  apiKey: process.env.OPENAI_API_KEY!,
  monthlyBudget: 1000 // $1000/month budget
});
```

**3. Verify Available Models**
```typescript
const models = modelRegistry.getAvailableModels();
// Should include:
// - claude-sonnet-4-5-200k (PRIMARY)
// - gemini-2-5-pro-1m (1M context!)
// - glm-4-6-200k (free fallback)
// - chatgpt-5-pro (supervisor)
```

---

## Future Enterprise Upgrade (GOAL)

### Upgrade Path

**1. Upgrade to Anthropic Enterprise**
- Contact: enterprise@anthropic.com
- Request: Enterprise account with 1M context access
- Benefits:
  - Claude Sonnet 4.5 (1M context)
  - 4000 req/min rate limit
  - Priority support
  - Higher token limits

**2. Update Configuration**
```bash
doppler secrets set --project central-mcp --config prod ANTHROPIC_ACCOUNT_TIER="enterprise"
```

**3. Models Auto-Enable**
```typescript
// After upgrade, 1M models automatically available
const models = modelRegistry.getAvailableModels();
// Will include: claude-sonnet-4-5-1m, claude-opus-4
```

---

## Cost Management

### Budget Tracking

```typescript
// Set monthly budget
subscription.monthlyBudget = 5000; // $5000/month

// Real-time tracking
subscription.currentSpend += requestCost;

// Alert if exceeded
if (subscription.currentSpend > subscription.monthlyBudget) {
  alert('Budget exceeded!');
}
```

### Cost Optimization

**1. Model Selection**
- Use 1M context only when needed
- Fall back to 200K for smaller tasks
- Use free models (GLM, Gemini) for experiments

**2. Prompt Caching**
- Cache system prompts (save 90% on repeated calls)
- Cache project context
- Anthropic's prompt caching = huge savings

**3. Token Management**
- Estimate tokens before calling
- Use streaming for long responses
- Truncate unnecessary context

### Expected Costs

**Scenario: 1000 requests/day**

**Spec Generation (50 req/day, 50K context, Sonnet 4.5 1M):**
- Input: 50 req × 50K tokens × $3/1M = $7.50
- Output: 50 req × 5K tokens × $15/1M = $3.75
- **Daily: $11.25**

**Task Breakdown (200 req/day, 10K context, Sonnet 4.5 200K):**
- Input: 200 × 10K × $3/1M = $6
- Output: 200 × 2K × $15/1M = $6
- **Daily: $12**

**Code Generation (500 req/day, 5K context, Sonnet 4.5 200K):**
- Input: 500 × 5K × $3/1M = $7.50
- Output: 500 × 3K × $15/1M = $22.50
- **Daily: $30**

**Validation (250 req/day, 15K context, Sonnet 4.5 200K):**
- Input: 250 × 15K × $3/1M = $11.25
- Output: 250 × 2K × $15/1M = $7.50
- **Daily: $18.75**

**Total Daily: ~$72**
**Total Monthly: ~$2,160**

**Within $5000/month budget with 2.3x headroom!**

---

## Success Criteria

### Must Have

✅ Model Registry system operational
✅ LLM Orchestrator routing requests
✅ Anthropic Enterprise subscription active
✅ Sonnet 4.5 (1M context) available
✅ Integration in 5 key points (Intelligence, Spec, Task, Validation, Curation)
✅ Usage tracking and cost monitoring
✅ Rate limit enforcement
✅ Automatic fallback on failures

### Performance Targets

✅ Model selection: <100ms
✅ LLM response: <5s average
✅ Cost per request: <$0.10
✅ Monthly budget: <$5000
✅ 99% uptime

### Quality Targets

✅ All prompts tested and optimized
✅ Insight extraction: >90% accuracy
✅ Spec generation: >95% complete
✅ Task breakdown: >90% correct dependencies
✅ Validation: >85% catch rate for issues

---

## Implementation Plan

### Phase 1: Foundation (COMPLETE ✅)
- [x] ModelRegistry.ts (600 lines)
- [x] LLMOrchestrator.ts (500 lines)
- [x] Model definitions
- [x] Subscription management

### Phase 2: Anthropic Integration (IN PROGRESS)
- [ ] Anthropic client setup
- [ ] Enterprise subscription
- [ ] 1M context testing
- [ ] Prompt caching

### Phase 3: Deep Integration
- [ ] IntelligenceEngine + LLM
- [ ] SpecGenerationLoop + LLM
- [ ] IntelligentTaskGenerator + LLM
- [ ] SpecLifecycleValidator + LLM
- [ ] CuratedContentManager + LLM

### Phase 4: Cost Management
- [ ] Usage dashboard
- [ ] Budget alerts
- [ ] Cost optimization
- [ ] Monthly reports

### Phase 5: Testing & Optimization
- [ ] End-to-end testing
- [ ] Prompt optimization
- [ ] Performance tuning
- [ ] Production deployment

---

## Database Schema

```sql
-- AI Models Registry
CREATE TABLE ai_models (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  model_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  tier TEXT NOT NULL,
  context_window INTEGER,
  max_output_tokens INTEGER,
  cost_per_1m_input REAL,
  cost_per_1m_output REAL,
  requests_per_minute INTEGER,
  best_for TEXT, -- JSON array
  available BOOLEAN DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Subscriptions
CREATE TABLE ai_subscriptions (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  account_tier TEXT NOT NULL,
  api_key TEXT NOT NULL, -- Encrypted
  monthly_budget REAL,
  current_spend REAL DEFAULT 0,
  requests_this_month INTEGER DEFAULT 0,
  tokens_this_month INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT 1,
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Model Usage Tracking
CREATE TABLE ai_model_usage (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost REAL,
  latency_ms INTEGER,
  success BOOLEAN,
  error TEXT,
  timestamp TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (subscription_id) REFERENCES ai_subscriptions(id)
);

CREATE INDEX idx_usage_timestamp ON ai_model_usage(timestamp);
CREATE INDEX idx_usage_model ON ai_model_usage(model_id);
CREATE INDEX idx_usage_purpose ON ai_model_usage(purpose);
```

---

## Conclusion

This specification defines how Central-MCP integrates **TOP OF THE CLASS** AI models **DEEP INTO ITS CORE**. With Anthropic's Sonnet 4.5 (1M context) as the primary intelligence, every layer of the system becomes truly intelligent:

- Messages → Insights (AI-powered)
- Insights → Specs (AI-generated)
- Specs → Tasks (AI-broken-down)
- Tasks → Code (AI-implemented)
- Code → Validated (AI-reviewed)

**This transforms Central-MCP from mechanical automation → INTELLIGENT ORCHESTRATION!**

🤖 **Generated with Claude Code + Agent B (Sonnet 4.5)**

Co-Authored-By: User (Requirements) + Claude <noreply@anthropic.com>
