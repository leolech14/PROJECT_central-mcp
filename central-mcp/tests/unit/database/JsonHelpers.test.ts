/**
 * 🧪 UNIT TESTS: JSON HELPERS
 * ==============================
 *
 * Test JSON helper utilities for database operations
 */

import {
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
  JsonPerformanceMonitor
} from '../../../src/database/JsonHelpers.js';
import { TestUtils } from '../../setup.js';

describe('JSON Helpers', () => {
  describe('📄 safeJsonParse', () => {
    test('should parse valid JSON', () => {
      expect(safeJsonParse('{"key": "value"}', {})).toEqual({ key: 'value' });
      expect(safeJsonParse('[1, 2, 3]', [])).toEqual([1, 2, 3]);
      expect(safeJsonParse('true', false)).toBe(true);
    });

    test('should return fallback for invalid JSON', () => {
      expect(safeJsonParse('invalid json', { default: true })).toEqual({ default: true });
      expect(safeJsonParse('', { fallback: 'test' })).toEqual({ fallback: 'test' });
      expect(safeJsonParse(null, { fallback: null })).toEqual({ fallback: null });
    });

    test('should handle null/undefined/empty strings', () => {
      expect(safeJsonParse(null, 'fallback')).toBe('fallback');
      expect(safeJsonParse(undefined as any, 'fallback')).toBe('fallback');
      expect(safeJsonParse('', 'fallback')).toBe('fallback');
      expect(safeJsonParse('null', 'fallback')).toBe('fallback');
      expect(safeJsonParse('undefined', 'fallback')).toBe('fallback');
    });
  });

  describe('📄 safeJsonStringify', () => {
    test('should stringify valid objects', () => {
      expect(safeJsonStringify({ key: 'value' }, '[]')).toBe('{"key":"value"}');
      expect(safeJsonStringify([1, 2, 3], '[]')).toBe('[1,2,3]');
      expect(safeJsonStringify(true, 'false')).toBe('true');
    });

    test('should return fallback for invalid objects', () => {
      const circular: any = {};
      circular.self = circular;
      expect(safeJsonStringify(circular, '[]')).toBe('[]');
    });

    test('should handle null/undefined', () => {
      expect(safeJsonStringify(null, '[]')).toBe('[]');
      expect(safeJsonStringify(undefined, '[]')).toBe('[]');
    });
  });

  describe('📄 jsonExtract', () => {
    test('should extract values using dot notation', () => {
      const obj = {
        user: {
          name: 'John',
          address: {
            city: 'New York'
          }
        },
        tags: ['tag1', 'tag2']
      };

      expect(jsonExtract(JSON.stringify(obj), 'user.name')).toBe('John');
      expect(jsonExtract(JSON.stringify(obj), 'user.address.city')).toBe('New York');
      expect(jsonExtract(JSON.stringify(obj), 'tags.0')).toBe('tag1');
    });

    test('should return null for invalid paths', () => {
      const obj = { user: { name: 'John' } };
      expect(jsonExtract(JSON.stringify(obj), 'user.age')).toBeNull();
      expect(jsonExtract(JSON.stringify(obj), 'invalid.path')).toBeNull();
    });

    test('should handle null/empty input', () => {
      expect(jsonExtract(null, 'path')).toBeNull();
      expect(jsonExtract('', 'path')).toBeNull();
    });
  });

  describe('📄 jsonSet', () => {
    test('should set values using dot notation', () => {
      expect(jsonSet(null, 'user.name', 'John')).toBe('{"user":{"name":"John"}}');
      expect(jsonSet('{"user":{}}', 'user.name', 'John')).toBe('{"user":{"name":"John"}}');
      expect(jsonSet('{"user":{"name":"Old"}}', 'user.name', 'John')).toBe('{"user":{"name":"John"}}');
    });

    test('should create nested structure if needed', () => {
      expect(jsonSet('{}', 'user.profile.age', 25)).toBe('{"user":{"profile":{"age":25}}}');
    });
  });

  describe('📄 jsonContains', () => {
    test('should check if array contains value', () => {
      expect(jsonContains('[1, 2, 3]', 2)).toBe(true);
      expect(jsonContains('[1, 2, 3]', 4)).toBe(false);
      expect(jsonContains('["a", "b", "c"]', 'b')).toBe(true);
    });

    test('should handle non-array JSON', () => {
      expect(jsonContains('{"key": "value"}', 'value')).toBe(false);
      expect(jsonContains('invalid', 'value')).toBe(false);
    });

    test('should handle null/empty input', () => {
      expect(jsonContains(null, 'value')).toBe(false);
      expect(jsonContains('', 'value')).toBe(false);
    });
  });

  describe('📄 jsonAddToArray', () => {
    test('should add value to array', () => {
      expect(jsonAddToArray('[1, 2]', 3)).toBe('[1,2,3]');
      expect(jsonAddToArray('[]', 'item')).toBe('["item"]');
    });

    test('should not add duplicates', () => {
      expect(jsonAddToArray('[1, 2]', 2)).toBe('[1,2]');
      expect(jsonAddToArray('["a", "b"]', 'a')).toBe('["a","b"]');
    });

    test('should handle null/empty input', () => {
      expect(jsonAddToArray(null, 'item')).toBe('["item"]');
      expect(jsonAddToArray('', 'item')).toBe('["item"]');
    });

    test('should handle non-array JSON by creating new array', () => {
      expect(jsonAddToArray('{"key": "value"}', 'item')).toBe('["item"]');
    });
  });

  describe('📄 jsonRemoveFromArray', () => {
    test('should remove value from array', () => {
      expect(jsonRemoveFromArray('[1, 2, 3]', 2)).toBe('[1,3]');
      expect(jsonRemoveFromArray('["a", "b", "c"]', 'b')).toBe('["a","c"]');
    });

    test('should handle null/empty input', () => {
      expect(jsonRemoveFromArray(null, 'item')).toBe('[]');
      expect(jsonRemoveFromArray('', 'item')).toBe('[]');
    });

    test('should handle non-array JSON', () => {
      expect(jsonRemoveFromArray('{"key": "value"}', 'item')).toBe('[]');
    });
  });

  describe('📄 jsonArrayLength', () => {
    test('should get array length', () => {
      expect(jsonArrayLength('[1, 2, 3]')).toBe(3);
      expect(jsonArrayLength('[]')).toBe(0);
      expect(jsonArrayLength('["a", "b"]')).toBe(2);
    });

    test('should handle null/empty input', () => {
      expect(jsonArrayLength(null)).toBe(0);
      expect(jsonArrayLength('')).toBe(0);
    });

    test('should handle non-array JSON', () => {
      expect(jsonArrayLength('{"key": "value"}')).toBe(0);
    });
  });

  describe('📄 jsonMerge', () => {
    test('should merge JSON objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 3, c: 4 };
      const result = jsonMerge(JSON.stringify(obj1), JSON.stringify(obj2));
      expect(JSON.parse(result)).toEqual({ a: 1, b: 3, c: 4 });
    });

    test('should handle null/empty inputs', () => {
      expect(jsonMerge(null, '{"b": 2}')).toBe('{"b":2}');
      expect(jsonMerge('{"a": 1}', null)).toBe('{"a":1}');
      expect(jsonMerge(null, null)).toBe('{}');
    });
  });

  describe('📄 validateJsonSchema', () => {
    test('should validate valid objects against schema', () => {
      const taskDeps = ['dep1', 'dep2'];
      const result = validateJsonSchema(JSON.stringify(taskDeps), CommonSchemas.TaskDependencies);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should reject invalid objects', () => {
      const invalidDeps = { not: 'an array' };
      const result = validateJsonSchema(JSON.stringify(invalidDeps), CommonSchemas.TaskDependencies);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate task deliverables', () => {
      const deliverables = [
        { type: 'file', description: 'Main component' },
        { type: 'test', description: 'Unit tests' }
      ];
      const result = validateJsonSchema(JSON.stringify(deliverables), CommonSchemas.TaskDeliverables);
      expect(result.valid).toBe(true);
    });
  });

  describe('📄 JsonQueryBuilder', () => {
    let builder: JsonQueryBuilder;

    beforeEach(() => {
      builder = new JsonQueryBuilder('tasks', 'metadata');
    });

    test('should build contains query', () => {
      const query = builder.contains('value');
      expect(query).toBe("json_extract(metadata, '$') LIKE '%value%'");
    });

    test('should build has property query', () => {
      const query = builder.hasProperty('status');
      expect(query).toBe("json_extract(metadata, '$.status') IS NOT NULL");
    });

    test('should build get property query', () => {
      const query = builder.getProperty('status');
      expect(query).toBe("json_extract(metadata, '$.status')");
    });

    test('should build array length query', () => {
      const query = builder.arrayLength('>', 0);
      expect(query).toBe('json_array_length(metadata) > 0');
    });

    test('should build is valid query', () => {
      const query = builder.isValid();
      expect(query).toBe('json_valid(metadata)');
    });

    test('should build select query', () => {
      const query = builder.select([builder.hasProperty('status')]);
      expect(query).toBe("SELECT * FROM tasks WHERE json_extract(metadata, '$.status') IS NOT NULL");
    });

    test('should build set property query', () => {
      const query = builder.setProperty('status', 'active');
      expect(query).toBe("UPDATE tasks SET metadata = json_set(metadata, '$.status', 'active')");
    });

    test('should build append to array query', () => {
      const query = builder.appendToArray('new_item');
      expect(query).toBe(`UPDATE tasks SET metadata = (
        CASE
          WHEN metadata IS NULL OR metadata = 'null' THEN json_array('new_item')
          ELSE json_insert(metadata, '$[#]', 'new_item')
        END
      )`);
    });
  });

  describe('📄 JsonPerformanceMonitor', () => {
    let monitor: JsonPerformanceMonitor;

    beforeEach(() => {
      monitor = new JsonPerformanceMonitor();
    });

    test('should record operations', () => {
      monitor.recordOperation('parse', 10);
      monitor.recordOperation('stringify', 5);
      monitor.recordOperation('parse', 15);

      const stats = monitor.getStats();
      expect(stats.parse.count).toBe(2);
      expect(stats.parse.averageTime).toBe(12.5); // (10 + 15) / 2
      expect(stats.parse.totalTime).toBe(25);
      expect(stats.stringify.count).toBe(1);
      expect(stats.stringify.averageTime).toBe(5);
    });

    test('should reset stats', () => {
      monitor.recordOperation('parse', 10);
      monitor.reset();
      const stats = monitor.getStats();
      expect(Object.keys(stats)).toHaveLength(0);
    });

    test('should handle multiple operations', () => {
      for (let i = 0; i < 100; i++) {
        monitor.recordOperation('test', i);
      }

      const stats = monitor.getStats();
      expect(stats.test.count).toBe(100);
      expect(stats.test.averageTime).toBe(49.5); // Average of 0-99
      expect(stats.test.totalTime).toBe(4950); // Sum of 0-99
    });
  });

  describe('📄 Integration Tests', () => {
    test('should handle complex JSON operations', () => {
      const taskData = {
        dependencies: ['task1', 'task2'],
        deliverables: [
          { type: 'file', description: 'Component', location: '/src/component.ts' },
          { type: 'test', description: 'Unit tests', location: '/tests/' }
        ],
        metadata: {
          priority: 'high',
          tags: ['frontend', 'ui']
        }
      };

      // Test parsing and validation
      const jsonString = safeJsonStringify(taskData, '{}');
      const parsed = safeJsonParse(jsonString, {}) as typeof taskData;
      expect(parsed).toEqual(taskData);

      // Test schema validation
      const depsValidation = validateJsonSchema(
        safeJsonStringify(taskData.dependencies),
        CommonSchemas.TaskDependencies
      );
      expect(depsValidation.valid).toBe(true);

      // Test array operations on dependencies array specifically
      const depsString = safeJsonStringify(taskData.dependencies, '[]');
      const newDeps = jsonAddToArray(depsString, 'task3');
      const updatedDeps = safeJsonParse(newDeps, []) as string[];
      expect(updatedDeps).toContain('task3');

      const removedDeps = jsonRemoveFromArray(newDeps, 'task1');
      const finalDeps = safeJsonParse(removedDeps, []) as string[];
      expect(finalDeps).not.toContain('task1');
      expect(finalDeps).toContain('task2');
      expect(finalDeps).toContain('task3');
    });

    test('should handle edge cases gracefully', () => {
      // Test circular references (should fallback)
      const circular: any = { name: 'test' };
      circular.self = circular;
      const safeString = safeJsonStringify(circular, '{}');
      expect(safeString).toBe('{}');

      // Test malformed JSON
      const malformed = '{"key": "value",}'; // Trailing comma
      const parsed = safeJsonParse(malformed, { key: 'default' });
      expect(parsed).toEqual({ key: 'default' });

      // Test very deep nesting
      const deep = { level1: { level2: { level3: { level4: 'deep' } } } };
      const extracted = jsonExtract(JSON.stringify(deep), 'level1.level2.level3.level4');
      expect(extracted).toBe('deep');
    });
  });
});