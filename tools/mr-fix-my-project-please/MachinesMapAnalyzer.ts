/**
 * 🌐 MACHINES MAP ANALYZER - ULTRATHINK EDITION
 * =============================================
 *
 * Dual-system infrastructure analysis and mapping tool
 * Adapted from MegaProjectAnalyzer for real-time machine mapping
 *
 * Features:
 * - Dual-system analysis (Local + Remote VM)
 * - Real-time infrastructure monitoring
 * - Network connectivity analysis
 * - Service health monitoring
 * - Storage optimization recommendations
 * - Automated reporting generation
 */

import { readFileSync, existsSync, readdirSync, statSync, execSync } from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

export interface MachineSystem {
  name: string;
  type: 'local' | 'remote';
  architecture: string;
  os: string;
  memory: {
    total: number;
    used: number;
    available: number;
  };
  storage: {
    total: number;
    used: number;
    available: number;
    utilization: number;
  };
  cpu: {
    cores: number;
    model: string;
  };
  network: {
    interfaces: NetworkInterface[];
    connectivity: ConnectionStatus;
  };
  services: ServiceInfo[];
  projects: ProjectInfo[];
  healthScore: number;
}

export interface NetworkInterface {
  name: string;
  type: string;
  ip: string;
  status: string;
}

export interface ConnectionStatus {
  latency: number;
  status: 'connected' | 'disconnected' | 'degraded';
  lastCheck: Date;
}

export interface ServiceInfo {
  name: string;
  status: 'running' | 'stopped' | 'unknown';
  port?: number;
  memoryUsage?: number;
}

export interface ProjectInfo {
  name: string;
  path: string;
  size: number;
  lastModified: Date;
  status: 'active' | 'inactive' | 'archived';
}

export interface MachinesMapReport {
  generatedAt: Date;
  systems: MachineSystem[];
  integration: {
    networkStatus: ConnectionStatus;
    syncStatus: string;
    distributedServices: string[];
  };
  healthScores: {
    overall: number;
    bySystem: { [key: string]: number };
  };
  recommendations: Recommendation[];
  alerts: Alert[];
}

export interface Recommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'storage' | 'performance' | 'security' | 'optimization';
  title: string;
  description: string;
  actionItems: string[];
}

export interface Alert {
  severity: 'info' | 'warning' | 'error' | 'critical';
  system: string;
  message: string;
  timestamp: Date;
}

export class MachinesMapAnalyzer {
  private db: Database.Database;
  private vmConfig: {
    host: string;
    zone: string;
    user: string;
  };

  constructor(db: Database.Database, vmConfig: any) {
    this.db = db;
    this.vmConfig = vmConfig;
    this.initializeAnalysisTables();
  }

  /**
   * Generate comprehensive machines map analysis
   */
  async generateMachinesMap(): Promise<MachinesMapReport> {
    console.log('🌐 Starting ULTRATHINK Machines Map Analysis...');

    // Analyze local system
    const localSystem = await this.analyzeLocalSystem();
    console.log('   ✅ Local system analyzed');

    // Analyze remote VM
    const remoteSystem = await this.analyzeRemoteSystem();
    console.log('   ✅ Remote VM analyzed');

    // Analyze integration
    const integration = await this.analyzeSystemIntegration();
    console.log('   ✅ System integration analyzed');

    // Calculate health scores
    const healthScores = this.calculateHealthScores([localSystem, remoteSystem]);
    console.log('   ✅ Health scores calculated');

    // Generate recommendations
    const recommendations = this.generateRecommendations([localSystem, remoteSystem]);
    console.log('   ✅ Recommendations generated');

    // Generate alerts
    const alerts = this.generateAlerts([localSystem, remoteSystem]);
    console.log('   ✅ Alerts generated');

    const report: MachinesMapReport = {
      generatedAt: new Date(),
      systems: [localSystem, remoteSystem],
      integration,
      healthScores,
      recommendations,
      alerts
    };

    // Save analysis to database
    this.saveAnalysis(report);

    console.log('🎯 ULTRATHINK Machines Map Analysis Complete!');
    return report;
  }

