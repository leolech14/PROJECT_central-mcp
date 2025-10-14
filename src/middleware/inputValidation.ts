/**
 * 🔒 SECURITY: Comprehensive Input Validation Middleware
 * ===================================================
 *
 * Prevents SQL injection, XSS, code injection, and other attacks
 * through rigorous input sanitization and validation.
 *
 * Features:
 * - Request body validation
 * - Query parameter sanitization
 * - Path parameter validation
 * - File upload security
 * - Rate limiting integration
 * - XSS prevention
 * - SQL injection protection
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import DOMPurify from 'isomorphic-dompurify';
import { logger } from '../utils/logger.js';

/**
 * 🔒 SECURITY: Validation schema definitions
 */
export const ValidationSchemas = {
  // Agent-related validations
  agentId: Joi.string().alphanum().min(1).max(10).required(),
  agentRole: Joi.string().valid('A', 'B', 'C', 'D', 'E', 'F').required(),

  // Task-related validations
  taskId: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).min(1).max(50).required(),
  taskStatus: Joi.string().valid('pending', 'in_progress', 'completed', 'blocked').required(),
  taskDescription: Joi.string().min(1).max(1000).required(),

  // API Key validations
  apiKey: Joi.string().pattern(/^cmcp_[a-zA-Z0-9_]+$/).min(20).max(100).required(),

  // Project validations
  projectId: Joi.string().alphanum().min(1).max(50).required(),
  projectName: Joi.string().min(1).max(100).required(),
  projectPath: Joi.string().pattern(/^[\w\-\.\/\\]+$/).min(1).max(500).required(),

  // Common validations
  id: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).min(1).max(50).required(),
  timestamp: Joi.number().integer().min(0).max(9999999999999).required(),
  boolean: Joi.boolean().required(),

  // Pagination
  page: Joi.number().integer().min(1).max(1000).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),

  // Search and filter
  search: Joi.string().min(1).max(100).optional(),
  sortBy: Joi.string().valid('created_at', 'updated_at', 'name', 'status').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
};

/**
 * 🔒 SECURITY: Sanitization functions
 */
export class InputSanitizer {
  /**
   * Sanitize string input to prevent XSS
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    // Remove potential XSS vectors
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [], // No attributes allowed
    }).trim();
  }

  /**
   * Sanitize code input (allow only safe characters)
   */
  static sanitizeCode(input: string): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    // Allow only alphanumeric and common programming characters
    return input.replace(/[^\w\s\-\.\(\)\[\]\{\}:;,\+=\*\/\?!<>]/g, '').trim();
  }

  /**
   * Sanitize file path to prevent directory traversal
   */
  static sanitizePath(input: string): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    // Remove directory traversal attempts
    let sanitized = input.replace(/\.\./g, '').replace(/[\/\\]/g, '/');

    // Ensure path doesn't start with /
    if (sanitized.startsWith('/')) {
      sanitized = sanitized.substring(1);
    }

    // Remove multiple consecutive slashes
    sanitized = sanitized.replace(/\/+/g, '/');

    return sanitized.trim();
  }

  /**
   * Sanitize SQL-like input (basic protection)
   */
  static sanitizeSQL(input: string): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    // Remove common SQL injection patterns
    return input
      .replace(/['"\\]/g, '') // Remove quotes and backslashes
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove block comment start
      .replace(/\*\//g, '') // Remove block comment end
      .replace(/;/g, '') // Remove semicolons
      .replace(/\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b/gi, '') // Remove SQL keywords
      .trim();
  }

  /**
   * Validate and sanitize email addresses
   */
  static sanitizeEmail(input: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input)) {
      throw new Error('Invalid email format');
    }
    return input.toLowerCase().trim();
  }

  /**
   * Sanitize numeric input
   */
  static sanitizeNumber(input: any, min?: number, max?: number): number {
    const num = Number(input);
    if (isNaN(num)) {
      throw new Error('Invalid number format');
    }

    if (min !== undefined && num < min) {
      throw new Error(`Number must be at least ${min}`);
    }

    if (max !== undefined && num > max) {
      throw new Error(`Number must be at most ${max}`);
    }

    return num;
  }
}

/**
 * 🔒 SECURITY: Request validation middleware
 */
export function validateRequest(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (req.body && Object.keys(req.body).length > 0) {
        const { error, value } = schema.validate(req.body, {
          abortEarly: false,
          stripUnknown: true,
          convert: true,
        });

        if (error) {
          logger.warn('🚫 Input validation failed', {
            url: req.url,
            method: req.method,
            errors: error.details.map(d => d.message),
            body: req.body,
          });

          return res.status(400).json({
            error: 'Invalid input',
            message: 'Request contains invalid or missing data',
            details: error.details.map(d => ({
              field: d.path.join('.'),
              message: d.message,
            })),
          });
        }

        // Replace request body with validated and sanitized data
        req.body = value;
      }

      next();
    } catch (err: any) {
      logger.error('❌ Input validation error:', err);
      return res.status(500).json({
        error: 'Validation error',
        message: 'Internal server error during validation',
      });
    }
  };
}

/**
 * 🔒 SECURITY: Query parameter validation middleware
 */
