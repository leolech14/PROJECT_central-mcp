/**
 * 🧪 UNIT TESTS: Input Validation Middleware
 * ===========================================
 *
 * Test comprehensive input validation functionality
 */

import { Request, Response, NextFunction } from 'express';
import {
  validateRequest,
  validateQuery,
  validateParams,
  sanitizeInput,
  InputSanitizer,
  CommonSchemas,
} from '../../../src/middleware/inputValidation.js';
import { TestUtils } from '../../setup.js';
import Joi from 'joi';

describe('Input Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = TestUtils.createMockRequest();
    mockResponse = TestUtils.createMockResponse();
    mockNext = jest.fn();
  });

  describe('🔒 InputSanitizer', () => {
    describe('sanitizeString', () => {
      test('should sanitize basic strings', () => {
        expect(InputSanitizer.sanitizeString('Hello World')).toBe('Hello World');
        expect(InputSanitizer.sanitizeString('  Hello  World  ')).toBe('Hello World');
      });

      test('should remove HTML tags', () => {
        expect(InputSanitizer.sanitizeString('<script>alert("xss")</script>')).toBe('');
        expect(InputSanitizer.sanitizeString('<p>Hello</p>')).toBe('Hello');
        expect(InputSanitizer.sanitizeString('Hello <b>World</b>')).toBe('Hello World');
      });

      test('should handle empty strings', () => {
        expect(InputSanitizer.sanitizeString('')).toBe('');
        expect(InputSanitizer.sanitizeString('   ')).toBe('');
      });

      test('should throw error for non-string input', () => {
        expect(() => InputSanitizer.sanitizeString(123 as any)).toThrow('Input must be a string');
        expect(() => InputSanitizer.sanitizeString(null as any)).toThrow('Input must be a string');
        expect(() => InputSanitizer.sanitizeString(undefined as any)).toThrow('Input must be a string');
      });
    });

    describe('sanitizeCode', () => {
      test('should sanitize code input', () => {
        expect(InputSanitizer.sanitizeCode('const x = 5;')).toBe('const x = 5;');
        expect(InputSanitizer.sanitizeCode('function test() { return "hello"; }')).toBe('function test() { return "hello"; }');
      });

      test('should remove dangerous characters', () => {
        expect(InputSanitizer.sanitizeCode('const x = 5; rm -rf /')).toBe('const x = 5; rm -rf ');
        expect(InputSanitizer.sanitizeCode('const x = 5; && echo "hack"')).toBe('const x = 5;  echo "hack"');
      });
    });

    describe('sanitizePath', () => {
      test('should sanitize file paths', () => {
        expect(InputSanitizer.sanitizePath('/home/user/file.txt')).toBe('home/user/file.txt');
        expect(InputSanitizer.sanitizePath('C:\\Users\\User\\file.txt')).toBe('C:/Users/User/file.txt');
      });

      test('should prevent directory traversal', () => {
        expect(InputSanitizer.sanitizePath('../../../etc/passwd')).toBe('etc/passwd');
        expect(InputSanitizer.sanitizePath('..\\..\\windows\\system32')).toBe('windows/system32');
      });

      test('should normalize path separators', () => {
        expect(InputSanitizer.sanitizePath('path//to///file')).toBe('path/to/file');
        expect(InputSanitizer.sanitizePath('path\\\\to\\\\file')).toBe('path/to/file');
      });
    });

    describe('sanitizeSQL', () => {
      test('should remove SQL injection patterns', () => {
        expect(InputSanitizer.sanitizeSQL("SELECT * FROM users WHERE id = '1'")).toBe('SELECT  FROM users WHERE id = 1');
        expect(InputSanitizer.sanitizeSQL("'; DROP TABLE users; --")).toBe('  DROP TABLE users');
        expect(InputSanitizer.sanitizeSQL("1' OR '1'='1")).toBe('1 OR 11');
      });

      test('should handle SQL keywords', () => {
        expect(InputSanitizer.sanitizeSQL('UNION SELECT * FROM passwords')).toBe('  * FROM passwords');
        expect(InputSanitizer.sanitizeSQL('INSERT INTO users VALUES...')).toBe(' INTO users VALUES...');
      });
    });

    describe('sanitizeEmail', () => {
      test('should validate and sanitize emails', () => {
        expect(InputSanitizer.sanitizeEmail('test@example.com')).toBe('test@example.com');
        expect(InputSanitizer.sanitizeEmail('Test@EXAMPLE.COM')).toBe('test@example.com');
        expect(InputSanitizer.sanitizeEmail('  user@domain.org  ')).toBe('user@domain.org');
      });

      test('should throw error for invalid emails', () => {
        expect(() => InputSanitizer.sanitizeEmail('invalid')).toThrow('Invalid email format');
        expect(() => InputSanitizer.sanitizeEmail('test@')).toThrow('Invalid email format');
        expect(() => InputSanitizer.sanitizeEmail('@example.com')).toThrow('Invalid email format');
      });
    });

    describe('sanitizeNumber', () => {
      test('should validate and sanitize numbers', () => {
        expect(InputSanitizer.sanitizeNumber('123')).toBe(123);
        expect(InputSanitizer.sanitizeNumber(456)).toBe(456);
        expect(InputSanitizer.sanitizeNumber('78.9')).toBe(78.9);
      });

      test('should enforce min/max constraints', () => {
        expect(InputSanitizer.sanitizeNumber(50, 0, 100)).toBe(50);
        expect(() => InputSanitizer.sanitizeNumber(-1, 0, 100)).toThrow('Number must be at least 0');
        expect(() => InputSanitizer.sanitizeNumber(150, 0, 100)).toThrow('Number must be at most 100');
      });

      test('should throw error for invalid numbers', () => {
        expect(() => InputSanitizer.sanitizeNumber('abc')).toThrow('Invalid number format');
        expect(() => InputSanitizer.sanitizeNumber(null as any)).toThrow('Invalid number format');
        expect(() => InputSanitizer.sanitizeNumber(NaN)).toThrow('Invalid number format');
      });
    });
  });

  describe('✅ validateRequest', () => {
    test('should validate request body successfully', async () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().integer().min(0).required(),
      });

      mockRequest.body = { name: 'John', age: 30 };

      const middleware = validateRequest(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body).toEqual({ name: 'John', age: 30 });
    });

    test('should reject invalid request body', async () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().integer().min(0).required(),
      });

      mockRequest.body = { name: 'John' }; // Missing age

      const middleware = validateRequest(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid input',
        message: 'Request contains invalid or missing data',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'age',
            message: expect.stringContaining('required'),
          }),
        ]),
      });
    });

    test('should handle empty request body', async () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });

      const middleware = validateRequest(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled(); // Empty body should pass through
    });
  });

  describe('✅ validateQuery', () => {
    test('should validate query parameters successfully', async () => {
      const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        search: Joi.string().optional(),
      });

      mockRequest.query = { page: '2', limit: '10', search: 'test' };

      const middleware = validateQuery(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.query).toEqual({ page: 2, limit: 10, search: 'test' });
    });

    test('should apply default values', async () => {
      const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
      });

      mockRequest.query = {};

      const middleware = validateQuery(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.query).toEqual({ page: 1, limit: 20 });
    });

    test('should reject invalid query parameters', async () => {
      const schema = Joi.object({
        page: Joi.number().integer().min(1).required(),
      });

      mockRequest.query = { page: 'invalid' };

      const middleware = validateQuery(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('✅ validateParams', () => {
    test('should validate path parameters successfully', async () => {
      const schema = Joi.object({
        id: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).required(),
      });

      mockRequest.params = { id: 'valid-id-123' };

      const middleware = validateParams(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.params).toEqual({ id: 'valid-id-123' });
    });

    test('should reject invalid path parameters', async () => {
      const schema = Joi.object({
        id: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).required(),
      });

      mockRequest.params = { id: 'invalid@id' };

      const middleware = validateParams(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('🧹 sanitizeInput', () => {
    test('should sanitize request body', async () => {
      mockRequest.body = {
        name: '<script>alert("xss")</script>',
        description: 'Normal text',
        nested: {
          html: '<p>Dangerous</p>',
          safe: 'Safe text',
        },
      };

      const middleware = sanitizeInput();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body).toEqual({
        name: '',
        description: 'Normal text',
        nested: {
          html: 'Dangerous',
          safe: 'Safe text',
        },
      });
    });

    test('should sanitize query parameters', async () => {
      mockRequest.query = {
        search: '<script>alert("xss")</script>',
        filter: 'normal',
      };

      const middleware = sanitizeInput();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.query).toEqual({
        search: '',
        filter: 'normal',
      });
    });

    test('should sanitize path parameters', async () => {
      mockRequest.params = {
        id: '../../../etc/passwd',
        name: 'normal',
      };

      const middleware = sanitizeInput();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.params).toEqual({
        id: 'etc/passwd',
        name: 'normal',
      });
    });
  });

  describe('📋 CommonSchemas', () => {
    test('should have pagination schema', () => {
      const { error, value } = CommonSchemas.pagination.validate({
        page: 2,
        limit: 50,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      expect(error).toBeUndefined();
      expect(value).toEqual({
        page: 2,
        limit: 50,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
    });

    test('should have agent creation schema', () => {
      const { error, value } = CommonSchemas.agentCreate.validate({
        agentId: 'agent-a',
        role: 'A',
        capabilities: ['ui', 'frontend'],
      });

      expect(error).toBeUndefined();
      expect(value).toEqual({
        agentId: 'agent-a',
        role: 'A',
        capabilities: ['ui', 'frontend'],
      });
    });

    test('should have task creation schema', () => {
      const { error, value } = CommonSchemas.taskCreate.validate({
        taskId: 'task-123',
        title: 'Test Task',
        description: 'A test task description',
        agentId: 'agent-a',
        priority: 'high',
      });

      expect(error).toBeUndefined();
      expect(value).toEqual({
        taskId: 'task-123',
        title: 'Test Task',
        description: 'A test task description',
        agentId: 'agent-a',
        priority: 'high',
      });
    });

    test('should have project creation schema', () => {
      const { error, value } = CommonSchemas.projectCreate.validate({
        projectId: 'project-123',
        name: 'Test Project',
        path: '/path/to/project',
        description: 'A test project',
      });

      expect(error).toBeUndefined();
      expect(value).toEqual({
        projectId: 'project-123',
        name: 'Test Project',
        path: '/path/to/project',
        description: 'A test project',
      });
    });

    test('should have search schema', () => {
      const { error, value } = CommonSchemas.search.validate({
        query: 'search term',
        page: 1,
        limit: 10,
      });

      expect(error).toBeUndefined();
      expect(value).toEqual({
        query: 'search term',
        page: 1,
        limit: 10,
      });
    });
  });
});