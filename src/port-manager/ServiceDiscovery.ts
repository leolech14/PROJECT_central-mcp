/**
 * ServiceDiscovery - Ecosystem Scanner and Analyzer
 * ===================================================
 *
 * Automatically discovers all services across PROJECTS_ALL ecosystem
 * and identifies IP addresses, ports, and configuration files.
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { ServiceEntry, ServiceRegistry } from './ServiceRegistry.js';
import { logger } from '../utils/logger.js';

export interface DiscoveredService {
  projectId: string;
  serviceName: string;
  externalIP: string;
  internalPort: number;
  externalPort: number;
  protocol: 'http' | 'ws' | 'tcp' | 'udp';
  configFiles: string[];
  projectPath: string;
  status: 'active' | 'inactive' | 'unknown';
}

export interface IPChangeEvent {
  oldIP: string;
  newIP: string;
  timestamp: Date;
  source: 'gcp-api' | 'manual-detection' | 'health-check';
}

export interface ServicePattern {
  name: string;
  filePatterns: string[];
  extractors: ServiceExtractor[];
}

export interface ServiceExtractor {
  name: string;
  regex: RegExp;
  fields: {
    ip?: number;
    port?: number;
    protocol?: number;
    serviceName?: number;
    healthCheck?: number;
  };
  transform?: (match: RegExpMatchArray) => Partial<DiscoveredService>;
}

export class ServiceDiscovery {
  private patterns: ServicePattern[] = [
    {
      name: 'mcp-configurations',
      filePatterns: ['**/mcp.json', '**/.mcp.json'],
      extractors: [
        {
          name: 'central-mcp-url',
          regex: /("CENTRAL_MCP_URL":\s*")ws:\/\/([^:]+):?(\d+)?([^"]*)"/,
          fields: { ip: 2, port: 3 },
          transform: (match) => ({
            serviceName: 'central-mcp-client',
            protocol: 'ws',
            configFiles: [match.input ? match.input.split('\n')[0].trim() : '']
          })
        },
        {
          name: 'service-url',
          regex: /("URL":\s*")https?:\/\/([^:]+):?(\d+)?([^"]*)"/,
          fields: { ip: 2, port: 3 },
          transform: (match) => ({
            serviceName: 'mcp-service',
            protocol: 'http',
            configFiles: [match.input ? match.input.split('\n')[0].trim() : '']
          })
        }
      ]
    },
    {
      name: 'environment-variables',
      filePatterns: ['**/.env*', '**/config/**/*.js', '**/config/**/*.ts'],
      extractors: [
        {
          name: 'host-port-variables',
          regex: /(HOST|URL|ENDPOINT|SERVER|API_URL|WEBHOOK_URL)=([a-z:\/]*)?([^:\n\s]+):?(\d+)?/g,
          fields: { ip: 3, port: 4 },
          transform: (match) => ({
            serviceName: `${match[1].toLowerCase()}-service`,
            protocol: match[3].includes('ws') ? 'ws' : 'http'
          })
        }
      ]
    },
    {
      name: 'package-json-scripts',
      filePatterns: ['**/package.json'],
      extractors: [
        {
          name: 'dev-server-scripts',
          regex: /"dev":\s*"([^"]+)"/g,
          fields: {},
          transform: (match) => {
            const script = match[1];
            const portMatch = script.match(/--port\s+(\d+)|-p\s+(\d+)|:(\d+)/);
            const ipMatch = script.match(/--host\s+([^ ]+)|-H\s+([^ ]+)|([0-9.]+)/);

            return {
              serviceName: 'dev-server',
              internalPort: portMatch ? parseInt(portMatch[1] || portMatch[2] || portMatch[3]) : undefined,
              externalIP: ipMatch ? (ipMatch[1] || ipMatch[2] || ipMatch[3]) : undefined
            };
          }
        }
      ]
    },
    {
      name: 'javascript-services',
      filePatterns: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
      extractors: [
        {
          name: 'http-servers',
          regex: /(?:app\.listen|server\.listen|createServer)\([^,]+,\s*(\d+)[^,]*,\s*['"`]([^'"`]+)['"`]/g,
          fields: { port: 1, ip: 2 },
          transform: (match) => ({
            serviceName: 'http-server',
            protocol: 'http'
          })
        },
        {
          name: 'websocket-servers',
          regex: /new\s+(?:WebSocketServer|Server)\([^)]*port:\s*(\d+)[^}]*host:\s*['"`]([^'"`]+)['"`]/g,
          fields: { port: 1, ip: 2 },
          transform: (match) => ({
            serviceName: 'websocket-server',
            protocol: 'ws'
          })
        },
        {
          name: 'url-constants',
          regex: /(?:const|let|var)\s+\w*[Uu]rl\s*=\s*['"`]https?:\/\/([^:]+):?(\d+)?['"`]/g,
          fields: { ip: 1, port: 2 },
          transform: (match) => ({
            serviceName: 'service-url',
            protocol: 'http'
          })
        }
      ]
    },
    {
      name: 'docker-configurations',
      filePatterns: ['**/docker-compose*.yml', '**/docker-compose*.yaml', '**/Dockerfile*'],
      extractors: [
        {
          name: 'docker-ports',
          regex: /-\s*['"]?(\d+):(\d+)['"]?/g,
          fields: { externalPort: 1, internalPort: 2 },
          transform: (match) => ({
            serviceName: 'docker-service',
            protocol: 'http'
          })
        },
        {
          name: 'docker-environment',
          regex: /([A-Z_]+_URL|HOST|ENDPOINT):\s*['"`]https?:\/\/([^:]+):?(\d+)?['"`]/g,
          fields: { ip: 2, port: 3 },
          transform: (match) => ({
            serviceName: match[1].toLowerCase().replace(/_url|_host|_endpoint/g, '-service'),
            protocol: 'http'
          })
        }
      ]
    },
    {
      name: 'shell-scripts',
      filePatterns: ['**/*.sh', '**/*.bash', '**/*.zsh'],
      extractors: [
        {
          name: 'server-commands',
          regex: /--port\s+(\d+)|-p\s+(\d+)|:(\d+)/g,
          fields: { port: 1 },
          transform: (match) => ({
            serviceName: 'shell-service',
            protocol: 'http'
          })
        },
        {
          name: 'curl-commands',
          regex: /curl\s+[^\\n]*https?:\/\/([^:]+):?(\d+)?/g,
          fields: { ip: 1, port: 2 },
          transform: (match) => ({
            serviceName: 'curl-service',
            protocol: 'http'
          })
        }
      ]
    }
  ];

  constructor(
    private serviceRegistry: ServiceRegistry,
    private projectsRoot: string = '/Users/lech/PROJECTS_all'
  ) {
    logger.info('🔍 ServiceDiscovery initialized');
  }

  /**
   * Scan all projects and discover services
   */
  async scanAllProjects(): Promise<DiscoveredService[]> {
    logger.info('🌍 Starting comprehensive service discovery across PROJECTS_ALL');

    const discoveredServices: DiscoveredService[] = [];

    try {
      // Get all project directories
      const projects = await this.getAllProjects();
      logger.info(`📂 Found ${projects.length} projects to scan`);

      // Scan each project
      for (const projectPath of projects) {
        const projectId = path.basename(projectPath);
        logger.info(`🔍 Scanning project: ${projectId}`);

        try {
          const projectServices = await this.scanProject(projectPath);
          discoveredServices.push(...projectServices);
          logger.info(`✅ Found ${projectServices.length} services in ${projectId}`);
        } catch (error) {
          logger.error(`❌ Failed to scan project ${projectId}:`, error);
        }
      }

      // Register discovered services
      for (const service of discoveredServices) {
        this.serviceRegistry.registerService({
          ...service,
          id: 0, // Will be assigned by registry
          config: {
            projectPath: service.projectPath,
            configFiles: service.configFiles,
            status: service.status,
            lastChecked: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      logger.info(`🎉 Service discovery completed: ${discoveredServices.length} services found`);
      return discoveredServices;

    } catch (error) {
      logger.error('❌ Service discovery failed:', error);
      throw error;
    }
  }

  /**
   * Scan a single project for services
   */
  async scanProject(projectPath: string): Promise<DiscoveredService[]> {
    const services: DiscoveredService[] = [];
    const projectId = path.basename(projectPath);

    try {
      // Scan for all configuration patterns
      for (const pattern of this.patterns) {
        const files = await this.findPatternFiles(projectPath, pattern.filePatterns);

        for (const filePath of files) {
          const fileServices = await this.scanFile(filePath, pattern, projectId, projectPath);
          services.push(...fileServices);
        }
      }

      // Remove duplicates based on service name, IP, and port
      const uniqueServices = this.deduplicateServices(services);

      return uniqueServices;

    } catch (error) {
      logger.error(`❌ Failed to scan project ${projectId}:`, error);
      return [];
    }
  }

  /**
   * Monitor for IP changes using GCP API
   */
  async monitorIPChanges(): Promise<IPChangeEvent[]> {
    const changes: IPChangeEvent[] = [];

    try {
      // Get current services and their IPs
      const services = this.serviceRegistry.getAllServices();
      const ipGroups = this.groupServicesByIP(services);

      for (const [ip, ipServices] of ipGroups) {
        // Check if IP is still reachable
        const isReachable = await this.checkIPReachability(ip);

        if (!isReachable && this.isExternalIP(ip)) {
          // Try to find new IP for the same services
          const newIP = await this.detectNewIPForServices(ipServices);

          if (newIP && newIP !== ip) {
            changes.push({
              oldIP: ip,
              newIP: newIP,
              timestamp: new Date(),
              source: 'health-check'
            });

            logger.warn(`🔄 IP change detected: ${ip} → ${newIP} for ${ipServices.length} services`);
          }
        }
      }

    } catch (error) {
      logger.error('❌ IP monitoring failed:', error);
    }

    return changes;
  }

  /**
   * Detect port conflicts
   */
  detectPortConflicts(services: ServiceEntry[]): Array<{
    ip: string;
    port: number;
    services: ServiceEntry[];
    conflictType: 'exact' | 'protocol';
  }> {
    const portMap = new Map<string, ServiceEntry[]>();

    // Group services by IP and port
    for (const service of services) {
      const key = `${service.externalIP}:${service.externalPort}`;
      if (!portMap.has(key)) {
        portMap.set(key, []);
      }
      portMap.get(key)!.push(service);
    }

    // Find conflicts
    const conflicts: Array<{
      ip: string;
      port: number;
      services: ServiceEntry[];
      conflictType: 'exact' | 'protocol';
    }> = [];

    for (const [key, conflictingServices] of portMap) {
      if (conflictingServices.length > 1) {
        const [ip, portStr] = key.split(':');
        const port = parseInt(portStr);

        // Check if it's a protocol conflict (HTTP vs WebSocket on same port)
        const protocols = new Set(conflictingServices.map(s => s.protocol));
        const conflictType = protocols.size > 1 ? 'protocol' : 'exact';

        conflicts.push({
          ip,
          port,
          services: conflictingServices,
          conflictType
        });
      }
    }

    return conflicts;
  }

  private async getAllProjects(): Promise<string[]> {
    const entries = await fs.readdir(this.projectsRoot, { withFileTypes: true });

    return entries
      .filter(entry => entry.isDirectory() && entry.name.startsWith('PROJECT_'))
      .map(entry => path.join(this.projectsRoot, entry.name))
      .filter(async projectPath => {
        try {
          await fs.access(projectPath);
          return true;
        } catch {
          return false;
        }
      });
  }

  private async findPatternFiles(projectPath: string, patterns: string[]): Promise<string[]> {
    const files: string[] = [];

    for (const pattern of patterns) {
      const matchedFiles = await glob(pattern, {
        cwd: projectPath,
        absolute: true,
        ignore: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/.git/**',
          '**/coverage/**',
          '**/.next/**',
          '**/out/**'
        ]
      });
      files.push(...matchedFiles);
    }

    // Remove duplicates
    return [...new Set(files)];
  }

  private async scanFile(filePath: string, pattern: ServicePattern, projectId: string, projectPath: string): Promise<DiscoveredService[]> {
    const services: DiscoveredService[] = [];

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const relativePath = path.relative(projectPath, filePath);

      // Apply all extractors for this pattern
      for (const extractor of pattern.extractors) {
        const matches = content.matchAll(extractor.regex);

        for (const match of matches) {
          const service: Partial<DiscoveredService> = {
            projectId,
            projectPath,
            configFiles: [relativePath],
            status: 'unknown'
          };

          // Extract basic fields
          if (extractor.fields.ip && match[extractor.fields.ip]) {
            service.externalIP = match[extractor.fields.ip];
          }
          if (extractor.fields.port && match[extractor.fields.port]) {
            service.externalPort = parseInt(match[extractor.fields.port]);
          }
          if (extractor.fields.protocol && match[extractor.fields.protocol]) {
            service.protocol = match[extractor.fields.protocol] as any;
          }
          if (extractor.fields.serviceName && match[extractor.fields.serviceName]) {
            service.serviceName = match[extractor.fields.serviceName];
          }

          // Apply transformer if available
          if (extractor.transform) {
            const transformed = extractor.transform(match);
            Object.assign(service, transformed);
          }

          // Set defaults
          if (!service.serviceName) {
            service.serviceName = `${extractor.name}-${path.basename(filePath, path.extname(filePath))}`;
          }
          if (!service.protocol) {
            service.protocol = 'http';
          }
          if (!service.externalPort && service.internalPort) {
            service.externalPort = service.internalPort;
          }
          if (!service.internalPort && service.externalPort) {
            service.internalPort = service.externalPort;
          }

          // Only add if we have meaningful data
          if (service.externalIP && service.externalPort) {
            services.push(service as DiscoveredService);
          }
        }
      }

    } catch (error) {
      logger.error(`❌ Failed to scan file ${filePath}:`, error);
    }

    return services;
  }

  private deduplicateServices(services: DiscoveredService[]): DiscoveredService[] {
    const uniqueServices = new Map<string, DiscoveredService>();

    for (const service of services) {
      const key = `${service.projectId}:${service.serviceName}:${service.externalIP}:${service.externalPort}`;

      if (!uniqueServices.has(key)) {
        uniqueServices.set(key, service);
      } else {
        // Merge config files
        const existing = uniqueServices.get(key)!;
        existing.configFiles = [...new Set([...existing.configFiles, ...service.configFiles])];
      }
    }

    return Array.from(uniqueServices.values());
  }

  private groupServicesByIP(services: ServiceEntry[]): Map<string, ServiceEntry[]> {
    const groups = new Map<string, ServiceEntry[]>();

    for (const service of services) {
      if (!groups.has(service.externalIP)) {
        groups.set(service.externalIP, []);
      }
      groups.get(service.externalIP)!.push(service);
    }

    return groups;
  }

  private async checkIPReachability(ip: string): Promise<boolean> {
    try {
      // Simple health check - try to connect to common ports
      const commonPorts = [80, 443, 3000, 3001, 8000, 8080];

      for (const port of commonPorts) {
        try {
          const response = await fetch(`http://${ip}:${port}`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
          });
          return true;
        } catch {
          continue;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  private isExternalIP(ip: string): boolean {
    // Check if IP is external (not private/local)
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^localhost$/,
      /^0\.0\.0\.0$/
    ];

    return !privateRanges.some(range => range.test(ip));
  }

  private async detectNewIPForServices(services: ServiceEntry[]): Promise<string | null> {
    // This is a simplified implementation
    // In production, you would use GCP API or other cloud provider APIs
    try {
      // Check common GCP metadata endpoints
      const metadataResponse = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip', {
        headers: { 'Metadata-Flavor': 'Google' },
        signal: AbortSignal.timeout(5000)
      });

      if (metadataResponse.ok) {
        const newIP = await metadataResponse.text();
        logger.info(`🔍 Detected new external IP from metadata: ${newIP}`);
        return newIP.trim();
      }
    } catch {
      // Metadata service not available
    }

    return null;
  }
}