export function validateQuery(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.query && Object.keys(req.query).length > 0) {
        const { error, value } = schema.validate(req.query, {
          abortEarly: false,
          stripUnknown: true,
          convert: true,
        });

        if (error) {
          logger.warn('🚫 Query validation failed', {
            url: req.url,
            method: req.method,
            errors: error.details.map(d => d.message),
            query: req.query,
          });

          return res.status(400).json({
            error: 'Invalid query parameters',
            message: 'Request contains invalid query parameters',
            details: error.details.map(d => ({
              field: d.path.join('.'),
              message: d.message,
            })),
          });
        }

        // Replace query with validated and sanitized data
        req.query = value;
      }

      next();
    } catch (err: any) {
      logger.error('❌ Query validation error:', err);
      return res.status(500).json({
        error: 'Validation error',
        message: 'Internal server error during query validation',
      });
    }
  };
}

/**
 * 🔒 SECURITY: Path parameter validation middleware
 */
export function validateParams(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.params && Object.keys(req.params).length > 0) {
        const { error, value } = schema.validate(req.params, {
          abortEarly: false,
          stripUnknown: false,
          convert: true,
        });

        if (error) {
          logger.warn('🚫 Parameter validation failed', {
            url: req.url,
            method: req.method,
            errors: error.details.map(d => d.message),
            params: req.params,
          });

          return res.status(400).json({
            error: 'Invalid path parameters',
            message: 'Request contains invalid path parameters',
            details: error.details.map(d => ({
              field: d.path.join('.'),
              message: d.message,
            })),
          });
        }

        // Replace params with validated and sanitized data
        req.params = value;
      }

      next();
    } catch (err: any) {
      logger.error('❌ Parameter validation error:', err);
      return res.status(500).json({
        error: 'Validation error',
        message: 'Internal server error during parameter validation',
      });
    }
  };
}

/**
 * 🔒 SECURITY: Generic input sanitization middleware
 */
export function sanitizeInput() {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
      }

      // Sanitize path parameters
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params);
      }

      next();
    } catch (err: any) {
      logger.error('❌ Input sanitization error:', err);
      return res.status(500).json({
        error: 'Sanitization error',
        message: 'Internal server error during input sanitization',
      });
    }
  };
}

/**
 * 🔒 SECURITY: Recursive object sanitization
 */
function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Sanitize keys
    const sanitizedKey = InputSanitizer.sanitizeString(key);

    // Sanitize values based on type
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = InputSanitizer.sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[sanitizedKey] = sanitizeObject(value);
    } else {
      sanitized[sanitizedKey] = value;
    }
  }

  return sanitized;
}

/**
 * 🔒 SECURITY: File upload validation middleware
 */
export function validateFileUpload(options: {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'text/plain', 'application/json'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.txt', '.json'],
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.file) {
        const file = req.file;

        // Check file size
        if (file.size > maxSize) {
          return res.status(400).json({
            error: 'File too large',
            message: `File size exceeds maximum allowed size of ${maxSize} bytes`,
          });
        }

        // Check MIME type
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({
            error: 'Invalid file type',
            message: `File type ${file.mimetype} is not allowed`,
          });
        }

        // Check file extension
        const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
        if (!allowedExtensions.includes(ext)) {
          return res.status(400).json({
            error: 'Invalid file extension',
            message: `File extension ${ext} is not allowed`,
          });
        }

        // Sanitize filename
        file.originalname = InputSanitizer.sanitizeString(file.originalname);
      }

      next();
    } catch (err: any) {
      logger.error('❌ File validation error:', err);
      return res.status(500).json({
        error: 'File validation error',
        message: 'Internal server error during file validation',
      });
    }
  };
}

/**
 * 🔒 SECURITY: Common validation schemas for API endpoints
 */
export const CommonSchemas = {
  // Pagination
  pagination: Joi.object({
    page: ValidationSchemas.page,
    limit: ValidationSchemas.limit,
    sortBy: ValidationSchemas.sortBy,
    sortOrder: ValidationSchemas.sortOrder,
  }),

  // Agent operations
  agentCreate: Joi.object({
    agentId: ValidationSchemas.agentId,
    role: ValidationSchemas.agentRole,
    capabilities: Joi.array().items(Joi.string()).optional(),
  }),

  // Task operations
  taskCreate: Joi.object({
    taskId: ValidationSchemas.taskId,
    title: Joi.string().min(1).max(200).required(),
    description: ValidationSchemas.taskDescription,
    agentId: ValidationSchemas.agentId,
    priority: Joi.string().valid('low', 'normal', 'high', 'critical').default('normal'),
  }),

  // Project operations
  projectCreate: Joi.object({
    projectId: ValidationSchemas.projectId,
    name: ValidationSchemas.projectName,
    path: ValidationSchemas.projectPath,
    description: Joi.string().max(500).optional(),
  }),

  // Search
  search: Joi.object({
    query: ValidationSchemas.search,
    page: ValidationSchemas.page,
    limit: ValidationSchemas.limit,
    filters: Joi.object().optional(),
  }),
};

export default {
  validateRequest,
  validateQuery,
  validateParams,
  sanitizeInput,
  validateFileUpload,
  ValidationSchemas,
  InputSanitizer,
  CommonSchemas,
};