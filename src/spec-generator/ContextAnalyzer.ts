/**
 * Context Analyzer - Reads and Understands Context Files
 * ======================================================
 *
 * Reads any context file format and extracts semantic meaning:
 * - Markdown files (README, docs, specs)
 * - Code files (TypeScript, Python, Swift)
 * - Natural language descriptions
 * - Multi-file aggregation
 */

import { promises as fs } from 'fs';
import * as path from 'path';

export interface ContextFile {
  path: string;
  content: string;
  type: 'markdown' | 'code' | 'yaml' | 'json' | 'text';
}

export interface ContextAnalysis {
  purpose: string;
  features: string[];
  architecture: string;
  contracts: APIContract[];
  dependencies: Dependency[];
  security: SecurityRequirements;
  performance: PerformanceRequirements;
  raw_context: ContextFile[];
}

export interface APIContract {
  name: string;
  type: 'interface' | 'class' | 'function' | 'endpoint';
  definition: string;
  description: string;
}

export interface Dependency {
  name: string;
  type: 'npm' | 'system' | 'internal' | 'external';
  version?: string;
  required: boolean;
}

export interface SecurityRequirements {
  authentication_required: boolean;
  authorization_level: string;
  data_classification: string;
  encryption_at_rest: boolean;
  encryption_in_transit: boolean;
  audit_logging: boolean;
}

export interface PerformanceRequirements {
  max_response_time_ms: number;
  max_memory_mb: number;
  concurrent_requests: number;
  availability_percent: number;
}

export class ContextAnalyzer {
  private contextFiles: ContextFile[] = [];

