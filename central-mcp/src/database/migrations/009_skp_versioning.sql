-- ============================================================================
-- SKP (Specialized Knowledge Packs) Versioning & Tracking System
-- ============================================================================
-- Purpose: Track versions, updates, and content of Specialized Knowledge Packs
-- Created: 2025-10-12
-- Part of: Central-MCP Knowledge Ingestion Pipeline
-- ============================================================================

-- Main SKP registry table
CREATE TABLE IF NOT EXISTS skp_registry (
    skp_id TEXT PRIMARY KEY,                    -- e.g. "ULTRATHINK_REALTIME_VOICE_MASTERY"
    display_name TEXT NOT NULL,                 -- Human-readable name
    category TEXT NOT NULL,                     -- e.g. "REALTIME_VOICE", "UI_COMPONENTS"
    description TEXT,                           -- Purpose and capabilities
    current_version TEXT NOT NULL,              -- Semantic version: v1.2.3
    file_path TEXT NOT NULL,                    -- Location of .zip file
    file_size INTEGER,                          -- Size in bytes
    file_count INTEGER,                         -- Number of files in pack
    total_words INTEGER,                        -- Total word count
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active'                -- active, deprecated, archived
);

-- Version history for each SKP
CREATE TABLE IF NOT EXISTS skp_versions (
    version_id INTEGER PRIMARY KEY AUTOINCREMENT,
    skp_id TEXT NOT NULL,
    version TEXT NOT NULL,                      -- v1.0.0, v1.1.0, etc.
    changelog TEXT,                             -- What changed in this version
    files_added TEXT,                           -- JSON array of added files
    files_updated TEXT,                         -- JSON array of updated files
    files_removed TEXT,                         -- JSON array of removed files
    created_by TEXT,                            -- agent_letter or "system"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_path TEXT,                             -- Path to this version's .zip
    file_size INTEGER,
    FOREIGN KEY (skp_id) REFERENCES skp_registry(skp_id)
);

-- Individual file tracking within SKPs
CREATE TABLE IF NOT EXISTS skp_files (
    file_id INTEGER PRIMARY KEY AUTOINCREMENT,
    skp_id TEXT NOT NULL,
    version TEXT NOT NULL,
    filename TEXT NOT NULL,                     -- e.g. "HOW_REALTIME_VOICE_WORKS.md"
    file_type TEXT,                             -- md, html, js, json, etc.
    file_size INTEGER,                          -- Size in bytes
    word_count INTEGER,                         -- Word count for text files
    content_hash TEXT,                          -- SHA-256 for deduplication
    source_origin TEXT,                         -- Where did this file come from
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (skp_id) REFERENCES skp_registry(skp_id)
);

-- Ingestion log - track all updates
CREATE TABLE IF NOT EXISTS skp_ingestion_log (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    skp_id TEXT NOT NULL,
    operation TEXT NOT NULL,                    -- create, update, add_file, remove_file
    source_path TEXT,                           -- Where content came from
    source_type TEXT,                           -- file, url, folder, text
    files_processed INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    duration_ms INTEGER,
    created_by TEXT,                            -- agent_letter or "system"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (skp_id) REFERENCES skp_registry(skp_id)
);

-- Search index for SKP content
CREATE TABLE IF NOT EXISTS skp_search_index (
    index_id INTEGER PRIMARY KEY AUTOINCREMENT,
    skp_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    section_title TEXT,
    content_snippet TEXT,                       -- First 500 chars
    full_content TEXT,                          -- Full searchable content
    keywords TEXT,                              -- Space-separated keywords
    FOREIGN KEY (skp_id) REFERENCES skp_registry(skp_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_skp_versions_skp_id ON skp_versions(skp_id);
CREATE INDEX IF NOT EXISTS idx_skp_files_skp_id ON skp_files(skp_id);
CREATE INDEX IF NOT EXISTS idx_skp_files_hash ON skp_files(content_hash);
CREATE INDEX IF NOT EXISTS idx_skp_ingestion_skp_id ON skp_ingestion_log(skp_id);
CREATE INDEX IF NOT EXISTS idx_skp_search_keywords ON skp_search_index(keywords);

-- ============================================================================
-- Initial SKP: ULTRATHINK_REALTIME_VOICE_MASTERY
-- ============================================================================

INSERT OR IGNORE INTO skp_registry (
    skp_id,
    display_name,
    category,
    description,
    current_version,
    file_path,
    file_size,
    file_count,
    total_words,
    status
) VALUES (
    'ULTRATHINK_REALTIME_VOICE_MASTERY',
    'ULTRATHINK Realtime Voice Mastery',
    'REALTIME_VOICE',
    'Complete implementation system for real-time voice conversation with parallel context injection. <600ms latency, production-ready.',
    'v1.0.0',
    '03_CONTEXT_FILES/SPECIALIZED_KNOWLEDGE_PACKS/ULTRATHINK_REALTIME_VOICE_MASTERY.zip',
    46548,
    7,
    18000,
    'active'
);

-- Track initial version
INSERT OR IGNORE INTO skp_versions (
    skp_id,
    version,
    changelog,
    files_added,
    created_by,
    file_path,
    file_size
) VALUES (
    'ULTRATHINK_REALTIME_VOICE_MASTERY',
    'v1.0.0',
    'Initial release: Complete real-time voice conversation system with WebRTC, Doppler integration, and agent SOPs.',
    '["HOW_REALTIME_VOICE_WORKS.md","IMPLEMENTATION_GUIDE_FROM_SCRATCH.md","voice-orb-webrtc.html","professional-realtime-server.js","test-doppler-session.js","REALTIME_VOICE_MASTERY_GUIDE.md","AGENT_SOP_VOICE_SYSTEMS.md"]',
    'system',
    '03_CONTEXT_FILES/SPECIALIZED_KNOWLEDGE_PACKS/ULTRATHINK_REALTIME_VOICE_MASTERY.zip',
    46548
);

-- ============================================================================
-- Views for easy querying
-- ============================================================================

-- Latest version of each SKP
CREATE VIEW IF NOT EXISTS skp_latest_versions AS
SELECT
    r.skp_id,
    r.display_name,
    r.category,
    r.current_version,
    v.changelog,
    v.created_at as version_date,
    r.file_count,
    r.total_words,
    r.status
FROM skp_registry r
LEFT JOIN skp_versions v ON r.skp_id = v.skp_id AND r.current_version = v.version
ORDER BY r.updated_at DESC;

-- Ingestion activity summary
CREATE VIEW IF NOT EXISTS skp_ingestion_summary AS
SELECT
    skp_id,
    COUNT(*) as total_operations,
    SUM(CASE WHEN success = TRUE THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN success = FALSE THEN 1 ELSE 0 END) as failed,
    SUM(files_processed) as total_files_processed,
    MAX(created_at) as last_operation
FROM skp_ingestion_log
GROUP BY skp_id;
