#!/usr/bin/env node

/**
 * Emergency IP Fix Script
 * ========================
 *
 * Immediate fix for the IP change we just discovered:
 * 34.41.115.199 → 136.112.123.243
 *
 * This script will:
 * 1. Scan all PROJECTS_ALL for references to the old IP
 * 2. Update all configuration files
 * 3. Update the service registry
 * 4. Provide a comprehensive report
 */

import fs from 'fs/promises';
import path from 'path';
import pkg from 'glob';
const { glob } = pkg;
// Simple logger replacement for emergency use
const logger = {
  info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
  debug: (msg, ...args) => console.debug(`[DEBUG] ${msg}`, ...args)
};

const OLD_IP = '34.41.115.199';
const NEW_IP = '136.112.123.243';
const PROJECTS_ROOT = '/Users/lech/PROJECTS_all';

async function emergencyIPFix() {
  logger.info('🚨 EMERGENCY IP FIX STARTED');
  logger.info(`🔄 Updating all references from ${OLD_IP} → ${NEW_IP}`);

  const results = {
    filesScanned: 0,
    filesUpdated: 0,
    projectsUpdated: 0,
    errors: [],
    updatedFiles: []
  };

  try {
    // Get all projects
    const projectEntries = await fs.readdir(PROJECTS_ROOT, { withFileTypes: true });
    const projects = projectEntries
      .filter(entry => entry.isDirectory() && entry.name.startsWith('PROJECT_'))
      .map(entry => entry.name);

    logger.info(`📂 Found ${projects.length} projects to process`);

    for (const projectName of projects) {
      const projectPath = path.join(PROJECTS_ROOT, projectName);
      logger.info(`🔍 Processing project: ${projectName}`);

      try {
        const projectResult = await updateProject(projectPath);
        results.filesScanned += projectResult.filesScanned;
        results.filesUpdated += projectResult.filesUpdated;
        results.projectsUpdated += projectResult.filesUpdated > 0 ? 1 : 0;
        results.errors.push(...projectResult.errors);
        results.updatedFiles.push(...projectResult.updatedFiles);

        if (projectResult.filesUpdated > 0) {
          logger.info(`✅ ${projectName}: ${projectResult.filesUpdated} files updated`);
        }
      } catch (error) {
        logger.error(`❌ Failed to process ${projectName}:`, error);
        results.errors.push(`${projectName}: ${error.message}`);
      }
    }

    // Generate comprehensive report
    logger.info('📊 GENERATING COMPREHENSIVE REPORT');

    const report = `
EMERGENCY IP FIX REPORT
=====================
Date: ${new Date().toISOString()}
Old IP: ${OLD_IP}
New IP: ${NEW_IP}

SUMMARY:
- Projects Scanned: ${projects.length}
- Projects Updated: ${results.projectsUpdated}
- Files Scanned: ${results.filesScanned}
- Files Updated: ${results.filesUpdated}
- Errors: ${results.errors.length}

UPDATED FILES:
${results.updatedFiles.map(file => `  - ${file}`).join('\n')}

${results.errors.length > 0 ? `
ERRORS:
${results.errors.map(error => `  - ${error}`).join('\n')}
` : ''}

STATUS: ${results.errors.length === 0 ? 'SUCCESS' : 'PARTIAL SUCCESS'}
`;

    // Save report
    const reportPath = path.join(PROJECTS_ROOT, 'PROJECT_central-mcp', `emergency-ip-fix-${Date.now()}.md`);
    await fs.writeFile(reportPath, report, 'utf-8');

    logger.info(`📄 Report saved to: ${reportPath}`);

    // Log summary
    if (results.errors.length === 0) {
      logger.info(`🎉 EMERGENCY IP FIX COMPLETED SUCCESSFULLY!`);
      logger.info(`   Updated ${results.filesUpdated} files across ${results.projectsUpdated} projects`);
    } else {
      logger.warn(`⚠️ EMERGENCY IP FIX COMPLETED WITH ${results.errors.length} ERRORS`);
    }

    return results;

  } catch (error) {
    logger.error('❌ EMERGENCY IP FIX FAILED:', error);
    throw error;
  }
}

async function updateProject(projectPath) {
  const result = {
    filesScanned: 0,
    filesUpdated: 0,
    errors: [],
    updatedFiles: []
  };

  // File patterns to scan
  const patterns = [
    '**/*.json',
    '**/*.js',
    '**/*.ts',
    '**/*.jsx',
    '**/*.tsx',
    '**/*.md',
    '**/*.yml',
    '**/*.yaml',
    '**/*.sh',
    '**/*.bash',
    '**/*.zsh',
    '**/.env*',
    '**/Dockerfile*',
    '**/docker-compose*'
  ];

  try {
    // Find all matching files
    const files = [];
    for (const pattern of patterns) {
      try {
        const matches = await glob(pattern, {
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
        files.push(...matches);
      } catch (error) {
        // Ignore pattern errors
      }
    }

    // Remove duplicates
    const uniqueFiles = [...new Set(files)];
    result.filesScanned = uniqueFiles.length;

    // Process each file
    for (const filePath of uniqueFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');

        if (content.includes(OLD_IP)) {
          // Update the content
          const updatedContent = content.replace(new RegExp(OLD_IP, 'g'), NEW_IP);

          // Write back
          await fs.writeFile(filePath, updatedContent, 'utf-8');

          result.filesUpdated++;
          result.updatedFiles.push(path.relative(PROJECTS_ROOT, filePath));

          logger.debug(`  📝 Updated: ${path.relative(PROJECTS_ROOT, filePath)}`);
        }
      } catch (error) {
        result.errors.push(`${path.relative(PROJECTS_ROOT, filePath)}: ${error.message}`);
      }
    }

  } catch (error) {
    result.errors.push(`Project scan failed: ${error.message}`);
  }

  return result;
}

// Run the emergency fix
if (import.meta.url === `file://${process.argv[1]}`) {
  emergencyIPFix()
    .then((results) => {
      process.exit(results.errors.length === 0 ? 0 : 1);
    })
    .catch((error) => {
      logger.error('💥 Emergency fix failed:', error);
      process.exit(1);
    });
}

export { emergencyIPFix };