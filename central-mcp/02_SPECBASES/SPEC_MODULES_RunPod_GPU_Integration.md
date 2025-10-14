---
spec_id: CMCP-CLOUD-002
title: "RunPod GPU Integration - Multi-Cloud VM Coordination"
version: 1.0
created: 2025-10-10
updated: 2025-10-10
status: ACTIVE
type: INTEGRATION
layer: INFRASTRUCTURE
priority: P1-High
estimated_hours: 80
assigned_agent: UNASSIGNED
dependencies: [CMCP-A2A-001, CMCP-AUTH-001]
tags: [runpod, gpu, multi-cloud, ai-media-generation, vm-coordination, stable-diffusion]
authors: []
reviewers: []
---

# 🎨 RunPod GPU Integration - Multi-Cloud VM Coordination

## 1. Purpose & Overview

**What**: Integrate RunPod GPU VMs into Central-MCP to enable seamless AI media generation coordination across GCP and RunPod infrastructure.

**Why**: Current Central-MCP runs on GCP e2-micro (CPU-only). AI media generation tasks (Stable Diffusion, video generation, LLM inference) require GPU acceleration. RunPod provides affordable GPU instances that complement GCP's orchestration capabilities.

**Who**:
- **Target Users**: AI agents needing GPU compute (image generation, video processing, LLM tasks)
- **Target Systems**: Central-MCP hub (GCP), RunPod GPU pods, agent frameworks (GLM-4.6, Gemini, Claude)

**When**:
- **Phase 1**: Weeks 1-2 (RunPod connection, basic tools)
- **Phase 2**: Weeks 2-3 (VM Router, intelligent routing)
- **Phase 3**: Weeks 3-4 (A2A integration, production deployment)

**Success Criteria**:
- [ ] Agents can discover and connect to RunPod pods programmatically
- [ ] Commands execute on RunPod VMs with < 2s latency
- [ ] Files transfer between GCP ↔ RunPod reliably (100 MB/s+)
- [ ] Intelligent routing: GPU tasks → RunPod, Compute tasks → GCP
- [ ] Cost tracking for both GCP and RunPod infrastructure
- [ ] 99.5% uptime for VM coordination

---

## 2. Functional Requirements

### 2.1 Core Functionality

- **REQ-001**: Discover RunPod Pods
  - **Description**: List all available RunPod GPU pods via REST API
  - **Test**: API call returns pod list with status, GPU type, region

- **REQ-002**: Execute Commands on RunPod
  - **Description**: Run bash commands remotely on RunPod pods via SSH
  - **Test**: Execute `nvidia-smi` and receive GPU info

- **REQ-003**: File Upload to RunPod
  - **Description**: Upload files (datasets, models) from GCP/local to RunPod
  - **Test**: Upload 100MB file, verify integrity with checksum

- **REQ-004**: File Download from RunPod
  - **Description**: Download generated media (images, videos) from RunPod
  - **Test**: Generate image, download, verify file exists locally

- **REQ-005**: VM Health Monitoring
  - **Description**: Monitor RunPod pod status, GPU utilization, availability
  - **Test**: Poll health every 30s, detect pod offline within 1 minute

### 2.2 User Interactions

- **INT-001**: Agent requests GPU task → Central-MCP routes to RunPod
  - **Flow**: Agent → A2A message → VM Router → RunPod Pod → Execute → Return result

- **INT-002**: Agent uploads dataset → RunPod processes → Agent downloads result
  - **Flow**: Upload → Execute processing → Download → Cleanup

- **INT-003**: Agent queries available GPUs → Central-MCP returns list
  - **Flow**: Query → VM Registry → Return available pods with GPU types

### 2.3 System Behavior

- **BEH-001**: If RunPod pod unavailable → Retry with different pod
  - **Condition**: Primary pod offline
  - **Action**: VM Router selects next available pod
  - **Outcome**: Task completes successfully with <5s additional latency

- **BEH-002**: If all RunPod pods busy → Queue task
  - **Condition**: All pods at >80% utilization
  - **Action**: Task enters queue with estimated wait time
  - **Outcome**: Task executes when pod becomes available

- **BEH-003**: If RunPod API key invalid → Reject task with clear error
  - **Condition**: Authentication failure
  - **Action**: Return error to agent
  - **Outcome**: Agent receives actionable error message

### 2.4 Edge Cases

