/**
 * Dependency-Edits Analyzer - Revolutionary Ripple Effect Mapping
 * ==========================================================
 *
 * Automatically identifies the dependency chain when adding new features or specs.
 * Answers: "If I add this feature, what other files/specs must be updated?"
 *
 * INNOVATION: Maps the butterfly effect of code changes across the entire ecosystem!
 *
 * Core Concept: Every change creates ripples - we need to map them deterministically!
 *
 * Usage:
 * 1. Add new feature spec
 * 2. Run Dependency-Edits Analyzer
 * 3. Get Mermaid diagram of all dependent files that need updates
 * 4. Prevent breaking changes and ensure consistency
 *
 * Standard Localization: filePath + lineOfCode (LOC) = Universal coordinate system
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

export interface FileDependency {
  sourceFile: string;
  sourceLine: number;
  sourceEntity: string; // function, class, interface, etc.
  targetFile: string;
  targetLine: number;
  targetEntity: string;
  dependencyType: 'imports' | 'calls' | 'extends' | 'implements' | 'uses' | 'configures' | 'documents';
  strength: 'strong' | 'medium' | 'weak';
  impact: 'critical' | 'high' | 'medium' | 'low';
}

export interface DependencyNode {
  filePath: string;
  entityType: 'spec' | 'code' | 'config' | 'test' | 'docs';
  fileName: string;
  lineCount: number;
  entities: EntityInfo[];
  dependencies: FileDependency[];
  reverseDependencies: FileDependency[];
}

export interface EntityInfo {
  name: string;
  type: 'function' | 'class' | 'interface' | 'type' | 'const' | 'enum' | 'method' | 'property';
  lineStart: number;
  lineEnd: number;
  exported: boolean;
  documentation?: string;
}

export interface EntityPattern {
  pattern: string;
  type: string;
  group: number;
}

export interface DependencyEditsResult {
  projectRoot: string;
  totalFiles: number;
  dependencyNodes: DependencyNode[];
  mermaidDiagram: string;
  impactAnalysis: {
    newFeature: string;
    directlyAffected: number;
    indirectlyAffected: number;
    criticalPath: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
}

export class DependencyEditsAnalyzer {
  private db: Database.Database;
  private entityPatternCache = new Map<string, EntityPattern[]>();

  constructor(db: Database.Database) {
    this.db = db;
    this.initializeEntityPatterns();
  }

  /**
   * Core analysis: Given a new feature file, generate dependency map
   */
  async analyzeDependencyEdits(newFeaturePath: string, projectRoot: string): Promise<DependencyEditsResult> {
    console.log('🔍 Analyzing Dependency-Edits for new feature...');
    console.log(`   Feature: ${path.relative(projectRoot, newFeaturePath)}`);
    console.log(`   Project: ${projectRoot}`);

    // 1. Discover all files in project
    const allFiles = this.discoverAllFiles(projectRoot);
    console.log(`   Discovered ${allFiles.length} files`);

    // 2. Build dependency nodes for each file
    const dependencyNodes = await this.buildDependencyNodes(allFiles, projectRoot);
    console.log(`   Analyzed ${dependencyNodes.length} dependency nodes`);

    // 3. Analyze the new feature's entities
    const featureNode = dependencyNodes.find(node => node.filePath === path.relative(projectRoot, newFeaturePath));
    if (!featureNode) {
      throw new Error(`New feature file not found in analysis: ${newFeaturePath}`);
    }

    // 4. Map direct and indirect dependencies
    const directDeps = this.mapDirectDependencies(featureNode, dependencyNodes);
    const indirectDeps = this.mapIndirectDependencies(directDeps, dependencyNodes);

    // 5. Generate Mermaid diagram
    const mermaidDiagram = this.generateMermaidDiagram(featureNode, directDeps, indirectDeps);

    // 6. Calculate impact analysis
    const impactAnalysis = this.calculateImpactAnalysis(featureNode, directDeps, indirectDeps);

    console.log(`   ✅ Dependency-Edits analysis complete!`);
    console.log(`   Direct dependencies: ${directDeps.length}`);
    console.log(`   Indirect dependencies: ${indirectDeps.length}`);

    return {
      projectRoot,
      totalFiles: allFiles.length,
      dependencyNodes,
      mermaidDiagram,
      impactAnalysis
    };
  }

  /**
   * Initialize entity recognition patterns for different languages
   */
  private initializeEntityPatterns(): void {
    // TypeScript/JavaScript patterns
    this.entityPatternCache.set('ts', [
      { pattern: '^export\\s+(class|interface|type)\\s+(\\w+)', type: 'declaration', group: 2 },
      { pattern: '^export\\s+(async\\s+)?function\\s+(\\w+)', type: 'function', group: 2 },
      { pattern: '^export\\s+const\\s+(\\w+)', type: 'const', group: 2 },
      { pattern: '^export\\s+enum\\s+(\\w+)', type: 'enum', group: 2 },
      { pattern: '^(\\s*)(\\w+)\\s*:', type: 'property', group: 2 }, // class properties
      { pattern: '^(\\s*)(async\\s+)?(\\w+)\\s*\\([^)]*\\)\\s*[:{]', type: 'method', group: 3 } // class methods
    ]);

    // Markdown patterns (for specs)
    this.entityPatternCache.set('md', [
      { pattern: '^#+\\s+(.+)$', type: 'section', group: 1 },
      { pattern: '^##\\s+(Component|API|Feature|Requirement):\\s*(.+)', type: 'entity', group: 2 },
      { pattern: '^\\*\\*([^*]+)\\*\\*:$', type: 'definition', group: 1 },
      { pattern: '^- \\*\\*([^*]+)\\*\\*: (.+)', type: 'property', group: 1 }
    ]);

    // JSON patterns
    this.entityPatternCache.set('json', [
      { pattern: '"([^"]+)":\\s*{', type: 'object', group: 1 },
      { pattern: '"([^"]+)":\\s*\\[', type: 'array', group: 1 },
      { pattern: '"([^"]+)":\\s*"[^"]+"', type: 'property', group: 1 }
    ]);
  }

  /**
   * Discover all analyzable files in project
   */
  private discoverAllFiles(projectRoot: string): string[] {
    const files: string[] = [];
    const analyzableExtensions = ['.ts', '.js', '.tsx', '.jsx', '.md', '.json', '.yml', '.yaml'];

    const scanDirectory = (dirPath: string, relativePath: string = '') => {
      try {
        const entries = readdirSync(dirPath);

        for (const entry of entries) {
          // Skip large generated directories
          if (entry === 'node_modules' || entry === '.git' || entry === 'dist' || entry === 'build') {
            continue;
          }

          const fullPath = path.join(dirPath, entry);
          const relativeFilePath = relativePath ? path.join(relativePath, entry) : entry;
          const stat = statSync(fullPath);

          if (stat.isDirectory()) {
            scanDirectory(fullPath, relativeFilePath);
          } else if (stat.isFile()) {
            const ext = path.extname(entry).toLowerCase();
            if (analyzableExtensions.includes(ext)) {
              files.push(relativeFilePath);
            }
          }
        }
      } catch (error) {
        console.log(`   Warning: Could not scan ${dirPath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    scanDirectory(projectRoot);
    return files;
  }

  /**
   * Build dependency nodes for all files
   */
  private async buildDependencyNodes(filePaths: string[], projectRoot: string): Promise<DependencyNode[]> {
    const nodes: DependencyNode[] = [];

    for (const filePath of filePaths) {
      const fullPath = path.join(projectRoot, filePath);
      if (!existsSync(fullPath)) continue;

      try {
        const content = readFileSync(fullPath, 'utf-8');
        const ext = path.extname(filePath).substring(1);

        const node: DependencyNode = {
          filePath,
          entityType: this.determineEntityType(filePath, content),
          fileName: path.basename(filePath),
          lineCount: content.split('\n').length,
          entities: this.extractEntities(content, ext),
          dependencies: [],
          reverseDependencies: []
        };

        // Extract dependencies
        node.dependencies = this.extractDependencies(content, filePath, ext);

        nodes.push(node);
      } catch (error) {
        console.log(`   Warning: Could not analyze ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Map reverse dependencies
    this.mapReverseDependencies(nodes);

    return nodes;
  }

  /**
   * Determine entity type (spec, code, config, test, docs)
   */
  private determineEntityType(filePath: string, content: string): DependencyNode['entityType'] {
    if (filePath.includes('test') || filePath.includes('.test.') || filePath.includes('.spec.')) {
      return 'test';
    }
    if (filePath.includes('spec') || filePath.includes('docs') || filePath.endsWith('.md')) {
      return 'spec';
    }
    if (filePath.includes('config') || filePath.endsWith('.json') || filePath.endsWith('.yml') || filePath.endsWith('.yaml')) {
      return 'config';
    }
    if (filePath.includes('src') || filePath.includes('lib')) {
      return 'code';
    }
    return 'docs';
  }

  /**
   * Extract entities from file content
   */
  private extractEntities(content: string, ext: string): EntityInfo[] {
    const entities: EntityInfo[] = [];
    const lines = content.split('\n');
    const patterns = this.entityPatternCache.get(ext) || [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const pattern of patterns) {
        const regex = new RegExp(pattern.pattern);
        const match = line.match(regex);
        if (match) {
          const entityName = match[pattern.group];
          const entity: EntityInfo = {
            name: entityName,
            type: pattern.type as EntityInfo['type'],
            lineStart: i + 1,
            lineEnd: i + 1,
            exported: line.includes('export'),
            documentation: this.extractDocumentation(lines, i)
          };

          // Try to find entity end
          if (entity.type === 'class' || entity.type === 'interface' || entity.type === 'function') {
            entity.lineEnd = this.findEntityEnd(lines, i + 1, entity.type);
          }

          entities.push(entity);
        }
      }
    }

    return entities;
  }

  /**
   * Extract dependencies from file content
   */
  private extractDependencies(content: string, filePath: string, ext: string): FileDependency[] {
    const dependencies: FileDependency[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Import dependencies
      const importMatch = line.match(/import.*from\s+['"`]([^'"`]+)['"`]/);
      if (importMatch) {
        dependencies.push({
          sourceFile: filePath,
          sourceLine: i + 1,
          sourceEntity: 'import',
          targetFile: this.resolveImportPath(importMatch[1], filePath),
          targetLine: 0,
          targetEntity: 'module',
          dependencyType: 'imports',
          strength: 'strong',
          impact: 'critical'
        });
      }

      // Function calls
      const functionCallMatch = line.match(/(\w+)\(/);
      if (functionCallMatch && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
        dependencies.push({
          sourceFile: filePath,
          sourceLine: i + 1,
          sourceEntity: functionCallMatch[1],
          targetFile: 'unknown', // Will be resolved later
          targetLine: 0,
          targetEntity: functionCallMatch[1],
          dependencyType: 'calls',
          strength: 'medium',
          impact: 'medium'
        });
      }

      // Component usage in JSX/TSX
      const jsxComponentMatch = line.match(/<(\w+)(?:\s|>)/);
      if (jsxComponentMatch && (ext === 'tsx' || ext === 'jsx')) {
        dependencies.push({
          sourceFile: filePath,
          sourceLine: i + 1,
          sourceEntity: jsxComponentMatch[1],
          targetFile: 'unknown',
          targetLine: 0,
          targetEntity: jsxComponentMatch[1],
          dependencyType: 'uses',
          strength: 'strong',
          impact: 'high'
        });
      }

      // Configuration references
      const configMatch = line.match(/config\.(\w+)/);
      if (configMatch) {
        dependencies.push({
          sourceFile: filePath,
          sourceLine: i + 1,
          sourceEntity: configMatch[1],
          targetFile: 'config',
          targetLine: 0,
          targetEntity: configMatch[1],
          dependencyType: 'configures',
          strength: 'medium',
          impact: 'high'
        });
      }
    }

    return dependencies;
  }

  /**
   * Resolve import path to actual file
   */
  private resolveImportPath(importPath: string, currentFile: string): string {
    if (importPath.startsWith('.')) {
      // Relative import
      const currentDir = path.dirname(currentFile);
      return path.normalize(path.join(currentDir, importPath));
    }
    return importPath;
  }

  /**
   * Find where an entity ends
   */
  private findEntityEnd(lines: string[], startLine: number, entityType: string): number {
    let braceCount = 0;
    let inBlock = false;

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes('{')) {
        braceCount += (line.match(/{/g) || []).length;
        inBlock = true;
      }

      if (line.includes('}')) {
        braceCount -= (line.match(/}/g) || []).length;
        if (inBlock && braceCount === 0) {
          return i + 1;
        }
      }

      // If no braces found after reasonable lines, assume single line
      if (i - startLine > 50 && !inBlock) {
        return startLine + 1;
      }
    }

    return lines.length;
  }

  /**
   * Extract documentation for an entity
   */
  private extractDocumentation(lines: string[], entityLine: number): string {
    const docLines: string[] = [];

    // Look for JSDoc comment above entity
    for (let i = entityLine - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith('/**') || line.startsWith('*') || line.startsWith('*/')) {
        docLines.unshift(line);
      } else if (line === '' && docLines.length > 0) {
        continue;
      } else {
        break;
      }
    }

    return docLines.join('\n').replace(/\/\*\*|\*\/|\*/g, '').trim();
  }

  /**
   * Map reverse dependencies (what depends on this file)
   */
  private mapReverseDependencies(nodes: DependencyNode[]): void {
    for (const node of nodes) {
      for (const dep of node.dependencies) {
        const targetNode = nodes.find(n =>
          n.filePath === dep.targetFile ||
          n.fileName === dep.targetFile ||
          n.entities.some(e => e.name === dep.targetEntity)
        );

        if (targetNode) {
          targetNode.reverseDependencies.push({
            ...dep,
            targetFile: node.filePath,
            targetEntity: node.fileName
          });
        }
      }
    }
  }

  /**
   * Map direct dependencies from new feature
   */
  private mapDirectDependencies(featureNode: DependencyNode, allNodes: DependencyNode[]): DependencyNode[] {
    const directDeps = new Set<DependencyNode>();

    for (const dep of featureNode.dependencies) {
      const targetNode = allNodes.find(node =>
        node.filePath === dep.targetFile ||
        node.fileName === dep.targetFile ||
        node.entities.some(e => e.name === dep.targetEntity)
      );

      if (targetNode && targetNode !== featureNode) {
        directDeps.add(targetNode);
      }
    }

    return Array.from(directDeps);
  }

  /**
   * Map indirect dependencies (dependencies of dependencies)
   */
  private mapIndirectDependencies(directDeps: DependencyNode[], allNodes: DependencyNode[]): DependencyNode[] {
    const indirectDeps = new Set<DependencyNode>();
    const visited = new Set<string>();

    const traverse = (node: DependencyNode, depth: number = 0) => {
      if (depth > 3 || visited.has(node.filePath)) return; // Limit depth to prevent infinite loops

      visited.add(node.filePath);

      for (const dep of node.dependencies) {
        const targetNode = allNodes.find(n =>
          n.filePath === dep.targetFile ||
          n.fileName === dep.targetFile ||
          n.entities.some(e => e.name === dep.targetEntity)
        );

        if (targetNode && !directDeps.includes(targetNode)) {
          indirectDeps.add(targetNode);
          traverse(targetNode, depth + 1);
        }
      }
    };

    directDeps.forEach(node => traverse(node));

    return Array.from(indirectDeps);
  }

  /**
   * Generate Mermaid diagram of dependencies
   */
  private generateMermaidDiagram(featureNode: DependencyNode, directDeps: DependencyNode[], indirectDeps: DependencyNode[]): string {
    let diagram = '```mermaid\n';
    diagram += 'graph TD\n';
    diagram += '    %% Dependency-Edits Analysis\n';
    diagram += '    %% New Feature: ' + featureNode.fileName + '\n\n';

    // Add main feature node
    const featureId = this.sanitizeNodeId(featureNode.fileName);
    diagram += `    ${featureId}["${featureNode.fileName}<br/><span style='color:red;'>NEW FEATURE</span>"]\n\n`;

    // Add direct dependencies
    directDeps.forEach(dep => {
      const depId = this.sanitizeNodeId(dep.fileName);
      const depType = dep.entityType.toUpperCase();
      diagram += `    ${depId}["${dep.fileName}<br/><span style='color:blue;'>${depType}</span>"]\n`;
      diagram += `    ${featureId} --> ${depId}\n`;
    });

    // Add indirect dependencies
    if (indirectDeps.length > 0) {
      diagram += '\n    %% Indirect Dependencies\n';
      indirectDeps.forEach(dep => {
        const depId = this.sanitizeNodeId(dep.fileName);
        const depType = dep.entityType.toUpperCase();
        diagram += `    ${depId}["${dep.fileName}<br/><span style='color:green;'>${depType}</span>"]\n`;
        diagram += `    ${featureId} -.-> ${depId}\n`;
      });
    }

    // Add styling
    diagram += '\n    %% Styling\n';
    diagram += `    classDef newFeature fill:#ffcccc,stroke:#ff6666,stroke-width:3px\n`;
    diagram += `    classDef directDep fill:#cce5ff,stroke:#66aaff,stroke-width:2px\n`;
    diagram += `    classDef indirectDep fill:#ccffcc,stroke:#66cc66,stroke-width:1px\n`;
    diagram += `    class ${featureId} newFeature\n`;

    directDeps.forEach(dep => {
      diagram += `    class ${this.sanitizeNodeId(dep.fileName)} directDep\n`;
    });

    indirectDeps.forEach(dep => {
      diagram += `    class ${this.sanitizeNodeId(dep.fileName)} indirectDep\n`;
    });

    diagram += '```';
    return diagram;
  }

  /**
   * Calculate impact analysis
   */
  private calculateImpactAnalysis(featureNode: DependencyNode, directDeps: DependencyNode[], indirectDeps: DependencyNode[]): any {
    const criticalPath = [...directDeps, ...indirectDeps]
      .filter(dep => dep.dependencies.some(d => d.strength === 'strong'))
      .map(dep => dep.filePath);

    const highImpactDeps = directDeps.filter(dep =>
      dep.dependencies.some(d => d.impact === 'critical' || d.impact === 'high')
    ).length;

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (highImpactDeps > 5) riskLevel = 'critical';
    else if (highImpactDeps > 2) riskLevel = 'high';
    else if (highImpactDeps > 0) riskLevel = 'medium';

    return {
      newFeature: featureNode.fileName,
      directlyAffected: directDeps.length,
      indirectlyAffected: indirectDeps.length,
      criticalPath,
      riskLevel,
      recommendations: this.generateRecommendations(featureNode, directDeps, indirectDeps)
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(featureNode: DependencyNode, directDeps: DependencyNode[], indirectDeps: DependencyNode[]): string[] {
    const recommendations: string[] = [];

    if (directDeps.some(dep => dep.entityType === 'spec')) {
      recommendations.push('📝 Update specification files to document new feature dependencies');
    }

    if (directDeps.some(dep => dep.entityType === 'test')) {
      recommendations.push('🧪 Add test coverage for new feature in existing test files');
    }

    if (directDeps.some(dep => dep.entityType === 'config')) {
      recommendations.push('⚙️ Update configuration files to include new feature settings');
    }

    if (directDeps.some(dep => dep.dependencies.some(d => d.strength === 'strong'))) {
      recommendations.push('🔗 Review strong dependencies - consider breaking changes impact');
    }

    if (indirectDeps.length > 10) {
      recommendations.push('⚠️ Large ripple effect detected - consider feature decomposition');
    }

    recommendations.push('📋 Create integration test for end-to-end functionality');
    recommendations.push('📖 Update API documentation if feature exposes new interfaces');

    return recommendations;
  }

  /**
   * Sanitize node ID for Mermaid diagram
   */
  private sanitizeNodeId(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  }

  /**
   * Store dependency analysis results in database
   */
  async storeDependencyAnalysis(result: DependencyEditsResult): Promise<void> {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS dependency_analysis (
        id TEXT PRIMARY KEY,
        feature_file TEXT NOT NULL,
        project_root TEXT NOT NULL,
        analysis_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        mermaid_diagram TEXT,
        impact_analysis TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO dependency_analysis
      (id, feature_file, project_root, mermaid_diagram, impact_analysis)
      VALUES (?, ?, ?, ?, ?)
    `);

    insert.run(
      `dep_${Date.now()}`,
      result.impactAnalysis.newFeature,
      result.projectRoot,
      result.mermaidDiagram,
      JSON.stringify(result.impactAnalysis)
    );

    console.log('   ✅ Dependency analysis stored in database');
  }

  /**
   * Get historical dependency analyses
   */
  getDependencyHistory(limit: number = 10): any[] {
    return this.db.prepare(`
      SELECT * FROM dependency_analysis
      ORDER BY analysis_date DESC
      LIMIT ?
    `).all(limit);
  }
}