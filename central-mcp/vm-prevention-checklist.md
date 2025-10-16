# VM Prevention Checklist - Central-MCP Service Stability

**Created:** 2025-10-16
**Purpose:** Prevent future Central-MCP service crashes and outages
**Target:** Zero-downtime deployments and 99.9% uptime

---

## 🎯 OVERVIEW

This checklist implements safeguards to prevent the type of crash that occurred on 2025-10-16, caused by incomplete migration to PHOTON architecture with TypeScript compilation errors.

---

## 🔒 PRE-DEPLOYMENT SAFEGUARDS

### 1. Code Quality Gates

**Must Pass Before Any Deployment:**

```bash
#!/bin/bash
# pre-deploy-check.sh - Mandatory validation script

echo "🔍 Running pre-deployment validation..."

# 1. TypeScript compilation
echo "📝 Checking TypeScript compilation..."
if ! npm run build; then
    echo "❌ BUILD FAILED - Cannot deploy"
    echo "Fix TypeScript errors before deploying"
    exit 1
fi
echo "✅ TypeScript compilation successful"

# 2. Unit tests
echo "🧪 Running unit tests..."
if ! npm test; then
    echo "❌ TESTS FAILED - Cannot deploy"
    echo "Fix failing tests before deploying"
    exit 1
fi
echo "✅ All tests passing"

# 3. Linting
echo "🔧 Running linter..."
if ! npm run lint; then
    echo "❌ LINTING FAILED - Cannot deploy"
    echo "Fix linting errors before deploying"
    exit 1
fi
echo "✅ Code passes linting"

# 4. Environment validation
echo "⚙️ Validating environment files..."
if [ ! -f ".env.production" ]; then
    echo "❌ MISSING .env.production - Cannot deploy"
    exit 1
fi

# Check required environment variables
required_vars=("PHOTON_PORT" "NODE_ENV" "PHOTON_DB_PATH")
for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env.production; then
        echo "❌ MISSING ${var} in .env.production"
        exit 1
    fi
done
echo "✅ Environment validation successful"

# 5. Entry point validation
echo "📂 Validating entry points..."
if [ ! -f "dist/photon/PhotonServer.js" ]; then
    echo "❌ MISSING dist/photon/PhotonServer.js - Build incomplete"
    exit 1
fi
echo "✅ Entry points validated"

echo "🎉 ALL CHECKS PASSED - Ready to deploy"
exit 0
```

### 2. Build Verification Script

```bash
#!/bin/bash
# verify-build.sh - Comprehensive build verification

echo "🔨 Verifying build completeness..."

# 1. Check dist directory
if [ ! -d "dist" ]; then
    echo "❌ No dist directory found"
    exit 1
fi

# 2. Check critical files
critical_files=(
    "dist/photon/PhotonServer.js"
    "dist/photon/PhotonCore.js"
    "dist/photon/PhotonAPI.js"
    "dist/photon/PhotonIntegrations.js"
)

for file in "${critical_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing critical file: $file"
        exit 1
    fi
done

# 3. Check file sizes (ensure they're not empty)
for file in "${critical_files[@]}"; do
    if [ ! -s "$file" ]; then
        echo "❌ Critical file is empty: $file"
        exit 1
    fi
done

echo "✅ Build verification successful"
```

### 3. Environment Validation

```bash
#!/bin/bash
# validate-environment.sh - Environment validation

echo "⚙️ Validating production environment..."

# 1. Check .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file missing"
    exit 1
fi

# 2. Load and validate environment
source .env.production

# 3. Check required variables
validate_var() {
    local var_name="$1"
    local var_value="${!var_name}"

    if [ -z "$var_value" ]; then
        echo "❌ Environment variable $var_name is not set"
        exit 1
    fi
    echo "✅ $var_name = $var_value"
}

validate_var "NODE_ENV"
validate_var "PHOTON_PORT"
validate_var "PHOTON_DB_PATH"

# 4. Validate port number
if ! [[ "$PHOTON_PORT" =~ ^[0-9]+$ ]] || [ "$PHOTON_PORT" -lt 1 ] || [ "$PHOTON_PORT" -gt 65535 ]; then
    echo "❌ Invalid PHOTON_PORT: $PHOTON_PORT"
    exit 1
fi

# 5. Validate NODE_ENV
if [[ ! "$NODE_ENV" =~ ^(development|production|test)$ ]]; then
    echo "❌ Invalid NODE_ENV: $NODE_ENV"
    exit 1
fi

echo "✅ Environment validation successful"
```

