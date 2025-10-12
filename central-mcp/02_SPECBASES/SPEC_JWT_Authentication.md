---
spec_id: CMCP-AUTH-001
title: "JWT Authentication & Authorization System"
version: 1.0
created: 2025-10-10
updated: 2025-10-10
status: DRAFT
type: FEATURE
layer: SECURITY
priority: P1-Critical
estimated_hours: 8
assigned_agent: UNASSIGNED
dependencies: []
tags: [security, authentication, jwt, rbac]
authors: []
reviewers: []
---

# 🔐 JWT Authentication & Authorization System

## 1. Purpose & Overview

**What**: Secure JWT-based authentication and role-based authorization for Central-MCP WebSocket and HTTP connections.

**Why**:
- Current system has NO authentication (security vulnerability)
- Need to verify agent identity before task assignment
- Must protect sensitive operations (task completion, rule changes)
- Required for production deployment

**Who**:
- All agents connecting to Central-MCP
- Human supervisors accessing dashboard
- External systems (LocalBrain, PHOTON) integration

**When**: Phase 1 - Before any production deployment

**Success Criteria**:
- [ ] All WebSocket connections require valid JWT token
- [ ] Agents authenticated with unique identities
- [ ] Role-based permissions enforced (read, write, admin)
- [ ] Zero security vulnerabilities (OWASP Top 10 compliant)
- [ ] Performance <10ms per auth check

---

## 2. Functional Requirements

### 2.1 Core Functionality
- **REQ-001**: JWT token generation → Test: Generate token, decode and verify signature
- **REQ-002**: JWT token validation → Test: Accept valid tokens, reject invalid/expired
- **REQ-003**: Role-based access control → Test: Admin can delete, agent can only read
- **REQ-004**: Token refresh mechanism → Test: Refresh before expiry, reject after expiry
- **REQ-005**: API key management → Test: Create, revoke, list keys

### 2.2 User Interactions
- **INT-001**: Agent connects with API key → System generates JWT token
- **INT-002**: Agent sends JWT in WebSocket header → System validates and establishes connection
- **INT-003**: Agent calls protected MCP tool → System checks permissions before execution
- **INT-004**: Token expires mid-session → System prompts refresh or disconnect

### 2.3 System Behavior
- **BEH-001**: Invalid token → Reject connection → Log attempt → Alert admin
- **BEH-002**: Expired token → Reject request → Return 401 → Trigger refresh flow
- **BEH-003**: Insufficient permissions → Deny action → Return 403 → Log attempt
- **BEH-004**: Token refresh → Validate current token → Issue new token → Invalidate old token

### 2.4 Edge Cases
- **EDGE-001**: Token tampered → Reject immediately → Log security event
- **EDGE-002**: Clock skew between client/server → Accept tokens with 5min tolerance
- **EDGE-003**: Revoked API key mid-session → Disconnect immediately → Notify agent
- **EDGE-004**: Concurrent refresh requests → First succeeds, rest fail gracefully

---

## 3. Performance Requirements

### 3.1 Response Time
- **Metric**: Token validation
- **Target**: <10ms (p95)
- **Test**: Benchmark 10,000 validations

### 3.2 Throughput
- **Metric**: Auth checks/second
- **Target**: 10,000 ops/sec
- **Test**: Load test with concurrent connections

### 3.3 Resource Usage
- **CPU**: <5% average (auth operations)
- **Memory**: <100 MB (token cache)
- **Disk**: <10 MB (keys storage)

### 3.4 Scalability
- **Concurrent**: 1000+ authenticated connections
- **Tokens**: 100,000+ active tokens
- **Degradation**: <5% at peak load

---

## 4. Quality Requirements

### 4.1 Code Quality
- **Coverage**: ≥90% (security-critical)
- **Complexity**: Cyclomatic ≤5 (simple, auditable)
- **Documentation**: All security functions documented
- **Type Safety**: 100% strict TypeScript

### 4.2 Standards
- **JWT**: RFC 7519 compliant
- **Security**: OWASP Top 10 addressed
- **Crypto**: Use industry-standard algorithms (RS256, HS256)
- **Storage**: Secure key storage (encrypted at rest)