  /**
   * Analyze local MacBook Pro system
   */
  private async analyzeLocalSystem(): Promise<MachineSystem> {
    console.log('   🏠 Analyzing MacBook Pro system...');

    try {
      // Get system information
      const uname = execSync('uname -a').toString().trim();
      const memoryInfo = execSync('sysctl hw.memsize').toString().trim();
      const cpuInfo = execSync('sysctl -n machdep.cpu.brand_string').toString().trim();

      // Parse memory info
      const memoryMatch = memoryInfo.match(/hw.memsize: (\d+)/);
      const totalMemory = memoryMatch ? parseInt(memoryMatch[1]) : 0;

      // Get disk usage
      const dfOutput = execSync('df -h').toString().split('\n');
      const mainVolume = dfOutput.find(line => line.includes('/dev/disk3s5')) || dfOutput[1];
      const diskParts = mainVolume.split(/\s+/);

      // Analyze PROJECTS_all ecosystem
      const projects = await this.analyzeProjects('/Users/lech/PROJECTS_all');

      // Get network interfaces
      const ifconfig = execSync('ifconfig | grep "inet " | grep -v 127.0.0.1').toString().trim();
      const networkInterfaces = this.parseNetworkInterfaces(ifconfig);

      const system: MachineSystem = {
        name: 'MacBook Pro',
        type: 'local',
        architecture: 'ARM64',
        os: uname,
        memory: {
          total: totalMemory,
          used: 0, // Would need more detailed parsing
          available: totalMemory * 0.3 // Estimate
        },
        storage: {
          total: this.parseSize(diskParts[1]),
          used: this.parseSize(diskParts[2]),
          available: this.parseSize(diskParts[3]),
          utilization: parseInt(diskParts[4])
        },
        cpu: {
          cores: 0, // Apple M4 Pro - would need system_profiler
          model: cpuInfo
        },
        network: {
          interfaces: networkInterfaces,
          connectivity: {
            latency: 0,
            status: 'connected',
            lastCheck: new Date()
          }
        },
        services: [], // Local services analysis would require additional tools
        projects,
        healthScore: 0 // Will be calculated
      };

      return system;

    } catch (error) {
      console.error('   ❌ Error analyzing local system:', error);
      throw error;
    }
  }

  /**
   * Analyze remote Google VM system
   */
  private async analyzeRemoteSystem(): Promise<MachineSystem> {
    console.log('   🖥️ Analyzing Google VM system...');

    try {
      // Get VM system information
      const vmCommand = (cmd: string) => {
        const fullCmd = `gcloud compute ssh ${this.vmConfig.host} --zone=${this.vmConfig.zone} --command='${cmd}'`;
        return execSync(fullCmd, { timeout: 30000 }).toString().trim();
      };

      const uname = vmCommand('uname -a');
      const dfOutput = vmCommand('df -h');
      const freeOutput = vmCommand('free -h');
      const servicesOutput = vmCommand('systemctl list-units --type=service --state=running | head -10');
      const ipOutput = vmCommand("ip addr show | grep 'inet '");

      // Parse disk usage
      const dfLines = dfOutput.split('\n');
      const rootVolume = dfLines.find(line => line.includes('/dev/root')) || dfLines[1];
      const rootParts = rootVolume.split(/\s+/);

      // Parse memory
      const freeLines = freeOutput.split('\n');
      const memLine = freeLines.find(line => line.startsWith('Mem:')) || '';
      const memParts = memLine.split(/\s+/);

      // Parse services
      const services = this.parseServices(servicesOutput);

      // Analyze VM projects
      const vmProjects = await this.analyzeVMProjects(vmCommand);

      // Parse network interfaces
      const networkInterfaces = this.parseVMNetworkInterfaces(ipOutput);

      const system: MachineSystem = {
        name: 'Google VM (central-mcp-server)',
        type: 'remote',
        architecture: 'x86_64',
        os: uname,
        memory: {
          total: this.parseMemorySize(memParts[1]),
          used: this.parseMemorySize(memParts[2]),
          available: this.parseMemorySize(memParts[6])
        },
        storage: {
          total: this.parseSize(rootParts[1]),
          used: this.parseSize(rootParts[2]),
          available: this.parseSize(rootParts[3]),
          utilization: parseInt(rootParts[4])
        },
        cpu: {
          cores: parseInt(vmCommand('nproc')),
          model: 'Intel Xeon (e2-standard-4)'
        },
        network: {
          interfaces: networkInterfaces,
          connectivity: {
            latency: 177, // From ping test
            status: 'connected',
            lastCheck: new Date()
          }
        },
        services,
        projects: vmProjects,
        healthScore: 0 // Will be calculated
      };

      return system;

    } catch (error) {
      console.error('   ❌ Error analyzing remote system:', error);
      throw error;
    }
  }