---

## 🚀 DEPLOYMENT PIPELINE SAFEGUARDS

### 1. Staging Environment Requirement

**Never deploy directly to production without staging:**

```bash
#!/bin/bash
# deploy-with-staging.sh - Safe deployment pipeline

echo "🚀 Starting safe deployment pipeline..."

# 1. Deploy to staging first
echo "📋 Step 1: Deploying to staging..."
./scripts/deploy-to-staging.sh

# 2. Wait for staging to be ready
echo "⏳ Step 2: Waiting for staging to be ready..."
sleep 30

# 3. Health check staging
echo "🏥 Step 3: Health checking staging..."
if ! curl -s http://staging-central-mcp:3000/health > /dev/null; then
    echo "❌ Staging health check failed"
    echo "DO NOT PROCEED TO PRODUCTION"
    exit 1
fi

# 4. Run integration tests on staging
echo "🧪 Step 4: Running integration tests on staging..."
if ! npm run test:integration -- --env=staging; then
    echo "❌ Integration tests failed on staging"
    echo "DO NOT PROCEED TO PRODUCTION"
    exit 1
fi

# 5. Only then deploy to production
echo "🎯 Step 5: Deploying to production..."
./scripts/deploy-to-production.sh

echo "✅ Deployment pipeline completed successfully"
```

### 2. Blue-Green Deployment Strategy

```bash
#!/bin/bash
# blue-green-deploy.sh - Zero-downtime deployment

echo "🔄 Starting blue-green deployment..."

# Configuration
BLUE_PORT=3000
GREEN_PORT=3001
HEALTH_CHECK_TIMEOUT=300

# 1. Check current active version
if curl -s http://localhost:$BLUE_PORT/health > /dev/null; then
    CURRENT="blue"
    NEW="green"
    CURRENT_PORT=$BLUE_PORT
    NEW_PORT=$GREEN_PORT
else
    CURRENT="green"
    NEW="blue"
    CURRENT_PORT=$GREEN_PORT
    NEW_PORT=$BLUE_PORT
fi

echo "📍 Current active: $CURRENT (port $CURRENT_PORT)"
echo "🎯 Deploying new version to: $NEW (port $NEW_PORT)"

# 2. Deploy new version to inactive environment
echo "📦 Deploying to $NEW environment..."
# Copy files to new environment
rsync -av --exclude='.git' --exclude='node_modules' \
    ./ /opt/central-mcp-$NEW/

# 3. Start new version on different port
cd /opt/central-mcp-$NEW
PHOTON_PORT=$NEW_PORT NODE_ENV=production nohup node dist/photon/PhotonServer.js > /tmp/central-mcp-$NEW.log 2>&1 &

# 4. Health check new version
echo "🏥 Health checking $NEW environment..."
for i in $(seq 1 $HEALTH_CHECK_TIMEOUT); do
    if curl -s http://localhost:$NEW_PORT/health > /dev/null; then
        echo "✅ $NEW environment is healthy"
        break
    fi
    if [ $i -eq $HEALTH_CHECK_TIMEOUT ]; then
        echo "❌ $NEW environment failed health check"
        # Kill new version
        pkill -f "PHOTON_PORT=$NEW_PORT"
        exit 1
    fi
    sleep 1
done

# 5. Switch traffic to new version
echo "🔄 Switching traffic to $NEW environment..."
# Update load balancer or reverse proxy
# This depends on your infrastructure

# 6. Stop old version
echo "🛑 Stopping old $CURRENT environment..."
pkill -f "PHOTON_PORT=$CURRENT_PORT"

# 7. Update symlink
ln -sfn /opt/central-mcp-$NEW /opt/central-mcp

echo "✅ Blue-green deployment completed successfully"
```

