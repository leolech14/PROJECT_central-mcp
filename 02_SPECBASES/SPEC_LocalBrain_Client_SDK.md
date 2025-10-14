---
spec_id: CMCP-SDK-011
title: "LocalBrain Client SDK for Central-MCP Integration"
version: 1.0
created: 2025-10-10
updated: 2025-10-10
status: DRAFT
type: FEATURE
layer: INTEGRATION
priority: P1-Critical
estimated_hours: 10
assigned_agent: UNASSIGNED
dependencies: [CMCP-AUTH-001, CMCP-TASK-004]
tags: [sdk, client, localbrain, integration, mcp]
authors: []
reviewers: []
---

# 🔗 LocalBrain Client SDK for Central-MCP Integration

## 1. Purpose & Overview

**What**: TypeScript/Swift SDK for LocalBrain to interact with Central-MCP task registry and intelligence engine.

**Why**:
- LocalBrain needs seamless integration with Central-MCP
- Current MCP tools require manual WebSocket management
- Need type-safe client library with error handling
- Must support both Swift (macOS app) and TypeScript (Next.js prototype)

**Who**:
- LocalBrain Swift application
- Orchestra.blue (Next.js prototype)
- External tools integrating with Central-MCP

**When**: Phase 1 - Foundation for LocalBrain ↔ Central-MCP coordination

**Success Criteria**:
- [ ] TypeScript SDK works in Next.js (Orchestra.blue)
- [ ] Swift SDK works in macOS app (LocalBrain)
- [ ] All MCP tools accessible via clean API
- [ ] Real-time events work (WebSocket subscriptions)
- [ ] Performance <100ms for all operations

---

## 2. Functional Requirements

### 2.1 Core Functionality
- **REQ-001**: Task delegation → Test: Create task in Central-MCP from LocalBrain
- **REQ-002**: Progress tracking → Test: Update task progress, receive confirmation
- **REQ-003**: Real-time subscriptions → Test: Subscribe to task updates, receive events
- **REQ-004**: Agent management → Test: Connect agent, get status, disconnect
- **REQ-005**: Intelligence queries → Test: Analyze patterns, get predictions

### 2.2 User Interactions
- **INT-001**: LocalBrain creates task → SDK sends to Central-MCP → Returns task ID
- **INT-002**: LocalBrain updates progress → SDK sends progress → Central-MCP broadcasts event
- **INT-003**: LocalBrain subscribes to agent status → SDK establishes WebSocket → Receives real-time updates
- **INT-004**: LocalBrain queries predictions → SDK calls intelligence API → Returns forecast

### 2.3 System Behavior
- **BEH-001**: Connection lost → SDK auto-reconnects → Resubscribes to events
- **BEH-002**: Authentication fails → SDK refreshes token → Retries request
- **BEH-003**: Request timeout → SDK retries with exponential backoff → Returns error after max retries
- **BEH-004**: Invalid response → SDK validates schema → Throws typed error

### 2.4 Edge Cases
- **EDGE-001**: Network offline → Queue requests → Send when online → Notify user
- **EDGE-002**: Central-MCP down → Return cached data → Show offline indicator
- **EDGE-003**: Malformed event → Log error → Skip event → Continue processing
- **EDGE-004**: Concurrent requests → Use request queue → Process in order

---

## 3. Performance Requirements

### 3.1 Response Time
- **Metric**: API call latency
- **Target**: <100ms (p95)
- **Test**: Benchmark 1000 task operations

### 3.2 Throughput
- **Metric**: Operations/second
- **Target**: 500 ops/sec
- **Test**: Load test with concurrent clients

### 3.3 Resource Usage
- **CPU**: <10% (SDK operations)
- **Memory**: <50 MB (TypeScript), <20 MB (Swift)
- **Network**: <1 MB/min (WebSocket events)

### 3.4 Scalability
- **Concurrent**: 100+ LocalBrain instances
- **Events**: 1000+ events/min
- **Degradation**: Graceful (queue, not crash)

---

## 4. Quality Requirements

### 4.1 Code Quality
- **Coverage**: ≥85%
- **Complexity**: Cyclomatic ≤8
- **Documentation**: All public APIs documented (TSDoc, Swift DocC)
- **Type Safety**: 100% strict (TypeScript strict mode, Swift type inference)

### 4.2 Standards
- **API**: MCP protocol compliant
- **WebSocket**: RFC 6455 compliant
- **Error Handling**: Typed errors, no silent failures
- **Async**: Promises (TypeScript), async/await (Swift)

### 4.3 Maintainability
- **Review**: Required for API changes
- **Linting**: ESLint (TS), SwiftLint (Swift)
- **Formatting**: Prettier (TS), swift-format (Swift)
- **Dependencies**: Minimal, well-maintained

---

## 5. Testing Specifications

### 5.1 Unit Tests
- **Files**:
  - `tests/unit/LocalBrainClient.test.ts` (TypeScript)
  - `Tests/LocalBrainClientTests.swift` (Swift)