### 4.3 Maintainability
- **Review**: Security review required
- **Linting**: Zero errors, strict rules
- **Formatting**: Prettier enforced
- **Dependencies**: Minimal, audited (jsonwebtoken, bcrypt)

---

## 5. Testing Specifications

### 5.1 Unit Tests
- **File**: `tests/unit/Authentication.test.ts`
- **Coverage**: ≥95%
- **Test Count**: 25+
- **Focus**:
  - Token generation (5 tests)
  - Token validation (5 tests)
  - Permission checks (5 tests)
  - Edge cases (5 tests)
  - Error handling (5 tests)

### 5.2 Integration Tests
- **Scenario 1**: Agent authentication flow
  - Given: Agent with valid API key
  - When: Connects to WebSocket with key
  - Then: Receives valid JWT, connection established

- **Scenario 2**: Unauthorized access attempt
  - Given: Agent with read-only role
  - When: Attempts to delete task
  - Then: 403 Forbidden, action denied, logged

### 5.3 E2E Tests
- **Flow 1**: Complete authentication lifecycle
  - Steps: Generate API key → Connect → Get JWT → Call protected tool → Refresh token → Revoke key
  - Expected: All steps succeed until revoke, then 401
  - Pass: No unauthorized access at any point

### 5.4 Security Tests
- **Penetration**: Test JWT tampering, replay attacks, brute force
- **Tool**: OWASP ZAP, Burp Suite
- **Pass**: Zero critical/high vulnerabilities

---

## 6. Implementation Details

### 6.1 Technology Stack
- **Language**: TypeScript 5+
- **Framework**: Node.js
- **Libraries**:
  - jsonwebtoken (JWT generation/validation)
  - bcrypt (password hashing)
  - @types/jsonwebtoken (TypeScript types)
- **Tools**: Jest (testing), ESLint (security rules)

### 6.2 File Structure
```
src/
├── auth/
│   ├── Authentication.ts           # Main auth service
│   ├── TokenManager.ts              # JWT operations
│   ├── PermissionChecker.ts         # RBAC logic
│   ├── ApiKeyManager.ts             # API key CRUD
│   └── middleware/
│       ├── authenticateWebSocket.ts # WS middleware
│       └── authorizeAction.ts       # Permission middleware
├── types/
│   └── Auth.ts                      # Auth types
└── database/
    └── migrations/
        └── 009_auth_tables.sql      # Auth schema
```

### 6.3 Key Algorithms
- **Algorithm 1**: JWT Generation
  - Input: AgentProfile (id, role, metadata)
  - Process: Sign payload with secret/private key, set expiry
  - Output: Signed JWT string
  - Complexity: O(1)

- **Algorithm 2**: Permission Check
  - Input: JWT, action, resource
  - Process: Decode JWT → Extract role → Check RBAC rules
  - Output: Boolean (allowed/denied)
  - Complexity: O(1) with HashMap lookup

### 6.4 Data Models
```typescript
interface JWTPayload {
  sub: string;           // Agent ID
  role: AgentRole;       // Agent role
  permissions: string[]; // Allowed actions
  iat: number;           // Issued at
  exp: number;           // Expiry
  jti: string;           // JWT ID (for revocation)
}

interface ApiKey {
  id: string;
  agentId: string;
  key: string;           // Hashed
  role: AgentRole;
  createdAt: Date;
  expiresAt?: Date;
  revokedAt?: Date;
}

type AgentRole = 'admin' | 'supervisor' | 'agent' | 'readonly';

interface RBACRule {
  role: AgentRole;
  action: string;        // e.g., 'task:complete', 'rule:create'
  allowed: boolean;
}
```

---

## 7. Dependencies & Integration

### 7.1 Internal Dependencies
- **Spec**: None (foundational)
- **Must Complete**: Before all other features

### 7.2 External Dependencies
- **Package**: jsonwebtoken@9.0.0 - JWT operations
- **Package**: bcrypt@5.1.0 - Password hashing
- **Database**: SQLite or PostgreSQL for key storage

### 7.3 Integration Points
- **WebSocket Transport**: Add auth middleware to ws://
- **MCP Tools**: Wrap all tools with permission check
- **Event Broadcaster**: Only authenticated clients receive events

### 7.4 Breaking Changes
- **Change 1**: All existing connections will be rejected → Migration: Generate API keys for all agents

---

## 8. Acceptance Criteria

