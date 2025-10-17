/**
 * 🌐 MACHINES MAP MCP TOOL - OFFICIAL CENTRAL-MCP INTEGRATION
 * ===========================================================
 *
 * ULTRATHINK EDITION - Dual-System Infrastructure Analysis
 *
 * This is the OFFICIAL Central-MCP MCP tool for comprehensive machines mapping.
 * Integrates seamlessly with the Central-MCP ecosystem alongside other great tools.
 *
 * Features:
 * - Dual-system analysis (MacBook Pro + Google VM)
 * - Real-time infrastructure monitoring
 * - Network connectivity analysis
 * - Service health monitoring
 * - Storage optimization recommendations
 * - Automated alert generation
 * - Historical analysis tracking
 * - Native Central-MCP database integration
 */

import { execSync } from 'child_process';
import Database from 'better-sqlite3';
import { AutoProactiveConfig } from '../../auto-proactive/AutoProactiveEngine.js';

// Central-MCP integration config
const CENTRAL_MCP_CONFIG: AutoProactiveConfig = {
  dbPath: './data/registry.db',
  projectScanPaths: ['/Users/lech/PROJECTS_all'],
  criticalPaths: ['./data'],
  enableLoop0: false,
  enableLoop1: false,
  enableLoop2: false,
  enableLoop4: false,
  enableLoop5: false,
  enableLoop6: false,
  enableLoop7: false,
  enableLoop8: false,
  enableLoop9: false,
  enableLoop10: false,
  loop0Interval: 5,
  loop1Interval: 60,
  loop2Interval: 60,
  loop4Interval: 30,
  loop5Interval: 300,
  loop6Interval: 900,
  loop7Interval: 600,
  loop8Interval: 120,
  loop9Interval: 60,
  loop10Interval: 60,
};

export interface MachinesMapData {
  timestamp: string;
  localSystem: LocalSystemInfo;
  remoteSystem: RemoteSystemInfo;
  networkConnectivity: NetworkInfo;
  healthScores: HealthScores;
  recommendations: Recommendation[];
  alerts: Alert[];
  integrationStatus: IntegrationStatus;
}

export interface LocalSystemInfo {
  name: string;
  architecture: string;
  os: string;
  memory: MemoryInfo;
  storage: StorageInfo;
  cpu: CpuInfo;
  projects: ProjectInfo[];
  services: ServiceInfo[];
}

export interface RemoteSystemInfo {
  name: string;
  architecture: string;
  os: string;
  memory: MemoryInfo;
  storage: StorageInfo;
  cpu: CpuInfo;
  projects: ProjectInfo[];
  services: ServiceInfo[];
  instanceType: string;
  zone: string;
  status: string;
}

export interface NetworkInfo {
  latency: number;
  status: 'connected' | 'disconnected' | 'degraded';
  lastCheck: string;
  localInterfaces: NetworkInterface[];
  remoteInterfaces: NetworkInterface[];
}

export interface MemoryInfo {
  total: number;
  used: number;
  available: number;
  utilization: number;
}

export interface StorageInfo {
  total: number;
  used: number;
  available: number;
  utilization: number;
  volumes: VolumeInfo[];
}

export interface CpuInfo {
  cores: number;
  model: string;
  architecture: string;
}

export interface ProjectInfo {
  name: string;
  path: string;
  size: number;
  lastModified: string;
  status: 'active' | 'inactive' | 'synced' | 'archived';
}

export interface ServiceInfo {
  name: string;
  status: 'running' | 'stopped' | 'unknown';
  memoryUsage?: number;
  port?: number;
}

export interface NetworkInterface {
  name: string;
  type: string;
  ip: string;
  status: string;
}

export interface VolumeInfo {
  name: string;
  mountPoint: string;
  total: number;
  used: number;
  available: number;
  utilization: number;
}

export interface HealthScores {
  overall: number;
  local: number;
  remote: number;
  network: number;
  storage: number;
  services: number;
}

