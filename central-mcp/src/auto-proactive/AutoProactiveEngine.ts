/**
 * Auto-Proactive Engine - THE LIVING SYSTEM
 * ==========================================
 *
 * Manages all 9 auto-proactive loops that make Central-MCP ALIVE!
 *
 * The system that never sits still.
 * The system with an agenda.
 * The machine that builds itself.
 *
 * Natural Order (Inside-Out Building):
 * Loop 0: System Status (foundation - health checks)
 * Loop 1: Agent Auto-Discovery (awareness - who/what/where)
 * Loop 2: Project Auto-Discovery (projects - what exists)
 * Loop 3: Context Learning (RESERVED - future)
 * Loop 4: Progress Auto-Monitoring (monitoring - real-time tracking)
 * Loop 5: Status Auto-Analysis (status - health analysis)
 * Loop 6: Opportunity Auto-Scanning (opportunities - what's needed)
 * Loop 7: Spec Auto-Generation (specs - what to build)
 * Loop 8: Task Auto-Assignment (execution - who does what)
 */

import Database from 'better-sqlite3';
import { SystemStatusLoop } from './SystemStatusLoop.js';
import { AgentAutoDiscoveryLoop } from './AgentAutoDiscoveryLoop.js';
import { ProjectDiscoveryLoop } from './ProjectDiscoveryLoop.js';
import { ProgressMonitoringLoop } from './ProgressMonitoringLoop.js';
import { StatusAnalysisLoop } from './StatusAnalysisLoop.js';
import { OpportunityScanningLoop } from './OpportunityScanningLoop.js';
import { SpecGenerationLoop } from './SpecGenerationLoop.js';
import { TaskAssignmentLoop } from './TaskAssignmentLoop.js';
import { logger } from '../utils/logger.js';

export interface AutoProactiveConfig {
  // Loop enablement
  enableLoop0: boolean; // System Status
  enableLoop1: boolean; // Agent Auto-Discovery
  enableLoop2: boolean; // Project Discovery
  enableLoop4: boolean; // Progress Monitoring
  enableLoop5: boolean; // Status Analysis
  enableLoop9: boolean; // Git Push Monitor
  enableLoop10: boolean; // RunPod Monitor (NEW!)
  enableLoop6: boolean; // Opportunity Scanning
  enableLoop7: boolean; // Spec Generation
  enableLoop8: boolean; // Task Assignment

  // Database path for Loop 0
  dbPath: string;
  criticalPaths: string[];

  // Scan paths for Loop 2
  projectScanPaths: string[];

  // Intervals (seconds)
  loop0Interval: number; // Default: 5
  loop1Interval: number; // Default: 60
  loop2Interval: number; // Default: 60
  loop4Interval: number; // Default: 30
  loop5Interval: number; // Default: 300 (5min)
  loop9Interval: number; // Default: 60 (1min) - Git Push Monitor
  loop10Interval: number; // Default: 60 (1min) - RunPod Monitor (NEW!)
  loop6Interval: number; // Default: 900 (15min)
  loop7Interval: number; // Default: 600 (10min)
  loop8Interval: number; // Default: 120 (2min)

  // Revolutionary Systems (NEW!)
  systems?: {
    modelRegistry?: any;
    llmOrchestrator?: any;
    gitIntelligence?: any;
    autoDeployer?: any;
    specValidator?: any;
    totalityVerification?: any;
    agentOrchestrator?: any;
    contentManager?: any;
    taskGenerator?: any;
    specParser?: any;
  };
}

export class AutoProactiveEngine {
  private db: Database.Database;
  private config: AutoProactiveConfig;
  private loops: Map<string, any> = new Map();
  private startTime: number = 0;
  private systems: any; // Store revolutionary systems for loop access

  constructor(db: Database.Database, config: AutoProactiveConfig) {
    this.db = db;
    this.config = config;
    this.systems = config.systems || {}; // Store systems for loops to access

    if (config.systems) {
      logger.info('🎯 AutoProactiveEngine initialized with 10 revolutionary systems');
    }
  }

