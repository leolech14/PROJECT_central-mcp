/**
 * ReadmeParser Test Suite
 * =======================
 *
 * Unit tests for the README parsing utility.
 *
 * Built by: Backend Specialist (Agent C)
 * Purpose: Test README parsing functionality
 */

import { readmeParser } from '../ReadmeParser.js';
import fs from 'fs/promises';
import path from 'path';

describe('ReadmeParser', () => {
  const testDir = path.join(__dirname, '../../../test-data');

  beforeAll(async () => {
    // Create test directory if it doesn't exist
    try {
      await fs.mkdir(testDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  });

  describe('parseReadme', () => {
    it('should parse a basic README file', async () => {
      const testReadme = `# Test Project

This is a test README file for parsing.

## Features

- Feature 1
- Feature 2

## Usage

Basic usage instructions here.
`;

      const testFile = path.join(testDir, 'test-readme.md');
      await fs.writeFile(testFile, testReadme, 'utf-8');

      try {
        const result = await readmeParser.parseReadme(testFile);

        expect(result).toBeDefined();
        expect(result.metadata.title).toBe('Test Project');
        expect(result.rawContent).toContain('This is a test README file');
        expect(result.sections).toHaveLength(3); // #, ## Features, ## Usage
        expect(result.wordCount).toBeGreaterThan(0);
        expect(result.readingTime).toBeGreaterThan(0);
        expect(result.excerpt).toBeDefined();
      } finally {
        await fs.unlink(testFile);
      }
    });

    it('should parse README with frontmatter', async () => {
      const testReadme = `---
title: "Advanced Project"
author: "Test Author"
version: "2.0.0"
tags: ["test", "example", "readme"]
status: "active"
---

# Advanced Project

This README has frontmatter metadata.

## Description

A detailed description of the project.
`;

      const testFile = path.join(testDir, 'test-frontmatter.md');
      await fs.writeFile(testFile, testReadme, 'utf-8');

      try {
        const result = await readmeParser.parseReadme(testFile);

        expect(result.metadata.title).toBe('Advanced Project');
        expect(result.metadata.author).toBe('Test Author');
        expect(result.metadata.version).toBe('2.0.0');
        expect(result.metadata.tags).toEqual(['test', 'example', 'readme']);
        expect(result.metadata.status).toBe('active');
      } finally {
        await fs.unlink(testFile);
      }
    });

    it('should handle non-existent file gracefully', async () => {
      const nonExistentFile = path.join(testDir, 'non-existent.md');

      await expect(readmeParser.parseReadme(nonExistentFile))
        .rejects.toThrow('Failed to parse README');
    });
  });

  describe('findReadmesInDirectory', () => {
    it('should find README files in directory', async () => {
      // Create test files
      const files = [
        { name: 'README.md', content: '# Main README' },
        { name: 'readme.txt', content: 'Text readme' },
        { name: 'README', content: 'README without extension' },
        { name: 'not-a-readme.md', content: 'Regular file' }
      ];

      const createdFiles: string[] = [];

      try {
        for (const file of files) {
          const filePath = path.join(testDir, file.name);
          await fs.writeFile(filePath, file.content, 'utf-8');
          createdFiles.push(filePath);
        }

        const foundReadmes = await readmeParser.findReadmesInDirectory(testDir);

        expect(foundReadmes).toHaveLength(3); // Should find 3 README files
        expect(foundReadmes.some(path => path.includes('README.md'))).toBe(true);
        expect(foundReadmes.some(path => path.includes('readme.txt'))).toBe(true);
        expect(foundReadmes.some(path => path.includes('README'))).toBe(true);
        expect(foundReadmes.some(path => path.includes('not-a-readme.md'))).toBe(false);
      } finally {
        // Cleanup
        for (const file of createdFiles) {
          await fs.unlink(file);
        }
      }
    });

    it('should handle empty directory', async () => {
      const emptyDir = path.join(testDir, 'empty');
      await fs.mkdir(emptyDir, { recursive: true });

      try {
        const foundReadmes = await readmeParser.findReadmesInDirectory(emptyDir);
        expect(foundReadmes).toHaveLength(0);
      } finally {
        await fs.rmdir(emptyDir);
      }
    });
  });

  describe('parseMultipleReadmes', () => {
    it('should parse multiple README files', async () => {
      const files = [
        { name: 'project1.md', content: '# Project 1\nDescription of project 1' },
        { name: 'project2.md', content: '# Project 2\nDescription of project 2' }
      ];

      const filePaths: string[] = [];

      try {
        for (const file of files) {
          const filePath = path.join(testDir, file.name);
          await fs.writeFile(filePath, file.content, 'utf-8');
          filePaths.push(filePath);
        }

        const results = await readmeParser.parseMultipleReadmes(filePaths);

        expect(results.size).toBe(2);
        expect(results.get(filePaths[0])?.metadata.title).toBe('Project 1');
        expect(results.get(filePaths[1])?.metadata.title).toBe('Project 2');
      } finally {
        for (const filePath of filePaths) {
          await fs.unlink(filePath);
        }
      }
    });

    it('should handle parsing errors gracefully', async () => {
      const existingFile = path.join(testDir, 'existing.md');
      const nonExistentFile = path.join(testDir, 'non-existent.md');

      await fs.writeFile(existingFile, '# Existing File', 'utf-8');

      try {
        const results = await readmeParser.parseMultipleReadmes([existingFile, nonExistentFile]);

        // Should still parse the existing file
        expect(results.size).toBe(1);
        expect(results.get(existingFile)).toBeDefined();
        expect(results.get(nonExistentFile)).toBeUndefined();
      } finally {
        await fs.unlink(existingFile);
      }
    });
  });

  describe('searchKeywords', () => {
    it('should find keywords in content', async () => {
      const testReadme = `# AI Project

This project involves artificial intelligence and machine learning.
It includes natural language processing capabilities.

## Features

- AI-powered analysis
- Machine learning models
- Natural language understanding
`;

      const testFile = path.join(testDir, 'ai-project.md');
      await fs.writeFile(testFile, testReadme, 'utf-8');

      try {
        const content = await readmeParser.parseReadme(testFile);

        expect(readmeParser.searchKeywords(content, ['AI', 'machine learning'])).toBe(true);
        expect(readmeParser.searchKeywords(content, ['blockchain', 'crypto'])).toBe(false);
        expect(readmeParser.searchKeywords(content, ['artificial', 'intelligence'])).toBe(true);
      } finally {
        await fs.unlink(testFile);
      }
    });
  });

  describe('getCardSummary', () => {
    it('should generate card summary', async () => {
      const testReadme = `---
title: "Test Project"
description: "A comprehensive test project"
tags: ["test", "example", "project"]
status: "active"
---

# Test Project

This is a detailed description of the test project that should provide good context for the card summary. It includes information about the purpose and features of the project.
`;

      const testFile = path.join(testDir, 'card-test.md');
      await fs.writeFile(testFile, testReadme, 'utf-8');

      try {
        const content = await readmeParser.parseReadme(testFile);
        const summary = readmeParser.getCardSummary(content);

        expect(summary.title).toBe('Test Project');
        expect(summary.description).toContain('detailed description');
        expect(summary.tags).toEqual(['test', 'example', 'project']);
        expect(summary.status).toBe('active');
        expect(summary.readingTime).toBeGreaterThan(0);
      } finally {
        await fs.unlink(testFile);
      }
    });

    it('should generate summary from content without metadata', async () => {
      const testReadme = `# Simple Project

This is a simple project without frontmatter. It should still generate a reasonable summary based on the content structure and first few paragraphs of text.

## Overview

The project provides basic functionality for testing purposes.
`;

      const testFile = path.join(testDir, 'simple-test.md');
      await fs.writeFile(testFile, testReadme, 'utf-8');

      try {
        const content = await readmeParser.parseReadme(testFile);
        const summary = readmeParser.getCardSummary(content);

        expect(summary.title).toBe('Simple Project');
        expect(summary.description).toBeDefined();
        expect(summary.tags).toEqual([]);
        expect(summary.readingTime).toBeGreaterThan(0);
      } finally {
        await fs.unlink(testFile);
      }
    });
  });

  afterAll(async () => {
    // Cleanup test directory
    try {
      await fs.rmdir(testDir);
    } catch (error) {
      // Directory might not be empty or might not exist
    }
  });
});