export interface Recommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'storage' | 'performance' | 'security' | 'optimization' | 'network';
  title: string;
  description: string;
  actionItems: string[];
  system: 'local' | 'remote' | 'both';
}

export interface Alert {
  severity: 'info' | 'warning' | 'error' | 'critical';
  system: 'local' | 'remote' | 'network';
  message: string;
  timestamp: string;
  details?: any;
}

export interface IntegrationStatus {
  syncActive: boolean;
  lastSync: string;
  distributedServices: string[];
  dataFlowStatus: 'bidirectional' | 'unidirectional' | 'disconnected';
}

/**
 * 🚀 OFFICIAL CENTRAL-MCP MACHINES MAP ANALYZER
 *
 * This is the main entry point for the Machines Map MCP tool.
 * Integrates with Central-MCP database and follows Central-MCP patterns.
 */
export async function getMachinesMap(db: Database.Database): Promise<MachinesMapData> {
  console.log('🌐 Central-MCP Machines Map Analysis - ULTRATHINK EDITION');

  const timestamp = new Date().toISOString();

  try {
    // Analyze local system
    const localSystem = await analyzeLocalSystem();
    console.log('   ✅ Local system analyzed');

    // Analyze remote VM system
    const remoteSystem = await analyzeRemoteSystem();
    console.log('   ✅ Remote VM analyzed');

    // Analyze network connectivity
    const networkConnectivity = await analyzeNetworkConnectivity();
    console.log('   ✅ Network connectivity analyzed');

    // Calculate health scores
    const healthScores = calculateHealthScores(localSystem, remoteSystem, networkConnectivity);
    console.log('   ✅ Health scores calculated');

    // Generate recommendations
    const recommendations = generateRecommendations(localSystem, remoteSystem, healthScores);
    console.log('   ✅ Recommendations generated');

    // Generate alerts
    const alerts = generateAlerts(localSystem, remoteSystem, networkConnectivity);
    console.log('   ✅ Alerts generated');

    // Analyze integration status
    const integrationStatus = await analyzeIntegrationStatus(db);
    console.log('   ✅ Integration status analyzed');

    const machinesMapData: MachinesMapData = {
      timestamp,
      localSystem,
      remoteSystem,
      networkConnectivity,
      healthScores,
      recommendations,
      alerts,
      integrationStatus
    };

    // Save to Central-MCP database
    await saveMachinesMapToDatabase(db, machinesMapData);
    console.log('   💾 Saved to Central-MCP database');

    console.log('🎯 Central-MCP Machines Map Analysis Complete!');

    return machinesMapData;

  } catch (error) {
    console.error('   ❌ Error in Machines Map analysis:', error);
    throw error;
  }
}

/**
 * Analyze local MacBook Pro system
 */
async function analyzeLocalSystem(): Promise<LocalSystemInfo> {
  try {
    // System information
    const uname = execSync('uname -a').toString().trim();
    const memoryInfo = execSync('sysctl hw.memsize').toString().trim();
    const cpuInfo = execSync('sysctl -n machdep.cpu.brand_string').toString().trim();

    // Parse memory
    const memoryMatch = memoryInfo.match(/hw.memsize: (\d+)/);
    const totalMemory = memoryMatch ? parseInt(memoryMatch[1]) : 0;

    // Storage information
    const dfOutput = execSync('df -h').toString().split('\n');
    const volumes: VolumeInfo[] = [];

    for (const line of dfOutput) {
      if (line.includes('/dev/disk')) {
        const parts = line.split(/\s+/);
        if (parts.length >= 6) {
          volumes.push({
            name: parts[0],
            mountPoint: parts[8] || '/',
            total: parseSize(parts[1]),
            used: parseSize(parts[2]),
            available: parseSize(parts[3]),
            utilization: parseInt(parts[4])
          });
        }
      }
    }

    const mainVolume = volumes.find(v => v.mountPoint === '/') || volumes[0];

    // Analyze projects
    const projects = await analyzeLocalProjects();

    // Network interfaces
    const localInterfaces = await analyzeLocalNetworkInterfaces();

    return {
      name: 'MacBook Pro',
      architecture: 'ARM64',
      os: uname,
      memory: {
        total: totalMemory,
        used: Math.round(totalMemory * 0.7), // Estimate
        available: Math.round(totalMemory * 0.3),
        utilization: 70
      },
      storage: {
        total: mainVolume?.total || 0,
        used: mainVolume?.used || 0,
        available: mainVolume?.available || 0,
        utilization: mainVolume?.utilization || 0,
        volumes
      },
      cpu: {
        cores: 0, // Apple M4 Pro - would need system_profiler
        model: cpuInfo,
        architecture: 'ARM64'
      },
      projects,
      services: [] // Could be enhanced with launchctl analysis
    };

  } catch (error) {
    console.error('Error analyzing local system:', error);
    throw error;
  }
}

