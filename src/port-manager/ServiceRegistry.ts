/**
 * Service Registry - Core of PORT-MANAGER-V2
 * ==========================================
 *
 * Central registry for all services across PROJECTS_ALL ecosystem
 * Tracks IP addresses, ports, and configuration files
 */

import { Database } from 'better-sqlite3';
import { logger } from '../utils/logger.js';

export interface ServiceConfig {
  projectPath: string;
  configFiles: string[];
  status: 'active' | 'inactive' | 'conflict' | 'unknown';
  lastChecked: Date;
  healthCheck?: {
    url: string;
    method: string;
    expectedStatus: number;
  };
}

export interface ServiceEntry {
  id: number;
  projectId: string;
  serviceName: string;
  externalIP: string;
  internalPort: number;
  externalPort: number;
  protocol: 'http' | 'ws' | 'tcp' | 'udp';
  config: ServiceConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortConflict {
  externalIP: string;
  externalPort: number;
  services: ServiceEntry[];
  conflictType: 'exact' | 'range' | 'protocol';
}

export class ServiceRegistry {
  constructor(private db: Database) {
    this.initializeTables();
  }

  private initializeTables(): void {
    // Services table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT NOT NULL,
        service_name TEXT NOT NULL,
        external_ip TEXT NOT NULL,
        internal_port INTEGER NOT NULL,
        external_port INTEGER NOT NULL,
        protocol TEXT NOT NULL CHECK (protocol IN ('http', 'ws', 'tcp', 'udp')),
        status TEXT NOT NULL DEFAULT 'unknown',
        project_path TEXT NOT NULL,
        config_files TEXT NOT NULL DEFAULT '[]',
        health_check_url TEXT,
        health_check_method TEXT DEFAULT 'GET',
        health_check_status INTEGER DEFAULT 200,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, service_name, external_port)
      )
    `);

    // Port history for audit trail
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS port_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id INTEGER NOT NULL,
        field_name TEXT NOT NULL,
        old_value TEXT NOT NULL,
        new_value TEXT NOT NULL,
        change_reason TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_services_external_ip_port ON services(external_ip, external_port);
      CREATE INDEX IF NOT EXISTS idx_services_project_id ON services(project_id);
      CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
      CREATE INDEX IF NOT EXISTS idx_port_history_service_id ON port_history(service_id);
    `);

    logger.info('📊 ServiceRegistry: Database tables initialized');
  }

  /**
   * Register or update a service
   */
  registerService(service: Omit<ServiceEntry, 'id' | 'createdAt' | 'updatedAt'>): number {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO services (
        project_id, service_name, external_ip, internal_port, external_port,
        protocol, status, project_path, config_files,
        health_check_url, health_check_method, health_check_status,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const result = stmt.run(
      service.projectId,
      service.serviceName,
      service.externalIP,
      service.internalPort,
      service.externalPort,
      service.protocol,
      service.config.status,
      service.config.projectPath,
      JSON.stringify(service.config.configFiles),
      service.config.healthCheck?.url || null,
      service.config.healthCheck?.method || 'GET',
      service.config.healthCheck?.expectedStatus || 200
    );

    // Log the change in history
    if (result.changes > 0) {
      this.logChange(result.lastInsertRowid as number, 'service_registered',
        'N/A', `${service.projectId}:${service.serviceName}`, 'Initial registration');
    }

    logger.info(`📝 Registered service: ${service.projectId}:${service.serviceName} on ${service.externalIP}:${service.externalPort}`);
    return result.lastInsertRowid as number;
  }

  /**
   * Get all services
   */
  getAllServices(): ServiceEntry[] {
    const stmt = this.db.prepare(`
      SELECT * FROM services ORDER BY external_ip, external_port
    `);

    const rows = stmt.all() as any[];
    return rows.map(row => this.mapRowToService(row));
  }

  /**
   * Get services by external IP
   */
  getServicesByIP(ip: string): ServiceEntry[] {
    const stmt = this.db.prepare(`
      SELECT * FROM services WHERE external_ip = ? ORDER BY external_port
    `);

    const rows = stmt.all(ip) as any[];
    return rows.map(row => this.mapRowToService(row));
  }

  /**
   * Get port conflicts
   */
  getPortConflicts(): PortConflict[] {
    const stmt = this.db.prepare(`
      SELECT external_ip, external_port, COUNT(*) as service_count
      FROM services
      WHERE status != 'inactive'
      GROUP BY external_ip, external_port
      HAVING service_count > 1
    `);

    const conflicts = stmt.all() as { external_ip: string; external_port: number; service_count: number }[];

    return conflicts.map(conflict => {
      const servicesStmt = this.db.prepare(`
        SELECT * FROM services
        WHERE external_ip = ? AND external_port = ? AND status != 'inactive'
      `);

      const services = servicesStmt.all(conflict.external_ip, conflict.external_port) as any[];

      return {
        externalIP: conflict.external_ip,
        externalPort: conflict.external_port,
        services: services.map(row => this.mapRowToService(row)),
        conflictType: 'exact'
      };
    });
  }

  /**
   * Update service IP address (critical for IP changes)
   */
  updateServiceIP(serviceId: number, newIP: string, reason: string = 'IP change'): boolean {
    const service = this.getServiceById(serviceId);
    if (!service) {
      logger.error(`❌ Service not found: ${serviceId}`);
      return false;
    }

    const oldIP = service.externalIP;
    if (oldIP === newIP) {
      logger.info(`ℹ️ IP unchanged for service ${serviceId}: ${newIP}`);
      return true;
    }

    const stmt = this.db.prepare(`
      UPDATE services
      SET external_ip = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(newIP, serviceId);

    if (result.changes > 0) {
      this.logChange(serviceId, 'external_ip', oldIP, newIP, reason);
      logger.info(`🔄 Updated IP for service ${serviceId}: ${oldIP} → ${newIP} (${reason})`);
      return true;
    }

    return false;
  }

  /**
   * Update service port
   */
  updateServicePort(serviceId: number, newPort: number, reason: string = 'Port conflict resolution'): boolean {
    const service = this.getServiceById(serviceId);
    if (!service) {
      logger.error(`❌ Service not found: ${serviceId}`);
      return false;
    }

    const oldPort = service.externalPort;
    if (oldPort === newPort) {
      logger.info(`ℹ️ Port unchanged for service ${serviceId}: ${newPort}`);
      return true;
    }

    const stmt = this.db.prepare(`
      UPDATE services
      SET external_port = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(newPort, serviceId);

    if (result.changes > 0) {
      this.logChange(serviceId, 'external_port', oldPort.toString(), newPort.toString(), reason);
      logger.info(`🔄 Updated port for service ${serviceId}: ${oldPort} → ${newPort} (${reason})`);
      return true;
    }

    return false;
  }

  /**
   * Update all services with old IP to new IP
   */
  updateAllServicesIP(oldIP: string, newIP: string, reason: string = 'Bulk IP update'): number {
    const services = this.getServicesByIP(oldIP);
    let updatedCount = 0;

    for (const service of services) {
      if (this.updateServiceIP(service.id, newIP, reason)) {
        updatedCount++;
      }
    }

    logger.info(`🔄 Bulk IP update completed: ${updatedCount} services updated from ${oldIP} → ${newIP}`);
    return updatedCount;
  }

  /**
   * Get service history
   */
  getServiceHistory(serviceId: number): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM port_history
      WHERE service_id = ?
      ORDER BY timestamp DESC
    `);

    return stmt.all(serviceId);
  }

  /**
   * Get next available port for an IP
   */
  getNextAvailablePort(ip: string, startPort: number = 3000, endPort: number = 3999): number {
    const usedPortsStmt = this.db.prepare(`
      SELECT external_port FROM services
      WHERE external_ip = ? AND external_port BETWEEN ? AND ?
    `);

    const usedPorts = usedPortsStmt.all(ip, startPort, endPort) as { external_port: number }[];
    const usedPortSet = new Set(usedPorts.map(p => p.external_port));

    for (let port = startPort; port <= endPort; port++) {
      if (!usedPortSet.has(port)) {
        return port;
      }
    }

    throw new Error(`No available ports found in range ${startPort}-${endPort} for IP ${ip}`);
  }

  private getServiceById(serviceId: number): ServiceEntry | null {
    const stmt = this.db.prepare('SELECT * FROM services WHERE id = ?');
    const row = stmt.get(serviceId) as any;
    return row ? this.mapRowToService(row) : null;
  }

  private mapRowToService(row: any): ServiceEntry {
    return {
      id: row.id,
      projectId: row.project_id,
      serviceName: row.service_name,
      externalIP: row.external_ip,
      internalPort: row.internal_port,
      externalPort: row.external_port,
      protocol: row.protocol,
      config: {
        projectPath: row.project_path,
        configFiles: JSON.parse(row.config_files || '[]'),
        status: row.status,
        lastChecked: new Date(row.updated_at),
        healthCheck: row.health_check_url ? {
          url: row.health_check_url,
          method: row.health_check_method,
          expectedStatus: row.health_check_status
        } : undefined
      },
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private logChange(serviceId: number, fieldName: string, oldValue: string, newValue: string, reason?: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO port_history (service_id, field_name, old_value, new_value, change_reason)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(serviceId, fieldName, oldValue, newValue, reason || null);
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalServices: number;
    activeServices: number;
    inactiveServices: number;
    conflictCount: number;
    uniqueIPs: number;
  } {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM services');
    const activeStmt = this.db.prepare("SELECT COUNT(*) as count FROM services WHERE status = 'active'");
    const inactiveStmt = this.db.prepare("SELECT COUNT(*) as count FROM services WHERE status = 'inactive'");
    const ipStmt = this.db.prepare('SELECT COUNT(DISTINCT external_ip) as count FROM services');

    const total = totalStmt.get() as { count: number };
    const active = activeStmt.get() as { count: number };
    const inactive = inactiveStmt.get() as { count: number };
    const uniqueIPs = ipStmt.get() as { count: number };
    const conflicts = this.getPortConflicts();

    return {
      totalServices: total.count,
      activeServices: active.count,
      inactiveServices: inactive.count,
      conflictCount: conflicts.length,
      uniqueIPs: uniqueIPs.count
    };
  }
}