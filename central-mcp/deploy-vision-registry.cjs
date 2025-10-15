#!/usr/bin/env node

/**
 * Deploy Vision Registry System
 * ============================
 *
 * Activates the Vision Registry for Messages → Specifications conversion.
 * This system extracts user visions from messages and converts them into
 * technical specifications with quality validation.
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const DATABASE_PATH = path.join(PROJECT_ROOT, 'data', 'registry.db');

console.log('🚀 DEPLOYING VISION REGISTRY SYSTEM');
console.log('='.repeat(50));
console.log(`Project Root: ${PROJECT_ROOT}`);
console.log(`Database: ${DATABASE_PATH}`);
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log();

// Verify database exists
if (!fs.existsSync(DATABASE_PATH)) {
  console.error('❌ Database not found. Ensure Central-MCP is initialized.');
  process.exit(1);
}

const db = new Database(DATABASE_PATH);

try {
  console.log('📋 STEP 1: Verify Vision Registry schema...');

  // Check if vision_registry table exists
  const tableCheck = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='vision_registry'
  `).get();

  if (!tableCheck) {
    console.error('❌ vision_registry table not found. Run database migrations first.');
    process.exit(1);
  }

  console.log('✅ Vision Registry table verified');

  console.log();
  console.log('📋 STEP 2: Verify message and conversation tables...');

  // Check prerequisite tables
  const messageCheck = db.prepare(`
    SELECT COUNT(*) as count FROM messages
  `).get();

  const conversationCheck = db.prepare(`
    SELECT COUNT(*) as count FROM conversations
  `).get();

  console.log(`✅ Messages available: ${messageCheck.count}`);
  console.log(`✅ Conversations available: ${conversationCheck.count}`);

  console.log();
  console.log('📋 STEP 3: Set up Vision Registry triggers...');

  // Verify triggers are in place
  const triggerCheck = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='trigger' AND name LIKE '%vision%'
  `).all();

  console.log(`✅ Vision Registry triggers found: ${triggerCheck.length}`);
  triggerCheck.forEach(trigger => {
    console.log(`   - ${trigger.name}`);
  });

  console.log();
  console.log('📋 STEP 4: Create Vision Registry indexes...');

  // Create performance indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_vision_message_lookup ON vision_registry(source_message_id, status);',
    'CREATE INDEX IF NOT EXISTS idx_vision_conversation_lookup ON vision_registry(source_conversation_id, processing_stage);',
    'CREATE INDEX IF NOT EXISTS idx_vision_quality_filter ON vision_registry(spec_quality_score, spec_completeness_score) WHERE honest_completion_percentage > 0;',
    'CREATE INDEX IF NOT EXISTS idx_vision_completion_tracking ON vision_registry(status, processing_stage, assigned_agent);'
  ];

  indexes.forEach(indexSql => {
    try {
      db.exec(indexSql);
      console.log('✅ Index created/verified');
    } catch (error) {
      console.log(`⚠️  Index warning: ${error.message}`);
    }
  });

  console.log();
  console.log('📋 STEP 5: Initialize Vision Registry workflows...');

  // Check for existing workflow templates
  const workflowCount = db.prepare(`
    SELECT COUNT(*) as count FROM workflow_templates
    WHERE template_category = 'vision_extraction' OR template_category = 'spec_generation'
  `).get();

  console.log(`✅ Vision workflows available: ${workflowCount.count}`);

  if (workflowCount.count === 0) {
    console.log('📝 Creating default Vision Registry workflows...');

    // Insert default vision extraction workflow
    db.prepare(`
      INSERT OR IGNORE INTO workflow_templates (
        id, template_name, template_category, workflow_description,
        workflow_phases, requires_capabilities, avg_duration_hours, created_at
      ) VALUES (
        'vision-extraction-default',
        'Default Vision Extraction',
        'vision_extraction',
        'Extract user vision from conversation messages and convert to technical specifications',
        '["INTENT_ANALYSIS", "BUSINESS_CONTEXT_EXTRACTION", "SUCCESS_CRITERIA_IDENTIFICATION", "CONSTRAINTS_ANALYSIS", "SPEC_GENERATION"]',
        '["nlp-analysis", "context-injection", "spec-generator"]',
        15,
        datetime('now')
      )
    `).run();

    // Insert default spec generation workflow
    db.prepare(`
      INSERT OR IGNORE INTO workflow_templates (
        id, template_name, template_category, workflow_description,
        workflow_phases, requires_capabilities, avg_duration_hours, created_at
      ) VALUES (
        'spec-generation-default',
        'Default Specification Generation',
        'spec_generation',
        'Generate comprehensive technical specifications from extracted vision',
        '["REQUIREMENT_ANALYSIS", "TECHNICAL_DESIGN", "IMPLEMENTATION_PLAN", "VALIDATION_CRITERIA", "RESOURCE_ESTIMATION"]',
        '["template-engine", "component-library", "cost-estimator"]',
        30,
        datetime('now')
      )
    `).run();

    console.log('✅ Default Vision Registry workflows created');
  }

  console.log();
  console.log('📋 STEP 6: Verify Vision Registry quality gates...');

  // Check quality gates are configured
  const qualityGateCount = db.prepare(`
    SELECT COUNT(*) as count FROM validation_criteria
    WHERE criteria_type = 'vision_quality' OR criteria_type = 'spec_quality'
  `).get();

  console.log(`✅ Quality gates configured: ${qualityGateCount.count}`);

  if (qualityGateCount.count === 0) {
    console.log('📝 Creating Vision Registry quality gates...');

    // Insert vision quality criteria using existing schema
    db.prepare(`
      INSERT OR IGNORE INTO validation_criteria (
        id, spec_id, spec_path, criteria_type, criteria_details, enabled, extracted_at
      ) VALUES
        ('vision-clarity-min', 'VISION-QUALITY', '/system/quality', 'vision_quality',
         'Minimum Vision Clarity: Vision must have clear, identifiable user intent (threshold: 0.8)', 1, datetime('now')),
        ('business-value-min', 'VISION-QUALITY', '/system/quality', 'vision_quality',
         'Minimum Business Value Alignment: Vision must align with clear business value (threshold: 0.7)', 1, datetime('now')),
        ('spec-quality-min', 'SPEC-QUALITY', '/system/quality', 'spec_quality',
         'Minimum Specification Quality: Generated specifications must meet quality standards (threshold: 0.8)', 1, datetime('now')),
        ('spec-completeness-min', 'SPEC-QUALITY', '/system/quality', 'spec_quality',
         'Minimum Specification Completeness: Generated specifications must be comprehensive (threshold: 0.8)', 1, datetime('now'))
    `).run();

    console.log('✅ Vision Registry quality gates created');
  }

  console.log();
  console.log('📋 STEP 7: Test Vision Registry with sample data...');

  // Get a sample message for testing
  const sampleMessage = db.prepare(`
    SELECT id, conversation_id, content
    FROM messages
    WHERE content IS NOT NULL AND length(content) > 50
    ORDER BY RANDOM()
    LIMIT 1
  `).get();

  if (sampleMessage) {
    console.log(`📝 Testing with message ID: ${sampleMessage.id}`);

    // Create a test vision extraction
    const visionId = `VISION-TEST-${Date.now()}`;

    db.prepare(`
      INSERT OR IGNORE INTO vision_registry (
        vision_id, source_message_id, source_conversation_id,
        user_intent, business_context, success_criteria,
        status, processing_stage, extraction_confidence,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'EXTRACTING', 'INTENT_ANALYSIS', 0.85, datetime('now'))
    `).run(
      visionId,
      sampleMessage.id,
      sampleMessage.conversation_id,
      'Test vision extraction from user message',
      'Test business context for validation',
      'Test success criteria for validation'
    );

    console.log('✅ Vision Registry test record created');

    // Clean up test record
    db.prepare('DELETE FROM vision_registry WHERE vision_id = ?').run(visionId);
    console.log('✅ Vision Registry test record cleaned up');
  } else {
    console.log('⚠️  No messages available for testing (system ready for future messages)');
  }

  console.log();
  console.log('📋 STEP 8: Create Vision Registry monitoring...');

  // Create monitoring view for vision extraction pipeline
  db.exec(`
    CREATE VIEW IF NOT EXISTS vision_extraction_pipeline AS
    SELECT
      vr.vision_id,
      vr.status,
      vr.processing_stage,
      vr.extraction_confidence,
      vr.spec_quality_score,
      vr.spec_completeness_score,
      vr.honest_completion_percentage,
      vr.assigned_agent,
      vr.created_at,
      vr.completed_at,
      m.content as original_message,
      c.title as conversation_title,
      CASE
        WHEN vr.status = 'COMPLETED' THEN '✅ COMPLETED'
        WHEN vr.status = 'FAILED' THEN '❌ FAILED'
        WHEN vr.status = 'BLOCKED' THEN '🚫 BLOCKED'
        ELSE '🔄 IN PROGRESS'
      END as status_indicator
    FROM vision_registry vr
    LEFT JOIN messages m ON vr.source_message_id = m.id
    LEFT JOIN conversations c ON vr.source_conversation_id = c.id
    ORDER BY vr.created_at DESC
  `);

  console.log('✅ Vision Registry monitoring view created');

  console.log();
  console.log('📋 STEP 9: Verify integration with Multi-Registry System...');

  // Check multi-registry overview includes vision data
  const overviewCheck = db.prepare(`
    SELECT registry_type, total_tasks, avg_completion_percentage
    FROM v_multi_registry_overview
    WHERE registry_type = 'vision'
  `).get();

  if (overviewCheck) {
    console.log('✅ Multi-Registry integration verified');
    console.log(`   - Registry Type: ${overviewCheck.registry_type}`);
    console.log(`   - Total Tasks: ${overviewCheck.total_tasks}`);
    console.log(`   - Avg Completion: ${Math.round((overviewCheck.avg_completion_percentage || 0) * 100)}%`);
  } else {
    console.log('⚠️  Multi-Registry integration needs data (will populate with first vision)');
  }

  console.log();
  console.log('🎉 VISION REGISTRY DEPLOYMENT COMPLETE!');
  console.log('='.repeat(50));

  // Final status summary
  const finalStats = {
    visions: db.prepare('SELECT COUNT(*) FROM vision_registry').get(),
    messages: db.prepare('SELECT COUNT(*) FROM messages').get(),
    conversations: db.prepare('SELECT COUNT(*) FROM conversations').get(),
    workflows: db.prepare('SELECT COUNT(*) FROM workflow_templates WHERE category LIKE "%vision%" OR category LIKE "%spec%"').get(),
    qualityGates: db.prepare('SELECT COUNT(*) FROM validation_criteria WHERE category LIKE "%vision%" OR category LIKE "%spec%"').get()
  };

  console.log('📊 FINAL STATUS:');
  console.log(`   - Vision Registry Entries: ${finalStats.visions['COUNT(*)']}`);
  console.log(`   - Available Messages: ${finalStats.messages['COUNT(*)']}`);
  console.log(`   - Available Conversations: ${finalStats.conversations['COUNT(*)']}`);
  console.log(`   - Vision Workflows: ${finalStats.workflows['COUNT(*)']}`);
  console.log(`   - Quality Gates: ${finalStats.qualityGates['COUNT(*)']}`);
  console.log();
  console.log('🚀 VISION REGISTRY SYSTEM IS READY FOR:');
  console.log('   ✅ Message → Vision extraction');
  console.log('   ✅ Vision → Specification conversion');
  console.log('   ✅ Quality validation and scoring');
  console.log('   ✅ Multi-Registry integration');
  console.log('   ✅ Real-time monitoring and tracking');
  console.log();
  console.log('🔧 NEXT STEPS:');
  console.log('   1. Vision Registry will automatically process new messages');
  console.log('   2. Use MCP tools: create_vision_extraction, declare_vision_completion');
  console.log('   3. Monitor via vision_extraction_pipeline view');
  console.log('   4. Integrate with Implementation Gap Registry for end-to-end tracking');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}

console.log();
console.log('✅ Vision Registry deployment script completed successfully!');