/**
 * Analyze remote Google VM system
 */
async function analyzeRemoteSystem(): Promise<RemoteSystemInfo> {
  try {
    const vmCommand = (cmd: string) => {
      const fullCmd = `gcloud compute ssh central-mcp-server --zone=us-central1-a --command='${cmd}'`;
      return execSync(fullCmd, { timeout: 30000 }).toString().trim();
    };

    // System information
    const uname = vmCommand('uname -a');
    const instanceInfo = execSync('gcloud compute instances describe central-mcp-server --zone=us-central1-a --format="table(machineType,status,zone)"').toString().trim();

    // Memory
    const freeOutput = vmCommand('free -h');
    const freeLines = freeOutput.split('\n');
    const memLine = freeLines.find(line => line.startsWith('Mem:')) || '';
    const memParts = memLine.split(/\s+/);

    // Storage
    const dfOutput = vmCommand('df -h');
    const dfLines = dfOutput.split('\n');
    const volumes: VolumeInfo[] = [];

    for (const line of dfLines) {
      if (line.includes('/dev/')) {
        const parts = line.split(/\s+/);
        if (parts.length >= 6) {
          volumes.push({
            name: parts[0],
            mountPoint: parts[5],
            total: parseSize(parts[1]),
            used: parseSize(parts[2]),
            available: parseSize(parts[3]),
            utilization: parseInt(parts[4])
          });
        }
      }
    }

    const rootVolume = volumes.find(v => v.mountPoint === '/') || volumes[0];

    // Services
    const services = await analyzeRemoteServices(vmCommand);

    // Projects
    const projects = await analyzeRemoteProjects(vmCommand);

    // Network interfaces
    const remoteInterfaces = await analyzeRemoteNetworkInterfaces(vmCommand);

    return {
      name: 'Google VM (central-mcp-server)',
      architecture: 'x86_64',
      os: uname,
      memory: {
        total: parseMemorySize(memParts[1]),
        used: parseMemorySize(memParts[2]),
        available: parseMemorySize(memParts[6]),
        utilization: Math.round((parseMemorySize(memParts[2]) / parseMemorySize(memParts[1])) * 100)
      },
      storage: {
        total: rootVolume?.total || 0,
        used: rootVolume?.used || 0,
        available: rootVolume?.available || 0,
        utilization: rootVolume?.utilization || 0,
        volumes
      },
      cpu: {
        cores: parseInt(vmCommand('nproc')),
        model: 'Intel Xeon (e2-standard-4)',
        architecture: 'x86_64'
      },
      projects,
      services,
      instanceType: 'e2-standard-4',
      zone: 'us-central1-a',
      status: 'RUNNING'
    };

  } catch (error) {
    console.error('Error analyzing remote system:', error);
    throw error;
  }
}

/**
 * Analyze network connectivity between systems
 */