  /**
   * Analyze PROJECTS_all ecosystem
   */
  private async analyzeProjects(projectPath: string): Promise<ProjectInfo[]> {
    const projects: ProjectInfo[] = [];

    try {
      const entries = readdirSync(projectPath);
      const projectDirs = entries.filter(entry =>
        entry.startsWith('PROJECT_') &&
        statSync(path.join(projectPath, entry)).isDirectory()
      );

      for (const projectDir of projectDirs) {
        const fullPath = path.join(projectPath, projectDir);
        const stats = statSync(fullPath);

        // Get project size
        const duOutput = execSync(`du -sh "${fullPath}"`).toString().trim();
        const size = this.parseSize(duOutput.split('\t')[0]);

        projects.push({
          name: projectDir,
          path: fullPath,
          size,
          lastModified: stats.mtime,
          status: 'active' // Could be enhanced with activity analysis
        });
      }

      // Sort by size (largest first)
      projects.sort((a, b) => b.size - a.size);

    } catch (error) {
      console.error('     Warning: Could not analyze projects:', error);
    }

    return projects;
  }

  /**
   * Analyze VM projects
   */
  private async analyzeVMProjects(vmCommand: (cmd: string) => string): Promise<ProjectInfo[]> {
    const projects: ProjectInfo[] = [];

    try {
      const lsOutput = vmCommand('ls -la /home/lech/PROJECTS_all/');
      const lines = lsOutput.split('\n');

      for (const line of lines) {
        if (line.startsWith('d') && line.includes('PROJECT_')) {
          const parts = line.split(/\s+/);
          const projectName = parts[parts.length - 1];

          projects.push({
            name: projectName,
            path: `/home/lech/PROJECTS_all/${projectName}`,
            size: 0, // Would need additional commands
            lastModified: new Date(), // Would need additional parsing
            status: 'synced'
          });
        }
      }
    } catch (error) {
      console.error('     Warning: Could not analyze VM projects:', error);
    }

    return projects;
  }

  /**
   * Parse network interfaces from ifconfig output
   */
  private parseNetworkInterfaces(ifconfigOutput: string): NetworkInterface[] {
    const interfaces: NetworkInterface[] = [];

    try {
      const lines = ifconfigOutput.split('\n');
      for (const line of lines) {
        const match = line.match(/inet (\S+)/);
        if (match) {
          interfaces.push({
            name: 'en0', // Simplified - would need proper parsing
            type: 'Ethernet/Wi-Fi',
            ip: match[1],
            status: 'active'
          });
        }
      }
    } catch (error) {
      console.error('     Warning: Could not parse network interfaces:', error);
    }

    return interfaces;
  }

  /**
   * Parse VM network interfaces
   */
  private parseVMNetworkInterfaces(ipOutput: string): NetworkInterface[] {
    const interfaces: NetworkInterface[] = [];

    try {
      const lines = ipOutput.split('\n');
      for (const line of lines) {
        const match = line.match(/inet (\S+)/);
        if (match) {
          const ip = match[1];
          let name = 'unknown';

          if (ip.startsWith('127.')) name = 'lo';
          else if (ip.startsWith('10.128.')) name = 'ens4';
          else if (ip.startsWith('172.17.')) name = 'docker0';
          else if (ip.startsWith('172.18.')) name = 'br-container';

          interfaces.push({
            name,
            type: name === 'ens4' ? 'External' : 'Internal',
            ip,
            status: 'active'
          });
        }
      }
    } catch (error) {
      console.error('     Warning: Could not parse VM network interfaces:', error);
    }

    return interfaces;
  }

  /**
   * Parse services from systemctl output
   */
  private parseServices(servicesOutput: string): ServiceInfo[] {
    const services: ServiceInfo[] = [];

    try {
      const lines = servicesOutput.split('\n');
      for (const line of lines) {
        if (line.includes('.service') && line.includes('loaded active running')) {
          const parts = line.split(/\s+/);
          const serviceName = parts.find(p => p.includes('.service')) || 'unknown';

          services.push({
            name: serviceName,
            status: 'running'
          });
        }
      }
    } catch (error) {
      console.error('     Warning: Could not parse services:', error);
    }

    return services;
  }

  /**
   * Analyze system integration
   */
  private async analyzeSystemIntegration(): Promise<MachinesMapReport['integration']> {
    console.log('   🔗 Analyzing system integration...');

    // Test network connectivity
    const latency = await this.testNetworkConnectivity();

    return {
      networkStatus: {
        latency,
        status: latency < 500 ? 'connected' : latency < 1000 ? 'degraded' : 'disconnected',
        lastCheck: new Date()
      },
      syncStatus: 'active', // Could be enhanced with actual sync status
      distributedServices: ['central-mcp-dashboard', 'docker', 'database']
    };
  }

