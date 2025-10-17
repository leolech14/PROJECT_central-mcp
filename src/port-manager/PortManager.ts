/**
 * PortManager - Main Orchestrator for PORT-MANAGER-V2
 * ===================================================
 *
 * Central management system for all IP addresses and ports across PROJECTS_ALL ecosystem
 * Provides automatic detection, conflict resolution, and real-time synchronization
 */

import Database from 'better-sqlite3';
import { ServiceRegistry } from './ServiceRegistry.js';
import { ConfigurationUpdater } from './ConfigurationUpdater.js';
import { ServiceDiscovery } from './ServiceDiscovery.js';
import { PortManagerDashboard } from './PortManagerDashboard.js';
import { logger } from '../utils/logger.js';

export interface PortManagerConfig {
  databasePath: string;
  projectsRoot: string;
  dashboard: {
    enabled: boolean;
    port: number;
    host: string;
    enableAuth: boolean;
    authToken?: string;
  };
  monitoring: {
    enabled: boolean;
    intervalMs: number;
    enableHealthChecks: boolean;
    enableAutoResolution: boolean;
  };
  autoDiscovery: {
    enabled: boolean;
    intervalMs: number;
    scanOnStartup: boolean;
  };
}

export class PortManager {
  private db: Database;
  private serviceRegistry: ServiceRegistry;
  private configurationUpdater: ConfigurationUpdater;
  private serviceDiscovery: ServiceDiscovery;
  private dashboard: PortManagerDashboard | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private discoveryInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(private config: PortManagerConfig) {
    this.db = new Database(config.databasePath);
    this.serviceRegistry = new ServiceRegistry(this.db);
    this.configurationUpdater = new ConfigurationUpdater(this.serviceRegistry, config.projectsRoot);
    this.serviceDiscovery = new ServiceDiscovery(this.serviceRegistry, config.projectsRoot);

    if (config.dashboard.enabled) {
      this.dashboard = new PortManagerDashboard(
        this.serviceRegistry,
        this.configurationUpdater,
        this.serviceDiscovery,
        config.dashboard
      );
    }

    logger.info('🚀 PortManager initialized');
  }

