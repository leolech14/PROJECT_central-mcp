# Model Detection System Troubleshooting Guide

## 🚨 Common Issues & Solutions

### Detection Accuracy Problems

#### Issue: Low Detection Accuracy (<80%)

**Symptoms:**
- Models consistently misidentified
- Wrong agent assignments
- High self-correction rate

**Diagnostic Steps:**
```bash
# Check recent detection accuracy
curl http://localhost:3000/api/detection/stats | jq '.accuracyRate'

# Review recent detections
curl http://localhost:3000/api/detection/events?range=24h | jq '.[] | {model: .detectedModel, confidence: .confidence, verified: .verified}'

# Check model performance metrics
curl http://localhost:3000/api/detection/performance | jq '.[] | select(.accuracy < 0.8)'
```

**Common Causes & Solutions:**

1. **Outdated Model Registry**
   ```bash
   # Check when model registry was last updated
   git log --oneline src/auto-proactive/ModelCapabilityVerifier.ts

   # Update model capabilities if needed
   # Edit ModelCapabilityVerifier.ts to add new models or update capabilities
   ```

2. **Configuration Parsing Issues**
   ```bash
   # Test configuration detection
   node -e "
   import { ActiveConfigurationDetector } from './src/auto-proactive/ActiveConfigurationDetector.js';
   const detector = new ActiveConfigurationDetector();
   detector.detectActiveConfiguration().then(console.log);
   "
   ```

3. **API Endpoint Changes**
   ```bash
   # Test model endpoints
   node -e "
   import { ModelCapabilityVerifier } from './src/auto-proactive/ModelCapabilityVerifier.js';
   const verifier = new ModelCapabilityVerifier();
   verifier.testModelEndpoint('https://api.openai.com/v1/models', config).then(console.log);
   "
   ```

#### Issue: Specific Model Consistently Misdentified

**Example**: GLM-4.6 identified as GPT-4

**Diagnostic Steps:**
```bash
# Check correction patterns for this model
sqlite3 data/registry.db "
SELECT * FROM correction_patterns
WHERE original_model LIKE '%glm%' OR corrected_to LIKE '%glm%'
ORDER BY frequency DESC;
"

# Check user feedback for this model
sqlite3 data/registry.db "
SELECT * FROM user_feedback
WHERE detected_model LIKE '%glm%' OR actual_model LIKE '%glm%'
ORDER BY timestamp DESC LIMIT 10;
"
```

**Solutions:**
1. **Update Model Registry**: Add/update GLM-4 in ModelCapabilityVerifier.ts
2. **Add Correction Pattern**: Create explicit correction rule in database
3. **Improve Configuration Detection**: Add GLM-specific detection logic

---

### Performance Issues

#### Issue: Slow Detection Performance (>500ms)

**Symptoms:**
- High average detection time
- Dashboard loading slowly
- Timeouts in detection API

**Diagnostic Steps:**
```bash
# Check performance metrics
curl http://localhost:3000/api/detection/monitoring | jq '.performance'

# Monitor cache performance
curl http://localhost:3000/api/detection/monitoring | jq '.performance.cacheHitRate'

# Check database performance
sqlite3 data/registry.db "
SELECT
  AVG(execution_time_ms) as avg_time,
  COUNT(*) as total_detections,
  MAX(execution_time_ms) as max_time
FROM enhanced_model_detections
WHERE timestamp > datetime('now', '-1 hour');
"
```

**Performance Optimization Solutions:**

1. **Cache Issues**
   ```bash
   # Warm up cache manually
   curl -X POST http://localhost:3000/api/detection/monitoring \
     -H "Content-Type: application/json" \
     -d '{"action": "warmup_cache"}'

   # Check cache statistics
   sqlite3 data/registry.db "
   SELECT * FROM cache_stats ORDER BY timestamp DESC LIMIT 1;
   "
   ```

2. **Database Optimization**
   ```bash
   # Check database indexes
   sqlite3 data/registry.db ".schema enhanced_model_detections"

   # Add missing indexes if needed
   sqlite3 data/registry.db "
   CREATE INDEX IF NOT EXISTS idx_enhanced_detections_timestamp
   ON enhanced_model_detections(timestamp);

   CREATE INDEX IF NOT EXISTS idx_enhanced_detections_model
   ON enhanced_model_detections(detected_model);
   "
   ```