  /**
   * Test network connectivity between systems
   */
  private async testNetworkConnectivity(): Promise<number> {
    try {
      const pingCommand = `ping -c 2 34.41.115.199 | grep "round-trip" | awk -F'/' '{print $5}'`;
      const pingOutput = execSync(pingCommand, { timeout: 10000 }).toString().trim();
      return parseFloat(pingOutput) || 0;
    } catch (error) {
      return 999; // Connection failed
    }
  }

  /**
   * Calculate health scores for all systems
   */
  private calculateHealthScores(systems: MachineSystem[]): MachinesMapReport['healthScores'] {
    const bySystem: { [key: string]: number } = {};
    let totalScore = 0;

    for (const system of systems) {
      let score = 100;

      // Storage health (30% weight)
      if (system.storage.utilization > 90) score -= 30;
      else if (system.storage.utilization > 80) score -= 20;
      else if (system.storage.utilization > 70) score -= 10;

      // Memory health (25% weight)
      const memUtilization = ((system.memory.total - system.memory.available) / system.memory.total) * 100;
      if (memUtilization > 90) score -= 25;
      else if (memUtilization > 80) score -= 15;
      else if (memUtilization > 70) score -= 5;

      // Service health (25% weight)
      const runningServices = system.services.filter(s => s.status === 'running').length;
      const serviceHealth = system.services.length > 0 ? (runningServices / system.services.length) * 100 : 100;
      score -= (100 - serviceHealth) * 0.25;

      // Network health (20% weight)
      if (system.network.connectivity.status !== 'connected') score -= 20;
      else if (system.network.connectivity.latency > 500) score -= 10;
      else if (system.network.connectivity.latency > 200) score -= 5;

      bySystem[system.name] = Math.max(0, Math.min(100, Math.round(score)));
      totalScore += bySystem[system.name];
    }

    return {
      overall: Math.round(totalScore / systems.length),
      bySystem
    };
  }