- **Coverage**: ≥90%
- **Test Count**: 40+ (20 per language)
- **Focus**:
  - Task operations (8 tests)
  - Subscriptions (8 tests)
  - Error handling (8 tests)
  - Reconnection (8 tests)
  - Authentication (8 tests)

### 5.2 Integration Tests
- **Scenario 1**: End-to-end task flow
  - Given: LocalBrain client connected
  - When: Create task → Update progress → Complete task
  - Then: All operations succeed, events received

- **Scenario 2**: Reconnection flow
  - Given: Client connected, subscribed to events
  - When: Network disconnects → Reconnects
  - Then: Subscriptions restored, no events lost

### 5.3 E2E Tests
- **Flow 1**: Complete LocalBrain workflow
  - Steps:
    1. Initialize client with API key
    2. Authenticate and get JWT
    3. Create task in Central-MCP
    4. Subscribe to task updates
    5. Update task progress (50%, 75%, 100%)
    6. Receive real-time events
    7. Complete task
    8. Disconnect gracefully
  - Expected: All steps succeed, zero errors
  - Pass: TypeScript and Swift both work

### 5.4 Performance Tests
- **Benchmark**: 1000 task creations
- **Target**: <100ms per operation
- **Tool**: k6 (TypeScript), XCTest (Swift)

---

## 6. Implementation Details

### 6.1 Technology Stack
- **TypeScript**:
  - Language: TypeScript 5+
  - Runtime: Node.js, Bun, Browser
  - Libraries: ws (WebSocket), cross-fetch (HTTP)
- **Swift**:
  - Language: Swift 5.9+
  - Framework: URLSession (HTTP), Starscream (WebSocket)
  - Platform: macOS 13+, iOS 16+

### 6.2 File Structure
```
TypeScript SDK:
src/sdk/
├── LocalBrainClient.ts       # Main client
├── TaskClient.ts              # Task operations
├── IntelligenceClient.ts      # AI queries
├── EventSubscriber.ts         # Real-time events
├── AuthManager.ts             # Authentication
├── types/
│   └── index.ts               # All types
└── utils/
    ├── retry.ts               # Retry logic
    └── validation.ts          # Response validation

Swift SDK:
Sources/LocalBrainSDK/
├── LocalBrainClient.swift     # Main client
├── TaskClient.swift           # Task operations
├── IntelligenceClient.swift   # AI queries
├── EventSubscriber.swift      # Real-time events
├── AuthManager.swift          # Authentication
├── Models/
│   └── Task.swift             # Data models
└── Utils/
    ├── Retry.swift            # Retry logic
    └── Validation.swift       # Response validation
```

### 6.3 Key Algorithms
- **Algorithm 1**: Exponential Backoff Retry
  - Input: Request, max retries
  - Process: Try → Wait 2^n seconds → Retry → Repeat
  - Output: Response or Error
  - Complexity: O(1)

- **Algorithm 2**: Event Queue with Deduplication
  - Input: Incoming events
  - Process: Check event ID → Skip if duplicate → Queue → Process in order
  - Output: Processed events
  - Complexity: O(1) amortized

### 6.4 Data Models
```typescript
// TypeScript
interface LocalBrainClientConfig {
  baseUrl: string;              // Central-MCP URL
  apiKey: string;               // Authentication
  projectId: string;            // Project scope
  autoReconnect?: boolean;      // Default: true
  maxRetries?: number;          // Default: 3
  timeout?: number;             // Default: 30000ms
}

interface TaskCreationRequest {
  title: string;
  description: string;
  taskType: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours?: number;
  assignToAgent?: string;
}

interface TaskProgressUpdate {
  taskId: string;
  percentage: number;
  notes?: string;
  filesChanged?: string[];
}

// Swift
struct LocalBrainClientConfig {
    let baseUrl: String
    let apiKey: String
    let projectId: String
    var autoReconnect: Bool = true
    var maxRetries: Int = 3
    var timeout: TimeInterval = 30.0
}

struct TaskCreationRequest {
    let title: String
    let description: String
    let taskType: String
    var priority: TaskPriority?
    var estimatedHours: Int?
    var assignToAgent: String?
}
```

---

## 7. Dependencies & Integration

### 7.1 Internal Dependencies
- **Spec**: CMCP-AUTH-001 (JWT Authentication) - Required for API key → JWT flow
- **Spec**: CMCP-TASK-004 (Multi-Project) - Required for project-scoped operations

### 7.2 External Dependencies
- **TypeScript**:
  - ws@8.14.0 - WebSocket client
  - cross-fetch@4.0.0 - HTTP client (universal)
  - zod@3.22.0 - Schema validation
- **Swift**:
  - Starscream@4.0.0 - WebSocket client
  - (No HTTP dependency, using URLSession)

### 7.3 Integration Points
- **LocalBrain (Swift)**: Import SDK, initialize client, use in app
- **Orchestra.blue (TypeScript)**: Import SDK, use in Next.js API routes
- **Central-MCP**: Expose MCP tools via SDK methods