- **EDGE-001**: RunPod pod terminated mid-task
  - **Handling**: Save partial progress, retry on new pod

- **EDGE-002**: Network interruption during file transfer
  - **Handling**: Resume from last checkpoint (chunked upload/download)

- **EDGE-003**: RunPod API rate limit exceeded
  - **Handling**: Exponential backoff, queue requests

- **EDGE-004**: Pod runs out of disk space mid-processing
  - **Handling**: Pre-check disk space, fail early with clear message

---

## 3. Performance Requirements

### 3.1 Response Time

- **Metric**: Command execution latency
- **Target**: < 2s (p95) from agent request to execution start
- **Test**: Benchmark 100 executions, measure p50/p95/p99

### 3.2 Throughput

- **Metric**: Concurrent tasks
- **Target**: 50+ concurrent GPU tasks across multiple pods
- **Test**: Load test with 50 parallel image generation requests

### 3.3 Resource Usage

- **CPU**: < 10% on Central-MCP hub (orchestration overhead)
- **Memory**: < 200 MB for VM Router + RunPod client
- **Network**: 100 Mbps sustained for file transfers

### 3.4 Scalability

- **Concurrent Agents**: 100+ agents using GPU resources
- **Pod Count**: Support 1-50 RunPod pods dynamically
- **Data Volume**: 1 TB+ daily file transfers (uploads + downloads)
- **Degradation**: < 10% latency increase at peak load

---

## 4. Quality Requirements

### 4.1 Code Quality

- **Coverage**: ≥ 85% for RunPod client, VM Router, tools
- **Complexity**: Cyclomatic ≤ 10 per function
- **Documentation**: JSDoc for all public APIs
- **Type Safety**: 100% strict TypeScript, no `any` types

### 4.2 Standards

- **API**: RESTful design for RunPod client
- **SSH**: OpenSSH compatible, ed25519 keys
- **Security**: API keys in Doppler, no hardcoded credentials
- **Error Handling**: Structured errors with retry guidance

### 4.3 Maintainability

- **Review**: Required before merge (2 approvers)
- **Linting**: ESLint, Prettier enforced
- **Formatting**: Consistent style across codebase
- **Dependencies**: Minimal, well-maintained packages only

---

## 5. Testing Specifications

### 5.1 Unit Tests

- **File**: `tests/unit/RunPodClient.test.ts`
- **Coverage**: ≥ 90%
- **Test Count**: 25+
- **Focus**:
  - API client methods (8 tests: listPods, getPod, startPod, stopPod, etc.)
  - SSH connection management (5 tests: connect, disconnect, reconnect, timeout)
  - Error handling (7 tests: invalid API key, network errors, pod offline)
  - File transfer (5 tests: upload, download, chunking, resume, integrity)

### 5.2 Integration Tests

- **Scenario 1**: End-to-end image generation workflow
  - **Given**: Agent connected to Central-MCP, RunPod pod available
  - **When**: Agent requests image generation with Stable Diffusion
  - **Then**: Task routes to RunPod, executes, returns generated image

- **Scenario 2**: Multi-agent GPU coordination
  - **Given**: 3 agents requesting GPU tasks simultaneously
  - **When**: Tasks submitted to VM Router
  - **Then**: Each task routes to different pod or queues appropriately

- **Scenario 3**: Failover handling
  - **Given**: Primary RunPod pod crashes mid-task
  - **When**: VM Router detects failure
  - **Then**: Task retries on backup pod within 10s

### 5.3 E2E Tests

- **Flow 1**: Agent discovers → connects → executes → downloads
  - **Steps**:
    1. Agent queries available RunPod pods
    2. Selects pod with A100 GPU
    3. Uploads dataset (10MB)
    4. Executes processing command
    5. Downloads result
    6. Verifies integrity
  - **Expected**: All steps complete within 60s
  - **Pass**: File integrity verified, no errors

### 5.4 Performance Tests

- **Benchmark 1**: Command execution latency
  - **Target**: < 2s (p95)
  - **Tool**: k6 load testing framework

- **Benchmark 2**: File transfer throughput
  - **Target**: 100 MB/s for 1GB file transfer
  - **Tool**: iperf3 + custom benchmark

- **Benchmark 3**: Concurrent task handling
  - **Target**: 50 concurrent tasks without degradation
  - **Tool**: Artillery load testing