### 3. Automated Rollback on Failure

```bash
#!/bin/bash
# deploy-with-auto-rollback.sh - Deployment with automatic rollback

DEPLOY_LOG="/tmp/deploy-$(date +%Y%m%d-%H%M%S).log"
ROLLBACK_TRIGGERED=false

# Function to trigger rollback
rollback() {
    if [ "$ROLLBACK_TRIGGERED" = false ]; then
        echo "🚨 TRIGGERING AUTOMATIC ROLLBACK..."
        ROLLBACK_TRIGGERED=true

        # Get last known good commit
        LAST_GOOD=$(git tag -l "last-good-*" --sort=-version:refname | head -1 | cut -d'-' -f2-)

        if [ -n "$LAST_GOOD" ]; then
            echo "📦 Rolling back to commit: $LAST_GOOD"
            git checkout $LAST_GOOD
            npm run build
            sudo systemctl restart central-mcp

            # Wait for rollback to complete
            sleep 30

            # Verify rollback success
            if curl -s http://localhost:3000/health > /dev/null; then
                echo "✅ Rollback successful"
            else
                echo "❌ Rollback failed - MANUAL INTERVENTION REQUIRED"
            fi
        else
            echo "❌ No known good commit found - MANUAL INTERVENTION REQUIRED"
        fi
    fi
}

# Set trap for any script failure
trap rollback ERR

echo "🚀 Starting deployment with automatic rollback protection..."

# 1. Pre-deployment checks
./scripts/pre-deploy-check.sh

# 2. Create backup of current working version
git tag "last-good-$(date +%Y%m%d-%H%M%S)"

# 3. Deploy new version
echo "📦 Deploying new version..."
# Your deployment commands here

# 4. Health check with timeout
echo "🏥 Health checking new deployment..."
for i in {1..60}; do
    if curl -s http://localhost:3000/health > /dev/null; then
        echo "✅ New deployment is healthy"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "❌ Health check failed after 60 seconds"
        rollback
        exit 1
    fi
    sleep 1
done

# 5. Run smoke tests
echo "💨 Running smoke tests..."
if ! npm run test:smoke; then
    echo "❌ Smoke tests failed"
    rollback
    exit 1
fi

echo "✅ Deployment completed successfully - No rollback needed"
```

---

## 🔍 MONITORING AND ALERTING

### 1. Service Health Monitoring

```bash
#!/bin/bash
# service-monitor.sh - Continuous service monitoring

ALERT_EMAIL="admin@centralmcp.net"
SERVICE_URL="http://localhost:3000/health"
LOG_FILE="/var/log/central-mcp-monitor.log"
ALERT_THRESHOLD=3  # Alert after 3 consecutive failures

FAILURE_COUNT=0

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

    if curl -s "$SERVICE_URL" > /dev/null; then
        echo "[$TIMESTAMP] ✅ Service healthy" >> "$LOG_FILE"
        FAILURE_COUNT=0
    else
        FAILURE_COUNT=$((FAILURE_COUNT + 1))
        echo "[$TIMESTAMP] ❌ Service unhealthy (failure $FAILURE_COUNT/$ALERT_THRESHOLD)" >> "$LOG_FILE"

        if [ $FAILURE_COUNT -ge $ALERT_THRESHOLD ]; then
            echo "[$TIMESTAMP] 🚨 ALERT: Service failure threshold reached" >> "$LOG_FILE"

            # Send alert
            echo "Central-MCP service is down! Immediate attention required." | \
                mail -s "🚨 Central-MCP Service Alert" "$ALERT_EMAIL"

            # Attempt automatic restart
            echo "[$TIMESTAMP] 🔄 Attempting automatic restart..." >> "$LOG_FILE"
            sudo systemctl restart central-mcp

            # Wait for restart
            sleep 30

            # Check if restart worked
            if curl -s "$SERVICE_URL" > /dev/null; then
                echo "[$TIMESTAMP] ✅ Automatic restart successful" >> "$LOG_FILE"
                FAILURE_COUNT=0
            else
                echo "[$TIMESTAMP] ❌ Automatic restart failed" >> "$LOG_FILE"
                # Send critical alert
                echo "Central-MCP automatic restart failed! Manual intervention required." | \
                    mail -s "🚨🚨 CRITICAL: Central-MCP Service Down" "$ALERT_EMAIL"
            fi
        fi
    fi

    sleep 60  # Check every minute
done
```

