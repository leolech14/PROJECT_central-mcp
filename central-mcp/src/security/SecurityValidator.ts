/**
 * Security Validator
 * ================
 *
 * Comprehensive security validation for model detection system.
 * Provides input sanitization, API key validation, and security best practices.
 */

import { logger } from '../utils/logger.js';

export interface SecurityValidationResult {
  isValid: boolean;
  sanitized: any;
  warnings: string[];
  errors: string[];
  securityLevel: 'low' | 'medium' | 'high';
}

export interface ApiKeyValidation {
  isValid: boolean;
  isEncrypted: boolean;
  provider: string;
  lastRotation?: Date;
  exposureRisk: 'low' | 'medium' | 'high';
}

export class SecurityValidator {
  private static readonly SENSITIVE_PATTERNS = [
    /sk-[a-zA-Z0-9]{48}/g, // OpenAI API keys
    /sk-ant-[a-zA-Z0-9]{95}/g, // Anthropic API keys
    /[a-zA-Z0-9]{32}/g, // Generic API keys
    /Bearer\s+[a-zA-Z0-9\-_\.]+/g, // Bearer tokens
    /password\s*[:=]\s*["']?[^\s"']+/gi, // Passwords
    /secret\s*[:=]\s*["']?[^\s"']+/gi, // Secrets
  ];

  private static readonly DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // XSS
    /javascript:/gi, // JavaScript URLs
    /on\w+\s*=/gi, // Event handlers
    /eval\s*\(/gi, // Eval functions
    /import\s+.*\s+from/gi, // Dynamic imports
  ];

  /**
   * Validate and sanitize model input
   */
  static validateModelInput(input: any): SecurityValidationResult {
    const result: SecurityValidationResult = {
      isValid: true,
      sanitized: input,
      warnings: [],
      errors: [],
      securityLevel: 'high'
    };

    try {
      // Input type validation
      if (typeof input !== 'string' && typeof input !== 'object') {
        result.errors.push('Invalid input type');
        result.isValid = false;
        result.securityLevel = 'low';
        return result;
      }

      // Convert objects to JSON strings for validation
      const inputString = typeof input === 'string' ? input : JSON.stringify(input);

      // Check for dangerous patterns
      this.DANGEROUS_PATTERNS.forEach(pattern => {
        if (pattern.test(inputString)) {
          result.errors.push(`Dangerous pattern detected: ${pattern.source}`);
          result.isValid = false;
          result.securityLevel = 'low';
        }
      });

      // Check for sensitive information exposure
      this.SENSITIVE_PATTERNS.forEach(pattern => {
        if (pattern.test(inputString)) {
          result.warnings.push('Potential sensitive information detected in input');
          result.securityLevel = result.securityLevel === 'high' ? 'medium' : 'low';
        }
      });

      // Sanitize input
      result.sanitized = this.sanitizeInput(inputString);

      // Length validation
      if (inputString.length > 10000) {
        result.warnings.push('Input length exceeds recommended limit');
        result.securityLevel = 'medium';
      }

      // Character encoding validation
      if (!this.isValidUtf8(inputString)) {
        result.errors.push('Invalid character encoding detected');
        result.isValid = false;
        result.securityLevel = 'low';
      }

    } catch (error: any) {
      result.errors.push(`Validation error: ${error.message}`);
      result.isValid = false;
      result.securityLevel = 'low';
    }

    return result;
  }

  /**
   * Validate API key security
   */
  static validateApiKeySecurity(apiKey: string, provider: string): ApiKeyValidation {
    const result: ApiKeyValidation = {
      isValid: true,
      isEncrypted: false,
      provider: provider.toLowerCase(),
      exposureRisk: 'low'
    };

    try {
      // Check if API key is in plain text
      if (this.isPlainTextApiKey(apiKey)) {
        result.exposureRisk = 'high';
        result.warnings = ['API key stored in plain text - high security risk'];
      }

      // Validate API key format for different providers
      const formatValidation = this.validateApiKeyFormat(apiKey, provider);
      if (!formatValidation.isValid) {
        result.isValid = false;
        result.exposureRisk = 'high';
      }

      // Check for common weak patterns
      if (this.isWeakApiKey(apiKey)) {
        result.isValid = false;
        result.exposureRisk = 'high';
      }

      // Check if key appears to be encrypted
      if (this.appearsEncrypted(apiKey)) {
        result.isEncrypted = true;
        result.exposureRisk = 'low';
      }

    } catch (error: any) {
      result.isValid = false;
      result.exposureRisk = 'high';
    }

    return result;
  }

  /**
   * Validate HTTP response for security
   */
  static validateHttpResponse(response: any, source: string): SecurityValidationResult {
    const result: SecurityValidationResult = {
      isValid: true,
      sanitized: response,
      warnings: [],
      errors: [],
      securityLevel: 'high'
    };

    try {
      // Validate response structure
      if (!response || typeof response !== 'object') {
        result.errors.push('Invalid response structure');
        result.isValid = false;
        result.securityLevel = 'low';
        return result;
      }

      // Check for suspicious content
      const responseString = JSON.stringify(response);

      // XSS checks
      if (this.DANGEROUS_PATTERNS.some(pattern => pattern.test(responseString))) {
        result.errors.push('Potentially malicious content in response');
        result.sanitized = this.sanitizeInput(responseString);
        result.securityLevel = 'medium';
      }

      // Size validation
      if (responseString.length > 1000000) { // 1MB
        result.warnings.push('Large response size - potential DoS risk');
        result.securityLevel = 'medium';
      }

      // Source validation
      if (!this.validateSource(source)) {
        result.warnings.push('Untrusted response source');
        result.securityLevel = 'medium';
      }

    } catch (error: any) {
      result.errors.push(`Response validation error: ${error.message}`);
      result.isValid = false;
      result.securityLevel = 'low';
    }

    return result;
  }

  /**
   * Sanitize input string
   */
  private static sanitizeInput(input: string): any {
    try {
      // Remove dangerous patterns
      let sanitized = input;

      // Remove script tags and dangerous content
      this.DANGEROUS_PATTERNS.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '');
      });

      // Mask sensitive information
      this.SENSITIVE_PATTERNS.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      });

      // Try to parse as JSON
      try {
        return JSON.parse(sanitized);
      } catch {
        return sanitized;
      }
    } catch (error) {
      return input; // Return original if sanitization fails
    }
  }

  /**
   * Check if string is valid UTF-8
   */
  private static isValidUtf8(str: string): boolean {
    try {
      return Buffer.from(str, 'utf8').toString('utf8') === str;
    } catch {
      return false;
    }
  }

  /**
   * Check if API key is in plain text
   */
  private static isPlainTextApiKey(apiKey: string): boolean {
    // Check for common plain text patterns
    const plainTextPatterns = [
      /^sk-/i, // OpenAI/Anthropic
      /^Bearer\s+/i, // Bearer tokens
      /^[a-zA-Z0-9]{32,}$/, // Generic API keys
    ];

    return plainTextPatterns.some(pattern => pattern.test(apiKey));
  }

  /**
   * Validate API key format for specific provider
   */
  private static validateApiKeyFormat(apiKey: string, provider: string): { isValid: boolean } {
    const patterns: Record<string, RegExp> = {
      'openai': /^sk-[a-zA-Z0-9]{48}$/,
      'anthropic': /^sk-ant-[a-zA-Z0-9]{95}$/,
      'zhipu': /^[a-f0-9]{64}$/,
      'runpod': /^[a-zA-Z0-9\-_]{20,}$/
    };

    const pattern = patterns[provider.toLowerCase()];
    if (pattern) {
      return { isValid: pattern.test(apiKey) };
    }

    // Generic validation for unknown providers
    return { isValid: apiKey.length >= 20 && /^[a-zA-Z0-9\-_]+$/.test(apiKey) };
  }

  /**
   * Check if API key appears weak
   */
  private static isWeakApiKey(apiKey: string): boolean {
    // Check for common weak patterns
    const weakPatterns = [
      /test/i,
      /demo/i,
      /example/i,
      /sample/i,
      /^123/,
      /password/i,
      /secret/i
    ];

    return weakPatterns.some(pattern => pattern.test(apiKey));
  }

  /**
   * Check if API key appears to be encrypted
   */
  private static appearsEncrypted(apiKey: string): boolean {
    // Check for encryption indicators
    const encryptedPatterns = [
      /^[A-Za-z0-9+/]+={0,2}$/, // Base64
      /^[0-9a-fA-F]+$/, // Hex
      /^gcm:/, // Google Cloud encrypted
      /^encrypted:/i // Explicit encryption marker
    ];

    return encryptedPatterns.some(pattern => pattern.test(apiKey));
  }

  /**
   * Validate response source
   */
  private static validateSource(source: string): boolean {
    try {
      const url = new URL(source);

      // Allow HTTPS only
      if (url.protocol !== 'https:') {
        return false;
      }

      // Block suspicious domains
      const blockedDomains = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        '::1'
      ];

      return !blockedDomains.includes(url.hostname);
    } catch {
      return false; // Invalid URL
    }
  }

  /**
   * Generate security report
   */
  static generateSecurityReport(validations: SecurityValidationResult[]): {
    overallScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
    criticalIssues: string[];
  } {
    const totalValidations = validations.length;
    const failedValidations = validations.filter(v => !v.isValid).length;
    const warnings = validations.flatMap(v => v.warnings);
    const errors = validations.flatMap(v => v.errors);

    const overallScore = Math.max(0, 100 - (failedValidations / totalValidations) * 100 - (warnings.length / totalValidations) * 10);

    const riskLevel = overallScore >= 80 ? 'low' : overallScore >= 60 ? 'medium' : 'high';

    const recommendations = [];
    const criticalIssues = [];

    if (failedValidations > 0) {
      criticalIssues.push(`${failedValidations} validation failures detected`);
      recommendations.push('Fix all validation failures immediately');
    }

    if (warnings.length > 5) {
      recommendations.push('Address security warnings to improve system security');
    }

    if (errors.length > 0) {
      criticalIssues.push(`${errors.length} security errors found`);
      recommendations.push('Resolve all security errors for production deployment');
    }

    return {
      overallScore: Math.round(overallScore),
      riskLevel,
      recommendations,
      criticalIssues
    };
  }
}