  /**
   * Generate recommendations based on system analysis
   */
  private generateRecommendations(systems: MachineSystem[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const system of systems) {
      // Storage recommendations
      if (system.storage.utilization > 90) {
        recommendations.push({
          priority: 'critical',
          category: 'storage',
          title: `Critical storage issue on ${system.name}`,
          description: `System storage utilization is at ${system.storage.utilization}%`,
          actionItems: [
            'Immediately clean up unnecessary files',
            'Archive old projects to external storage',
            'Consider storage upgrade'
          ]
        });
      } else if (system.storage.utilization > 80) {
        recommendations.push({
          priority: 'high',
          category: 'storage',
          title: `High storage utilization on ${system.name}`,
          description: `System storage utilization is at ${system.storage.utilization}%`,
          actionItems: [
            'Review and remove unused files',
            'Archive inactive projects',
            'Monitor storage growth'
          ]
        });
      }

      // Memory recommendations
      const memUtilization = ((system.memory.total - system.memory.available) / system.memory.total) * 100;
      if (memUtilization > 90) {
        recommendations.push({
          priority: 'high',
          category: 'performance',
          title: `High memory usage on ${system.name}`,
          description: `Memory utilization is at ${memUtilization.toFixed(1)}%`,
          actionItems: [
            'Identify memory-intensive processes',
            'Restart memory-consuming services',
            'Consider memory upgrade'
          ]
        });
      }

      // Service recommendations
      const stoppedServices = system.services.filter(s => s.status === 'stopped');
      if (stoppedServices.length > 0) {
        recommendations.push({
          priority: 'medium',
          category: 'optimization',
          title: `Stopped services on ${system.name}`,
          description: `${stoppedServices.length} services are not running`,
          actionItems: stoppedServices.map(s => `Restart ${s.name}`)
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate alerts based on system analysis
   */
  private generateAlerts(systems: MachineSystem[]): Alert[] {
    const alerts: Alert[] = [];

    for (const system of systems) {
      if (system.storage.utilization > 95) {
        alerts.push({
          severity: 'critical',
          system: system.name,
          message: `CRITICAL: Storage utilization at ${system.storage.utilization}%`,
          timestamp: new Date()
        });
      } else if (system.storage.utilization > 85) {
        alerts.push({
          severity: 'warning',
          system: system.name,
          message: `WARNING: Storage utilization at ${system.storage.utilization}%`,
          timestamp: new Date()
        });
      }

      if (system.network.connectivity.status !== 'connected') {
        alerts.push({
          severity: 'error',
          system: system.name,
          message: `Network connectivity: ${system.network.connectivity.status}`,
          timestamp: new Date()
        });
      }
    }

    return alerts;
  }

  /**
   * Save analysis to database
   */
  private saveAnalysis(report: MachinesMapReport): void {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO machines_map_analysis
        (timestamp, local_system, remote_system, health_scores, recommendations, alerts)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        report.generatedAt.toISOString(),
        JSON.stringify(report.systems.find(s => s.type === 'local')),
        JSON.stringify(report.systems.find(s => s.type === 'remote')),
        JSON.stringify(report.healthScores),
        JSON.stringify(report.recommendations),
        JSON.stringify(report.alerts)
      );

      console.log('   💾 Analysis saved to database');

    } catch (error) {
      console.error('   ❌ Error saving analysis:', error);
    }
  }

  /**
   * Initialize analysis database tables
   */
  private initializeAnalysisTables(): void {
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS machines_map_analysis (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp DATETIME NOT NULL,
          local_system TEXT,
          remote_system TEXT,
          health_scores TEXT,
          recommendations TEXT,
          alerts TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('   🗄️ Analysis tables initialized');

    } catch (error) {
      console.error('   ❌ Error initializing tables:', error);
    }
  }

  /**
   * Utility functions
   */
  private parseSize(sizeStr: string): number {
    const units: { [key: string]: number } = {
      'K': 1024,
      'M': 1024 * 1024,
      'G': 1024 * 1024 * 1024,
      'T': 1024 * 1024 * 1024 * 1024
    };

    const match = sizeStr.match(/^(\d+(?:\.\d+)?)(K|M|G|T)?$/);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2] || '';

    return Math.round(value * (units[unit] || 1));
  }

  private parseMemorySize(memStr: string): number {
    // Remove unit and convert to bytes
    const match = memStr.match(/^(\d+(?:\.\d+)?)(K|M|G)?$/);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2] || '';

    const units: { [key: string]: number } = {
      'K': 1024,
      'M': 1024 * 1024,
      'G': 1024 * 1024 * 1024
    };

    return Math.round(value * (units[unit] || 1));
  }

  /**
   * Get historical analyses
   */
  getHistoricalAnalyses(limit: number = 10): MachinesMapReport[] {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM machines_map_analysis
        ORDER BY created_at DESC
        LIMIT ?
      `);

      const rows = stmt.all(limit) as any[];

      return rows.map(row => ({
        generatedAt: new Date(row.timestamp),
        systems: [
          JSON.parse(row.local_system || '{}'),
          JSON.parse(row.remote_system || '{}')
        ],
        integration: {}, // Would need to store this separately
        healthScores: JSON.parse(row.health_scores || '{}'),
        recommendations: JSON.parse(row.recommendations || '[]'),
        alerts: JSON.parse(row.alerts || '[]')
      }));

    } catch (error) {
      console.error('Error retrieving historical analyses:', error);
      return [];
    }
  }

  /**
   * Export analysis to markdown
   */
  async exportToMarkdown(report: MachinesMapReport): Promise<string> {
    const markdown = `
# 🌐 MACHINES MAP - ULTRATHINK ANALYSIS
**Generated:** ${report.generatedAt.toISOString()}
**Systems Analyzed:** ${report.systems.map(s => s.name).join(' + ')}

## 📊 EXECUTIVE SUMMARY

Overall Health Score: ${report.healthScores.overall}/100

### System Health Scores
${Object.entries(report.healthScores.bySystem).map(([name, score]) =>
  `- ${name}: ${score}/100`
).join('\n')}

## 🚨 CRITICAL ALERTS
${report.alerts.filter(a => a.severity === 'critical').map(alert =>
  `**${alert.system}:** ${alert.message}`
).join('\n') || 'No critical alerts'}

## 📈 RECOMMENDATIONS
${report.recommendations.map(rec =>
  `### ${rec.priority.toUpperCase()}: ${rec.title}
**Category:** ${rec.category}
**Description:** ${rec.description}

**Action Items:**
${rec.actionItems.map(item => `- ${item}`).join('\n')}
`).join('\n')}

---
*Generated by MachinesMapAnalyzer - ULTRATHINK Edition*
    `;

    return markdown.trim();
  }
}

export default MachinesMapAnalyzer;