### 2. Log Monitoring for Errors

```bash
#!/bin/bash
# log-monitor.sh - Monitor logs for error patterns

ERROR_PATTERNS=(
    "Error:"
    "FATAL:"
    "Exception:"
    "Cannot read property"
    "Cannot read.*undefined"
    "Port.*already in use"
    "EADDRINUSE"
)

LOG_FILE="/var/log/central-mcp/error.log"
ALERT_EMAIL="admin@centralmcp.net"

# Monitor journalctl in real-time
journalctl -u central-mcp -f --no-pager | while read line; do
    for pattern in "${ERROR_PATTERNS[@]}"; do
        if echo "$line" | grep -iq "$pattern"; then
            TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
            echo "[$TIMESTAMP] 🚨 Error detected: $line" >> "$LOG_FILE"

            # Send alert
            echo "Error detected in Central-MCP: $line" | \
                mail -s "🚨 Central-MCP Error Alert" "$ALERT_EMAIL"
            break
        fi
    done
done
```

### 3. Performance Monitoring

```bash
#!/bin/bash
# performance-monitor.sh - Monitor performance metrics

METRICS_ENDPOINT="http://localhost:3000/api/v1/metrics"
LOG_FILE="/var/log/central-mcp-performance.log"
ALERT_THRESHOLDS=(
    "memory_usage:80"     # Alert if memory usage > 80%
    "cpu_usage:90"        # Alert if CPU usage > 90%
    "response_time:5000"  # Alert if response time > 5s
)

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

    # Get metrics
    if METRICS=$(curl -s "$METRICS_ENDPOINT" 2>/dev/null); then
        # Parse metrics (adjust parsing based on your metrics format)
        MEMORY_USAGE=$(echo "$METRICS" | jq -r '.memory.usagePercent // 0')
        CPU_USAGE=$(echo "$METRICS" | jq -r '.cpu.usagePercent // 0')
        RESPONSE_TIME=$(echo "$METRICS" | jq -r '.responseTime // 0')

        echo "[$TIMESTAMP] Memory: ${MEMORY_USAGE}% CPU: ${CPU_USAGE}% Response: ${RESPONSE_TIME}ms" >> "$LOG_FILE"

        # Check thresholds
        if [ "$(echo "$MEMORY_USAGE > 80" | bc -l)" -eq 1 ]; then
            echo "[$TIMESTAMP] 🚨 High memory usage: ${MEMORY_USAGE}%" >> "$LOG_FILE"
            # Send alert
        fi

        if [ "$(echo "$CPU_USAGE > 90" | bc -l)" -eq 1 ]; then
            echo "[$TIMESTAMP] 🚨 High CPU usage: ${CPU_USAGE}%" >> "$LOG_FILE"
            # Send alert
        fi

        if [ "$(echo "$RESPONSE_TIME > 5000" | bc -l)" -eq 1 ]; then
            echo "[$TIMESTAMP] 🚨 High response time: ${RESPONSE_TIME}ms" >> "$LOG_FILE"
            # Send alert
        fi
    else
        echo "[$TIMESTAMP] ❌ Failed to get metrics" >> "$LOG_FILE"
    fi

    sleep 300  # Check every 5 minutes
done
```

---

## 📋 DEVELOPMENT BEST PRACTICES

### 1. TypeScript Best Practices

```typescript
// src/types/common.ts - Always export required interfaces
export interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
}

// Use explicit return types
export function getPoolStats(): PoolStats {
  // Implementation
}

// Always import what you export
import { PoolStats } from './types/common';
```

### 2. Environment Variable Management

