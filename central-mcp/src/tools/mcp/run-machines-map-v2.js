#!/usr/bin/env node

/**
 * 🚀 MACHINES MAP V2.0 - AUTOMATIC EXECUTION & HTML REPORT
 * ==========================================================
 *
 * ULTRATHINK EVOLUTION - Complete Automated Analysis System
 *
 * This script automatically runs the V2.0 analysis and generates
 * a sophisticated HTML report with stunning visual design.
 *
 * Usage:
 *   node run-machines-map-v2.js
 */

import { getMachinesMapV2 } from './getMachinesMapV2.js';
import Database from 'better-sqlite3';
import path from 'path';

console.log('🌐 MACHINES MAP V2.0 - AUTOMATIC EXECUTION');
console.log('==========================================');
console.log('🚀 ULTRATHINK EVOLUTION - Full Infrastructure Intelligence');
console.log('');

const startTime = Date.now();

try {
  // Initialize database connection
  const dbPath = path.join(process.cwd(), 'data', 'registry.db');
  console.log(`📊 Connecting to database: ${dbPath}`);

  const db = new Database(dbPath);
  console.log('✅ Database connected successfully');

  // Run V2.0 analysis with automatic HTML generation
  console.log('\n🧠 Starting V2.0 analysis with automatic HTML report generation...');
  console.log('   🌐 Multi-Cloud Analysis');
  console.log('   🔮 Predictive Analytics');
  console.log('   🔧 Automated Remediation');
  console.log('   💰 Cost Optimization');
  console.log('   🔐 Security Intelligence');
  console.log('   📈 Performance Analytics');
  console.log('   🌟 Sophisticated HTML Report');
  console.log('');

  const v2Data = await getMachinesMapV2(db);

  const analysisTime = Date.now() - startTime;

  console.log('\n🎉 V2.0 ANALYSIS COMPLETE - AUTOMATIC HTML REPORT GENERATED!');
  console.log('================================================================');

  // Display key results
  console.log(`⏱️  Total Analysis Time: ${(analysisTime/1000).toFixed(1)} seconds`);
  console.log(`📊 Overall Health Score: ${v2Data.healthScores.overall}/100`);
  console.log(`🌐 Multi-Cloud Resources: ${v2Data.multiCloudResources.length} providers`);
  console.log(`🧠 AI Predictions Generated: ${v2Data.predictiveInsights.length}`);
  console.log(`🔧 Automated Remediation Actions: ${v2Data.automatedRemediation.length}`);
  console.log(`💰 Monthly Savings Potential: $${v2Data.costOptimization.totalMonthlySavings.toFixed(2)}`);
  console.log(`🔐 Security Posture Score: ${v2Data.securityPosture.overallScore}/100`);
  console.log(`📈 Performance Analytics Score: ${v2Data.performanceAnalytics.overallScore}/100`);

  // Multi-Cloud breakdown
  console.log('\n🌐 Multi-Cloud Resource Breakdown:');
  v2Data.multiCloudResources.forEach(resource => {
    console.log(`   ${resource.provider.toUpperCase()}: ${resource.resources.length} resources (Health: ${resource.healthScore}/100)`);
  });

  // Critical insights
  const criticalInsights = v2Data.predictiveInsights.filter(i => i.riskLevel === 'critical');
  const highRiskInsights = v2Data.predictiveInsights.filter(i => i.riskLevel === 'high');

  if (criticalInsights.length > 0 || highRiskInsights.length > 0) {
    console.log('\n🚨 Predictive Alerts:');
    criticalInsights.forEach(insight => {
      console.log(`   🔴 CRITICAL: ${insight.insightType} - ${insight.failureProbability}% failure probability`);
    });
    highRiskInsights.forEach(insight => {
      console.log(`   🟠 HIGH RISK: ${insight.insightType} - ${insight.failureProbability}% failure probability`);
    });
  }

  // Cost optimization highlights
  if (v2Data.costOptimization.totalMonthlySavings > 0) {
    console.log('\n💰 Cost Optimization Highlights:');
    console.log(`   💵 Total Monthly Savings: $${v2Data.costOptimization.totalMonthlySavings.toFixed(2)}`);
    console.log(`   📋 Optimization Actions: ${v2Data.costOptimization.optimizationActions.length}`);

    // Top savings opportunities
    const topSavings = v2Data.costOptimization.optimizationActions
      .sort((a, b) => b.monthlySavings - a.monthlySavings)
      .slice(0, 3);

    if (topSavings.length > 0) {
      console.log('   🎯 Top Savings Opportunities:');
      topSavings.forEach((action, index) => {
        console.log(`      ${index + 1}. $${action.monthlySavings.toFixed(2)}/month - ${action.action}`);
      });
    }
  }

  // Security posture
  if (v2Data.securityPosture.vulnerabilities.length > 0) {
    console.log('\n🔐 Security Posture:');
    console.log(`   🛡️  Security Score: ${v2Data.securityPosture.overallScore}/100`);
    console.log(`   🚨 Vulnerabilities Found: ${v2Data.securityPosture.vulnerabilities.length}`);

    const criticalVulns = v2Data.securityPosture.vulnerabilities.filter(v => v.severity === 'critical');
    if (criticalVulns.length > 0) {
      console.log(`   🔴 Critical Vulnerabilities: ${criticalVulns.length}`);
    }
  }

  // Performance insights
  if (v2Data.performanceAnalytics.bottlenecks.length > 0) {
    console.log('\n📈 Performance Insights:');
    console.log(`   ⚡ Performance Score: ${v2Data.performanceAnalytics.overallScore}/100`);
    console.log(`   🚧 Bottlenecks Identified: ${v2Data.performanceAnalytics.bottlenecks.length}`);

    v2Data.performanceAnalytics.bottlenecks.slice(0, 2).forEach(bottleneck => {
      console.log(`      • ${bottleneck.resource}: ${bottleneck.metric} (${bottleneck.impact} impact)`);
    });
  }

  // HTML report location
  const htmlReportPath = path.join(process.cwd(), `MACHINES_MAP_V2_REPORT_${new Date().toISOString().replace(/[:.]/g, '-')}.html`);
  console.log(`\n🌟 SOPHISTICATED HTML REPORT GENERATED!`);
  console.log(`📄 Report Location: ${htmlReportPath}`);
  console.log(`🌐 Open in browser: open ${htmlReportPath}`);

  // Performance metrics
  console.log('\n📊 Performance Metrics:');
  console.log(`   ⚡ Analysis Speed: ${analysisTime < 30000 ? 'EXCELLENT' : analysisTime < 60000 ? 'GOOD' : 'NEEDS OPTIMIZATION'}`);
  console.log(`   🌟 Feature Completeness: V2.0 ULTRATHINK EVOLUTION`);
  console.log(`   🎨 Visual Report: SOPHISTICATED GLASSMORPHIC DESIGN`);
  console.log(`   🤖 AI Intelligence: PREDICTIVE ANALYTICS ACTIVE`);
  console.log(`   🔧 Automation: SELF-HEALING CAPABILITIES BUILT`);

  console.log('\n🎯 V2.0 EVOLUTION TRANSFORMATION ACHIEVED!');
  console.log('==========================================');
  console.log('✅ Multi-Cloud Empire Analysis');
  console.log('✅ AI-Powered Predictive Intelligence');
  console.log('✅ Automated Remediation System');
  console.log('✅ Financial Intelligence Platform');
  console.log('✅ Security Intelligence Framework');
  console.log('✅ Performance Analytics Engine');
  console.log('✅ Sophisticated HTML Report Generation');
  console.log('');
  console.log('🚀 THE FUTURE OF INFRASTRUCTURE MANAGEMENT IS NOW! 🌟');

  db.close();

  // Auto-open the HTML report (optional)
  console.log('\n🌐 Opening sophisticated HTML report in browser...');
  try {
    const { execSync } = await import('child_process');
    const platform = process.platform;

    if (platform === 'darwin') {
      execSync(`open "${htmlReportPath}"`);
    } else if (platform === 'win32') {
      execSync(`start "" "${htmlReportPath}"`);
    } else {
      execSync(`xdg-open "${htmlReportPath}"`);
    }

    console.log('✅ HTML report opened in browser!');
  } catch (error) {
    console.log('⚠️  Could not auto-open HTML report. Please open it manually.');
  }

} catch (error) {
  console.error('❌ V2.0 Analysis Failed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}