3. **Configuration Overhead**
   ```bash
   # Test configuration detection performance
   time node -e "
   import { ActiveConfigurationDetector } from './src/auto-proactive/ActiveConfigurationDetector.js';
   const detector = new ActiveConfigurationDetector();
   detector.detectActiveConfiguration().then(() => process.exit(0));
   "
   ```

#### Issue: High Memory Usage (>200MB)

**Diagnostic Steps:**
```bash
# Check process memory usage
ps aux | grep central-mcp

# Monitor cache size
curl http://localhost:3000/api/detection/monitoring | jq '.performance.databasePerformance'

# Check memory growth pattern
watch -n 5 'ps aux | grep central-mcp | grep -v grep'
```

**Solutions:**
1. **Reduce Cache Size**
   ```typescript
   // In DetectionCache.ts configuration
   const cacheConfig = {
     maxSize: 25 * 1024 * 1024, // Reduce from 50MB to 25MB
     maxEntries: 500,           // Reduce from 1000 to 500
     defaultTTL: 300000         // Reduce from 5min to 5min
   };
   ```

2. **Increase Cleanup Frequency**
   ```typescript
   // In DetectionCache.ts
   this.config = {
     cleanupInterval: 30000, // Increase from 60s to 30s
     // ... other config
   };
   ```

---

### System Health Issues

#### Issue: System Status "Degraded" or "Critical"

**Symptoms:**
- Dashboard shows yellow/red status
- No recent detections
- Alert notifications

**Diagnostic Steps:**
```bash
# Check system health
curl http://localhost:3000/api/detection/monitoring | jq '.systemHealth'

# Check last detection time
sqlite3 data/registry.db "
SELECT MAX(timestamp) as last_detection
FROM enhanced_model_detections;
"

# Check agent sessions
sqlite3 data/registry.db "
SELECT agent_letter, agent_model, status, connected_at
FROM agent_sessions
WHERE status = 'ACTIVE';
"
```

**Recovery Procedures:**

1. **Restart Detection System**
   ```bash
   # Check if central-mcp process is running
   ps aux | grep central-mcp

   # Restart if needed
   pm2 restart central-mcp
   # or
   npm run start
   ```

2. **Verify Database Connectivity**
   ```bash
   # Test database connection
   sqlite3 data/registry.db "SELECT 1;"

   # Check database integrity
   sqlite3 data/registry.db "PRAGMA integrity_check;"
   ```

3. **Check Agent Discovery Loop**
   ```bash
   # Check loop logs
   tail -100 /tmp/central-mcp-final.log | grep -E "(AgentAutoDiscovery|Loop 1)"

   # Manually trigger agent discovery
   node -e "
   import { AgentAutoDiscoveryLoop } from './src/auto-proactive/AgentAutoDiscoveryLoop.js';
   const loop = new AgentAutoDiscoveryLoop(db);
   loop.execute();
   "
   ```

#### Issue: Missing Detection Events

**Symptoms:**
- No new detection events in dashboard
- Detection count not increasing
- Agent sessions not updating

**Diagnostic Steps:**
```bash
# Check loop execution logs
tail -100 /tmp/central-mcp-final.log | grep -E "(Loop|detection)"

# Check for errors in detection system
tail -100 /tmp/central-mcp-final.log | grep -i error

# Verify detection system is being called
sqlite3 data/registry.db "
SELECT COUNT(*) as count
FROM enhanced_model_detections
WHERE timestamp > datetime('now', '-1 hour');
"
```

**Solutions:**

1. **Check Auto-Discovery Loop Configuration**
   ```bash
   # Verify loop is configured correctly
   grep -A 10 -B 5 "AgentAutoDiscovery" src/auto-proactive/AgentAutoDiscoveryLoop.ts
   ```