### 8.1 Functional
- [ ] JWT generation works (test with 100 tokens)
- [ ] JWT validation works (accept valid, reject invalid)
- [ ] RBAC enforced (admin can do all, agent cannot delete)
- [ ] API key management (create, list, revoke)
- [ ] Token refresh works (new token issued before expiry)

### 8.2 Performance
- [ ] Auth check <10ms (p95)
- [ ] Memory <100 MB
- [ ] 1000+ concurrent authenticated connections

### 8.3 Quality
- [ ] Coverage ≥90%
- [ ] All security tests passing
- [ ] Security audit passed (OWASP ZAP)
- [ ] Code review approved by security expert

### 8.4 Integration
- [ ] Works with WebSocket transport
- [ ] Works with all MCP tools
- [ ] Works with LocalBrain client

---

## 9. Deployment Plan

### 9.1 Strategy
- **Type**: Phased rollout
- **Phase 1**: Add auth, keep backward compatibility (optional auth)
- **Phase 2**: Make auth required, migrate all agents
- **Phase 3**: Remove backward compatibility
- **Rollback**: Disable auth requirement via env variable

### 9.2 Configuration
- **Dev**: `AUTH_ENABLED=true, JWT_SECRET=dev-secret, JWT_EXPIRY=1h`
- **Staging**: `AUTH_ENABLED=true, JWT_SECRET=<doppler>, JWT_EXPIRY=24h`
- **Prod**: `AUTH_ENABLED=true, JWT_SECRET=<doppler>, JWT_EXPIRY=24h, REFRESH_ENABLED=true`

### 9.3 Migration
1. Deploy auth system (auth optional)
2. Generate API keys for all existing agents
3. Update agents to use API keys
4. Enable auth requirement
5. Validate all agents authenticated
6. Remove backward compatibility

### 9.4 Rollback
- **Trigger**: >5% connection failures
- **Steps**: Set `AUTH_ENABLED=false`, restart service
- **Validate**: All agents reconnect successfully

---

## 10. Maintenance & Monitoring

### 10.1 Health Checks
- **Endpoint**: /health/auth
- **Frequency**: 30s
- **Success**: 200 OK, token validation working

### 10.2 Metrics
- Auth success rate (%)
- Auth failure rate (%)
- Token refresh rate (req/min)
- Invalid token attempts (req/min)
- Permission denials (req/min)

### 10.3 Alerts
- **Critical**: Auth failure rate >10%
- **Warning**: Invalid token attempts >100/min (possible attack)
- **Info**: New API key created

### 10.4 Schedule
- **Daily**: Review auth logs, failed attempts
- **Weekly**: Rotate JWT secrets (if using HS256)
- **Monthly**: Audit API keys, revoke unused

---

## 11. Documentation

### 11.1 User Docs
- **Guide**: docs/AUTH_GUIDE.md
- **API**: docs/AUTH_API.md
- **Examples**: How to generate API key, connect with JWT

### 11.2 Developer Docs
- **Architecture**: JWT flow diagram
- **Comments**: All auth functions documented
- **README**: Setup guide for local development

### 11.3 Operations
- **Runbook**: How to rotate secrets, revoke keys
- **Troubleshooting**: Common auth errors
- **FAQ**: Why 401? Why 403?

### 11.4 Changelog
- **v1.0**: Initial JWT auth with RBAC

---

## 12. Evolution & Future

### 12.1 Limitations
- **Limitation 1**: Single JWT secret (not rotatable without downtime)
- **Workaround**: Use RS256 (public/private key) for rotation

### 12.2 Enhancements
- **Enhancement 1**: OAuth 2.0 integration (Google, GitHub)
- **Timeline**: Phase 2 (after MVP)
- **Enhancement 2**: Multi-factor authentication (MFA)
- **Timeline**: Phase 3 (enterprise)

### 12.3 Deprecation
- **What**: Backward compatibility (optional auth)
- **When**: 30 days after Phase 2
- **Migration**: All agents must use API keys

### 12.4 Vision
- **3 months**: OAuth 2.0 integration
- **6 months**: MFA for admin access
- **1 year**: Fine-grained permissions (resource-level RBAC)

---

**SPEC STATUS: READY FOR IMPLEMENTATION**
**NEXT: Generate tasks from this spec**
