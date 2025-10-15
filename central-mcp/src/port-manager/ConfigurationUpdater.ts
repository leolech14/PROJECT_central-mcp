/**
 * ConfigurationUpdater - Global Configuration Synchronization Engine
 * =================================================================
 *
 * Automatically updates IP addresses and ports across all configuration files
 * in the PROJECTS_ALL ecosystem when changes occur.
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { ServiceEntry, ServiceRegistry } from './ServiceRegistry.js';
import { logger } from '../utils/logger.js';

export interface UpdateResult {
  success: boolean;
  filesUpdated: number;
  errors: string[];
  updatedFiles: string[];
}

export interface ConfigurationPattern {
  name: string;
  extensions: string[];
  patterns: string[];
  updater: (content: string, oldIP: string, newIP: string, oldPort?: number, newPort?: number) => string;
}

export class ConfigurationUpdater {
  private patterns: ConfigurationPattern[] = [
    {
      name: 'mcp-config',
      extensions: ['.json'],
      patterns: ['mcp.json', '.mcp.json'],
      updater: this.updateMCPConfig.bind(this)
    },
    {
      name: 'environment-files',
      extensions: ['.env', '.env.example', '.env.local', '.env.production'],
      patterns: ['.env*'],
      updater: this.updateEnvFiles.bind(this)
    },
    {
      name: 'package-json',
      extensions: ['.json'],
      patterns: ['package.json'],
      updater: this.updatePackageJSON.bind(this)
    },
    {
      name: 'javascript-typescript',
      extensions: ['.js', '.ts', '.jsx', '.tsx'],
      patterns: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
      updater: this.updateJavaScript.bind(this)
    },
    {
      name: 'docker-compose',
      extensions: ['.yml', '.yaml'],
      patterns: ['docker-compose*.yml', 'docker-compose*.yaml'],
      updater: this.updateDockerCompose.bind(this)
    },
    {
      name: 'shell-scripts',
      extensions: ['.sh', '.bash', '.zsh'],
      patterns: ['**/*.sh', '**/*.bash', '**/*.zsh'],
      updater: this.updateShellScripts.bind(this)
    },
    {
      name: 'markdown-docs',
      extensions: ['.md'],
      patterns: ['**/*.md'],
      updater: this.updateMarkdown.bind(this)
    }
  ];

  constructor(
    private serviceRegistry: ServiceRegistry,
    private projectsRoot: string = '/Users/lech/PROJECTS_all'
  ) {
    logger.info('🔧 ConfigurationUpdater initialized');
  }

  /**
   * Update IP address across all projects and services
   */
  async updateIPAcrossProjects(oldIP: string, newIP: string, dryRun: boolean = false): Promise<UpdateResult> {
    logger.info(`🌍 Starting global IP update: ${oldIP} → ${newIP}${dryRun ? ' (DRY RUN)' : ''}`);

    const result: UpdateResult = {
      success: true,
      filesUpdated: 0,
      errors: [],
      updatedFiles: []
    };

    try {
      // Get all projects
      const projects = await this.getAllProjects();
      logger.info(`📂 Found ${projects.length} projects to scan`);

      // Scan each project for configuration files
      for (const project of projects) {
        const projectResult = await this.updateProjectIP(project, oldIP, newIP, dryRun);

        result.filesUpdated += projectResult.filesUpdated;
        result.errors.push(...projectResult.errors);
        result.updatedFiles.push(...projectResult.updatedFiles);
      }

      // Update service registry
      if (!dryRun) {
        const registryUpdated = this.serviceRegistry.updateAllServicesIP(oldIP, newIP, 'Global IP synchronization');
        if (registryUpdated > 0) {
          logger.info(`📊 Updated ${registryUpdated} services in registry`);
        }
      }

      result.success = result.errors.length === 0;
      logger.info(`✅ Global IP update completed: ${result.filesUpdated} files updated, ${result.errors.length} errors`);

    } catch (error) {
      result.success = false;
      result.errors.push(`Global update failed: ${error.message}`);
      logger.error(`❌ Global IP update failed:`, error);
    }

    return result;
  }

  /**
   * Update port for a specific service
   */
  async updateServicePort(service: ServiceEntry, newPort: number, dryRun: boolean = false): Promise<UpdateResult> {
    logger.info(`🔧 Updating port for ${service.projectId}:${service.serviceName}: ${service.externalPort} → ${newPort}${dryRun ? ' (DRY RUN)' : ''}`);

    const result: UpdateResult = {
      success: true,
      filesUpdated: 0,
      errors: [],
      updatedFiles: []
    };

    try {
      // Update configuration files
      for (const configFile of service.config.configFiles) {
        if (await this.fileExists(configFile)) {
          const updateResult = await this.updateFile(configFile, service.externalIP, service.externalIP, service.externalPort, newPort, dryRun);

          result.filesUpdated += updateResult.filesUpdated;
          result.errors.push(...updateResult.errors);
          result.updatedFiles.push(...updateResult.updatedFiles);
        }
      }

      // Update service registry
      if (!dryRun && result.success) {
        const registryUpdated = this.serviceRegistry.updateServicePort(service.id, newPort, 'Port conflict resolution');
        if (!registryUpdated) {
          result.errors.push('Failed to update service registry');
          result.success = false;
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Port update failed: ${error.message}`);
      logger.error(`❌ Port update failed for ${service.projectId}:${service.serviceName}:`, error);
    }

    return result;
  }

  /**
   * Resolve port conflicts by reassigning ports
   */
  async resolvePortConflicts(dryRun: boolean = false): Promise<UpdateResult> {
    const conflicts = this.serviceRegistry.getPortConflicts();
    if (conflicts.length === 0) {
      logger.info('✅ No port conflicts found');
      return { success: true, filesUpdated: 0, errors: [], updatedFiles: [] };
    }

    logger.info(`⚠️ Found ${conflicts.length} port conflicts to resolve`);

    const result: UpdateResult = {
      success: true,
      filesUpdated: 0,
      errors: [],
      updatedFiles: []
    };

    for (const conflict of conflicts) {
      // Keep first service, reassign others
      const servicesToReassign = conflict.services.slice(1);

      for (const service of servicesToReassign) {
        try {
          const newPort = this.serviceRegistry.getNextAvailablePort(conflict.externalIP);
          const updateResult = await this.updateServicePort(service, newPort, dryRun);

          result.filesUpdated += updateResult.filesUpdated;
          result.errors.push(...updateResult.errors);
          result.updatedFiles.push(...updateResult.updatedFiles);

          if (!dryRun) {
            logger.info(`🔄 Resolved conflict: ${service.projectId}:${service.serviceName} → port ${newPort}`);
          }

        } catch (error) {
          result.errors.push(`Failed to resolve conflict for ${service.projectId}:${service.serviceName}: ${error.message}`);
          result.success = false;
        }
      }
    }

    return result;
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

  private async updateProjectIP(projectPath: string, oldIP: string, newIP: string, dryRun: boolean): Promise<UpdateResult> {
    const result: UpdateResult = {
      success: true,
      filesUpdated: 0,
      errors: [],
      updatedFiles: []
    };

    try {
      // Find all configuration files in the project
      const configFiles = await this.findConfigFiles(projectPath);

      for (const configFile of configFiles) {
        const updateResult = await this.updateFile(configFile, oldIP, newIP, undefined, undefined, dryRun);

        result.filesUpdated += updateResult.filesUpdated;
        result.errors.push(...updateResult.errors);
        result.updatedFiles.push(...updateResult.updatedFiles);
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Project update failed: ${error.message}`);
    }

    return result;
  }

  private async findConfigFiles(projectPath: string): Promise<string[]> {
    const configFiles: string[] = [];

    for (const pattern of this.patterns) {
      const files = await glob(pattern.patterns, {
        cwd: projectPath,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**']
      });
      configFiles.push(...files);
    }

    // Remove duplicates
    return [...new Set(configFiles)];
  }

  private async updateFile(
    filePath: string,
    oldIP: string,
    newIP: string,
    oldPort?: number,
    newPort?: number,
    dryRun: boolean = false
  ): Promise<UpdateResult> {
    const result: UpdateResult = {
      success: true,
      filesUpdated: 0,
      errors: [],
      updatedFiles: []
    };

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let updatedContent = content;
      let hasChanges = false;

      // Apply appropriate updater based on file type
      const pattern = this.patterns.find(p => {
        const ext = path.extname(filePath);
        return p.extensions.includes(ext) || p.patterns.some(pattern => {
          const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
          return regex.test(path.relative('/Users/lech/PROJECTS_all', filePath));
        });
      });

      if (pattern) {
        updatedContent = pattern.updater(content, oldIP, newIP, oldPort, newPort);
        hasChanges = updatedContent !== content;
      } else {
        // Default simple replacement
        updatedContent = content.replace(new RegExp(oldIP, 'g'), newIP);
        if (oldPort && newPort) {
          updatedContent = updatedContent.replace(new RegExp(`:${oldPort}`, 'g'), `:${newPort}`);
        }
        hasChanges = updatedContent !== content;
      }

      if (hasChanges) {
        if (!dryRun) {
          await fs.writeFile(filePath, updatedContent, 'utf-8');
          logger.info(`📝 Updated: ${filePath}`);
        } else {
          logger.info(`🔍 Would update: ${filePath}`);
        }

        result.filesUpdated = 1;
        result.updatedFiles.push(filePath);
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Failed to update file ${filePath}: ${error.message}`);
    }

    return result;
  }

  // Configuration file updaters

  private updateMCPConfig(content: string, oldIP: string, newIP: string, oldPort?: number, newPort?: number): string {
    let updated = content;

    // Update CENTRAL_MCP_URL
    updated = updated.replace(
      /("CENTRAL_MCP_URL":\s*")ws:\/\/[^"]+(")/,
      `$1ws://${newIP}${newPort ? `:${newPort}` : ''}$2`
    );

    // Update hardcoded IPs
    updated = updated.replace(new RegExp(oldIP, 'g'), newIP);

    // Update ports if specified
    if (oldPort && newPort) {
      updated = updated.replace(new RegExp(`:${oldPort}`, 'g'), `:${newPort}`);
    }

    return updated;
  }

  private updateEnvFiles(content: string, oldIP: string, newIP: string, oldPort?: number, newPort?: number): string {
    let updated = content;

    // Update environment variables
    updated = updated.replace(
      /(HOST|URL|ENDPOINT|SERVER|API_URL|WEBHOOK_URL)=([a-z:\/]*)([^:\n]+)/g,
      (_, prefix, protocol, value) => {
        if (value.includes(oldIP)) {
          return `${prefix}=${protocol}${newIP}${newPort && value.includes(':') ? `:${newPort}` : ''}`;
        }
        return _;
      }
    );

    return updated;
  }

  private updatePackageJSON(content: string, oldIP: string, newIP: string, oldPort?: number, newPort?: number): string {
    let updated = content;

    try {
      const packageJson = JSON.parse(content);

      // Update scripts that contain IP references
      if (packageJson.scripts) {
        for (const [scriptName, scriptContent] of Object.entries(packageJson.scripts)) {
          if (typeof scriptContent === 'string' && scriptContent.includes(oldIP)) {
            packageJson.scripts[scriptName] = scriptContent.replace(new RegExp(oldIP, 'g'), newIP);
          }
        }
      }

      updated = JSON.stringify(packageJson, null, 2);
    } catch {
      // Fallback to simple replacement if JSON parsing fails
      updated = updated.replace(new RegExp(oldIP, 'g'), newIP);
    }

    return updated;
  }

  private updateJavaScript(content: string, oldIP: string, newIP: string, oldPort?: number, newPort?: number): string {
    let updated = content;

    // Update string literals containing IP
    updated = updated.replace(
      /(['"`])(ws?:\/\/[^'"`]+)\1/g,
      (match, quote, url) => {
        if (url.includes(oldIP)) {
          const newUrl = url.replace(new RegExp(oldIP, 'g'), newIP);
          if (oldPort && newPort) {
            return `${quote}${newUrl.replace(new RegExp(`:${oldPort}`), `:${newPort}`)}${quote}`;
          }
          return `${quote}${newUrl}${quote}`;
        }
        return match;
      }
    );

    // Update object properties
    updated = updated.replace(
      /(host|url|endpoint|server):\s*['"`]([^'"`]+)['"`]/g,
      (match, prop, value) => {
        if (value.includes(oldIP)) {
          return `${prop}: '${value.replace(new RegExp(oldIP, 'g'), newIP)}'`;
        }
        return match;
      }
    );

    return updated;
  }

  private updateDockerCompose(content: string, oldIP: string, newIP: string, oldPort?: number, newPort?: number): string {
    let updated = content;

    // Update environment variables
    updated = updated.replace(
      /(HOST|URL|ENDPOINT):\s*([^:\n]+)/g,
      (_, key, value) => {
        if (value.includes(oldIP)) {
          return `${key}: ${value.replace(new RegExp(oldIP, 'g'), newIP)}`;
        }
        return _;
      }
    );

    // Update port mappings
    if (oldPort && newPort) {
      updated = updated.replace(
        /-\s*["']?(\d+):["']?(\d+)["']?/g,
        (match, hostPort, containerPort) => {
          if (hostPort === oldPort.toString()) {
            return `- ${newPort}:${containerPort}`;
          }
          return match;
        }
      );
    }

    return updated;
  }

  private updateShellScripts(content: string, oldIP: string, newIP: string, oldPort?: number, newPort?: number): string {
    let updated = content;

    // Update variable assignments
    updated = updated.replace(
      /(HOST|URL|ENDPOINT|SERVER)=([a-z:\/]*)([^:\n\s]+)/g,
      (_, prefix, protocol, value) => {
        if (value.includes(oldIP)) {
          return `${prefix}=${protocol}${newIP}${newPort && value.includes(':') ? `:${newPort}` : ''}`;
        }
        return _;
      }
    );

    // Update curl commands
    updated = updated.replace(
      /(curl|wget)\s+([^:\s]+)(:[\d]+)?/g,
      (match, command, host, port) => {
        if (host.includes(oldIP)) {
          const newHost = host.replace(new RegExp(oldIP, 'g'), newIP);
          if (oldPort && newPort && port === `:${oldPort}`) {
            return `${command}${newHost}:${newPort}`;
          }
          return `${command}${newHost}${port || ''}`;
        }
        return match;
      }
    );

    return updated;
  }

  private updateMarkdown(content: string, oldIP: string, newIP: string, oldPort?: number, newPort?: number): string {
    let updated = content;

    // Update inline code
    updated = updated.replace(/`([^`]+)`/g, (match, code) => {
      if (code.includes(oldIP)) {
        return `\`${code.replace(new RegExp(oldIP, 'g'), newIP)}\``;
      }
      return match;
    });

    // Update links
    updated = updated.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      if (url.includes(oldIP)) {
        return `[${text}](${url.replace(new RegExp(oldIP, 'g'), newIP)})`;
      }
      return match;
    });

    return updated;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate configuration integrity after updates
   */
  async validateConfigurationIntegrity(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      const services = this.serviceRegistry.getAllServices();

      for (const service of services) {
        // Check if all config files still exist
        for (const configFile of service.config.configFiles) {
          if (!(await this.fileExists(configFile))) {
            issues.push(`Missing config file: ${configFile} for service ${service.projectId}:${service.serviceName}`);
          }
        }

        // Check for port conflicts
        const conflicts = this.serviceRegistry.getPortConflicts();
        if (conflicts.some(c => c.services.some(s => s.id === service.id))) {
          issues.push(`Port conflict detected for service ${service.projectId}:${service.serviceName}`);
        }
      }

    } catch (error) {
      issues.push(`Validation failed: ${error.message}`);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}