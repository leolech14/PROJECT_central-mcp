-- ============================================================================
-- PROMPTS REGISTRY SYSTEM - Prompt Template Management
-- ============================================================================
-- Purpose: Store, catalog, and manage AI prompt templates and instructions
-- Created: 2025-10-12
-- Part of: Central-MCP Atomic Entities Infrastructure
-- ============================================================================

-- Main prompts registry
CREATE TABLE IF NOT EXISTS prompts_registry (
    prompt_id TEXT PRIMARY KEY,                 -- e.g. "system-architect-v1", "code-review-comprehensive"
    prompt_name TEXT NOT NULL,                  -- Display name
    category TEXT NOT NULL,                     -- system, user, task, instruction, conversation, agent
    prompt_type TEXT NOT NULL,                  -- system_prompt, user_prompt, few_shot, chain_of_thought, react

    -- Content
    prompt_text TEXT NOT NULL,                  -- The actual prompt content
    prompt_hash TEXT,                           -- SHA-256 hash for deduplication
    word_count INTEGER DEFAULT 0,
    char_count INTEGER DEFAULT 0,
    estimated_tokens INTEGER DEFAULT 0,

    -- Metadata
    description TEXT NOT NULL,                  -- What this prompt does
    use_case TEXT,                              -- When to use it
    tags TEXT,                                  -- JSON array of tags
    temperature REAL DEFAULT 0.7,               -- Recommended temperature (0-1)
    max_tokens INTEGER DEFAULT 2000,            -- Recommended max tokens

    -- Variables and Structure
    variables TEXT,                             -- JSON array of {name, type, required, default}
    input_format TEXT,                          -- Expected input structure
    output_format TEXT,                         -- Expected output structure
    examples TEXT,                              -- JSON array of input/output examples

    -- AI Model Configuration
    recommended_models TEXT,                    -- JSON array: ["gpt-4", "claude-3-opus"]
    tested_models TEXT,                         -- JSON array of tested models
    model_specific_notes TEXT,                  -- Special considerations per model

    -- Quality and Testing
    test_cases TEXT,                            -- JSON array of test scenarios
    has_tests BOOLEAN DEFAULT FALSE,
    is_production_ready BOOLEAN DEFAULT FALSE,
    quality_score REAL DEFAULT 0.0,             -- 0-1 quality score
    effectiveness_rating REAL DEFAULT 0.0,      -- 0-1 based on usage feedback

    -- Source and Attribution
    source_file TEXT,                           -- Original file path
    source_url TEXT,                            -- Original URL
    author TEXT,                                -- Who created it
    license TEXT DEFAULT 'MIT',

    -- Usage Stats
    usage_count INTEGER DEFAULT 0,              -- How many times used
    last_used_at TIMESTAMP,
    success_rate REAL DEFAULT 0.0,              -- Success rate from feedback (0-1)
    avg_response_quality REAL DEFAULT 0.0,      -- Avg quality rating (0-1)

    -- Versioning
    version TEXT DEFAULT 'v1.0.0',              -- Semantic version
    parent_prompt_id TEXT,                      -- If derived from another prompt

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registered_by TEXT DEFAULT 'system'
);

-- Prompt chains (sequences of prompts)
CREATE TABLE IF NOT EXISTS prompt_chains (
    chain_id TEXT PRIMARY KEY,                  -- e.g. "code-review-full-workflow"
    chain_name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,                     -- development, analysis, generation, refinement

    -- Chain structure
    prompt_ids TEXT NOT NULL,                   -- JSON array of prompt_ids in order
    chain_logic TEXT,                           -- JSON: conditional logic, loops, branches
    execution_mode TEXT DEFAULT 'sequential',   -- sequential, parallel, conditional

    -- Configuration
    max_iterations INTEGER DEFAULT 1,
    early_stop_condition TEXT,                  -- When to stop chain
    error_handling TEXT DEFAULT 'abort',        -- abort, skip, retry

    -- Stats
    usage_count INTEGER DEFAULT 0,
    avg_duration_seconds REAL DEFAULT 0.0,
    success_rate REAL DEFAULT 0.0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT
);