  /**
   * Start all enabled loops in natural dependency order
   */
  async start(): Promise<void> {
    logger.info('');
    logger.info('⚡ ════════════════════════════════════════════');
    logger.info('   AUTO-PROACTIVE ENGINE STARTING');
    logger.info('   The Living System Awakening...');
    logger.info('════════════════════════════════════════════');
    logger.info('');

    this.startTime = Date.now();

    // ═══════════════════════════════════════════════════
    // LAYER 0: FOUNDATION & SYSTEM HEALTH
    // ═══════════════════════════════════════════════════

    // Loop 0: System Status (MUST RUN FIRST!)
    if (this.config.enableLoop0) {
      const loop0 = new SystemStatusLoop(this.db, {
        intervalSeconds: this.config.loop0Interval,
        dbPath: this.config.dbPath,
        criticalPaths: this.config.criticalPaths,
        memoryThresholdMB: 512,
        autoRecover: true
      }, this.systems); // Pass systems for intelligent health checks

      loop0.start();
      this.loops.set('loop0', loop0);

      logger.info('✅ Loop 0: System Status ACTIVE (Foundation)');
      logger.info(`   Interval: ${this.config.loop0Interval}s`);
      logger.info('');
    }

    // Loop 1: Agent Auto-Discovery (WHO/WHAT/WHERE awareness)
    if (this.config.enableLoop1) {
      const loop1 = new AgentAutoDiscoveryLoop(this.db, {
        intervalSeconds: this.config.loop1Interval,
        autoRegister: true,
        trackHeartbeats: true,
        sessionTimeoutMinutes: 10
      });

      loop1.start();
      this.loops.set('loop1', loop1);

      logger.info('✅ Loop 1: Agent Auto-Discovery ACTIVE (Awareness)');
      logger.info(`   Interval: ${this.config.loop1Interval}s`);
      logger.info('');
    }

    // ═══════════════════════════════════════════════════
    // LAYER 1: OBSERVATION & TRACKING
    // ═══════════════════════════════════════════════════

    // Loop 2: Project Auto-Discovery
    if (this.config.enableLoop2) {
      const loop2 = new ProjectDiscoveryLoop(this.db, {
        scanPaths: this.config.projectScanPaths,
        intervalSeconds: this.config.loop2Interval,
        autoRegister: true,
        extractContext: true
      });

      loop2.start();
      this.loops.set('loop2', loop2);

      logger.info('✅ Loop 2: Project Auto-Discovery ACTIVE');
      logger.info(`   Interval: ${this.config.loop2Interval}s`);
      logger.info(`   Scanning: ${this.config.projectScanPaths.join(', ')}`);
      logger.info('');
    }

    // Loop 3: Context Learning (RESERVED for future implementation)
    logger.info('⏸️  Loop 3: Context Learning (RESERVED)');
    logger.info('');

    // Loop 4: Progress Auto-Monitoring
    if (this.config.enableLoop4) {
      const loop4 = new ProgressMonitoringLoop(this.db, {
        intervalSeconds: this.config.loop4Interval,
        staleThresholdMinutes: 5,
        abandonThresholdMinutes: 10,
        autoRelease: true,
        autoUnblock: true
      });

      loop4.start();
      this.loops.set('loop4', loop4);

      logger.info('✅ Loop 4: Progress Auto-Monitoring ACTIVE');
      logger.info(`   Interval: ${this.config.loop4Interval}s`);
      logger.info('');
    }

    // Loop 5: Status Auto-Analysis
    if (this.config.enableLoop5) {
      const loop5 = new StatusAnalysisLoop(this.db, {
        intervalSeconds: this.config.loop5Interval,
        analyzeGit: true,
        analyzeBuild: true,
        detectBlockers: true,
        autoAlert: true
      });

      loop5.start();
      this.loops.set('loop5', loop5);

      logger.info('✅ Loop 5: Status Auto-Analysis ACTIVE');
      logger.info(`   Interval: ${this.config.loop5Interval}s`);
      logger.info('');
    }

    // Loop 9: Git Push Monitor (Senior Engineer Workflows)
    if (this.config.enableLoop9) {
      const { GitPushMonitor } = await import('./GitPushMonitor.js');

      const loop9 = new GitPushMonitor(this.db, {
        intervalSeconds: this.config.loop9Interval,
        repoPath: process.cwd(),
        autoVersion: true,
        autoChangelog: true,
        autoDeploy: false, // Manual deployment approval for now
        deployBranches: ['main', 'develop'],
        versionPrefix: 'v',
        changelogPath: './CHANGELOG.md'
      }, this.systems); // Pass systems for git intelligence

      loop9.start();
      this.loops.set('loop9', loop9);

      logger.info('✅ Loop 9: Git Push Monitor ACTIVE (Senior Engineer Workflows)');
      logger.info(`   Interval: ${this.config.loop9Interval}s`);
      logger.info(`   Features: Auto-versioning, Changelog, Deployment detection`);
      logger.info('');
    }

    // Loop 10: RunPod Monitor (Infrastructure Cost Tracking)
    if (this.config.enableLoop10) {
      const { RunPodMonitorLoop } = await import('./RunPodMonitorLoop.js');

      const loop10 = new RunPodMonitorLoop(this.db, {
        intervalSeconds: this.config.loop10Interval,
        warningThreshold: 50,   // $50/day warning
        criticalThreshold: 100  // $100/day critical
      });

      loop10.start();
      this.loops.set('loop10', loop10);

      logger.info('✅ Loop 10: RunPod Monitor ACTIVE (Infrastructure Cost Tracking)');
      logger.info(`   Interval: ${this.config.loop10Interval}s`);
      logger.info(`   Features: Cost tracking, Pod monitoring, Auto-alerts`);
      logger.info('');
    }

    // ═══════════════════════════════════════════════════
    // LAYER 2: DETECTION & PLANNING
    // ═══════════════════════════════════════════════════

    // Loop 6: Opportunity Auto-Scanning
    if (this.config.enableLoop6) {
      const loop6 = new OpportunityScanningLoop(this.db, {
        intervalSeconds: this.config.loop6Interval,
        scanSpecs: true,
        scanTests: true,
        scanDocs: true,
        autoGenerateTasks: true
      });

      loop6.start();
      this.loops.set('loop6', loop6);

      logger.info('✅ Loop 6: Opportunity Auto-Scanning ACTIVE');
      logger.info(`   Interval: ${this.config.loop6Interval}s`);
      logger.info('');
    }

    // Loop 7: Spec Auto-Generation
    if (this.config.enableLoop7) {
      const loop7 = new SpecGenerationLoop(this.db, {
        intervalSeconds: this.config.loop7Interval,
        autoGenerate: false, // Detection mode until LLM integrated
        createTasks: true,
        llmProvider: 'anthropic',
        llmModel: 'claude-sonnet-4-5'
      }, this.systems); // Pass systems for intelligent spec generation

      loop7.start();
      this.loops.set('loop7', loop7);

      logger.info('✅ Loop 7: Spec Auto-Generation ACTIVE');
      logger.info(`   Interval: ${this.config.loop7Interval}s`);
      logger.info(`   Mode: DETECTION (LLM pending)`);
      logger.info('');
    }

    // ═══════════════════════════════════════════════════
    // LAYER 3: EXECUTION
    // ═══════════════════════════════════════════════════

    // Loop 8: Task Auto-Assignment
    if (this.config.enableLoop8) {
      const loop8 = new TaskAssignmentLoop(this.db, {
        intervalSeconds: this.config.loop8Interval,
        autoAssign: true,
        notifyAgents: true
      }, this.systems); // Pass systems for intelligent task assignment

      loop8.start();
      this.loops.set('loop8', loop8);

      logger.info('✅ Loop 8: Task Auto-Assignment ACTIVE');
      logger.info(`   Interval: ${this.config.loop8Interval}s`);
      logger.info('');
    }

    logger.info('════════════════════════════════════════════');
    logger.info('🧠 AUTO-PROACTIVE ENGINE: ONLINE');
    const maxLoops = (this.config.enableLoop9 ? 1 : 0) + (this.config.enableLoop10 ? 1 : 0) + 8;
    logger.info(`   Active Loops: ${this.loops.size}/${maxLoops} (Loop 3 reserved)`);
    logger.info('   Natural Order: Foundation → Execution');
    logger.info('   The system is now ALIVE with purpose!');
    if (this.loops.size === 9) {
      logger.info('   🎉 PERFECT 9/9 LOOPS ACTIVE!');
    }
    logger.info('════════════════════════════════════════════');
    logger.info('');
  }

  /**
   * Stop all loops
   */
  stop(): void {
    logger.info('🛑 Stopping Auto-Proactive Engine...');

    for (const [name, loop] of this.loops.entries()) {
      if (loop.stop) {
        loop.stop();
        logger.info(`   Stopped: ${name}`);
      }
    }

    this.loops.clear();
    logger.info('✅ Auto-Proactive Engine stopped');
  }

  /**
   * Get engine status
   */
  getStatus(): {
    isRunning: boolean;
    uptimeSeconds: number;
    activeLoops: number;
    loopStats: any[];
  } {
    const uptime = this.startTime > 0 ? (Date.now() - this.startTime) / 1000 : 0;

    const loopStats: any[] = [];

    for (const [name, loop] of this.loops.entries()) {
      if (loop.getStats) {
        loopStats.push({
          name,
          ...loop.getStats()
        });
      }
    }

    return {
      isRunning: this.loops.size > 0,
      uptimeSeconds: uptime,
      activeLoops: this.loops.size,
      loopStats
    };
  }
}