### 7.4 Breaking Changes
- **Change 1**: SDK API changes → Migration: Bump major version, provide migration guide

---

## 8. Acceptance Criteria

### 8.1 Functional
- [ ] TypeScript SDK works in Next.js (Orchestra.blue)
- [ ] Swift SDK works in LocalBrain macOS app
- [ ] All MCP tools accessible (task, intelligence, agent)
- [ ] Real-time subscriptions work (WebSocket)
- [ ] Reconnection works automatically

### 8.2 Performance
- [ ] API call <100ms (p95)
- [ ] Memory <50 MB (TypeScript), <20 MB (Swift)
- [ ] WebSocket events <1 MB/min

### 8.3 Quality
- [ ] Coverage ≥85% (TypeScript and Swift)
- [ ] All tests passing (unit, integration, e2e)
- [ ] Documentation complete (TSDoc, Swift DocC)
- [ ] Code review approved

### 8.4 Integration
- [ ] Works with Central-MCP production
- [ ] Works with LocalBrain Swift app
- [ ] Works with Orchestra.blue Next.js

---

## 9. Deployment Plan

### 9.1 Strategy
- **TypeScript**: Publish to npm
- **Swift**: Distribute via Swift Package Manager (SPM)
- **Versioning**: SemVer (1.0.0)

### 9.2 Configuration
- **TypeScript**:
  ```typescript
  const client = new LocalBrainClient({
    baseUrl: process.env.CENTRAL_MCP_URL,
    apiKey: process.env.CENTRAL_MCP_API_KEY,
    projectId: 'localbrain'
  });
  ```
- **Swift**:
  ```swift
  let config = LocalBrainClientConfig(
    baseUrl: ProcessInfo.processInfo.environment["CENTRAL_MCP_URL"]!,
    apiKey: ProcessInfo.processInfo.environment["CENTRAL_MCP_API_KEY"]!,
    projectId: "localbrain"
  )
  let client = LocalBrainClient(config: config)
  ```

### 9.3 Migration
1. Publish SDK to npm and SPM
2. Update LocalBrain to use SDK
3. Update Orchestra.blue to use SDK
4. Deprecate manual WebSocket management
5. Monitor adoption

### 9.4 Rollback
- **Trigger**: SDK crashes or data loss
- **Steps**: Revert to manual WebSocket, publish hotfix
- **Validate**: All integrations working

---

## 10. Maintenance & Monitoring

### 10.1 Health Checks
- **SDK Health**: Automatic ping/pong every 30s
- **Connection**: Auto-reconnect on failure
- **Authentication**: Auto-refresh JWT before expiry

### 10.2 Metrics
- Connection success rate (%)
- API call latency (ms)
- WebSocket event rate (events/min)
- Reconnection count (count/hour)
- Authentication failures (count)

### 10.3 Alerts
- **Critical**: Connection failure >5 consecutive attempts
- **Warning**: API latency >500ms
- **Info**: New SDK version published

### 10.4 Schedule
- **Weekly**: Check npm/SPM downloads
- **Monthly**: Update dependencies
- **Quarterly**: Major version bump (if needed)

---

## 11. Documentation

### 11.1 User Docs
- **TypeScript**:
  - README.md with examples
  - API documentation (TypeDoc)
  - Quick start guide
- **Swift**:
  - README.md with examples
  - API documentation (Swift DocC)
  - Xcode inline help

### 11.2 Developer Docs
- **Architecture**: Client architecture diagram
- **Comments**: All public APIs documented
- **Examples**: Complete examples for common use cases

### 11.3 Operations
- **Runbook**: How to publish new version
- **Troubleshooting**: Common SDK errors
- **FAQ**: How to migrate from manual WebSocket?

### 11.4 Changelog
- **v1.0.0**: Initial release with TypeScript and Swift SDKs

---

## 12. Evolution & Future

### 12.1 Limitations
- **Limitation 1**: WebSocket only (no HTTP fallback)
- **Workaround**: Add HTTP long-polling fallback (v1.1)

### 12.2 Enhancements
- **Enhancement 1**: React hooks for TypeScript SDK
- **Timeline**: v1.1 (1 month)
- **Enhancement 2**: SwiftUI helpers for Swift SDK
- **Timeline**: v1.2 (2 months)

### 12.3 Deprecation
- **What**: Manual WebSocket management in LocalBrain
- **When**: After SDK v1.0 stable for 30 days
- **Migration**: Use SDK instead

### 12.4 Vision
- **3 months**: React hooks, SwiftUI helpers
- **6 months**: Python SDK, Go SDK
- **1 year**: Multi-language SDKs for all major platforms

---

**SPEC STATUS: READY FOR IMPLEMENTATION**
**DEPENDENCIES: CMCP-AUTH-001, CMCP-TASK-004**
**NEXT: Implement TypeScript SDK first, then Swift SDK**