-- Prompt variables (reusable variables)
CREATE TABLE IF NOT EXISTS prompt_variables (
    variable_id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_id TEXT NOT NULL,
    variable_name TEXT NOT NULL,                -- e.g. "project_name", "code_snippet"
    variable_type TEXT NOT NULL,                -- string, number, boolean, array, object
    is_required BOOLEAN DEFAULT TRUE,
    default_value TEXT,
    validation_rule TEXT,                       -- Regex or JSON schema
    description TEXT,
    FOREIGN KEY (prompt_id) REFERENCES prompts_registry(prompt_id)
);

-- Prompt usage history
CREATE TABLE IF NOT EXISTS prompt_usage (
    usage_id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_id TEXT NOT NULL,
    used_by TEXT,                               -- agent_id, user_id
    project_id TEXT,                            -- Where it was used
    model_used TEXT,                            -- gpt-4, claude-3-opus, etc.

    -- Context
    variables_used TEXT,                        -- JSON object of variable values
    context TEXT,                               -- Additional context

    -- Results
    success BOOLEAN DEFAULT TRUE,
    response_quality REAL,                      -- 0-1 quality rating
    response_time_ms INTEGER,
    tokens_used INTEGER,
    cost REAL,                                  -- Estimated cost in USD

    -- Feedback
    user_rating INTEGER CHECK(user_rating >= 1 AND user_rating <= 5),
    user_feedback TEXT,

    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prompt_id) REFERENCES prompts_registry(prompt_id)
);

-- Prompt versions (track changes over time)
CREATE TABLE IF NOT EXISTS prompt_versions (
    version_id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_id TEXT NOT NULL,
    version TEXT NOT NULL,                      -- v1.0.0, v1.1.0
    prompt_text TEXT NOT NULL,                  -- Prompt at this version
    changelog TEXT,                             -- What changed
    breaking_changes BOOLEAN DEFAULT FALSE,
    performance_delta REAL,                     -- Change in effectiveness rating
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    FOREIGN KEY (prompt_id) REFERENCES prompts_registry(prompt_id)
);