---

## 6. Implementation Details

### 6.1 Technology Stack

- **Language**: TypeScript 5+
- **Runtime**: Node.js 20+
- **SSH Client**: ssh2 (Node.js SSH client library)
- **HTTP Client**: axios (RunPod REST API)
- **Testing**: Vitest, Supertest
- **Tools**: ESLint, Prettier, TypeDoc

### 6.2 File Structure

```
src/
├── cloud-providers/
│   └── runpod/
│       ├── RunPodClient.ts           # API wrapper for RunPod REST API
│       ├── RunPodPodRegistry.ts      # Track pod availability/status
│       ├── RunPodSSHManager.ts       # SSH connection pooling
│       └── types.ts                  # RunPod type definitions
├── tools/
│   └── runpod/
│       ├── executeOnRunPod.ts        # MCP tool: execute command
│       ├── uploadToRunPod.ts         # MCP tool: upload file
│       ├── downloadFromRunPod.ts     # MCP tool: download file
│       ├── listRunPodFiles.ts        # MCP tool: list files
│       └── index.ts                  # Export all RunPod tools
└── vm-router/
    ├── VMRegistry.ts                 # Unified registry (GCP + RunPod)
    ├── VMRouter.ts                   # Intelligent task routing
    ├── VMHealthMonitor.ts            # Monitor all VMs
    └── types.ts                      # VM router types
```

### 6.3 Key Algorithms

- **Algorithm 1**: Pod Selection
  - **Input**: Task requirements (GPU type, VRAM, region)
  - **Process**:
    1. Filter pods by capabilities
    2. Check pod health and availability
    3. Calculate load score (CPU + GPU utilization)
    4. Select pod with lowest load score
  - **Output**: Selected pod ID
  - **Complexity**: O(n) where n = pod count

- **Algorithm 2**: Chunked File Transfer
  - **Input**: File path, chunk size (default 10MB)
  - **Process**:
    1. Split file into chunks
    2. Upload chunks sequentially with retry
    3. Verify each chunk with checksum
    4. Resume from failed chunk on error
  - **Output**: Upload status, completion time
  - **Complexity**: O(fileSize / chunkSize)

### 6.4 Data Models

```typescript
interface RunPodPod {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping';
  gpuType: string;              // 'RTX 4090', 'A100 80GB', 'H100'
  gpuCount: number;
  vramGB: number;
  region: string;               // 'US-TX-3', 'EU-RO-1'
  sshEndpoint: string;          // 'pod-abc123.runpod.io:12345'
  costPerHour: number;
  currentLoad: {
    cpuPercent: number;
    gpuPercent: number;
    memoryPercent: number;
  };
  metadata: {
    installedModels?: string[];  // ['stable-diffusion-xl', 'flux']
    capabilities?: string[];     // ['image-gen', 'video-gen', 'llm']
  };
}

interface VMTask {
  id: string;
  agentId: string;
  type: 'gpu-intensive' | 'compute' | 'storage';
  requiredCapabilities: string[];
  priority: number;
  estimatedDuration: number;
  createdAt: number;
  status: 'queued' | 'routing' | 'executing' | 'completed' | 'failed';
  assignedVM?: {
    provider: 'gcp' | 'runpod';
    vmId: string;
  };
}
```

---

## 7. Dependencies & Integration

### 7.1 Internal Dependencies

- **Spec**: CMCP-A2A-001 - Agent2Agent protocol for agent communication
  - **Must Complete**: Before A2A integration (Phase 3)

- **Spec**: CMCP-AUTH-001 - JWT Authentication for secure API access
  - **Must Complete**: Before production deployment

### 7.2 External Dependencies

