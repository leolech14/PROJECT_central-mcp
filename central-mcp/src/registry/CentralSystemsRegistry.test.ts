/**
 * 🧪 TESTS: CENTRAL SYSTEMS REGISTRY
 * ===================================
 *
 * Comprehensive tests for the Central Systems Registry - the single source
 * of truth for all Central-MCP systems, components, and integration status.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CentralSystemsRegistry, SystemCategory, SystemStatus, ConfidenceLevel } from './CentralSystemsRegistry.js';
import { TestUtils } from '../tests/setup.js';

describe('🏛️ Central Systems Registry', () => {
  let registry: CentralSystemsRegistry;

  beforeEach(() => {
    registry = CentralSystemsRegistry.getInstance();
    // Clear any existing systems for clean test
    (registry as any).systems.clear();
  });

  afterEach(async () => {
    // Cleanup
    (registry as any).systems.clear();
  });

  describe('🔍 System Registration', () => {
    test('should register a new system', () => {
      const system = {
        id: 'test-system',
        name: 'Test System',
        category: SystemCategory.CORE,
        version: '1.0.0',
        status: SystemStatus.ACTIVE,
        confidence: ConfidenceLevel.VERIFIED,
        integrated: true,
        globalAccess: false,
        dependencies: [],
        dependents: [],
        location: 'test/location',
        interfaces: ['test()'],
        configuration: {},
        description: 'Test system for registry',
        purpose: 'Testing registry functionality',
        lastUpdated: new Date(),
        tags: ['test'],
        health: {
          status: 'healthy' as const,
          lastCheck: new Date()
        },
        agentAccess: {
          canQuery: true,
          canUse: false,
          requiredPermissions: ['test.read']
        }
      };

      registry.registerSystem(system);

      const retrieved = registry.getSystem('test-system');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test System');
      expect(retrieved?.category).toBe(SystemCategory.CORE);
    });

    test('should prevent duplicate system registration', () => {
      const system = {
        id: 'duplicate-test',
        name: 'Duplicate Test',
        category: SystemCategory.CORE,
        version: '1.0.0',
        status: SystemStatus.ACTIVE,
        confidence: ConfidenceLevel.VERIFIED,
        integrated: true,
        globalAccess: false,
        dependencies: [],
        dependents: [],
        location: 'test/location',
        interfaces: ['test()'],
        configuration: {},
        description: 'Test system for duplicate prevention',
        purpose: 'Testing duplicate prevention',
        lastUpdated: new Date(),
        tags: ['test'],
        health: {
          status: 'healthy' as const,
          lastCheck: new Date()
        },
        agentAccess: {
          canQuery: true,
          canUse: false,
          requiredPermissions: ['test.read']
        }
      };

      registry.registerSystem(system);
      registry.registerSystem(system); // Should overwrite

      const systems = registry.querySystems({ search: 'duplicate-test' });
      expect(systems).toHaveLength(1); // Only one system should exist
    });
  });

  describe('🔍 System Querying', () => {
    beforeEach(() => {
      // Register test systems
      const systems = [
        {
          id: 'core-system-1',
          name: 'Core System 1',
          category: SystemCategory.CORE,
          version: '1.0.0',
          status: SystemStatus.ACTIVE,
          confidence: ConfidenceLevel.VERIFIED,
          integrated: true,
          globalAccess: false,
          dependencies: [],
          dependents: [],
          location: 'test/location',
          interfaces: ['test()'],
          configuration: {},
          description: 'Test core system',
          purpose: 'Core functionality',
          lastUpdated: new Date(),
          tags: ['core', 'test'],
          health: {
            status: 'healthy' as const,
            lastCheck: new Date()
          },
          agentAccess: {
            canQuery: true,
            canUse: false,
            requiredPermissions: ['core.read']
          }
        },
        {
          id: 'database-system-1',
          name: 'Database System 1',
          category: SystemCategory.DATABASE,
          version: '1.0.0',
          status: SystemStatus.ACTIVE,
          confidence: ConfidenceLevel.HIGH,
          integrated: true,
          globalAccess: true,
          dependencies: [],
          dependents: [],
          location: 'test/location',
          interfaces: ['test()'],
          configuration: {},
          description: 'Test database system',
          purpose: 'Database operations',
          lastUpdated: new Date(),
          tags: ['database', 'test'],
          health: {
            status: 'healthy' as const,
            lastCheck: new Date()
          },
          agentAccess: {
            canQuery: true,
            canUse: true,
            requiredPermissions: ['database.use']
          }
        },
        {
          id: 'legacy-system-1',
          name: 'Legacy System 1',
          category: SystemCategory.LEGACY,
          version: '0.9.0',
          status: SystemStatus.DISABLED,
          confidence: ConfidenceLevel.LOW,
          integrated: false,
          globalAccess: false,
          dependencies: [],
          dependents: [],
          location: 'test/location',
          interfaces: ['test()'],
          configuration: {},
          description: 'Test legacy system',
          purpose: 'Legacy functionality',
          lastUpdated: new Date(),
          tags: ['legacy', 'test'],
          health: {
            status: 'disabled' as const,
            lastCheck: new Date()
          },
          agentAccess: {
            canQuery: false,
            canUse: false,
            requiredPermissions: []
          }
        }
      ];

      systems.forEach(system => registry.registerSystem(system));
    });

    test('should query all systems', () => {
      const systems = registry.querySystems();
      expect(systems).toHaveLength(3);
    });

    test('should query by category', () => {
      const coreSystems = registry.querySystems({ category: SystemCategory.CORE });
      expect(coreSystems).toHaveLength(1);
      expect(coreSystems[0].id).toBe('core-system-1');

      const dbSystems = registry.querySystems({ category: SystemCategory.DATABASE });
      expect(dbSystems).toHaveLength(1);
      expect(dbSystems[0].id).toBe('database-system-1');
    });

    test('should query by status', () => {
      const activeSystems = registry.querySystems({ status: SystemStatus.ACTIVE });
      expect(activeSystems).toHaveLength(2);

      const disabledSystems = registry.querySystems({ status: SystemStatus.DISABLED });
      expect(disabledSystems).toHaveLength(1);
      expect(disabledSystems[0].id).toBe('legacy-system-1');
    });

    test('should query by confidence level', () => {
      const verifiedSystems = registry.querySystems({ confidence: ConfidenceLevel.VERIFIED });
      expect(verifiedSystems).toHaveLength(1);
      expect(verifiedSystems[0].id).toBe('core-system-1');

      const highSystems = registry.querySystems({ confidence: ConfidenceLevel.HIGH });
      expect(highSystems).toHaveLength(1);
      expect(highSystems[0].id).toBe('database-system-1');
    });

    test('should query by integration status', () => {
      const integratedSystems = registry.querySystems({ integrated: true });
      expect(integratedSystems).toHaveLength(2);

      const nonIntegratedSystems = registry.querySystems({ integrated: false });
      expect(nonIntegratedSystems).toHaveLength(1);
      expect(nonIntegratedSystems[0].id).toBe('legacy-system-1');
    });

    test('should query by search term', () => {
      const coreResults = registry.querySystems({ search: 'core' });
      expect(coreResults).toHaveLength(1);
      expect(coreResults[0].id).toBe('core-system-1');

      const testResults = registry.querySystems({ search: 'test' });
      expect(testResults).toHaveLength(3); // All systems have 'test' tag
    });

    test('should query by tags', () => {
      const coreTagResults = registry.querySystems({ tags: ['core'] });
      expect(coreTagResults).toHaveLength(1);
      expect(coreTagResults[0].id).toBe('core-system-1');

      const testTagResults = registry.querySystems({ tags: ['test'] });
      expect(testTagResults).toHaveLength(3); // All systems have 'test' tag
    });

    test('should query by agent accessibility', () => {
      const agentAccessible = registry.querySystems({ agentAccessible: true });
      expect(agentAccessible).toHaveLength(2); // core and database systems
    });

    test('should combine multiple filters', () => {
      const filtered = registry.querySystems({
        category: SystemCategory.CORE,
        status: SystemStatus.ACTIVE,
        confidence: ConfidenceLevel.VERIFIED,
        integrated: true,
        agentAccessible: true,
        tags: ['test']
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('core-system-1');
    });
  });

  describe('📊 Registry Statistics', () => {
    beforeEach(() => {
      // Register test systems for statistics
      const systems = [
        {
          id: 'stats-system-1',
          name: 'Stats System 1',
          category: SystemCategory.CORE,
          version: '1.0.0',
          status: SystemStatus.ACTIVE,
          confidence: ConfidenceLevel.VERIFIED,
          integrated: true,
          globalAccess: false,
          dependencies: [],
          dependents: [],
          location: 'test/location',
          interfaces: ['test()'],
          configuration: {},
          description: 'Test system for stats',
          purpose: 'Statistics testing',
          lastUpdated: new Date(),
          tags: ['stats', 'test'],
          health: {
            status: 'healthy' as const,
            lastCheck: new Date()
          },
          agentAccess: {
            canQuery: true,
            canUse: false,
            requiredPermissions: ['stats.read']
          }
        },
        {
          id: 'stats-system-2',
          name: 'Stats System 2',
          category: SystemCategory.DATABASE,
          version: '1.0.0',
          status: SystemStatus.INTEGRATED,
          confidence: ConfidenceLevel.HIGH,
          integrated: true,
          globalAccess: true,
          dependencies: [],
          dependents: [],
          location: 'test/location',
          interfaces: ['test()'],
          configuration: {},
          description: 'Test system for stats 2',
          purpose: 'Statistics testing 2',
          lastUpdated: new Date(),
          tags: ['stats', 'test'],
          health: {
            status: 'degraded' as const,
            lastCheck: new Date()
          },
          agentAccess: {
            canQuery: true,
            canUse: true,
            requiredPermissions: ['database.use']
          }
        },
        {
          id: 'stats-system-3',
          name: 'Stats System 3',
          category: SystemCategory.LEGACY,
          version: '0.9.0',
          status: SystemStatus.ERROR,
          confidence: ConfidenceLevel.LOW,
          integrated: false,
          globalAccess: false,
          dependencies: [],
          dependents: [],
          location: 'test/location',
          interfaces: ['test()'],
          configuration: {},
          description: 'Test system for stats 3',
          purpose: 'Statistics testing 3',
          lastUpdated: new Date(),
          tags: ['stats', 'test'],
          health: {
            status: 'unhealthy' as const,
            lastCheck: new Date()
          },
          agentAccess: {
            canQuery: false,
            canUse: false,
            requiredPermissions: []
          }
        }
      ];

      systems.forEach(system => registry.registerSystem(system));
    });

    test('should calculate correct statistics', () => {
      const stats = registry.getRegistryStats();

      expect(stats.totalSystems).toBe(3);
      expect(stats.activeSystems).toBe(1);
      expect(stats.integratedSystems).toBe(2);
      expect(stats.averageConfidence).toBeGreaterThan(70); // Average of 100, 90, 60
      expect(stats.systemsByCategory[SystemCategory.CORE]).toBe(1);
      expect(stats.systemsByCategory[SystemCategory.DATABASE]).toBe(1);
      expect(stats.systemsByCategory[SystemCategory.LEGACY]).toBe(1);
      expect(stats.healthDistribution.healthy).toBe(1);
      expect(stats.healthDistribution.degraded).toBe(1);
      expect(stats.healthDistribution.unhealthy).toBe(1);
    });
  });

  describe('🔍 Agent Interface Methods', () => {
    beforeEach(() => {
      // Register test systems for agent interface
      const systems = [
        {
          id: 'agent-system-1',
          name: 'Agent System 1',
          category: SystemCategory.CORE,
          version: '1.0.0',
          status: SystemStatus.ACTIVE,
          confidence: ConfidenceLevel.VERIFIED,
          integrated: true,
          globalAccess: false,
          dependencies: [],
          dependents: [],
          location: 'test/location',
          interfaces: ['test()'],
          configuration: {},
          description: 'Test system for agent',
          purpose: 'Agent interface testing',
          lastUpdated: new Date(),
          tags: ['agent', 'test'],
          health: {
            status: 'healthy' as const,
            lastCheck: new Date()
          },
          agentAccess: {
            canQuery: true,
            canUse: true,
            requiredPermissions: ['agent.use'],
            usageInstructions: 'Use via agent interface'
          }
        },
        {
          id: 'agent-system-2',
          name: 'Agent System 2',
          category: SystemCategory.DATABASE,
          version: '1.0.0',
          status: SystemStatus.ACTIVE,
          confidence: ConfidenceLevel.HIGH,
          integrated: true,
          globalAccess: true,
          dependencies: [],
          dependents: [],
          location: 'test/location',
          interfaces: ['test()'],
          configuration: {},
          description: 'Test system for agent 2',
          purpose: 'Agent interface testing 2',
          lastUpdated: new Date(),
          tags: ['agent', 'test'],
          health: {
            status: 'healthy' as const,
            lastCheck: new Date()
          },
          agentAccess: {
            canQuery: true,
            canUse: true,
            requiredPermissions: ['agent.use'],
            usageInstructions: 'Use via global interface'
          }
        }
      ];

      systems.forEach(system => registry.registerSystem(system));
    });

    test('should check if system exists', () => {
      expect(registry.systemExists('agent-system-1')).toBe(true);
      expect(registry.systemExists('non-existent')).toBe(false);
    });

    test('should allow feature creation when no conflicts', () => {
      const analysis = registry.canCreateFeature('brand new innovative feature');

      expect(analysis.allowed).toBe(true);
      expect(analysis.existingSystems).toHaveLength(0);
      expect(analysis.recommendations).toContain('Register new system in Central Systems Registry');
    });

    test('should prevent feature creation when similar systems exist', () => {
      const analysis = registry.canCreateFeature('agent system for testing');

      expect(analysis.allowed).toBe(false);
      expect(analysis.existingSystems.length).toBeGreaterThan(0);
      expect(analysis.recommendations).toContain('Use existing system instead of creating duplicate');
    });

    test('should provide agent-accessible systems', () => {
      const accessible = registry.getAvailableSystemsForAgent();

      expect(accessible.total).toBe(2);
      expect(accessible.systems).toHaveLength(2);
      expect(accessible.systems.every(s => s.canUse)).toBe(true);
      expect(accessible.categories).toBeDefined();
    });
  });

  describe('🔄 Registry Operations', () => {
    test('should refresh registry', async () => {
      const system = {
        id: 'refresh-test',
        name: 'Refresh Test',
        category: SystemCategory.CORE,
        version: '1.0.0',
        status: SystemStatus.ACTIVE,
        confidence: ConfidenceLevel.VERIFIED,
        integrated: true,
        globalAccess: false,
        dependencies: [],
        dependents: [],
        location: 'test/location',
        interfaces: ['test()'],
        configuration: {},
        description: 'Test system for refresh',
        purpose: 'Testing refresh functionality',
        lastUpdated: new Date(),
        tags: ['refresh', 'test'],
        health: {
          status: 'healthy' as const,
          lastCheck: new Date()
        },
        agentAccess: {
          canQuery: true,
          canUse: false,
          requiredPermissions: ['refresh.read']
        }
      };

      registry.registerSystem(system);
      expect(registry.getSystem('refresh-test')).toBeDefined();

      await registry.refresh();
      expect(registry.getSystem('refresh-test')).toBeNull(); // Should be cleared
    });

    test('should export registry data', () => {
      const system = {
        id: 'export-test',
        name: 'Export Test',
        category: SystemCategory.CORE,
        version: '1.0.0',
        status: SystemStatus.ACTIVE,
        confidence: ConfidenceLevel.VERIFIED,
        integrated: true,
        globalAccess: false,
        dependencies: [],
        dependents: [],
        location: 'test/location',
        interfaces: ['test()'],
        configuration: {},
        description: 'Test system for export',
        purpose: 'Testing export functionality',
        lastUpdated: new Date(),
        tags: ['export', 'test'],
        health: {
          status: 'healthy' as const,
          lastCheck: new Date()
        },
        agentAccess: {
          canQuery: true,
          canUse: false,
          requiredPermissions: ['export.read']
        }
      };

      registry.registerSystem(system);
      const exported = registry.exportRegistry();

      expect(exported.version).toBe('1.0.0');
      expect(exported.systems).toHaveLength(1);
      expect(exported.stats).toBeDefined();
      expect(exported.exported).toBeInstanceOf(Date);
    });
  });
});