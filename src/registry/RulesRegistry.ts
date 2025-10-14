/**
 * Rules Registry (Coordination Rules Storage)
 * ============================================
 *
 * Manages coordination rules for multi-agent orchestration.
 * Provides CRUD operations for routing, dependency, priority, project, and capacity rules.
 */

import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';

export type RuleType = 'ROUTING' | 'DEPENDENCY' | 'PRIORITY' | 'PROJECT' | 'CAPACITY';
export type RulePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Rule {
  id?: number;
  type: RuleType;
  name: string;
  condition?: Record<string, any>;
  action?: Record<string, any>;
  priority: RulePriority;
  enabled: boolean;
  created_at?: number;
  updated_at?: number;
}

export class RulesRegistry {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('ROUTING', 'DEPENDENCY', 'PRIORITY', 'PROJECT', 'CAPACITY')),
        name TEXT NOT NULL,
        condition TEXT,
        action TEXT,
        priority TEXT NOT NULL CHECK(priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_rules_type ON rules(type);
      CREATE INDEX IF NOT EXISTS idx_rules_priority ON rules(priority);
      CREATE INDEX IF NOT EXISTS idx_rules_enabled ON rules(enabled);
    `);

    // Insert default rules if table is empty
    const count = this.db.prepare('SELECT COUNT(*) as count FROM rules').get() as { count: number };
    if (count.count === 0) {
      this.insertDefaultRules();
    }

    logger.info('✅ Rules Registry schema initialized');
  }

  private insertDefaultRules(): void {
    const defaultRules: Omit<Rule, 'id' | 'created_at' | 'updated_at'>[] = [
      {
        type: 'ROUTING',
        name: 'UI tasks → Agent A',
        condition: { task_type: 'UI', component: '*' },
        action: { route_to: 'A' },
        priority: 'HIGH',
        enabled: true
      },
      {
        type: 'ROUTING',
        name: 'Design tasks → Agent B',
        condition: { task_type: 'DESIGN', domain: 'system' },
        action: { route_to: 'B' },
        priority: 'HIGH',
        enabled: true
      },
      {
        type: 'ROUTING',
        name: 'Backend tasks → Agent C',
        condition: { task_type: 'BACKEND', service: '*' },
        action: { route_to: 'C' },
        priority: 'HIGH',
        enabled: true
      },
      {
        type: 'ROUTING',
        name: 'Integration tasks → Agent D',
        condition: { task_type: 'INTEGRATION', platform: '*' },
        action: { route_to: 'D' },
        priority: 'HIGH',
        enabled: true
      },
      {
        type: 'DEPENDENCY',
        name: 'T004 blocks T011',
        condition: { task_id: 'T011', depends_on: 'T004' },
        action: { block_until: 'T004_complete' },
        priority: 'CRITICAL',
        enabled: true
      },
      {
        type: 'DEPENDENCY',
        name: 'T011 blocks T014',
        condition: { task_id: 'T014', depends_on: 'T011' },
        action: { block_until: 'T011_complete' },
        priority: 'CRITICAL',
        enabled: true
      },
      {
        type: 'PRIORITY',
        name: 'Critical tasks first',
        condition: { priority: 'CRITICAL' },
        action: { boost: 100 },
        priority: 'CRITICAL',
        enabled: true
      },
      {
        type: 'PRIORITY',
        name: 'High priority boost',
        condition: { priority: 'HIGH' },
        action: { boost: 50 },
        priority: 'HIGH',
        enabled: true
      },
      {
        type: 'PROJECT',
        name: 'Max 2 projects per agent',
        condition: { agent: '*', project_count: { $gt: 2 } },
        action: { deny: true, reason: 'Agent overloaded' },
        priority: 'MEDIUM',
        enabled: true
      },
      {
        type: 'PROJECT',
        name: 'LocalBrain priority agents',
        condition: { project: 'LocalBrain', agent: { $in: ['A', 'B', 'C', 'D'] } },
        action: { allow: true },
        priority: 'HIGH',
        enabled: true
      },
      {
        type: 'CAPACITY',
        name: 'GLM-4.6 200K context limit',
        condition: { model: 'glm-4-flash', context_usage: { $gt: 180000 } },
        action: { warn: true, message: 'Approaching context limit' },
        priority: 'MEDIUM',
        enabled: true
      },
      {
        type: 'CAPACITY',
        name: 'Sonnet-4.5 200K context limit',
        condition: { model: 'sonnet-4.5', context_usage: { $gt: 180000 } },
        action: { warn: true, message: 'Approaching context limit' },
        priority: 'MEDIUM',
        enabled: true
      }
    ];

    for (const rule of defaultRules) {
      this.createRule(rule);
    }

    logger.info(`📋 Inserted ${defaultRules.length} default coordination rules`);
  }

  /**
   * Get all rules
   */
  getAllRules(): Rule[] {
    const stmt = this.db.prepare('SELECT * FROM rules ORDER BY priority DESC, created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map(this.rowToRule);
  }

  /**
   * Get rules by type
   */
  getRulesByType(type: RuleType): Rule[] {
    const stmt = this.db.prepare('SELECT * FROM rules WHERE type = ? ORDER BY priority DESC');
    const rows = stmt.all(type) as any[];
    return rows.map(this.rowToRule);
  }

  /**
   * Get enabled rules
   */
  getEnabledRules(): Rule[] {
    const stmt = this.db.prepare('SELECT * FROM rules WHERE enabled = 1 ORDER BY priority DESC');
    const rows = stmt.all() as any[];
    return rows.map(this.rowToRule);
  }

  /**
   * Get rule by ID
   */
  getRule(id: number): Rule | null {
    const stmt = this.db.prepare('SELECT * FROM rules WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.rowToRule(row) : null;
  }

  /**
   * Create rule
   */
  createRule(rule: Omit<Rule, 'id' | 'created_at' | 'updated_at'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO rules (type, name, condition, action, priority, enabled)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      rule.type,
      rule.name,
      rule.condition ? JSON.stringify(rule.condition) : null,
      rule.action ? JSON.stringify(rule.action) : null,
      rule.priority,
      rule.enabled ? 1 : 0
    );

    logger.info(`📝 Created rule: ${rule.name} (ID: ${result.lastInsertRowid})`);
    return result.lastInsertRowid as number;
  }

  /**
   * Update rule
   */
  updateRule(id: number, updates: Partial<Omit<Rule, 'id' | 'created_at'>>): boolean {
    const rule = this.getRule(id);
    if (!rule) {
      logger.warn(`⚠️ Rule not found: ${id}`);
      return false;
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.type !== undefined) {
      fields.push('type = ?');
      values.push(updates.type);
    }
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.condition !== undefined) {
      fields.push('condition = ?');
      values.push(JSON.stringify(updates.condition));
    }
    if (updates.action !== undefined) {
      fields.push('action = ?');
      values.push(JSON.stringify(updates.action));
    }
    if (updates.priority !== undefined) {
      fields.push('priority = ?');
      values.push(updates.priority);
    }
    if (updates.enabled !== undefined) {
      fields.push('enabled = ?');
      values.push(updates.enabled ? 1 : 0);
    }

    if (fields.length === 0) {
      logger.warn(`⚠️ No fields to update for rule ${id}`);
      return false;
    }

    fields.push('updated_at = ?');
    values.push(Math.floor(Date.now() / 1000));

    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE rules
      SET ${fields.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);
    logger.info(`✅ Updated rule: ${id}`);
    return true;
  }

  /**
   * Delete rule
   */
  deleteRule(id: number): boolean {
    const rule = this.getRule(id);
    if (!rule) {
      logger.warn(`⚠️ Rule not found: ${id}`);
      return false;
    }

    const stmt = this.db.prepare('DELETE FROM rules WHERE id = ?');
    stmt.run(id);

    logger.info(`🗑️ Deleted rule: ${rule.name} (ID: ${id})`);
    return true;
  }

  /**
   * Toggle rule enabled status
   */
  toggleRule(id: number): boolean {
    const rule = this.getRule(id);
    if (!rule) {
      logger.warn(`⚠️ Rule not found: ${id}`);
      return false;
    }

    const newStatus = !rule.enabled;
    return this.updateRule(id, { enabled: newStatus });
  }

  /**
   * Convert database row to Rule object
   */
  private rowToRule(row: any): Rule {
    return {
      id: row.id,
      type: row.type as RuleType,
      name: row.name,
      condition: row.condition ? JSON.parse(row.condition) : undefined,
      action: row.action ? JSON.parse(row.action) : undefined,
      priority: row.priority as RulePriority,
      enabled: row.enabled === 1,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}
