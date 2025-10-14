/**
 * 🔒 SECURITY: Comprehensive Security Middleware
 * ==============================================
 *
 * Provides multiple layers of security protection:
 * - Rate limiting
 * - CORS configuration
 * - Security headers
 * - Request logging
 * - IP blocking
 * - Suspicious activity detection
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { logger } from '../utils/logger.js';

/**
 * 🔒 SECURITY: Rate limiting configurations
 */
export const RateLimitConfigs = {
  // General API rate limiting
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn('🚫 Rate limit exceeded', {
        ip: req.ip,
        url: req.url,
        userAgent: req.get('User-Agent'),
      });
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: '15 minutes',
      });
    },
  }),

  // Strict rate limiting for sensitive operations
  strict: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per 15 minutes
    message: {
      error: 'Too many sensitive requests',
      message: 'Rate limit for sensitive operations exceeded.',
    },
    skipSuccessfulRequests: false,
    handler: (req: Request, res: Response) => {
      logger.warn('🚫 Strict rate limit exceeded', {
        ip: req.ip,
        url: req.url,
        userAgent: req.get('User-Agent'),
      });
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit for sensitive operations exceeded.',
        retryAfter: '15 minutes',
      });
    },
  }),

  // Authentication rate limiting
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: {
      error: 'Too many authentication attempts',
      message: 'Account temporarily locked due to too many failed attempts.',
    },
    skipSuccessfulRequests: true,
    handler: (req: Request, res: Response) => {
      logger.warn('🚫 Authentication rate limit exceeded', {
        ip: req.ip,
        url: req.url,
        userAgent: req.get('User-Agent'),
      });
      res.status(429).json({
        error: 'Too many authentication attempts',
        message: 'Account temporarily locked. Please try again in 15 minutes.',
        retryAfter: '15 minutes',
      });
    },
  }),
};

/**
 * 🔒 SECURITY: CORS configuration
 */
export const corsConfig = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('🚫 CORS violation', { origin, url: '' });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Limit', 'X-Rate-Limit-Remaining'],
});

/**
 * 🔒 SECURITY: Security headers configuration
 */
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      childSrc: ["'none'"],
      workerSrc: ["'self'"],
      manifestSrc: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },

  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // X-Frame-Options
  frameguard: {
    action: 'deny',
  },

  // X-Content-Type-Options
  noSniff: true,

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // X-DNS-Prefetch-Control
  dnsPrefetchControl: {
    allow: false,
  },

  // X-Download-Options
  ieNoOpen: true,

  // X-Permitted-Cross-Domain-Policies
  permittedCrossDomainPolicies: false,

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // Expect-CT
  expectCt: {
    maxAge: 86400,
    enforce: true,
  },
});

/**
 * 🔒 SECURITY: IP-based blocking middleware
 */
class IPBlocker {
  private blockedIPs = new Set<string>();
  private suspiciousIPs = new Map<string, { count: number; lastSeen: number }>();

  /**
   * Block an IP address
   */
  blockIP(ip: string, reason: string): void {
    this.blockedIPs.add(ip);
    logger.warn('🚫 IP blocked', { ip, reason });
  }

  /**
   * Check if IP is blocked
   */
  isBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  /**
   * Mark IP as suspicious
   */
  markSuspicious(ip: string): void {
    const current = this.suspiciousIPs.get(ip) || { count: 0, lastSeen: 0 };
    current.count++;
    current.lastSeen = Date.now();
    this.suspiciousIPs.set(ip, current);

    // Auto-block if too many suspicious activities
    if (current.count > 10) {
      this.blockIP(ip, 'Excessive suspicious activity');
    }
  }

  /**
   * Clean up old entries
   */
  cleanup(): void {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    for (const [ip, data] of this.suspiciousIPs.entries()) {
      if (now - data.lastSeen > oneHour) {
        this.suspiciousIPs.delete(ip);
      }
    }
  }
}

const ipBlocker = new IPBlocker();

// Cleanup every hour
setInterval(() => ipBlocker.cleanup(), 60 * 60 * 1000);

/**
 * 🔒 SECURITY: IP blocking middleware
 */
export const ipBlocking = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || '';

  if (ipBlocker.isBlocked(ip)) {
    logger.warn('🚫 Blocked IP attempted access', { ip, url: req.url });
    return res.status(403).json({
      error: 'Access denied',
      message: 'Your IP address has been blocked due to suspicious activity.',
    });
  }

  next();
};

/**
 * 🔒 SECURITY: Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const ip = req.ip || req.connection.remoteAddress || '';

  // Log request
  logger.info('📡 Incoming request', {
    method: req.method,
    url: req.url,
    ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';

    logger[level]('📤 Request completed', {
      method: req.method,
      url: req.url,
      ip,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
    });

    // Mark suspicious activities
    if (res.statusCode === 401 || res.statusCode === 403) {
      ipBlocker.markSuspicious(ip);
    }
  });

  next();
};

/**
 * 🔒 SECURITY: Suspicious activity detection
 */
export const suspiciousActivityDetection = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || '';
  const userAgent = req.get('User-Agent') || '';

  // Check for suspicious user agents
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /scanner/i,
    /sqlmap/i,
    /nmap/i,
    /curl/i,
    /wget/i,
  ];

  const isSuspiciousUserAgent = suspiciousPatterns.some(pattern => pattern.test(userAgent));

  // Check for suspicious paths
  const suspiciousPaths = [
    '/admin',
    '/wp-admin',
    '/phpmyadmin',
    '/.env',
    '/config',
    '/etc/passwd',
  ];

  const isSuspiciousPath = suspiciousPaths.some(path => req.url.toLowerCase().includes(path));

  if (isSuspiciousUserAgent || isSuspiciousPath) {
    ipBlocker.markSuspicious(ip);
    logger.warn('🚨 Suspicious activity detected', {
      ip,
      url: req.url,
      userAgent,
      reason: isSuspiciousUserAgent ? 'Suspicious user agent' : 'Suspicious path',
    });
  }

  next();
};

/**
 * 🔒 SECURITY: Error handling middleware (prevents information leakage)
 */
export const secureErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log the full error for debugging
  logger.error('❌ Request error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Return generic error message to client
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred. Please try again later.',
    requestId: req.headers['x-request-id'] || 'unknown',
  });
};

/**
 * 🔒 SECURITY: 404 handler (prevents information leakage)
 */
export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn('🚫 404 Not Found', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found.',
  });
};

/**
 * 🔒 SECURITY: Combine all security middleware
 */
export const securityMiddleware = [
  // Apply security headers first
  securityHeaders,

  // CORS configuration
  corsConfig,

  // Request logging
  requestLogger,

  // IP blocking
  ipBlocking,

  // Suspicious activity detection
  suspiciousActivityDetection,

  // Rate limiting (general)
  RateLimitConfigs.general,
];

/**
 * 🔒 SECURITY: Auth-specific security middleware
 */
export const authSecurityMiddleware = [
  securityHeaders,
  corsConfig,
  requestLogger,
  ipBlocking,
  suspiciousActivityDetection,
  RateLimitConfigs.auth,
];

export default {
  RateLimitConfigs,
  corsConfig,
  securityHeaders,
  ipBlocking,
  requestLogger,
  suspiciousActivityDetection,
  secureErrorHandler,
  notFoundHandler,
  securityMiddleware,
  authSecurityMiddleware,
};