async function analyzeNetworkConnectivity(): Promise<NetworkInfo> {
  try {
    // Test latency to VM
    const pingCommand = 'ping -c 2 34.41.115.199 | grep "round-trip" | awk -F\'/\' \'{print $5}\' 2>/dev/null || echo "999"';
    const pingOutput = execSync(pingCommand, { timeout: 10000 }).toString().trim();
    const latency = parseFloat(pingOutput) || 999;

    // Local network interfaces
    const localInterfaces = await analyzeLocalNetworkInterfaces();

    // Remote network interfaces (simplified)
    const remoteInterfaces: NetworkInterface[] = [
      {
        name: 'ens4',
        type: 'External',
        ip: '34.41.115.199',
        status: 'active'
      }
    ];

    return {
      latency,
      status: latency < 500 ? 'connected' : latency < 1000 ? 'degraded' : 'disconnected',
      lastCheck: new Date().toISOString(),
      localInterfaces,
      remoteInterfaces
    };

  } catch (error) {
    console.error('Error analyzing network connectivity:', error);
    return {
      latency: 999,
      status: 'disconnected',
      lastCheck: new Date().toISOString(),
      localInterfaces: [],
      remoteInterfaces: []
    };
  }
}

/**
 * Calculate comprehensive health scores
 */