  /**
   * Start the PortManager system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('⚠️ PortManager is already running');
      return;
    }

    try {
      logger.info('🌟 Starting PortManager V2...');

      // Start dashboard if enabled
      if (this.dashboard) {
        await this.dashboard.start();
        logger.info(`📊 Dashboard running on http://${this.config.dashboard.host}:${this.config.dashboard.port}`);
      }

      // Initial service discovery if enabled
      if (this.config.autoDiscovery.scanOnStartup) {
        await this.performServiceDiscovery();
      }

      // Start monitoring if enabled
      if (this.config.monitoring.enabled) {
        this.startMonitoring();
      }

      // Start auto-discovery if enabled
      if (this.config.autoDiscovery.enabled) {
        this.startAutoDiscovery();
      }

      this.isRunning = true;
      logger.info('✅ PortManager V2 started successfully');

      // Log initial stats
      const stats = this.serviceRegistry.getStats();
      logger.info(`📈 Initial stats: ${stats.totalServices} services, ${stats.conflictCount} conflicts, ${stats.uniqueIPs} unique IPs`);

    } catch (error) {
      logger.error('❌ Failed to start PortManager:', error);
      throw error;
    }
  }

  /**
   * Stop the PortManager system
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('🛑 Stopping PortManager...');

    // Stop monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // Stop auto-discovery
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }

    // Stop dashboard
    if (this.dashboard) {
      await this.dashboard.stop();
    }

    this.isRunning = false;
    logger.info('✅ PortManager stopped');
  }

  /**
   * Update IP address across all projects
   */
  async updateGlobalIP(oldIP: string, newIP: string, dryRun: boolean = false): Promise<{
    success: boolean;
    filesUpdated: number;
    servicesUpdated: number;
    errors: string[];
  }> {
    logger.info(`🌍 Starting global IP update: ${oldIP} → ${newIP}${dryRun ? ' (DRY RUN)' : ''}`);

    try {
      // Update configuration files
      const configResult = await this.configurationUpdater.updateIPAcrossProjects(oldIP, newIP, dryRun);

      if (!dryRun) {
        // Update service registry
        const servicesUpdated = this.serviceRegistry.updateAllServicesIP(oldIP, newIP, 'Global IP update');

        logger.info(`✅ Global IP update completed: ${configResult.filesUpdated} files updated, ${servicesUpdated} services updated`);

        return {
          success: configResult.success,
          filesUpdated: configResult.filesUpdated,
          servicesUpdated,
          errors: configResult.errors
        };
      } else {
        logger.info(`🔍 Dry run completed: would update ${configResult.filesUpdated} files`);
        return {
          success: configResult.success,
          filesUpdated: configResult.filesUpdated,
          servicesUpdated: 0,
          errors: configResult.errors
        };
      }

    } catch (error) {
      logger.error(`❌ Global IP update failed:`, error);
      return {
        success: false,
        filesUpdated: 0,
        servicesUpdated: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Resolve all port conflicts
   */
  async resolvePortConflicts(dryRun: boolean = false): Promise<{
    success: boolean;
    conflictsResolved: number;
    filesUpdated: number;
    errors: string[];
  }> {
    logger.info(`🔧 Resolving port conflicts${dryRun ? ' (DRY RUN)' : ''}`);

    try {
      const result = await this.configurationUpdater.resolvePortConflicts(dryRun);

      if (!dryRun) {
        logger.info(`✅ Port conflicts resolved: ${result.filesUpdated} files updated`);
      } else {
        logger.info(`🔍 Dry run: would resolve conflicts in ${result.filesUpdated} files`);
      }

      const conflicts = this.serviceRegistry.getPortConflicts();

      return {
        success: result.success,
        conflictsResolved: conflicts.length,
        filesUpdated: result.filesUpdated,
        errors: result.errors
      };

    } catch (error) {
      logger.error(`❌ Port conflict resolution failed:`, error);
      return {
        success: false,
        conflictsResolved: 0,
        filesUpdated: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Perform comprehensive service discovery
   */
  async performServiceDiscovery(): Promise<{
    servicesFound: number;
    servicesUpdated: number;
    conflictsFound: number;
  }> {
    logger.info('🔍 Performing comprehensive service discovery...');

    try {
      const services = await this.serviceDiscovery.scanAllProjects();
      const conflicts = this.serviceRegistry.getPortConflicts();

      logger.info(`✅ Service discovery completed: ${services.length} services found, ${conflicts.length} conflicts`);

      return {
        servicesFound: services.length,
        servicesUpdated: services.length, // All new services are "updates" to the registry
        conflictsFound: conflicts.length
      };

    } catch (error) {
      logger.error('❌ Service discovery failed:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus(): {
    isRunning: boolean;
    stats: any;
    conflicts: any[];
    health: 'healthy' | 'warning' | 'critical';
    uptime: number;
    lastUpdate: Date;
  } {
    const stats = this.serviceRegistry.getStats();
    const conflicts = this.serviceRegistry.getPortConflicts();

    let health: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (conflicts.length > 5) {
      health = 'critical';
    } else if (conflicts.length > 0 || stats.inactiveServices > stats.activeServices) {
      health = 'warning';
    }

    return {
      isRunning: this.isRunning,
      stats,
      conflicts,
      health,
      uptime: process.uptime(),
      lastUpdate: new Date()
    };
  }

  /**
   * Validate configuration integrity
   */
  async validateConfigurationIntegrity(): Promise<{
    valid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    logger.info('🔍 Validating configuration integrity...');

    try {
      const validation = await this.configurationUpdater.validateConfigurationIntegrity();
      const recommendations: string[] = [];

      // Generate recommendations based on validation results
      if (validation.issues.length > 0) {
        recommendations.push('Fix missing configuration files');
        recommendations.push('Resolve port conflicts');
      }

      const conflicts = this.serviceRegistry.getPortConflicts();
      if (conflicts.length > 0) {
        recommendations.push(`Resolve ${conflicts.length} port conflicts`);
      }

      const stats = this.serviceRegistry.getStats();
      if (stats.inactiveServices > stats.activeServices * 0.5) {
        recommendations.push('Check inactive services - consider cleanup');
      }

      return {
        valid: validation.valid,
        issues: validation.issues,
        recommendations
      };

    } catch (error) {
      logger.error('❌ Configuration validation failed:', error);
      return {
        valid: false,
        issues: [error.message],
        recommendations: ['Fix validation errors']
      };
    }
  }

  /**
   * Generate comprehensive report
   */
  generateReport(): {
    timestamp: Date;
    summary: any;
    services: any[];
    conflicts: any[];
    recommendations: string[];
  } {
    const stats = this.serviceRegistry.getStats();
    const services = this.serviceRegistry.getAllServices();
    const conflicts = this.serviceRegistry.getPortConflicts();

    const recommendations: string[] = [];

    if (conflicts.length > 0) {
      recommendations.push(`Resolve ${conflicts.length} port conflicts`);
    }

    if (stats.inactiveServices > 0) {
      recommendations.push(`Review ${stats.inactiveServices} inactive services`);
    }

    // Group services by IP
    const ipGroups = services.reduce((groups, service) => {
      if (!groups[service.externalIP]) {
        groups[service.externalIP] = [];
      }
      groups[service.externalIP].push(service);
      return groups;
    }, {} as Record<string, typeof services>);

    const summary = {
      totalServices: stats.totalServices,
      activeServices: stats.activeServices,
      inactiveServices: stats.inactiveServices,
      conflicts: stats.conflictCount,
      uniqueIPs: stats.uniqueIPs,
      topIPs: Object.entries(ipGroups)
        .sort(([,a], [,b]) => b.length - a.length)
        .slice(0, 5)
        .map(([ip, services]) => ({ ip, serviceCount: services.length })),
      protocolDistribution: services.reduce((dist, service) => {
        dist[service.protocol] = (dist[service.protocol] || 0) + 1;
        return dist;
      }, {} as Record<string, number>)
    };

    return {
      timestamp: new Date(),
      summary,
      services,
      conflicts,
      recommendations
    };
  }

  private startMonitoring(): void {
    logger.info(`🔄 Starting monitoring (interval: ${this.config.monitoring.intervalMs}ms)`);

    this.monitoringInterval = setInterval(async () => {
      try {
        // Check for IP changes
        const ipChanges = await this.serviceDiscovery.monitorIPChanges();

        for (const change of ipChanges) {
          logger.warn(`🔄 IP change detected: ${change.oldIP} → ${change.newIP}`);

          if (this.config.monitoring.enableAutoResolution) {
            await this.updateGlobalIP(change.oldIP, change.newIP);
          }
        }

        // Check for new conflicts
        const conflicts = this.serviceRegistry.getPortConflicts();
        if (conflicts.length > 0) {
          logger.warn(`⚠️ ${conflicts.length} port conflicts detected`);

          if (this.config.monitoring.enableAutoResolution && conflicts.length <= 3) {
            logger.info('🔧 Auto-resolving port conflicts');
            await this.resolvePortConflicts();
          }
        }

        // Perform health checks if enabled
        if (this.config.monitoring.enableHealthChecks) {
          await this.performHealthChecks();
        }

      } catch (error) {
        logger.error('❌ Monitoring error:', error);
      }
    }, this.config.monitoring.intervalMs);
  }

  private startAutoDiscovery(): void {
    logger.info(`🔍 Starting auto-discovery (interval: ${this.config.autoDiscovery.intervalMs}ms)`);

    this.discoveryInterval = setInterval(async () => {
      try {
        await this.performServiceDiscovery();
      } catch (error) {
        logger.error('❌ Auto-discovery error:', error);
      }
    }, this.config.autoDiscovery.intervalMs);
  }

  private async performHealthChecks(): Promise<void> {
    const services = this.serviceRegistry.getAllServices();
    const activeServices = services.filter(s => s.config.status === 'active');

    for (const service of activeServices) {
      if (service.config.healthCheck) {
        try {
          const response = await fetch(service.config.healthCheck.url, {
            method: service.config.healthCheck.method,
            signal: AbortSignal.timeout(5000)
          });

          if (response.status !== service.config.healthCheck.expectedStatus) {
            logger.warn(`⚠️ Health check failed for ${service.projectId}:${service.serviceName}`);
          }
        } catch (error) {
          logger.warn(`⚠️ Health check error for ${service.projectId}:${service.serviceName}:`, error.message);
        }
      }
    }
  }

  /**
   * Emergency fix for IP change (like the one we just experienced)
   */
  async emergencyIPFix(oldIP: string, newIP: string): Promise<{
    success: boolean;
    actions: string[];
    errors: string[];
  }> {
    logger.info(`🚨 EMERGENCY IP FIX: ${oldIP} → ${newIP}`);

    const actions: string[] = [];
    const errors: string[] = [];

    try {
      // Step 1: Update configuration files
      actions.push('Updating configuration files...');
      const configResult = await this.configurationUpdater.updateIPAcrossProjects(oldIP, newIP, false);

      if (configResult.success) {
        actions.push(`✅ Updated ${configResult.filesUpdated} configuration files`);
      } else {
        errors.push(...configResult.errors);
      }

      // Step 2: Update service registry
      actions.push('Updating service registry...');
      const servicesUpdated = this.serviceRegistry.updateAllServicesIP(oldIP, newIP, 'Emergency IP fix');
      actions.push(`✅ Updated ${servicesUpdated} services in registry`);

      // Step 3: Validate changes
      actions.push('Validating changes...');
      const validation = await this.validateConfigurationIntegrity();

      if (validation.valid) {
        actions.push('✅ Configuration validation passed');
      } else {
        actions.push(`⚠️ ${validation.issues.length} validation issues found`);
      }

      // Step 4: Rescan for any missed services
      actions.push('Performing emergency service scan...');
      const discoveryResult = await this.performServiceDiscovery();
      actions.push(`✅ Emergency scan completed: ${discoveryResult.servicesFound} services found`);

      return {
        success: errors.length === 0,
        actions,
        errors
      };

    } catch (error) {
      errors.push(`Emergency fix failed: ${error.message}`);
      logger.error('❌ Emergency IP fix failed:', error);

      return {
        success: false,
        actions,
        errors
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.stop();

    if (this.db) {
      this.db.close();
      logger.info('🗄️ Database connection closed');
    }

    logger.info('🧹 PortManager cleanup completed');
  }
}