2. **Verify Enhanced Detection System Integration**
   ```typescript
   // Ensure EnhancedModelDetectionSystem is being used
   // In AgentAutoDiscoveryLoop.ts, check for:
   this.enhancedModelDetectionSystem = new EnhancedModelDetectionSystem(db);
   ```

3. **Check Session Creation**
   ```bash
   # Monitor for new sessions
   watch -n 5 "sqlite3 data/registry.db 'SELECT COUNT(*) FROM agent_sessions WHERE connected_at > datetime(\"now\", \"-5 minutes\");'"
   ```

---

### Database Issues

#### Issue: Database Lock or Connection Issues

**Symptoms:**
- "Database is locked" errors
- Timeouts in database operations
- Inconsistent data

**Diagnostic Steps:**
```bash
# Check for database locks
lsof data/registry.db

# Check database connections
sqlite3 data/registry.db "PRAGMA busy_timeout;"

# Test write operations
sqlite3 data/registry.db "
INSERT INTO test_table (id, data) VALUES ('test', 'test_data');
DELETE FROM test_table WHERE id = 'test';
"
```

**Solutions:**

1. **Fix Database Lock**
   ```bash
   # Kill any processes holding locks
   sudo fuser -k data/registry.db

   # Restart database connection pool
   pm2 restart central-mcp
   ```

2. **Optimize Database Settings**
   ```sql
   -- In database initialization
   PRAGMA journal_mode = WAL;
   PRAGMA synchronous = NORMAL;
   PRAGMA busy_timeout = 30000;
   PRAGMA cache_size = 10000;
   ```

#### Issue: Missing or Corrupted Data

**Diagnostic Steps:**
```bash
# Check table integrity
sqlite3 data/registry.db "PRAGMA integrity_check;"

# Check for missing tables
sqlite3 data/registry.db ".tables"

# Verify data consistency
sqlite3 data/registry.db "
SELECT COUNT(*) FROM enhanced_model_detections;
SELECT COUNT(*) FROM detection_corrections;
SELECT COUNT(*) FROM user_feedback;
"
```

**Solutions:**

1. **Run Database Migration**
   ```bash
   # Re-run migration to fix schema
   sqlite3 data/registry.db < src/database/migrations/026_enhanced_model_detection.sql
   ```

2. **Repair Corrupted Data**
   ```bash
   # Export and reimport data if needed
   sqlite3 data/registry.db ".dump" > backup.sql
   sqlite3 new_registry.db < backup.sql
   mv new_registry.db data/registry.db
   ```

---

### Dashboard & Monitoring Issues

#### Issue: Dashboard Not Updating

**Symptoms:**
- Stale data in dashboard
- Charts not loading
- Real-time updates not working

**Diagnostic Steps:**
```bash
# Test API endpoints directly
curl http://localhost:3000/api/detection/stats
curl http://localhost:3000/api/detection/monitoring

# Test SSE stream
curl -N http://localhost:3000/api/detection/monitoring?stream=true

# Check browser console for JavaScript errors
```

**Solutions:**

1. **Fix API Endpoints**
   ```bash
   # Restart Next.js development server
   npm run dev

   # Clear Next.js cache
   rm -rf .next
   npm run dev
   ```

2. **Fix Real-Time Updates**
   ```bash
   # Check SSE connection limits
   curl -I http://localhost:3000/api/detection/monitoring?stream=true

   # Verify no connection leaks
   netstat -an | grep :3000 | grep ESTABLISHED | wc -l
   ```

#### Issue: Performance Monitoring Data Missing

**Diagnostic Steps:**
```bash
# Check if performance monitoring is enabled
grep -i performance src/auto-proactive/EnhancedModelDetectionSystem.ts

# Verify query metrics are being recorded
sqlite3 data/registry.db "
SELECT COUNT(*) as performance_records
FROM query_metrics
WHERE timestamp > datetime('now', '-1 hour');
"
```

**Solutions:**

1. **Enable Performance Monitoring**
   ```typescript
   // In configuration, ensure:
   const config = {
     queries: {
       enableOptimizations: true,
       cachePreparedStatements: true
     }
   };
   ```

---

## 🔧 Advanced Troubleshooting

### Manual System Diagnosis

