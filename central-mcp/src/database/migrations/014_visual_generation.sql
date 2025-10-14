-- Visual Generation & External Services Tables
-- Enables ComfyUI integration and image generation tracking

-- External services registry (ComfyUI, APIs, etc.)
CREATE TABLE IF NOT EXISTS external_services (
  id TEXT PRIMARY KEY,
  service_type TEXT NOT NULL, -- 'image_generation', 'llm', 'vector_db', etc.
  name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  api_key TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'error')),
  capabilities JSON, -- Array of capabilities
  config JSON, -- Service-specific configuration
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_health_check TIMESTAMP,
  health_status TEXT -- 'healthy', 'degraded', 'down'
);

CREATE INDEX IF NOT EXISTS idx_external_services_type_status
ON external_services(service_type, status);

-- Image generations log
CREATE TABLE IF NOT EXISTS image_generations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prompt_id TEXT NOT NULL UNIQUE,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  image_url TEXT NOT NULL,
  width INTEGER DEFAULT 1024,
  height INTEGER DEFAULT 1024,
  steps INTEGER DEFAULT 20,
  cfg_scale REAL DEFAULT 8.0,
  seed INTEGER,
  model TEXT,
  duration_ms INTEGER NOT NULL,
  agent_letter TEXT,
  task_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_letter) REFERENCES agent_sessions(agent_letter),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE INDEX IF NOT EXISTS idx_image_generations_agent
ON image_generations(agent_letter);

CREATE INDEX IF NOT EXISTS idx_image_generations_task
ON image_generations(task_id);

CREATE INDEX IF NOT EXISTS idx_image_generations_created
ON image_generations(created_at DESC);

-- Service health checks log
CREATE TABLE IF NOT EXISTS service_health_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('healthy', 'degraded', 'down')),
  response_time_ms INTEGER,
  error_message TEXT,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES external_services(id)
);

CREATE INDEX IF NOT EXISTS idx_service_health_checks_service
ON service_health_checks(service_id, checked_at DESC);

-- Default ComfyUI service (update endpoint manually)
INSERT OR IGNORE INTO external_services (
  id,
  service_type,
  name,
  endpoint,
  status,
  capabilities,
  config
) VALUES (
  'comfyui-runpod-001',
  'image_generation',
  'ComfyUI on RunPod',
  'https://YOUR-POD-ID-8188.proxy.runpod.net',
  'inactive', -- Set to 'active' after configuring endpoint
  '["text_to_image","image_to_image","sd_models","sdxl_models","controlnet","lora"]',
  '{"default_model":"sd_xl_base_1.0.safetensors","max_steps":50,"default_steps":20}'
);

-- Usage statistics view
CREATE VIEW IF NOT EXISTS image_generation_stats AS
SELECT
  COUNT(*) as total_images,
  COUNT(DISTINCT agent_letter) as active_agents,
  AVG(duration_ms) as avg_duration_ms,
  MIN(duration_ms) as min_duration_ms,
  MAX(duration_ms) as max_duration_ms,
  SUM(CASE WHEN created_at >= datetime('now', '-1 hour') THEN 1 ELSE 0 END) as images_last_hour,
  SUM(CASE WHEN created_at >= datetime('now', '-1 day') THEN 1 ELSE 0 END) as images_last_day,
  SUM(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as images_last_week
FROM image_generations;

-- Recent images by agent view
CREATE VIEW IF NOT EXISTS recent_images_by_agent AS
SELECT
  agent_letter,
  COUNT(*) as image_count,
  AVG(duration_ms) as avg_duration_ms,
  MAX(created_at) as last_generated
FROM image_generations
WHERE created_at >= datetime('now', '-7 days')
GROUP BY agent_letter
ORDER BY image_count DESC;