  /**
   * Read context files from paths
   */
  async readContextFiles(filePaths: string[]): Promise<ContextFile[]> {
    this.contextFiles = [];

    for (const filePath of filePaths) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const type = this.detectFileType(filePath);

        this.contextFiles.push({
          path: filePath,
          content,
          type
        });
      } catch (error) {
        console.error(`Failed to read ${filePath}:`, error);
      }
    }

    return this.contextFiles;
  }

  /**
   * Analyze all context files and extract semantic structure
   */
  async analyze(): Promise<ContextAnalysis> {
    const analysis: ContextAnalysis = {
      purpose: '',
      features: [],
      architecture: '',
      contracts: [],
      dependencies: [],
      security: this.getDefaultSecurity(),
      performance: this.getDefaultPerformance(),
      raw_context: this.contextFiles
    };

    for (const file of this.contextFiles) {
      // Extract purpose
      const purpose = this.extractPurpose(file);
      if (purpose && !analysis.purpose) {
        analysis.purpose = purpose;
      }

      // Extract features
      const features = this.extractFeatures(file);
      analysis.features.push(...features);

      // Extract architecture
      const architecture = this.extractArchitecture(file);
      if (architecture && !analysis.architecture) {
        analysis.architecture = architecture;
      }

      // Extract contracts
      const contracts = this.extractContracts(file);
      analysis.contracts.push(...contracts);

      // Extract dependencies
      const dependencies = this.extractDependencies(file);
      analysis.dependencies.push(...dependencies);

      // Extract security requirements
      const security = this.extractSecurity(file);
      if (security) {
        analysis.security = { ...analysis.security, ...security };
      }

      // Extract performance requirements
      const performance = this.extractPerformance(file);
      if (performance) {
        analysis.performance = { ...analysis.performance, ...performance };
      }
    }

    // Deduplicate features
    analysis.features = [...new Set(analysis.features)];

    return analysis;
  }

  /**
   * Detect file type based on extension
   */
  private detectFileType(filePath: string): ContextFile['type'] {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.md') return 'markdown';
    if (['.yaml', '.yml'].includes(ext)) return 'yaml';
    if (ext === '.json') return 'json';
    if (['.ts', '.js', '.py', '.swift'].includes(ext)) return 'code';

    return 'text';
  }

  /**
   * Extract purpose from context
   */
  private extractPurpose(file: ContextFile): string {
    // Look for purpose indicators
    const patterns = [
      /##?\s*Purpose[:\s]+([\s\S]*?)(?=\n##|$)/i,
      /##?\s*Overview[:\s]+([\s\S]*?)(?=\n##|$)/i,
      /##?\s*About[:\s]+([\s\S]*?)(?=\n##|$)/i,
      /purpose:\s*(.+)/i
    ];

    for (const pattern of patterns) {
      const match = file.content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // Fallback: Use first paragraph after title
    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('# ') && lines[i + 2]) {
        return lines[i + 2].trim();
      }
    }

    return '';
  }

  /**
   * Extract features from context
   */
  private extractFeatures(file: ContextFile): string[] {
    const features: string[] = [];

    // Look for features sections
    const featuresMatch = file.content.match(/##?\s*Features?[:\s]+([\s\S]*?)(?=\n##|$)/i);
    if (featuresMatch) {
      const lines = featuresMatch[1].split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
          features.push(line.trim().replace(/^[-*]\s*/, ''));
        }
      }
    }

    // Look for capability indicators
    const capabilityPatterns = [
      /can\s+([^.]+)/gi,
      /allows?\s+([^.]+)/gi,
      /enables?\s+([^.]+)/gi,
      /provides?\s+([^.]+)/gi
    ];

    for (const pattern of capabilityPatterns) {
      const matches = file.content.matchAll(pattern);
      for (const match of matches) {
        features.push(match[1].trim());
      }
    }

    return features;
  }

  /**
   * Extract architecture description
   */
  private extractArchitecture(file: ContextFile): string {
    const patterns = [
      /##?\s*Architecture[:\s]+([\s\S]*?)(?=\n##|$)/i,
      /##?\s*System\s+Design[:\s]+([\s\S]*?)(?=\n##|$)/i,
      /##?\s*Components?[:\s]+([\s\S]*?)(?=\n##|$)/i
    ];

    for (const pattern of patterns) {
      const match = file.content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return '';
  }

  /**
   * Extract API contracts from code
   */
  private extractContracts(file: ContextFile): APIContract[] {
    if (file.type !== 'code') return [];

    const contracts: APIContract[] = [];

    // Extract TypeScript interfaces
    const interfacePattern = /interface\s+(\w+)\s*\{([^}]+)\}/g;
    const interfaceMatches = file.content.matchAll(interfacePattern);

    for (const match of interfaceMatches) {
      contracts.push({
        name: match[1],
        type: 'interface',
        definition: match[0],
        description: `TypeScript interface ${match[1]}`
      });
    }

    // Extract class definitions
    const classPattern = /class\s+(\w+)(?:\s+extends\s+\w+)?(?:\s+implements\s+\w+)?\s*\{/g;
    const classMatches = file.content.matchAll(classPattern);

    for (const match of classMatches) {
      contracts.push({
        name: match[1],
        type: 'class',
        definition: match[0],
        description: `Class ${match[1]}`
      });
    }

    return contracts;
  }

  /**
   * Extract dependencies
   */
  private extractDependencies(file: ContextFile): Dependency[] {
    const dependencies: Dependency[] = [];

    // NPM dependencies from package.json content
    if (file.path.endsWith('package.json')) {
      try {
        const pkg = JSON.parse(file.content);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };

        for (const [name, version] of Object.entries(deps)) {
          dependencies.push({
            name,
            type: 'npm',
            version: version as string,
            required: true
          });
        }
      } catch (error) {
        // Invalid JSON
      }
    }

    // Import statements
    const importPattern = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    const importMatches = file.content.matchAll(importPattern);

    for (const match of importMatches) {
      const dep = match[1];
      if (!dep.startsWith('.') && !dep.startsWith('/')) {
        dependencies.push({
          name: dep,
          type: 'npm',
          required: true
        });
      }
    }

    return dependencies;
  }

  /**
   * Extract security requirements
   */
  private extractSecurity(file: ContextFile): Partial<SecurityRequirements> | null {
    const security: Partial<SecurityRequirements> = {};
    let found = false;

    // Look for security keywords
    if (file.content.match(/authentication|auth/i)) {
      security.authentication_required = true;
      found = true;
    }

    if (file.content.match(/encryption|encrypt/i)) {
      security.encryption_in_transit = true;
      security.encryption_at_rest = true;
      found = true;
    }

    if (file.content.match(/audit|logging/i)) {
      security.audit_logging = true;
      found = true;
    }

    return found ? security : null;
  }

  /**
   * Extract performance requirements
   */
  private extractPerformance(file: ContextFile): Partial<PerformanceRequirements> | null {
    const performance: Partial<PerformanceRequirements> = {};
    let found = false;

    // Look for performance indicators
    const latencyMatch = file.content.match(/(?:latency|response.*?time).*?(\d+)\s*ms/i);
    if (latencyMatch) {
      performance.max_response_time_ms = parseInt(latencyMatch[1]);
      found = true;
    }

    const memoryMatch = file.content.match(/memory.*?(\d+)\s*mb/i);
    if (memoryMatch) {
      performance.max_memory_mb = parseInt(memoryMatch[1]);
      found = true;
    }

    const availabilityMatch = file.content.match(/availability.*?(\d+)%/i);
    if (availabilityMatch) {
      performance.availability_percent = parseInt(availabilityMatch[1]);
      found = true;
    }

    return found ? performance : null;
  }

  /**
   * Default security requirements
   */
  private getDefaultSecurity(): SecurityRequirements {
    return {
      authentication_required: false,
      authorization_level: 'public',
      data_classification: 'public',
      encryption_at_rest: false,
      encryption_in_transit: true,
      audit_logging: false
    };
  }

  /**
   * Default performance requirements
   */
  private getDefaultPerformance(): PerformanceRequirements {
    return {
      max_response_time_ms: 2000,
      max_memory_mb: 512,
      concurrent_requests: 100,
      availability_percent: 99.9
    };
  }
}
