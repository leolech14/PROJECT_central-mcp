/**
 * 📄 JSON HELPERS FOR DATABASE OPERATIONS
 * =========================================
 *
 * Utilities for working with JSON columns in SQLite
 * with proper validation, querying, and manipulation
 */

import { logger } from '../utils/logger.js';

/**
 * Safe JSON parsing with fallback
 */
export function safeJsonParse<T = any>(jsonString: string | null, fallback: T): T {
  if (!jsonString || jsonString === 'null' || jsonString === 'undefined') {
    return fallback;
  }

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    logger.warn(`⚠️ Failed to parse JSON, using fallback: ${error.message}`);
    return fallback;
  }
}

/**
 * Safe JSON stringification with validation
 */
export function safeJsonStringify(obj: any, fallback: string = '[]'): string {
  if (obj === null || obj === undefined) {
    return fallback;
  }

  try {
    const jsonString = JSON.stringify(obj);
    // Validate that the JSON is valid
    JSON.parse(jsonString);
    return jsonString;
  } catch (error) {
    logger.warn(`⚠️ Failed to stringify JSON, using fallback: ${error.message}`);
    return fallback;
  }
}

/**
 * Extract JSON path value safely
 */
export function jsonExtract(jsonString: string | null, path: string): any {
  if (!jsonString) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonString);
    return getNestedValue(parsed, path);
  } catch (error) {
    logger.warn(`⚠️ Failed to extract JSON path ${path}: ${error.message}`);
    return null;
  }
}

/**
 * Set JSON path value safely
 */
export function jsonSet(jsonString: string | null, path: string, value: any): string {
  let obj: any;

  if (!jsonString || jsonString === 'null') {
    obj = {};
  } else {
    try {
      obj = JSON.parse(jsonString);
    } catch {
      obj = {};
    }
  }

  setNestedValue(obj, path, value);
  return JSON.stringify(obj);
}

/**
 * Check if JSON array contains value
 */
