/**
 * 🔒 SECURITY: Secure Server Configuration
 * ======================================
 *
 * This file demonstrates how to properly configure an Express server
 * with all security measures implemented.
 *
 * Usage:
 * ```typescript
 * import { createSecureServer } from './src/config/secureServer.js';
 * const app = createSecureServer();
 * app.listen(3000, () => console.log('Secure server running'));
 * ```
 */

import express, { Application } from 'express';
import compression from 'compression';
import morgan from 'morgan';
import {
  securityMiddleware,
  authSecurityMiddleware,
  secureErrorHandler,
  notFoundHandler,
} from '../middleware/security.js';
import { validateRequest, validateQuery, validateParams, sanitizeInput } from '../middleware/inputValidation.js';
import { CommonSchemas } from '../middleware/inputValidation.js';
import { logger } from '../utils/logger.js';

/**
 * 🔒 SECURITY: Create secure Express server
 */
export function createSecureServer(): Application {
  const app = express();

  // Trust proxy for IP detection (important for rate limiting)
  app.set('trust proxy', 1);

  // 🔒 SECURITY: Apply security middleware
  app.use(securityMiddleware);

  // 🔒 SECURITY: Basic middleware
  app.use(compression()); // gzip compression
  app.use(express.json({ limit: '10mb' })); // JSON body parsing with size limit
  app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL-encoded parsing

  // 🔒 SECURITY: Request logging
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim())
      }
    }));
  }

  // 🔒 SECURITY: Input sanitization (applied to all routes)
  app.use(sanitizeInput());

  // ========================================
  // 🛡️  SECURE API ROUTES EXAMPLES
  // ========================================

  /**
   * Health check endpoint (public)
   */
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  /**
   * Public API endpoints
   */
  app.get('/api/v1/public/projects',
    validateQuery(CommonSchemas.search),
    (req, res) => {
      // Your public project listing logic here
      res.json({
        projects: [],
        pagination: {
          page: req.query.page,
          limit: req.query.limit,
          total: 0,
        },
      });
    }
  );

  /**
   * Authentication endpoints (with stricter security)
   */
  app.post('/api/v1/auth/login',
    authSecurityMiddleware,
    validateRequest(Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).max(128).required(),
    })),
    async (req, res) => {
      // Your authentication logic here
      res.json({
        message: 'Authentication successful',
        token: 'jwt-token-here',
      });
    }
  );

  /**
   * Agent management endpoints (protected)
   */
  app.post('/api/v1/agents',
    authSecurityMiddleware,
    validateRequest(CommonSchemas.agentCreate),
    (req, res) => {
      // Your agent creation logic here
      res.json({
        message: 'Agent created successfully',
        agent: req.body,
      });
    }
  );

  /**
   * Task management endpoints (protected)
   */
  app.post('/api/v1/tasks',
    authSecurityMiddleware,
    validateRequest(CommonSchemas.taskCreate),
    (req, res) => {
      // Your task creation logic here
      res.json({
        message: 'Task created successfully',
        task: req.body,
      });
    }
  );

  /**
   * Project management endpoints (protected)
   */
  app.post('/api/v1/projects',
    authSecurityMiddleware,
    validateRequest(CommonSchemas.projectCreate),
    (req, res) => {
      // Your project creation logic here
      res.json({
        message: 'Project created successfully',
        project: req.body,
      });
    }
  );

  /**
   * File upload endpoint (with file validation)
   */
  app.post('/api/v1/upload',
    authSecurityMiddleware,
    validateFileUpload({
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'text/plain', 'application/json'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.txt', '.json'],
    }),
    (req, res) => {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
        });
      }

      // Your file processing logic here
      res.json({
        message: 'File uploaded successfully',
        file: {
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });
    }
  );

  // Parameterized routes with validation
  app.get('/api/v1/agents/:agentId',
    validateParams(Joi.object({
      agentId: CommonSchemas.ValidationSchemas.agentId,
    })),
    (req, res) => {
      // Your agent retrieval logic here
      res.json({
        agentId: req.params.agentId,
        agent: {
          id: req.params.agentId,
          name: `Agent ${req.params.agentId}`,
          status: 'active',
        },
      });
    }
  );

  app.get('/api/v1/tasks/:taskId',
    validateParams(Joi.object({
      taskId: CommonSchemas.ValidationSchemas.taskId,
    })),
    (req, res) => {
      // Your task retrieval logic here
      res.json({
        taskId: req.params.taskId,
        task: {
          id: req.params.taskId,
          title: `Task ${req.params.taskId}`,
          status: 'pending',
        },
      });
    }
  );

  // ========================================
  // 🔒 SECURITY: Error handling
  // ========================================

  // 404 handler (must be last)
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(secureErrorHandler);

  return app;
}

/**
 * 🔒 SECURITY: Development server with security
 */
export function startSecureDevServer(port: number = 3000): void {
  const app = createSecureServer();

  app.listen(port, () => {
    logger.info(`🚀 Secure server running on port ${port}`);
    logger.info(`🔒 Security features enabled:`);
    logger.info(`   - Rate limiting`);
    logger.info(`   - CORS protection`);
    logger.info(`   - Security headers`);
    logger.info(`   - Input validation`);
    logger.info(`   - IP blocking`);
    logger.info(`   - Request logging`);
  });
}

/**
 * 🔒 SECURITY: Production server configuration
 */
export function createProductionServer(): Application {
  const app = createSecureServer();

  // Additional production-specific security measures
  app.disable('x-powered-by'); // Already handled by helmet, but explicit

  // Production-specific rate limiting (stricter)
  app.use('/api/v1/auth', rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts',
  }));

  return app;
}

// Import necessary modules
import Joi from 'joi';
import { validateFileUpload } from '../middleware/inputValidation.js';
import rateLimit from 'express-rate-limit';

export default {
  createSecureServer,
  startSecureDevServer,
  createProductionServer,
};