**Complete System Health Check:**
```bash
#!/bin/bash
echo "=== Central-MCP Model Detection System Health Check ==="
echo

# 1. Process Status
echo "1. Process Status:"
ps aux | grep -E "(central-mcp|next)" | grep -v grep
echo

# 2. Database Health
echo "2. Database Health:"
sqlite3 data/registry.db "
SELECT
  'enhanced_model_detections' as table_name, COUNT(*) as count
FROM enhanced_model_detections
UNION ALL
SELECT
  'detection_corrections', COUNT(*)
FROM detection_corrections
UNION ALL
SELECT
  'user_feedback', COUNT(*)
FROM user_feedback;
"
echo

# 3. Recent Performance
echo "3. Recent Performance:"
curl -s http://localhost:3000/api/detection/monitoring | \
  jq '{systemHealth: .systemHealth, performance: .performance}'
echo

# 4. Cache Status
echo "4. Cache Status:"
curl -s http://localhost:3000/api/detection/monitoring | \
  jq '.performance.databasePerformance'
echo

# 5. Recent Errors
echo "5. Recent Errors:"
tail -100 /tmp/central-mcp-final.log | grep -i error | tail -5
echo

echo "=== Health Check Complete ==="
```

### Performance Profiling

**Profile Detection Performance:**
```bash
# Create performance test
cat > test_detection_performance.js << 'EOF'
import { performance } from 'perf_hooks';
import { EnhancedModelDetectionSystem } from './src/auto-proactive/EnhancedModelDetectionSystem.js';
import Database from 'better-sqlite3';

const db = new Database('data/registry.db');
const system = new EnhancedModelDetectionSystem(db);

async function profileDetection() {
  const iterations = 100;
  const times = [];

  console.log(`Running ${iterations} detection iterations...`);

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await system.detectCurrentModel(`test-session-${i}`);
    const end = performance.now();
    times.push(end - start);

    if (i % 10 === 0) {
      console.log(`Completed ${i}/${iterations} iterations`);
    }
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);

  console.log(`Performance Results:`);
  console.log(`Average: ${avgTime.toFixed(2)}ms`);
  console.log(`Min: ${minTime.toFixed(2)}ms`);
  console.log(`Max: ${maxTime.toFixed(2)}ms`);

  db.close();
}

profileDetection().catch(console.error);
EOF

node test_detection_performance.js
```

### Log Analysis

**Analyze Detection Patterns:**
```bash
# Extract detection events from logs
grep -E "(detected|identified)" /tmp/central-mcp-final.log | \
  tail -100 | \
  awk '{print $1, $2, $NF}' | \
  sort | uniq -c | sort -nr

# Find error patterns
grep -i error /tmp/central-mcp-final.log | \
  tail -50 | \
  awk -F'error:' '{print $2}' | \
  sort | uniq -c | sort -nr

# Monitor performance trends
grep -E "(execution_time|detection.*ms)" /tmp/central-mcp-final.log | \
  tail -100 | \
  awk '{print $NF}' | \
  sed 's/ms//' | \
  awk '{sum+=$1; count++} END {print "Average:", sum/count, "ms"}'
```

---

## 📞 Getting Help

### When to File an Issue

Create a GitHub issue if you encounter:

1. **Persistent Accuracy Issues**: Detection accuracy <70% for extended periods
2. **Performance Problems**: Consistent slow performance (>500ms)
3. **System Instability**: Frequent crashes or degraded status
4. **Bugs**: Unexpected behavior or error messages
5. **Feature Requests**: New functionality or improvements

### Issue Template

```markdown
## Issue Description
[Clear description of the problem]

## Environment
- Node.js version:
- Operating system:
- Browser (if applicable):
- Central-MCP version:

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happened]

## Logs
[Relevant log entries]

## Additional Context
[Any other relevant information]
```

### Emergency Contacts

For critical system issues:
- **Documentation**: This troubleshooting guide
- **Community**: Central-MCP development discussions
- **Monitoring**: Real-time dashboard at `http://localhost:3000/detection-dashboard`

---

**Last Updated**: 2025-10-13
**Version**: 1.0.0
**Maintainer**: Central-MCP Development Team