export function jsonContains(jsonString: string | null, value: any): boolean {
  if (!jsonString) {
    return false;
  }

  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      return parsed.includes(value);
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Add value to JSON array
 */
export function jsonAddToArray(jsonString: string | null, value: any): string {
  let arr: any[];

  if (!jsonString || jsonString === 'null') {
    arr = [];
  } else {
    try {
      arr = JSON.parse(jsonString);
      if (!Array.isArray(arr)) {
        arr = [];
      }
    } catch {
      arr = [];
    }
  }

  if (!arr.includes(value)) {
    arr.push(value);
  }

  return JSON.stringify(arr);
}

/**
 * Remove value from JSON array
 */
export function jsonRemoveFromArray(jsonString: string | null, value: any): string {
  if (!jsonString) {
    return '[]';
  }

  try {
    const arr = JSON.parse(jsonString);
    if (Array.isArray(arr)) {
      const filtered = arr.filter(item => item !== value);
      return JSON.stringify(filtered);
    }
    return '[]';
  } catch {
    return '[]';
  }
}

/**
 * Get JSON array length
 */
export function jsonArrayLength(jsonString: string | null): number {
  if (!jsonString) {
    return 0;
  }

  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      return parsed.length;
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Merge JSON objects
 */
export function jsonMerge(jsonString1: string | null, jsonString2: string | null): string {
  let obj1: any = {};
  let obj2: any = {};

  if (jsonString1) {
    try {
      obj1 = JSON.parse(jsonString1);
    } catch {
      obj1 = {};
    }
  }

  if (jsonString2) {
    try {
      obj2 = JSON.parse(jsonString2);
    } catch {
      obj2 = {};
    }
  }

  const merged = { ...obj1, ...obj2 };
  return JSON.stringify(merged);
}

/**
 * Validate JSON structure against schema
 */
export function validateJsonSchema(jsonString: string | null, schema: JsonSchema): ValidationResult {
  if (!jsonString) {
    return { valid: false, errors: ['JSON is null or empty'] };
  }

  try {
    const parsed = JSON.parse(jsonString);
    return validateObject(parsed, schema);
  } catch (error) {
    return { valid: false, errors: [`Invalid JSON: ${error.message}`] };
  }
}

/**
 * JSON schema interface
 */
interface JsonSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  required?: string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  enum?: any[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
}

/**
 * Validation result interface
 */
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate object against schema
 */
function validateObject(obj: any, schema: JsonSchema): ValidationResult {
  const errors: string[] = [];

  // Check type
  if (schema.type === 'array') {
    if (!Array.isArray(obj)) {
      errors.push(`Expected array, got ${typeof obj}`);
    } else if (schema.items) {
      obj.forEach((item, index) => {
        const result = validateObject(item, schema.items!);
        if (!result.valid) {
          errors.push(`Item ${index}: ${result.errors.join(', ')}`);
        }
      });
    }
  } else if (schema.type === 'object') {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      errors.push(`Expected object, got ${typeof obj}`);
    } else {
      // Check required properties
      if (schema.required) {
        for (const prop of schema.required) {
          if (!(prop in obj)) {
            errors.push(`Missing required property: ${prop}`);
          }
        }
      }

      // Check properties
      if (schema.properties) {
        for (const [prop, propSchema] of Object.entries(schema.properties)) {
          if (prop in obj) {
            const result = validateObject(obj[prop], propSchema);
            if (!result.valid) {
              errors.push(`${prop}: ${result.errors.join(', ')}`);
            }
          }
        }
      }
    }
  } else if (schema.type === 'string') {
    if (typeof obj !== 'string') {
      errors.push(`Expected string, got ${typeof obj}`);
    } else {
      if (schema.minLength !== undefined && obj.length < schema.minLength) {
        errors.push(`String too short: minimum ${schema.minLength} characters`);
      }
      if (schema.maxLength !== undefined && obj.length > schema.maxLength) {
        errors.push(`String too long: maximum ${schema.maxLength} characters`);
      }
    }
  } else if (schema.type === 'number') {
    if (typeof obj !== 'number') {
      errors.push(`Expected number, got ${typeof obj}`);
    } else {
      if (schema.minimum !== undefined && obj < schema.minimum) {
        errors.push(`Number too small: minimum ${schema.minimum}`);
      }
      if (schema.maximum !== undefined && obj > schema.maximum) {
        errors.push(`Number too large: maximum ${schema.maximum}`);
      }
    }
  } else if (schema.type === 'boolean') {
    if (typeof obj !== 'boolean') {
      errors.push(`Expected boolean, got ${typeof obj}`);
    }
  }

  // Check enum
  if (schema.enum && !schema.enum.includes(obj)) {
    errors.push(`Value must be one of: ${schema.enum.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get nested value using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return null;
    }
    if (typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return null;
    }
  }

  return current;
}

/**
 * Set nested value using dot notation
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * Common JSON schemas for validation
 */
export const CommonSchemas = {
  // Task dependencies array
  TaskDependencies: {
    type: 'array' as const,
    items: {
      type: 'string' as const
    }
  },

  // Task deliverables array
  TaskDeliverables: {
    type: 'array' as const,
    items: {
      type: 'object' as const,
      required: ['type', 'description'],
      properties: {
        type: { type: 'string' as const },
        description: { type: 'string' as const, minLength: 1 },
        location: { type: 'string' as const }
      }
    }
  },

  // Agent capabilities array
  AgentCapabilities: {
    type: 'array' as const,
    items: {
      type: 'string' as const,
      enum: ['ui', 'backend', 'frontend', 'database', 'devops', 'testing', 'design', 'architecture']
    }
  },

  // Context file tags
  ContextFileTags: {
    type: 'array' as const,
    items: {
      type: 'string' as const,
      minLength: 1
    }
  },

  // Tool parameters
  ToolParameters: {
    type: 'object' as const,
    properties: {
      required: {
        type: 'array' as const,
        items: { type: 'string' as const }
      },
      optional: {
        type: 'array' as const,
        items: { type: 'string' as const }
      }
    }
  }
};

/**
 * JSON query builder for common operations
 */
export class JsonQueryBuilder {
  private tableName: string;
  private jsonColumn: string;

  constructor(tableName: string, jsonColumn: string) {
    this.tableName = tableName;
    this.jsonColumn = jsonColumn;
  }

  /**
   * Build query to check if JSON array contains value
   */
  contains(value: any): string {
    const escapedValue = typeof value === 'string' ? `'${value}'` : value;
    return `json_extract(${this.jsonColumn}, '$') LIKE '%${escapedValue}%'`;
  }

  /**
   * Build query to check if JSON object has property
   */
  hasProperty(property: string): string {
    return `json_extract(${this.jsonColumn}, '$.${property}') IS NOT NULL`;
  }

  /**
   * Build query to get JSON property value
   */
  getProperty(property: string): string {
    return `json_extract(${this.jsonColumn}, '$.${property}')`;
  }

  /**
   * Build query to check JSON array length
   */
  arrayLength(operator: '=' | '>' | '<' | '>=' | '<=', length: number): string {
    return `json_array_length(${this.jsonColumn}) ${operator} ${length}`;
  }

  /**
   * Build query to check if JSON is valid
   */
  isValid(): string {
    return `json_valid(${this.jsonColumn})`;
  }

  /**
   * Build complete SELECT query
   */
  select(conditions: string[] = []): string {
    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
    return `SELECT * FROM ${this.tableName}${whereClause}`;
  }

  /**
   * Build UPDATE query to set JSON property
   */
  setProperty(property: string, value: any): string {
    const jsonValue = typeof value === 'string' ? `'${value}'` : value;
    return `UPDATE ${this.tableName} SET ${this.jsonColumn} = json_set(${this.jsonColumn}, '$.${property}', ${jsonValue})`;
  }

  /**
   * Build UPDATE query to append to JSON array
   */
  appendToArray(value: any): string {
    const jsonValue = typeof value === 'string' ? `'${value}'` : value;
    return `UPDATE ${this.tableName} SET ${this.jsonColumn} = (
      CASE
        WHEN ${this.jsonColumn} IS NULL OR ${this.jsonColumn} = 'null' THEN json_array(${jsonValue})
        ELSE json_insert(${this.jsonColumn}, '$[#]', ${jsonValue})
      END
    )`;
  }
}

/**
 * Create JSON query builder instance
 */
export function createJsonQueryBuilder(tableName: string, jsonColumn: string): JsonQueryBuilder {
  return new JsonQueryBuilder(tableName, jsonColumn);
}

/**
 * Performance monitoring for JSON operations
 */
export class JsonPerformanceMonitor {
  private operationCounts: Record<string, number> = {};
  private operationTimes: Record<string, number[]> = {};

  recordOperation(operation: string, duration: number): void {
    this.operationCounts[operation] = (this.operationCounts[operation] || 0) + 1;

    if (!this.operationTimes[operation]) {
      this.operationTimes[operation] = [];
    }
    this.operationTimes[operation].push(duration);
  }

  getStats(): Record<string, {
    count: number;
    averageTime: number;
    totalTime: number;
  }> {
    const stats: Record<string, any> = {};

    for (const [operation, times] of Object.entries(this.operationTimes)) {
      const count = this.operationCounts[operation];
      const totalTime = times.reduce((sum, time) => sum + time, 0);
      const averageTime = totalTime / times.length;

      stats[operation] = {
        count,
        averageTime,
        totalTime
      };
    }

    return stats;
  }

  reset(): void {
    this.operationCounts = {};
    this.operationTimes = {};
  }
}

/**
 * Global JSON performance monitor
 */
const globalJsonMonitor = new JsonPerformanceMonitor();

export function getJsonPerformanceMonitor(): JsonPerformanceMonitor {
  return globalJsonMonitor;
}

export default {
  safeJsonParse,
  safeJsonStringify,
  jsonExtract,
  jsonSet,
  jsonContains,
  jsonAddToArray,
  jsonRemoveFromArray,
  jsonArrayLength,
  jsonMerge,
  validateJsonSchema,
  CommonSchemas,
  JsonQueryBuilder,
  createJsonQueryBuilder,
  JsonPerformanceMonitor,
  getJsonPerformanceMonitor
};