- **Package**: ssh2@^1.15.0 - SSH client for RunPod connections
- **Package**: axios@^1.6.0 - HTTP client for RunPod REST API
- **API**: RunPod REST API (https://rest.runpod.io/v1) - Pod management
- **CLI**: runpodctl - RunPod command-line tool (optional)

### 7.3 Integration Points

- **Central-MCP A2A Server**: Expose RunPod tools via A2A protocol
- **VM Registry**: Unified registry tracking both GCP and RunPod VMs
- **Cost Tracker**: Track RunPod hourly costs alongside GCP
- **Doppler**: Store RunPod API keys and SSH private keys

### 7.4 Breaking Changes

- **Change 1**: VM Tools API extended with RunPod-specific methods
  - **What breaks**: Existing tools expect only GCP VMs
  - **Migration**: Add `provider` field to tool calls

---

## 8. Acceptance Criteria

### 8.1 Functional

- [ ] REQ-001: List RunPod pods via API (verified with real account)
- [ ] REQ-002: Execute commands on RunPod pod via SSH (tested with nvidia-smi)
- [ ] REQ-003: Upload 100MB file to RunPod pod (integrity verified)
- [ ] REQ-004: Download generated image from RunPod (file valid)
- [ ] REQ-005: Health monitoring polls pods every 30s (logs show activity)

### 8.2 Performance

- [ ] Command execution < 2s latency (p95 benchmark passed)
- [ ] File transfer > 100 MB/s throughput (measured with 1GB test file)
- [ ] 50 concurrent tasks handled without degradation (load test passed)
- [ ] No memory leaks after 1000 operations (heap profiled)

### 8.3 Quality

- [ ] Test coverage ≥ 85% (measured with Vitest)
- [ ] All unit tests passing (25+ tests)
- [ ] All integration tests passing (3 scenarios)
- [ ] E2E test passed (full agent workflow)
- [ ] Code review approved by 2+ reviewers
- [ ] Security audit passed (no hardcoded credentials)

### 8.4 Integration

- [ ] Works with A2A protocol (agents can request GPU tasks)
- [ ] VM Router correctly routes GPU → RunPod, Compute → GCP
- [ ] Cost tracking records RunPod usage (verified in dashboard)
- [ ] Doppler integration working (API keys retrieved securely)

---

## 9. Deployment Plan

### 9.1 Strategy

- **Type**: Rolling deployment
- **Rollback**: Keep previous version deployed, switch symlink on failure
- **Health**: Monitor `/health` endpoint + RunPod connectivity test

**Phases**:
1. Deploy RunPod client to staging (test with single pod)
2. Deploy tools to staging (test with example agents)
3. Deploy VM Router to staging (verify routing logic)
4. Production deployment (incremental traffic 10% → 50% → 100%)

### 9.2 Configuration

- **Dev**:
  ```env
  RUNPOD_API_KEY=dev-key-from-doppler
  RUNPOD_ENABLED=true
  RUNPOD_MAX_PODS=5
  ```

- **Staging**:
  ```env
  RUNPOD_API_KEY=staging-key-from-doppler
  RUNPOD_ENABLED=true
  RUNPOD_MAX_PODS=10
  ```

- **Prod**:
  ```env
  RUNPOD_API_KEY=prod-key-from-doppler
  RUNPOD_ENABLED=true
  RUNPOD_MAX_PODS=50
  RUNPOD_AUTO_START=true
  RUNPOD_AUTO_STOP_IDLE_MINUTES=5
  ```

### 9.3 Migration

1. **Backup**: Export current VM registry and task queue
2. **Deploy**: Upload compiled dist/ to Central-MCP VM
3. **Migrate**: Add RunPod pods to VM registry (manual registration)
4. **Validate**: Test RunPod connectivity from Central-MCP
5. **Monitor**: Watch logs for 24h, alert on errors

### 9.4 Rollback

- **Trigger**: >5% error rate OR >10s latency (p95) OR pod connection failures
- **Steps**:
  1. Set `RUNPOD_ENABLED=false` in environment
  2. Restart Central-MCP service
  3. Revert symlink to previous dist/ version
  4. Flush task queue (retry on GCP VMs)
- **Validate**: Health checks pass, error rate < 1%

---

## 10. Maintenance & Monitoring

### 10.1 Health Checks

- **Endpoint**: `/health/runpod`
- **Frequency**: Every 30s
- **Success Criteria**:
  - RunPod API reachable (200 OK)
  - At least 1 pod available
  - SSH connection pool healthy
  - Response time < 50ms

### 10.2 Metrics

**Infrastructure**:
- Active RunPod pod count (gauge)
- Available GPU count (gauge)
- RunPod API latency (histogram: p50, p95, p99)
- SSH connection pool size (gauge)

**Tasks**:
- GPU tasks queued (gauge)
- GPU tasks processing (gauge)
- GPU tasks completed (counter)
- Task execution duration (histogram)

**Costs**:
- RunPod hourly cost (gauge)
- Total infrastructure spend (GCP + RunPod) (gauge)

**Errors**:
- RunPod API errors (counter, by type)
- SSH connection failures (counter)
- File transfer failures (counter)

### 10.3 Alerts

- **Critical**: All RunPod pods offline → Page on-call
- **Critical**: RunPod API error rate > 10% → Investigate immediately
- **Warning**: Pod count < 2 → Consider starting more pods
- **Warning**: Task queue > 50 → Scale up pods
- **Info**: New pod added to registry → Log for audit

### 10.4 Schedule

- **Daily**:
  - Review RunPod cost vs budget
  - Check for idle pods (auto-stop if idle > 5 min)
  - Audit SSH key rotation (monthly)

- **Weekly**:
  - Performance benchmarks (latency, throughput)
  - Security audit (API key validity, SSH keys)
  - Capacity planning (predict pod needs)

- **Monthly**:
  - Dependency updates (ssh2, axios)
  - Cost optimization review
  - Disaster recovery drill

---

## 11. Documentation

### 11.1 User Docs

- **Guide**: `docs/RunPod_Integration_Guide.md`
  - How to request GPU resources as an agent
  - Available GPU types and capabilities
  - Cost estimates per GPU type

- **API**: `docs/RunPod_API_Reference.md`
  - RunPod client methods
  - Tool schemas (executeOnRunPod, uploadToRunPod, etc.)

- **Examples**: `examples/runpod/`
  - Image generation agent
  - Video processing agent
  - Multi-agent coordination

### 11.2 Developer Docs

- **Architecture**: `docs/RunPod_Architecture.md`
  - System design diagram
  - Component interactions
  - Data flow

- **Comments**: JSDoc for all public APIs
- **README**: `src/cloud-providers/runpod/README.md`
  - Setup instructions
  - Development workflow
  - Testing guide

### 11.3 Operations

- **Runbook**: `docs/runbooks/RunPod_Operations.md`
  - How to add new pod
  - How to handle pod failures
  - Cost monitoring procedures

- **Troubleshooting**: `docs/troubleshooting/RunPod_Issues.md`
  - Common errors and solutions
  - SSH connection issues
  - API authentication problems

- **FAQ**: `docs/FAQ_RunPod.md`
  - "What GPU types are available?"
  - "How much does it cost?"
  - "How do I request a specific GPU?"

### 11.4 Changelog

- **v1.0** (2025-10-XX): Initial RunPod integration
  - Basic pod discovery and connection
  - SSH command execution
  - File upload/download
  - VM Router with intelligent routing

---

## 12. Evolution & Future

### 12.1 Limitations

- **Limitation 1**: No automatic pod provisioning
  - **Workaround**: Manual pod creation via RunPod dashboard
  - **Future**: Auto-provision pods based on demand

- **Limitation 2**: Single-region deployment (no multi-region routing)
  - **Workaround**: Manually select region when creating pod
  - **Future**: Geo-aware routing (route to nearest region)

- **Limitation 3**: No GPU sharing (1 task = 1 pod)
  - **Workaround**: Small tasks complete quickly, pod reused
  - **Future**: Batch multiple tasks per pod

### 12.2 Enhancements

- **Enhancement 1**: Auto-scaling pod count based on demand
  - **Description**: Automatically start/stop pods as task queue grows/shrinks
  - **Timeline**: Q1 2026

- **Enhancement 2**: Spot instance support
  - **Description**: Use RunPod spot pricing for 50-70% cost savings
  - **Timeline**: Q2 2026

- **Enhancement 3**: Multi-cloud GPU routing (RunPod + AWS + Azure)
  - **Description**: Extend VM Router to support multiple GPU cloud providers
  - **Timeline**: Q2 2026

### 12.3 Deprecation

- **What**: Manual SSH key management
- **When**: Q2 2026
- **Migration**: Automated key rotation via Doppler + Vault integration

### 12.4 Vision

- **3 months**: RunPod integration stable, 50+ pods coordinated, cost tracking complete
- **6 months**: Multi-cloud GPU support (RunPod + AWS + Azure), auto-scaling, spot instances
- **1 year**: Universal GPU orchestration layer supporting ANY cloud GPU provider, intelligent cost optimization, predictive scaling

---

**Status**: ACTIVE - Ready for implementation
**Next Action**: Phase 1 implementation (RunPod client + basic tools)
