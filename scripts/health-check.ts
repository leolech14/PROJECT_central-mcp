#!/usr/bin/env tsx
/**
 * Health Check Script
 * ===================
 *
 * Standalone health check for monitoring and debugging.
 * Can be run manually or via cron/scheduler.
 */

import Database from 'better-sqlite3';
import { HealthChecker } from '../src/health/HealthChecker.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../data/registry.db');

async function runHealthCheck() {
  console.log('🏥 Running System Health Check...\n');

  try {
    const db = new Database(DB_PATH);
    const healthChecker = new HealthChecker(db, DB_PATH);

    // Perform health check with auto-healing
    const health = await healthChecker.performHealthCheck();

    // Display summary
    console.log(healthChecker.getHealthSummary(health));

    // Display detailed results
    console.log('\n📊 Detailed Results:\n');
    for (const check of health.checks) {
      const icon = check.status === 'PASS' ? '✅' : check.status === 'WARN' ? '⚠️' : '❌';
      console.log(`${icon} ${check.name}: ${check.message} (${check.duration}ms)`);
    }

    if (health.issues.length > 0) {
      console.log('\n⚠️  Issues Detected:\n');
      for (const issue of health.issues) {
        console.log(`[${issue.severity}] ${issue.component}: ${issue.description}`);
        if (issue.autoRecoverable) {
          console.log(`   → Auto-recovery: ${issue.recoveryAction}`);
        }
      }
    }

    if (health.autoRecoveryAttempted) {
      console.log('\n🔧 Auto-recovery actions were executed');
    }

    // Exit code based on health
    if (health.status === 'UNHEALTHY') {
      console.error('\n❌ UNHEALTHY - Critical issues detected!');
      process.exit(1);
    } else if (health.status === 'DEGRADED') {
      console.warn('\n⚠️  DEGRADED - Warnings detected');
      process.exit(0); // Still operational
    } else {
      console.log('\n✅ HEALTHY - All systems operational');
      process.exit(0);
    }

  } catch (error) {
    console.error('💥 Health check failed:', error);
    process.exit(1);
  }
}

runHealthCheck();
