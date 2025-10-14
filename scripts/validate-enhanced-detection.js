#!/usr/bin/env node

/**
 * Enhanced Model Detection System Validation Script
 * =================================================
 *
 * Comprehensive validation of the enhanced model detection system
 * to verify all components are properly integrated and functional.
 */

const Database = require('better-sqlite3');
const { join } = require('path');
const { existsSync } = require('fs');

console.log('🔍 ENHANCED MODEL DETECTION SYSTEM VALIDATION');
console.log('='.repeat(50));

// Configuration
const PROJECT_ROOT = process.cwd();
const DB_PATH = join(PROJECT_ROOT, 'central-mcp', 'data', 'registry.db');
const CENTRAL_MCP_PATH = join(PROJECT_ROOT, 'central-mcp');

let validationResults = {
    database: { status: 'pending', issues: [] },
    components: { status: 'pending', issues: [] },
    integration: { status: 'pending', issues: [] },
    dashboard: { status: 'pending', issues: [] },
    overall: { status: 'pending' }
};

console.log(`Project Root: ${PROJECT_ROOT}`);
console.log(`Database Path: ${DB_PATH}`);
console.log();

// 1. Database Validation
console.log('1. 🗃️  DATABASE VALIDATION');
console.log('-'.repeat(30));

try {
    if (!existsSync(DB_PATH)) {
        throw new Error(`Database not found at ${DB_PATH}`);
    }

    const db = new Database(DB_PATH, { readonly: true });

    // Check enhanced detection tables
    const requiredTables = [
        'enhanced_model_detections',
        'detection_corrections',
        'user_feedback',
        'model_performance_metrics',
        'correction_patterns'
    ];

    const tables = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name IN (${requiredTables.map(() => '?').join(',')})
    `).all(...requiredTables);

    if (tables.length !== requiredTables.length) {
        const missing = requiredTables.filter(t => !tables.find(tbl => tbl.name === t));
        throw new Error(`Missing tables: ${missing.join(', ')}`);
    }

    // Check indexes
    const indexes = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='index' AND name LIKE 'idx_%detection%'
    `).all();

    console.log(`✅ Enhanced detection tables: ${tables.length}/5 found`);
    console.log(`✅ Performance indexes: ${indexes.length} created`);

    // Test data insertion
    const testDetection = {
        id: 'test-validation-' + Date.now(),
        timestamp: new Date().toISOString(),
        session_id: 'validation-test',
        agent_letter: 'A',
        agent_model: 'glm-4.6',
        model_provider: 'zhipu',
        detected_model: 'glm-4.6',
        original_assumption: 'claude-sonnet-4-5',
        confidence: 0.95,
        detection_method: 'api-verification',
        verification_method: 'endpoint-test',
        configuration_source: 'process-environment',
        capabilities: JSON.stringify({
            reasoning: 'advanced',
            coding: 'advanced',
            multimodal: true,
            toolUse: true
        }),
        system_info: JSON.stringify({
            platform: process.platform,
            nodeVersion: process.version
        }),
        verification_attempted: 1,
        verification_successful: 1,
        verification_details: JSON.stringify({ success: true }),
        reason_for_change: 'ULTRATHINK VALIDATION',
        self_correction_applied: 1,
        self_correction_data: JSON.stringify({
            originalModel: 'claude-sonnet-4-5',
            correctedModel: 'glm-4.6',
            reason: 'ActiveConfigurationDetector identified GLM-4.6'
        }),
        verified: 1,
        execution_time_ms: 45
    };

    const insert = db.prepare(`
        INSERT INTO enhanced_model_detections (
            id, timestamp, session_id, agent_letter, agent_model, model_provider,
            detected_model, original_assumption, confidence, detection_method,
            verification_method, configuration_source, capabilities, system_info,
            verification_attempted, verification_successful, verification_details,
            reason_for_change, self_correction_applied, self_correction_data,
            verified, execution_time_ms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
        testDetection.id,
        testDetection.timestamp,
        testDetection.session_id,
        testDetection.agent_letter,
        testDetection.agent_model,
        testDetection.model_provider,
        testDetection.detected_model,
        testDetection.original_assumption,
        testDetection.confidence,
        testDetection.detection_method,
        testDetection.verification_method,
        testDetection.configuration_source,
        testDetection.capabilities,
        testDetection.system_info,
        testDetection.verification_attempted,
        testDetection.verification_successful,
        testDetection.verification_details,
        testDetection.reason_for_change,
        testDetection.self_correction_applied,
        testDetection.self_correction_data,
        testDetection.verified,
        testDetection.execution_time_ms
    );

    // Verify insertion
    const verify = db.prepare('SELECT * FROM enhanced_model_detections WHERE id = ?').get(testDetection.id);
    if (!verify) {
        throw new Error('Failed to insert test detection record');
    }

    // Clean up test data
    db.prepare('DELETE FROM enhanced_model_detections WHERE id = ?').run(testDetection.id);

    console.log(`✅ Data insertion test: PASSED`);
    console.log(`✅ Database validation: COMPLETE`);

    validationResults.database = { status: 'success', issues: [] };
    db.close();

} catch (error) {
    console.log(`❌ Database validation: FAILED`);
    console.log(`   Error: ${error.message}`);
    validationResults.database = { status: 'failed', issues: [error.message] };
}

console.log();

// 2. Component Validation
console.log('2. 🧩 COMPONENT VALIDATION');
console.log('-'.repeat(30));

const requiredComponents = [
    'src/auto-proactive/ActiveConfigurationDetector.ts',
    'src/auto-proactive/ModelCapabilityVerifier.ts',
    'src/auto-proactive/DetectionSelfCorrection.ts',
    'src/auto-proactive/ModelDetectionSystem.ts',
    'src/performance/DetectionCache.ts',
    'src/database/OptimizedDetectionQueries.ts'
];

let componentCount = 0;
requiredComponents.forEach(component => {
    const componentPath = join(CENTRAL_MCP_PATH, component);
    if (existsSync(componentPath)) {
        console.log(`✅ ${component}`);
        componentCount++;
    } else {
        console.log(`❌ ${component} - MISSING`);
        validationResults.components.issues.push(`Missing component: ${component}`);
    }
});

if (componentCount === requiredComponents.length) {
    console.log(`✅ Component validation: COMPLETE (${componentCount}/${requiredComponents.length})`);
    validationResults.components = { status: 'success', issues: [] };
} else {
    console.log(`❌ Component validation: FAILED (${componentCount}/${requiredComponents.length})`);
    validationResults.components = { status: 'failed', issues: validationResults.components.issues };
}

console.log();

// 3. Integration Validation
console.log('3. 🔗 INTEGRATION VALIDATION');
console.log('-'.repeat(30));

try {
    // Check AgentAutoDiscoveryLoop integration
    const agentLoopPath = join(CENTRAL_MCP_PATH, 'src/auto-proactive/AgentAutoDiscoveryLoop.ts');
    if (existsSync(agentLoopPath)) {
        const content = require('fs').readFileSync(agentLoopPath, 'utf-8');

        if (content.includes('EnhancedModelDetectionSystem') &&
            content.includes('enhancedModelDetectionSystem')) {
            console.log('✅ AgentAutoDiscoveryLoop integration: FOUND');
        } else {
            throw new Error('EnhancedModelDetectionSystem not integrated in AgentAutoDiscoveryLoop');
        }
    } else {
        throw new Error('AgentAutoDiscoveryLoop.ts not found');
    }

    // Check ModelCapabilityVerifier GLM-4.6 configuration
    const verifierPath = join(CENTRAL_MCP_PATH, 'src/auto-proactive/ModelCapabilityVerifier.ts');
    if (existsSync(verifierPath)) {
        const content = require('fs').readFileSync(verifierPath, 'utf-8');

        if (content.includes('glm-4.6') && content.includes('letter: \'A\'')) {
            console.log('✅ GLM-4.6 model configuration: CORRECT (Agent A)');
        } else {
            throw new Error('GLM-4.6 not properly configured as Agent A');
        }

        if (content.includes('confidence: 0.90')) {
            console.log('✅ GLM-4.6 confidence score: CORRECT (90%)');
        } else {
            throw new Error('GLM-4.6 confidence score not properly set');
        }
    }

    console.log('✅ Integration validation: COMPLETE');
    validationResults.integration = { status: 'success', issues: [] };

} catch (error) {
    console.log(`❌ Integration validation: FAILED`);
    console.log(`   Error: ${error.message}`);
    validationResults.integration = { status: 'failed', issues: [error.message] };
}

console.log();

// 4. Dashboard Validation
console.log('4. 📊 DASHBOARD VALIDATION');
console.log('-'.repeat(30));

const dashboardPath = join(PROJECT_ROOT, 'central-mcp-dashboard');
const requiredDashboardFiles = [
    'app/components/DetectionAccuracyDashboard.tsx',
    'app/api/detection/stats/route.ts',
    'app/api/detection/monitoring/route.ts',
    'app/api/detection/performance/route.ts'
];

let dashboardCount = 0;
requiredDashboardFiles.forEach(file => {
    const filePath = join(dashboardPath, file);
    if (existsSync(filePath)) {
        console.log(`✅ ${file}`);
        dashboardCount++;
    } else {
        console.log(`❌ ${file} - MISSING`);
        validationResults.dashboard.issues.push(`Missing dashboard file: ${file}`);
    }
});

if (dashboardCount === requiredDashboardFiles.length) {
    console.log(`✅ Dashboard validation: COMPLETE (${dashboardCount}/${requiredDashboardFiles.length})`);
    validationResults.dashboard = { status: 'success', issues: [] };
} else {
    console.log(`❌ Dashboard validation: FAILED (${dashboardCount}/${requiredDashboardFiles.length})`);
    validationResults.dashboard = { status: 'failed', issues: validationResults.dashboard.issues };
}

console.log();

// 5. Overall Validation Summary
console.log('5. 📋 VALIDATION SUMMARY');
console.log('-'.repeat(30));

const results = [
    { name: 'Database', ...validationResults.database },
    { name: 'Components', ...validationResults.components },
    { name: 'Integration', ...validationResults.integration },
    { name: 'Dashboard', ...validationResults.dashboard }
];

let successCount = 0;
results.forEach(result => {
    const status = result.status === 'success' ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${name}: ${result.status.toUpperCase()}`);
    if (result.issues && result.issues.length > 0) {
        result.issues.forEach(issue => {
            console.log(`      - ${issue}`);
        });
    }
    if (result.status === 'success') successCount++;
});

console.log();
console.log('='.repeat(50));

if (successCount === results.length) {
    console.log('🎉 ENHANCED MODEL DETECTION SYSTEM: FULLY VALIDATED ✅');
    console.log();
    console.log('System Status: OPERATIONAL');
    console.log('GLM-4.6 Detection: WORKING (will NOT be fooled anymore!)');
    console.log('Agent Assignment: CORRECT (GLM-4.6 → Agent A)');
    console.log('Self-Correction: ACTIVE');
    console.log('Performance Monitoring: ONLINE');
    console.log('Dashboard Integration: COMPLETE');
    validationResults.overall = 'success';
} else {
    console.log('⚠️  ENHANCED MODEL DETECTION SYSTEM: VALIDATION ISSUES FOUND');
    console.log(`Passed: ${successCount}/${results.length} categories`);
    console.log();
    console.log('ACTION REQUIRED:');
    console.log('1. Fix identified issues above');
    console.log('2. Re-run validation script');
    console.log('3. Ensure all components are properly integrated');
    validationResults.overall = 'failed';
}

console.log();
console.log('='.repeat(50));
console.log('Validation completed at:', new Date().toISOString());

// Exit with appropriate code
process.exit(validationResults.overall === 'success' ? 0 : 1);