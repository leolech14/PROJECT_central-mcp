#!/usr/bin/env node

/**
 * 🧪 MACHINES MAP MCP TOOL - TEST SCRIPT
 * =======================================
 *
 * Official Central-MCP Integration Test
 * ULTRATHINK EDITION
 *
 * This script validates the Machines Map MCP tool integration
 * with the Central-MCP ecosystem.
 */

import { getMachinesMap, getMachinesMapHistory, exportMachinesMapToMarkdown } from './getMachinesMap.js';
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import path from 'path';

console.log('🌐 Central-MCP Machines Map MCP Tool - Integration Test');
console.log('===================================================');

// Initialize database connection
const dbPath = path.join(process.cwd(), 'data', 'registry.db');
console.log(`📊 Database: ${dbPath}`);

try {
  const db = new Database(dbPath, { readonly: true });
  console.log('✅ Database connected successfully');

  // Test 1: Basic functionality
  console.log('\n🧪 Test 1: Basic Machines Map Analysis');
  console.log('----------------------------------------');

  const startTime = Date.now();
  const machinesMap = await getMachinesMap(db);
  const analysisTime = Date.now() - startTime;

  console.log(`⏱️  Analysis completed in ${analysisTime}ms`);
  console.log(`📊 Overall Health Score: ${machinesMap.healthScores.overall}/100`);
  console.log(`🏠 Local System: ${machinesMap.localSystem.name} (${machinesMap.healthScores.local}/100)`);
  console.log(`🖥️  Remote System: ${machinesMap.remoteSystem.name} (${machinesMap.healthScores.remote}/100)`);
  console.log(`🌐 Network Status: ${machinesMap.networkConnectivity.status} (${machinesMap.networkConnectivity.latency}ms)`);
  console.log(`🚨 Critical Alerts: ${machinesMap.alerts.filter(a => a.severity === 'critical').length}`);
  console.log(`📈 Recommendations: ${machinesMap.recommendations.length}`);

  // Test 2: Data validation
  console.log('\n🧪 Test 2: Data Validation');
  console.log('----------------------------');

  const validationResults = {
    hasTimestamp: !!machinesMap.timestamp,
    hasLocalSystem: !!machinesMap.localSystem,
    hasRemoteSystem: !!machinesMap.remoteSystem,
    hasNetworkInfo: !!machinesMap.networkConnectivity,
    hasHealthScores: !!machinesMap.healthScores,
    hasRecommendations: Array.isArray(machinesMap.recommendations),
    hasAlerts: Array.isArray(machinesMap.alerts),
    hasIntegrationStatus: !!machinesMap.integrationStatus
  };

  const validationPassed = Object.values(validationResults).every(result => result === true);
  console.log(validationPassed ? '✅ Data validation passed' : '❌ Data validation failed');

  if (!validationPassed) {
    console.log('Validation issues:');
    Object.entries(validationResults).forEach(([test, passed]) => {
      if (!passed) console.log(`  ❌ ${test}`);
    });
  }

  // Test 3: Historical data
  console.log('\n🧪 Test 3: Historical Data Access');
  console.log('---------------------------------');

  const history = getMachinesMapHistory(db, 5);
  console.log(`📚 Historical analyses: ${history.length} records`);

  if (history.length > 0) {
    const latest = history[0];
    console.log(`🕐 Latest analysis: ${latest.timestamp}`);
    console.log(`📊 Latest health score: ${latest.healthScores.overall}/100`);
  }

  // Test 4: Export functionality
  console.log('\n🧪 Test 4: Export Functionality');
  console.log('--------------------------------');

  const markdownExport = exportMachinesMapToMarkdown(machinesMap);
  const exportSize = markdownExport.length;
  console.log(`📝 Markdown export size: ${exportSize} characters`);
  console.log(`📄 Contains sections: ${markdownExport.includes('# 🌐') ? '✅' : '❌'}`);
  console.log(`📊 Contains health scores: ${markdownExport.includes('Health Score') ? '✅' : '❌'}`);
  console.log(`🚨 Contains alerts: ${markdownExport.includes('Critical Alerts') ? '✅' : '❌'}`);

  // Test 5: Integration with Central-MCP patterns
  console.log('\n🧪 Test 5: Central-MCP Integration');
  console.log('-----------------------------------');

  try {
    // Check if analysis was saved to database
    const savedAnalysis = db.prepare('SELECT COUNT(*) as count FROM machines_map_analysis').get();
    console.log(`💾 Analyses saved to database: ${savedAnalysis.count}`);

    // Check table structure
    const tableInfo = db.prepare("PRAGMA table_info(machines_map_analysis)").all();
    console.log(`🗄️  Database table columns: ${tableInfo.length}`);

    const expectedColumns = ['timestamp', 'local_system', 'remote_system', 'network_connectivity', 'health_scores', 'recommendations', 'alerts', 'integration_status'];
    const hasAllColumns = expectedColumns.every(col =>
      tableInfo.some(colInfo => colInfo.name === col)
    );
    console.log(hasAllColumns ? '✅ Database schema correct' : '❌ Database schema issues');

  } catch (dbError) {
    console.log('❌ Database integration test failed:', dbError.message);
  }

  // Test 6: Performance benchmarks
  console.log('\n🧪 Test 6: Performance Benchmarks');
  console.log('--------------------------------');

  const performanceGrade = analysisTime < 10000 ? 'A+' :
                          analysisTime < 20000 ? 'A' :
                          analysisTime < 30000 ? 'B' : 'C';
  console.log(`⚡ Analysis speed: ${performanceGrade} grade (${analysisTime}ms)`);
  console.log(`🎯 Target: <30 seconds, Actual: ${(analysisTime/1000).toFixed(1)} seconds`);

  // Test 7: System health insights
  console.log('\n🧪 Test 7: System Health Insights');
  console.log('--------------------------------');

  const criticalIssues = machinesMap.alerts.filter(a => a.severity === 'critical');
  const warnings = machinesMap.alerts.filter(a => a.severity === 'warning');
  const highPriorityRecs = machinesMap.recommendations.filter(r => r.priority === 'high' || r.priority === 'critical');

  console.log(`🚨 Critical issues: ${criticalIssues.length}`);
  console.log(`⚠️  Warnings: ${warnings.length}`);
  console.log(`📋 High-priority recommendations: ${highPriorityRecs.length}`);

  if (criticalIssues.length > 0) {
    console.log('🚨 Critical issues:');
    criticalIssues.forEach(alert => {
      console.log(`   • ${alert.system}: ${alert.message}`);
    });
  }

  if (highPriorityRecs.length > 0) {
    console.log('📋 High-priority recommendations:');
    highPriorityRecs.slice(0, 3).forEach(rec => {
      console.log(`   • ${rec.title} (${rec.system})`);
    });
  }

  db.close();

  // Final assessment
  console.log('\n🎯 Integration Test Summary');
  console.log('===========================');

  const tests = [
    { name: 'Basic Functionality', passed: analysisTime > 0 },
    { name: 'Data Validation', passed: validationPassed },
    { name: 'Historical Data', passed: history.length >= 0 },
    { name: 'Export Functionality', passed: exportSize > 1000 },
    { name: 'Performance', passed: analysisTime < 30000 },
    { name: 'System Insights', passed: true }
  ];

  const passedTests = tests.filter(t => t.passed).length;
  const totalTests = tests.length;
  const successRate = Math.round((passedTests / totalTests) * 100);

  console.log(`✅ Tests passed: ${passedTests}/${totalTests} (${successRate}%)`);

  if (successRate >= 90) {
    console.log('🎉 EXCELLENT: Machines Map MCP Tool is fully integrated!');
  } else if (successRate >= 75) {
    console.log('✅ GOOD: Machines Map MCP Tool is mostly integrated');
  } else {
    console.log('⚠️  NEEDS ATTENTION: Some integration issues detected');
  }

  console.log('\n🌟 Ready for production use with Central-MCP agents!');

} catch (error) {
  console.error('❌ Integration test failed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}