```typescript
// src/config/environment.ts - Centralized environment management
interface EnvironmentConfig {
  port: number;
  nodeEnv: string;
  databasePath: string;
  logLevel: string;
}

function validateEnvironment(): EnvironmentConfig {
  const config: EnvironmentConfig = {
    port: parseInt(process.env.PHOTON_PORT || '8080'),
    nodeEnv: process.env.NODE_ENV || 'development',
    databasePath: process.env.PHOTON_DB_PATH || './data/photon.db',
    logLevel: process.env.PHOTON_LOG_LEVEL || 'info'
  };

  // Validate required fields
  if (!config.port || config.port < 1 || config.port > 65535) {
    throw new Error(`Invalid port: ${config.port}`);
  }

  if (!['development', 'production', 'test'].includes(config.nodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${config.nodeEnv}`);
  }

  return config;
}

export const environment = validateEnvironment();
```

### 3. Error Handling Best Practices

```typescript
// src/utils/errorHandler.ts - Centralized error handling
export class CentralMCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'CentralMCPError';
  }
}

// Always handle errors gracefully
export function handleError(error: unknown): void {
  if (error instanceof CentralMCPError) {
    logger.error(`Central-MCP Error [${error.code}]: ${error.message}`);
  } else if (error instanceof Error) {
    logger.error(`Unexpected Error: ${error.message}`);
  } else {
    logger.error('Unknown error occurred');
  }
}
```

---

## 🔄 CONTINUOUS INTEGRATION SETUP

### 1. GitHub Actions Workflow

```yaml
# .github/workflows/validate-and-deploy.yml
name: Validate and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run linting
        run: npm run lint

      - name: Build project
        run: npm run build

      - name: Validate build
        run: ./scripts/verify-build.sh

      - name: Validate environment
        run: ./scripts/validate-environment.sh

  deploy-staging:
    needs: validate
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to staging
        run: ./scripts/deploy-to-staging.sh

      - name: Health check staging
        run: curl -f http://staging-central-mcp:3000/health

      - name: Run integration tests
        run: npm run test:integration -- --env=staging

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: ./scripts/deploy-to-production.sh

      - name: Health check production
        run: curl -f http://34.41.115.199:3000/health
```

---

## 📊 CHECKLIST SUMMARY

### Before Every Deployment:

- [ ] **Code Quality**
  - [ ] TypeScript compilation succeeds
  - [ ] All tests pass
  - [ ] Linting passes
  - [ ] Build verification succeeds

- [ ] **Environment**
  - [ ] .env.production exists and is valid
  - [ ] All required environment variables set
  - [ ] Environment values validated

- [ ] **Testing**
  - [ ] Unit tests pass
  - [ ] Integration tests pass
  - [ ] Smoke tests pass on staging
  - [ ] Manual QA completed

- [ ] **Infrastructure**
  - [ ] Staging deployment successful
  - [ ] Health checks pass on staging
  - [ ] Rollback plan prepared
  - [ ] Backup created

### After Every Deployment:

- [ ] **Verification**
  - [ ] Service status healthy
  - [ ] Health endpoint responding
  - [ ] API endpoints working
  - [ ] Dashboard accessible
  - [ ] No errors in logs

- [ ] **Monitoring**
  - [ ] Monitoring systems active
  - [ ] Alerts configured
  - [ ] Performance metrics collected
  - [ ] Log monitoring active

- [ ] **Documentation**
  - [ ] Deployment documented
  - [ ] Changes recorded
  - [ ] Version tagged
  - [ ] Team notified

---

## 🎯 SUCCESS METRICS

Track these metrics to ensure prevention measures are working:

1. **Deployment Success Rate:** Target > 95%
2. **Mean Time To Recovery (MTTR):** Target < 15 minutes
3. **Uptime:** Target > 99.9%
4. **Failed Deployments:** Target 0 per month
5. **Rollback Frequency:** Target < 1 per quarter

---

**Document Version:** 1.0
**Last Updated:** 2025-10-16
**Next Review:** Monthly or after any incident
**Owner:** DevOps Team