-- Prompt ratings and feedback
CREATE TABLE IF NOT EXISTS prompt_ratings (
    rating_id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    category TEXT,                              -- clarity, effectiveness, consistency
    feedback TEXT,
    rated_by TEXT,
    rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prompt_id) REFERENCES prompts_registry(prompt_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts_registry(category);
CREATE INDEX IF NOT EXISTS idx_prompts_type ON prompts_registry(prompt_type);
CREATE INDEX IF NOT EXISTS idx_prompts_quality ON prompts_registry(is_production_ready, quality_score);
CREATE INDEX IF NOT EXISTS idx_prompts_usage_count ON prompts_registry(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_prompt ON prompt_usage(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_project ON prompt_usage(project_id);
CREATE INDEX IF NOT EXISTS idx_prompt_variables_prompt ON prompt_variables(prompt_id);

-- ============================================================================
-- Views
-- ============================================================================

-- Popular prompts
CREATE VIEW IF NOT EXISTS popular_prompts AS
SELECT
    p.prompt_id,
    p.prompt_name,
    p.category,
    p.prompt_type,
    p.usage_count,
    p.success_rate,
    p.effectiveness_rating,
    p.quality_score,
    AVG(r.rating) as avg_rating,
    COUNT(r.rating_id) as rating_count,
    AVG(pu.response_time_ms) as avg_response_time_ms
FROM prompts_registry p
LEFT JOIN prompt_ratings r ON p.prompt_id = r.prompt_id
LEFT JOIN prompt_usage pu ON p.prompt_id = pu.prompt_id
GROUP BY p.prompt_id
HAVING usage_count > 0
ORDER BY usage_count DESC, avg_rating DESC
LIMIT 50;

-- Production-ready prompts
CREATE VIEW IF NOT EXISTS production_ready_prompts AS
SELECT
    prompt_id,
    prompt_name,
    category,
    prompt_type,
    description,
    recommended_models,
    has_tests,
    quality_score,
    effectiveness_rating,
    usage_count,
    success_rate
FROM prompts_registry
WHERE is_production_ready = TRUE AND quality_score >= 0.7
ORDER BY quality_score DESC, effectiveness_rating DESC, usage_count DESC;

-- Recent prompts
CREATE VIEW IF NOT EXISTS recent_prompts AS
SELECT
    prompt_id,
    prompt_name,
    category,
    prompt_type,
    description,
    quality_score,
    created_at,
    registered_by
FROM prompts_registry
ORDER BY created_at DESC
LIMIT 20;

-- Prompt effectiveness stats
CREATE VIEW IF NOT EXISTS prompt_effectiveness_stats AS
SELECT
    p.prompt_id,
    p.prompt_name,
    p.category,
    COUNT(DISTINCT pu.usage_id) as total_uses,
    COUNT(DISTINCT pu.project_id) as projects_used_in,
    COUNT(DISTINCT pu.used_by) as unique_users,
    AVG(CASE WHEN pu.success THEN 1 ELSE 0 END) as success_rate,
    AVG(pu.response_quality) as avg_quality,
    AVG(pu.response_time_ms) as avg_response_time,
    SUM(pu.tokens_used) as total_tokens_used,
    SUM(pu.cost) as total_cost,
    MAX(pu.used_at) as last_used
FROM prompts_registry p
LEFT JOIN prompt_usage pu ON p.prompt_id = pu.prompt_id
GROUP BY p.prompt_id
ORDER BY total_uses DESC;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update timestamp
CREATE TRIGGER IF NOT EXISTS update_prompts_timestamp
AFTER UPDATE ON prompts_registry
FOR EACH ROW
BEGIN
    UPDATE prompts_registry SET updated_at = CURRENT_TIMESTAMP WHERE prompt_id = NEW.prompt_id;
END;

-- Increment usage count and update stats
CREATE TRIGGER IF NOT EXISTS increment_prompt_usage_count
AFTER INSERT ON prompt_usage
FOR EACH ROW
BEGIN
    UPDATE prompts_registry
    SET usage_count = usage_count + 1,
        last_used_at = NEW.used_at,
        success_rate = (
            SELECT AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END)
            FROM prompt_usage
            WHERE prompt_id = NEW.prompt_id
        ),
        avg_response_quality = (
            SELECT AVG(response_quality)
            FROM prompt_usage
            WHERE prompt_id = NEW.prompt_id AND response_quality IS NOT NULL
        )
    WHERE prompt_id = NEW.prompt_id;
END;

-- ============================================================================
-- Initial prompt population (essential templates)
-- ============================================================================

-- System Prompt: Code Architect
INSERT OR IGNORE INTO prompts_registry (
    prompt_id, prompt_name, category, prompt_type,
    prompt_text, description, use_case, tags, temperature, max_tokens,
    variables, recommended_models, tested_models,
    is_production_ready, quality_score, effectiveness_rating, registered_by
) VALUES (
    'system-code-architect',
    'System Architect Code Review',
    'system',
    'system_prompt',
    'You are an expert software architect with 15+ years of experience. Your role is to:

1. **Analyze Architecture**: Review code for architectural patterns, design principles, and scalability
2. **Identify Issues**: Spot code smells, anti-patterns, technical debt, security vulnerabilities
3. **Provide Solutions**: Suggest concrete improvements with code examples
4. **Explain Reasoning**: Clearly explain why changes are needed and their impact

**Focus Areas:**
- SOLID principles and clean code
- Performance optimization opportunities
- Security best practices
- Scalability considerations
- Maintainability and readability

**Output Format:**
For each issue found:
- 🔴 **Severity**: Critical/High/Medium/Low
- 📍 **Location**: File:Line
- 🔍 **Issue**: Clear description
- 💡 **Solution**: Concrete fix with code example
- 📊 **Impact**: What improves if fixed',
    'System-level prompt for comprehensive code architecture review',
    'Use when reviewing code for architectural quality, design patterns, and best practices',
    '["architecture", "code-review", "design-patterns", "best-practices", "system"]',
    0.3,
    3000,
    '[{"name": "code_snippet", "type": "string", "required": true, "description": "Code to review"}, {"name": "language", "type": "string", "required": true, "description": "Programming language"}, {"name": "context", "type": "string", "required": false, "description": "Project context"}]',
    '["gpt-4", "claude-3-opus", "claude-sonnet-4-5"]',
    '["gpt-4", "claude-3-opus", "claude-sonnet-4-5"]',
    TRUE,
    0.95,
    0.92,
    'system'
);

-- User Prompt: Bug Analysis
INSERT OR IGNORE INTO prompts_registry (
    prompt_id, prompt_name, category, prompt_type,
    prompt_text, description, use_case, tags, temperature, max_tokens,
    variables, recommended_models,
    is_production_ready, quality_score, effectiveness_rating, registered_by
) VALUES (
    'user-bug-analysis',
    'Comprehensive Bug Analysis',
    'task',
    'user_prompt',
    'Analyze this bug report and provide a comprehensive solution:

**Bug Report:**
{bug_description}

**Error Message:**
```
{error_message}
```

**Context:**
- **Language/Framework**: {language}
- **Environment**: {environment}
- **Recent Changes**: {recent_changes}

**Please provide:**

1. **Root Cause Analysis**
   - What is causing this bug?
   - Why did it happen?
   - What are the contributing factors?

2. **Impact Assessment**
   - Who/what is affected?
   - Severity: Critical/High/Medium/Low
   - Is this a regression?

3. **Solution**
   - Step-by-step fix
   - Code changes needed
   - Testing strategy

4. **Prevention**
   - How to prevent similar bugs?
   - What tests should be added?
   - Any process improvements?',
    'User prompt for comprehensive bug analysis and solution',
    'Use when debugging complex issues that require thorough analysis',
    '["debugging", "bug-analysis", "root-cause", "troubleshooting", "task"]',
    0.5,
    2500,
    '[{"name": "bug_description", "type": "string", "required": true}, {"name": "error_message", "type": "string", "required": true}, {"name": "language", "type": "string", "required": true}, {"name": "environment", "type": "string", "required": true}, {"name": "recent_changes", "type": "string", "required": false}]',
    '["gpt-4", "claude-3-opus", "claude-sonnet-4-5", "glm-4.6"]',
    TRUE,
    0.90,
    0.88,
    'system'
);

-- Task Prompt: Specification Generation
INSERT OR IGNORE INTO prompts_registry (
    prompt_id, prompt_name, category, prompt_type,
    prompt_text, description, use_case, tags, temperature, max_tokens,
    variables, recommended_models,
    is_production_ready, quality_score, effectiveness_rating, registered_by
) VALUES (
    'task-spec-generation',
    'Technical Specification Generation',
    'task',
    'chain_of_thought',
    'Convert this user requirement into a detailed technical specification:

**User Requirement:**
{user_requirement}

**Project Context:**
- **Stack**: {tech_stack}
- **Constraints**: {constraints}
- **Timeline**: {timeline}

**Generate specification with:**

## 1. Feature Overview
- What: Clear description of what needs to be built
- Why: Business value and user impact
- Who: Target users

## 2. Technical Requirements
- **Frontend**: UI components, pages, interactions
- **Backend**: APIs, endpoints, data models
- **Database**: Schema changes, migrations
- **Integration**: External services, APIs

## 3. Acceptance Criteria
- [ ] Functional requirement 1
- [ ] Functional requirement 2
- [ ] Performance targets
- [ ] Security requirements

## 4. Implementation Plan
1. Phase 1: Core functionality
2. Phase 2: Enhancements
3. Phase 3: Polish and optimization

## 5. Testing Strategy
- Unit tests needed
- Integration tests needed
- E2E scenarios

## 6. Risks and Mitigations
- Risk 1 → Mitigation
- Risk 2 → Mitigation',
    'Task prompt for converting user requirements into technical specifications',
    'Use when receiving feature requests that need formal specification',
    '["specification", "requirements", "planning", "task", "chain-of-thought"]',
    0.7,
    3500,
    '[{"name": "user_requirement", "type": "string", "required": true}, {"name": "tech_stack", "type": "string", "required": true}, {"name": "constraints", "type": "string", "required": false}, {"name": "timeline", "type": "string", "required": false}]',
    '["gpt-4", "claude-3-opus", "claude-sonnet-4-5"]',
    TRUE,
    0.93,
    0.90,
    'system'
);

-- Conversation Prompt: Agent Onboarding
INSERT OR IGNORE INTO prompts_registry (
    prompt_id, prompt_name, category, prompt_type,
    prompt_text, description, use_case, tags, temperature, max_tokens,
    variables, recommended_models,
    is_production_ready, quality_score, effectiveness_rating, registered_by
) VALUES (
    'conversation-agent-onboarding',
    'Agent Onboarding Greeting',
    'conversation',
    'user_prompt',
    'Welcome to Central-MCP, {agent_name}!

🎯 **Your Role:** {agent_role}
🔧 **Your Capabilities:** {capabilities}
📂 **Current Project:** {project_name}

**Here''s what you need to know:**

## 🌐 System Overview
Central-MCP is an auto-proactive intelligence system with 9 self-optimizing loops that discover projects, monitor progress, generate specs, and assign tasks.

## 📊 Your Status
- **Agent ID**: {agent_id}
- **Model**: {agent_model}
- **Working Directory**: {working_directory}
- **Current Session**: Started {session_started}

## 🎯 Your Current Tasks
{assigned_tasks}

## 🛠️ Available Tools
{available_tools}

## 📚 Knowledge Resources
You have access to:
- SKPs (Specialized Knowledge Packs)
- Technical Specifications
- Code Snippets Library
- Prompt Templates

**Need help?** Use the knowledge injection system: `./scripts/inject-knowledge.sh`

**Ready to start?** Let me know and I''ll guide you through your first task!',
    'Conversation prompt for welcoming and onboarding new agents',
    'Use when an agent first connects to provide context and orientation',
    '["onboarding", "greeting", "conversation", "agent", "welcome"]',
    0.8,
    1500,
    '[{"name": "agent_name", "type": "string", "required": true}, {"name": "agent_role", "type": "string", "required": true}, {"name": "capabilities", "type": "string", "required": true}, {"name": "project_name", "type": "string", "required": true}, {"name": "agent_id", "type": "string", "required": true}, {"name": "agent_model", "type": "string", "required": true}, {"name": "working_directory", "type": "string", "required": true}, {"name": "session_started", "type": "string", "required": true}, {"name": "assigned_tasks", "type": "string", "required": true}, {"name": "available_tools", "type": "string", "required": true}]',
    '["gpt-4", "claude-3-opus", "claude-sonnet-4-5", "glm-4.6"]',
    TRUE,
    0.88,
    0.85,
    'system'
);

-- Instruction Prompt: Code Refactoring
INSERT OR IGNORE INTO prompts_registry (
    prompt_id, prompt_name, category, prompt_type,
    prompt_text, description, use_case, tags, temperature, max_tokens,
    variables, recommended_models,
    is_production_ready, quality_score, effectiveness_rating, registered_by
) VALUES (
    'instruction-code-refactoring',
    'Step-by-Step Code Refactoring',
    'instruction',
    'react',
    'Refactor this code following clean code principles:

**Original Code:**
```{language}
{code}
```

**Refactoring Goals:**
{goals}

**Follow this process:**

## Step 1: Analyze Current Code
- Identify code smells
- List anti-patterns
- Note performance issues
- Check security concerns

## Step 2: Plan Refactoring
- Break down into small steps
- Prioritize changes
- Identify risks
- Plan tests

## Step 3: Apply Refactoring
For each refactoring step:
1. State what you''re changing and why
2. Show before/after code
3. Explain the improvement
4. Note any side effects

## Step 4: Verify Improvements
- Does it pass existing tests?
- Is it more readable?
- Is it more performant?
- Is it more maintainable?

## Step 5: Final Review
- Compare original vs refactored
- List all improvements
- Suggest additional tests
- Recommend next steps

**Output:** Provide refactored code with detailed explanations for each change.',
    'Instruction prompt for systematic code refactoring with step-by-step reasoning',
    'Use when refactoring complex code that needs careful transformation',
    '["refactoring", "clean-code", "instruction", "react", "step-by-step"]',
    0.4,
    4000,
    '[{"name": "code", "type": "string", "required": true}, {"name": "language", "type": "string", "required": true}, {"name": "goals", "type": "string", "required": false, "default": "Improve readability, maintainability, and performance"}]',
    '["gpt-4", "claude-3-opus", "claude-sonnet-4-5"]',
    TRUE,
    0.91,
    0.89,
    'system'
);