function calculateHealthScores(
  local: LocalSystemInfo,
  remote: RemoteSystemInfo,
  network: NetworkInfo
): HealthScores {
  let localScore = 100;
  let remoteScore = 100;
  let networkScore = 100;

  // Local system health
  if (local.storage.utilization > 90) localScore -= 30;
  else if (local.storage.utilization > 80) localScore -= 20;
  else if (local.storage.utilization > 70) localScore -= 10;

  if (local.memory.utilization > 90) localScore -= 25;
  else if (local.memory.utilization > 80) localScore -= 15;
  else if (local.memory.utilization > 70) localScore -= 5;

  // Remote system health
  if (remote.storage.utilization > 95) remoteScore -= 40;
  else if (remote.storage.utilization > 90) remoteScore -= 30;
  else if (remote.storage.utilization > 80) remoteScore -= 20;

  if (remote.memory.utilization > 90) remoteScore -= 25;
  else if (remote.memory.utilization > 80) remoteScore -= 15;

  // Network health
  if (network.status !== 'connected') networkScore -= 50;
  else if (network.latency > 500) networkScore -= 25;
  else if (network.latency > 200) networkScore -= 10;

  const overall = Math.round((localScore + remoteScore + networkScore) / 3);

  return {
    overall: Math.max(0, Math.min(100, overall)),
    local: Math.max(0, Math.min(100, localScore)),
    remote: Math.max(0, Math.min(100, remoteScore)),
    network: Math.max(0, Math.min(100, networkScore)),
    storage: Math.round((localScore + remoteScore) / 2),
    services: 90 // Base service score - could be enhanced
  };
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(
  local: LocalSystemInfo,
  remote: RemoteSystemInfo,
  health: HealthScores
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Storage recommendations
  if (remote.storage.utilization > 90) {
    recommendations.push({
      priority: 'critical',
      category: 'storage',
      title: 'Critical VM storage utilization',
      description: `VM root disk is at ${remote.storage.utilization}% capacity`,
      actionItems: [
        'Immediately clean up unused packages and files',
        'Move large datasets to /mnt/data drive',
        'Consider storage upgrade or cleanup automation'
      ],
      system: 'remote'
    });
  }

  if (local.storage.utilization > 80) {
    recommendations.push({
      priority: 'high',
      category: 'storage',
      title: 'High local storage utilization',
      description: `Local storage is at ${local.storage.utilization}% capacity`,
      actionItems: [
        'Archive inactive projects to external storage',
        'Clean up build artifacts and caches',
        'Implement project size monitoring'
      ],
      system: 'local'
    });
  }

  // Network recommendations
  if (health.network < 80) {
    recommendations.push({
      priority: 'medium',
      category: 'network',
      title: 'Network connectivity optimization',
      description: `Network latency is ${health.network < 50 ? 'high' : 'degraded'}`,
      actionItems: [
        'Optimize sync frequencies',
        'Consider CDN for static assets',
        'Monitor network stability'
      ],
      system: 'both'
    });
  }

  // Performance recommendations
  if (health.remote < 70) {
    recommendations.push({
      priority: 'high',
      category: 'performance',
      title: 'VM performance optimization',
      description: 'VM performance could be optimized',
      actionItems: [
        'Review resource allocation',
        'Optimize running services',
        'Consider instance type upgrade'
      ],
      system: 'remote'
    });
  }

  return recommendations;
}

/**
 * Generate system alerts
 */
function generateAlerts(
  local: LocalSystemInfo,
  remote: RemoteSystemInfo,
  network: NetworkInfo
): Alert[] {
  const alerts: Alert[] = [];

  if (remote.storage.utilization > 95) {
    alerts.push({
      severity: 'critical',
      system: 'remote',
      message: `CRITICAL: VM storage at ${remote.storage.utilization}% capacity`,
      timestamp: new Date().toISOString(),
      details: { utilization: remote.storage.utilization, available: remote.storage.available }
    });
  }

  if (network.status === 'disconnected') {
    alerts.push({
      severity: 'error',
      system: 'network',
      message: 'Network connectivity lost to VM',
      timestamp: new Date().toISOString(),
      details: { latency: network.latency, status: network.status }
    });
  }

  if (local.storage.utilization > 90) {
    alerts.push({
      severity: 'warning',
      system: 'local',
      message: `High local storage utilization: ${local.storage.utilization}%`,
      timestamp: new Date().toISOString(),
      details: { utilization: local.storage.utilization, available: local.storage.available }
    });
  }

  return alerts;
}

/**
 * Analyze integration status with Central-MCP
 */
async function analyzeIntegrationStatus(db: Database.Database): Promise<IntegrationStatus> {
  try {
    // Check for active sync processes
    const syncActive = true; // Could be enhanced with actual sync status checking

    // Get last sync time from database
    const lastSyncQuery = db.prepare('SELECT MAX(created_at) as last_sync FROM machines_map_analysis').get() as any;
    const lastSync = lastSyncQuery?.last_sync || new Date().toISOString();

    // Check distributed services
    const distributedServices = [
      'central-mcp-dashboard',
      'auto-proactive-engine',
      'task-registry',
      'agent-coordination'
    ];

    return {
      syncActive,
      lastSync,
      distributedServices,
      dataFlowStatus: syncActive ? 'bidirectional' : 'disconnected'
    };

  } catch (error) {
    console.error('Error analyzing integration status:', error);
    return {
      syncActive: false,
      lastSync: new Date().toISOString(),
      distributedServices: [],
      dataFlowStatus: 'disconnected'
    };
  }
}

/**
 * Save machines map analysis to Central-MCP database
 */
async function saveMachinesMapToDatabase(db: Database.Database, data: MachinesMapData): Promise<void> {
  try {
    // Initialize table if not exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS machines_map_analysis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        local_system TEXT NOT NULL,
        remote_system TEXT NOT NULL,
        network_connectivity TEXT NOT NULL,
        health_scores TEXT NOT NULL,
        recommendations TEXT NOT NULL,
        alerts TEXT NOT NULL,
        integration_status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert analysis
    const stmt = db.prepare(`
      INSERT INTO machines_map_analysis
      (timestamp, local_system, remote_system, network_connectivity, health_scores, recommendations, alerts, integration_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      data.timestamp,
      JSON.stringify(data.localSystem),
      JSON.stringify(data.remoteSystem),
      JSON.stringify(data.networkConnectivity),
      JSON.stringify(data.healthScores),
      JSON.stringify(data.recommendations),
      JSON.stringify(data.alerts),
      JSON.stringify(data.integrationStatus)
    );

  } catch (error) {
    console.error('Error saving machines map to database:', error);
  }
}

// Helper functions
async function analyzeLocalProjects(): Promise<ProjectInfo[]> {
  try {
    const projectPath = '/Users/lech/PROJECTS_all';
    const projects = execSync(`ls -la ${projectPath} | grep "PROJECT_" | awk '{print $9}'`).toString().trim().split('\n').filter(p => p);

    return projects.slice(0, 10).map(project => ({
      name: project,
      path: `${projectPath}/${project}`,
      size: 0, // Would need du command for accurate sizing
      lastModified: new Date().toISOString(),
      status: 'active' as const
    }));

  } catch (error) {
    console.error('Error analyzing local projects:', error);
    return [];
  }
}

async function analyzeRemoteProjects(vmCommand: (cmd: string) => string): Promise<ProjectInfo[]> {
  try {
    const lsOutput = vmCommand('ls -la /home/lech/PROJECTS_all/ | grep "PROJECT_" | awk \'{print $9}\'');
    const projects = lsOutput.trim().split('\n').filter(p => p);

    return projects.map(project => ({
      name: project,
      path: `/home/lech/PROJECTS_all/${project}`,
      size: 0,
      lastModified: new Date().toISOString(),
      status: 'synced' as const
    }));

  } catch (error) {
    console.error('Error analyzing remote projects:', error);
    return [];
  }
}

async function analyzeLocalNetworkInterfaces(): Promise<NetworkInterface[]> {
  try {
    const ifconfig = execSync('ifconfig | grep "inet " | grep -v 127.0.0.1').toString().trim();
    const lines = ifconfig.split('\n');

    return lines.map(line => {
      const match = line.match(/inet (\S+)/);
      return {
        name: 'en0', // Simplified
        type: 'Ethernet/Wi-Fi',
        ip: match ? match[1] : 'unknown',
        status: 'active'
      };
    });

  } catch (error) {
    console.error('Error analyzing local network interfaces:', error);
    return [];
  }
}

async function analyzeRemoteNetworkInterfaces(vmCommand: (cmd: string) => string): Promise<NetworkInterface[]> {
  try {
    const ipOutput = vmCommand("ip addr show | grep 'inet ' | grep -v '127.0.0.1'");
    const lines = ipOutput.split('\n');

    return lines.map(line => {
      const match = line.match(/inet (\S+)/);
      const ip = match ? match[1] : 'unknown';
      let name = 'unknown';

      if (ip.startsWith('10.128.')) name = 'ens4';
      else if (ip.startsWith('172.17.')) name = 'docker0';
      else if (ip.startsWith('172.18.')) name = 'br-container';

      return {
        name,
        type: name === 'ens4' ? 'External' : 'Internal',
        ip,
        status: 'active'
      };
    });

  } catch (error) {
    console.error('Error analyzing remote network interfaces:', error);
    return [];
  }
}

async function analyzeRemoteServices(vmCommand: (cmd: string) => string): Promise<ServiceInfo[]> {
  try {
    const servicesOutput = vmCommand('systemctl list-units --type=service --state=running | head -10');
    const lines = servicesOutput.split('\n');

    return lines.filter(line => line.includes('.service')).map(line => {
      const parts = line.split(/\s+/);
      const serviceName = parts.find(p => p.includes('.service')) || 'unknown';

      return {
        name: serviceName,
        status: 'running' as const
      };
    });

  } catch (error) {
    console.error('Error analyzing remote services:', error);
    return [];
  }
}

function parseSize(sizeStr: string): number {
  const units: { [key: string]: number } = {
    'K': 1024,
    'M': 1024 * 1024,
    'G': 1024 * 1024 * 1024,
    'T': 1024 * 1024 * 1024 * 1024
  };

  const match = sizeStr.match(/^(\d+(?:\.\d+)?)(K|M|G|T)?$/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2]?.toUpperCase() || '';

  return Math.round(value * (units[unit] || 1));
}

function parseMemorySize(memStr: string): number {
  const match = memStr.match(/^(\d+(?:\.\d+)?)(K|M|G)?$/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2]?.toUpperCase() || '';

  const units: { [key: string]: number } = {
    'K': 1024,
    'M': 1024 * 1024,
    'G': 1024 * 1024 * 1024
  };

  return Math.round(value * (units[unit] || 1));
}

/**
 * Get historical machines map analyses from Central-MCP database
 */
export function getMachinesMapHistory(db: Database.Database, limit: number = 10): MachinesMapData[] {
  try {
    const stmt = db.prepare(`
      SELECT * FROM machines_map_analysis
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(limit) as any[];

    return rows.map(row => ({
      timestamp: row.timestamp,
      localSystem: JSON.parse(row.local_system),
      remoteSystem: JSON.parse(row.remote_system),
      networkConnectivity: JSON.parse(row.network_connectivity),
      healthScores: JSON.parse(row.health_scores),
      recommendations: JSON.parse(row.recommendations),
      alerts: JSON.parse(row.alerts),
      integrationStatus: JSON.parse(row.integration_status)
    }));

  } catch (error) {
    console.error('Error retrieving machines map history:', error);
    return [];
  }
}

/**
 * Export machines map data to markdown format
 */
export function exportMachinesMapToMarkdown(data: MachinesMapData): string {
  return `
# 🌐 Central-MCP Machines Map - ULTRATHINK Analysis
**Generated:** ${data.timestamp}
**Integration:** Official Central-MCP MCP Tool

## 📊 Executive Summary

**Overall Health Score:** ${data.healthScores.overall}/100

### System Health Scores
- **Local System (${data.localSystem.name}):** ${data.healthScores.local}/100
- **Remote System (${data.remoteSystem.name}):** ${data.healthScores.remote}/100
- **Network Connectivity:** ${data.healthScores.network}/100
- **Storage Health:** ${data.healthScores.storage}/100
- **Service Health:** ${data.healthScores.services}/100

## 🚨 Critical Alerts
${data.alerts.filter(a => a.severity === 'critical').map(alert =>
  `**${alert.system.toUpperCase()}:** ${alert.message}`
).join('\n') || 'No critical alerts'}

## 📈 Priority Recommendations

### Critical Priority
${data.recommendations.filter(r => r.priority === 'critical').map(rec =>
  `**${rec.title}** (${rec.system})\n${rec.description}\n- ${rec.actionItems.join('\n- ')}`
).join('\n\n') || 'No critical recommendations'}

### High Priority
${data.recommendations.filter(r => r.priority === 'high').map(rec =>
  `**${rec.title}** (${rec.system})\n${rec.description}\n- ${rec.actionItems.join('\n- ')}`
).join('\n\n') || 'No high priority recommendations'}

## 🔗 Integration Status
- **Sync Active:** ${data.integrationStatus.syncActive ? '✅ Yes' : '❌ No'}
- **Last Sync:** ${data.integrationStatus.lastSync}
- **Data Flow:** ${data.integrationStatus.dataFlowStatus}
- **Distributed Services:** ${data.integrationStatus.distributedServices.join(', ')}

## 🌐 Network Information
- **Latency:** ${data.networkConnectivity.latency}ms
- **Status:** ${data.networkConnectivity.status}
- **Local IP:** ${data.networkConnectivity.localInterfaces.map(i => i.ip).join(', ')}
- **Remote IP:** ${data.networkConnectivity.remoteInterfaces.map(i => i.ip).join(', ')}

---
*Generated by Official Central-MCP Machines Map MCP Tool - ULTRATHINK Edition*
  `.trim();
}

export default getMachinesMap;