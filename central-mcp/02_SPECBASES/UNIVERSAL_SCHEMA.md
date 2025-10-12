# 🎯 UNIVERSAL SPECBASE SCHEMA - Official Standard

**Date**: October 10, 2025
**Status**: CANONICAL REFERENCE
**Purpose**: Define the universal schema ALL specfiles must follow

---

## 📋 NAMING CONVENTION

### Required Format:
```
SPEC_[CATEGORY]_[Feature_Name].md
```

### 5 Official Categories:

#### 1. **MODULES** - Functional Components
Feature implementations, services, APIs, tools
```
SPEC_MODULES_Agent2Agent_Integration.md
SPEC_MODULES_RunPod_GPU_Coordination.md
SPEC_MODULES_Internal_Tools_Registry.md
```

#### 2. **SCAFFOLD** - Infrastructure & Architecture
System architecture, frameworks, core structure
```
SPEC_SCAFFOLD_Multi_Cloud_VM_Router.md
SPEC_SCAFFOLD_Universal_Agent_Hub.md
SPEC_SCAFFOLD_Protocol_Bridge_Architecture.md
```

#### 3. **CONFIGURATION** - Setup & Configuration
Environment setup, credentials, deployment configs
```
SPEC_CONFIGURATION_Doppler_Secrets_Management.md
SPEC_CONFIGURATION_SSH_Key_Rotation.md
SPEC_CONFIGURATION_Multi_Environment_Setup.md
```

#### 4. **GOVERNANCE** - Policies & Standards
Security policies, compliance, code standards
```
SPEC_GOVERNANCE_API_Key_Security_Policy.md
SPEC_GOVERNANCE_Code_Review_Standards.md
SPEC_GOVERNANCE_Cost_Optimization_Rules.md
```

#### 5. **OPS** - Operations & Maintenance
Monitoring, logging, incident response, SRE
```
SPEC_OPS_Health_Monitoring_System.md
SPEC_OPS_Cost_Tracking_Dashboard.md
SPEC_OPS_Incident_Response_Protocol.md
```

---

## 📊 SECTION 0: YAML FRONTMATTER (CI/CD Driver)

### Purpose
**Section 0 = YAML Frontmatter** is the CI/CD configuration that:
- Defines spec metadata
- Drives the 12-section structure
- Enables automated validation
- Tracks dependencies and status
- Generates documentation

### Required Schema:
```yaml
---
spec_id: CMCP-[CATEGORY]-NNN       # Unique ID with category
title: "Full Descriptive Title"    # Human-readable name
version: 1.0                        # Semantic version
created: 2025-10-10                 # ISO date
updated: 2025-10-10                 # ISO date
status: DRAFT|ACTIVE|DEPRECATED     # Lifecycle status
type: FEATURE|INTEGRATION|API       # Implementation type
layer: UI|API|CORE|PROTOCOL|INFRA  # Architecture layer
category: MODULES|SCAFFOLD|CONFIG|GOVERNANCE|OPS  # Primary category
priority: P0|P1|P2|P3              # Priority level
estimated_hours: 16                 # Time estimate
assigned_agent: AGENT_ID|UNASSIGNED # Owner
dependencies: [SPEC_IDs]            # Blocking dependencies
tags: [searchable, keywords]        # Tags for discovery
authors: [names]                    # Who wrote it
reviewers: [names]                  # Who reviewed it
ci_cd:                              # CI/CD automation
  auto_validate: true               # Automatic validation
  required_sections: [1,2,3,4,5,6,7,8,9,10,11,12]  # All 12 required
  generate_docs: true               # Auto-generate from spec
  track_progress: true              # Track implementation
---
```

---

## 📐 THE 12 MANDATORY SECTIONS

**Section 0** (Frontmatter) drives these **12 sections**:

### 1. Purpose & Overview
- What, Why, Who, When
- Success criteria (measurable)

### 2. Functional Requirements
- Core functionality (REQ-NNN)
- User interactions (INT-NNN)
- System behavior (BEH-NNN)
- Edge cases (EDGE-NNN)

### 3. Performance Requirements
- Response time targets
- Throughput targets
- Resource usage limits
- Scalability requirements

### 4. Quality Requirements
- Code quality (coverage, complexity)
- Standards (WCAG, RESTful, security)
- Maintainability (review, linting)

### 5. Testing Specifications
- Unit tests (≥85% coverage)
- Integration tests (scenarios)
- E2E tests (user flows)
- Performance tests (benchmarks)

### 6. Implementation Details
- Technology stack
- File structure
- Key algorithms
- Data models

### 7. Dependencies & Integration
- Internal dependencies (spec IDs)
- External dependencies (packages)
- Integration points
- Breaking changes

### 8. Acceptance Criteria
- Functional checkboxes
- Performance checkboxes
- Quality checkboxes
- Integration checkboxes

### 9. Deployment Plan
- Strategy (blue-green, canary, rolling)
- Configuration (dev, staging, prod)
- Migration steps
- Rollback procedure

### 10. Maintenance & Monitoring
- Health checks
- Metrics (gauges, counters, histograms)
- Alerts (critical, warning, info)
- Maintenance schedule

### 11. Documentation
- User docs (guides, API, examples)
- Developer docs (architecture, comments, README)
- Operations (runbooks, troubleshooting, FAQ)
- Changelog

### 12. Evolution & Future
- Current limitations + workarounds
- Planned enhancements + timeline
- Deprecation plan
- Long-term vision (3m, 6m, 1y)

---

## 🔄 CI/CD AUTOMATION

### Spec Validation Pipeline
```yaml
# .github/workflows/spec-validation.yml
name: Spec Validation
on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Check YAML Frontmatter
        run: node scripts/validate-frontmatter.js

      - name: Check 12 Sections Present
        run: node scripts/validate-sections.js

      - name: Check Dependencies Valid
        run: node scripts/validate-dependencies.js

      - name: Check Naming Convention
        run: node scripts/validate-naming.js
```

### Auto-Generated Artifacts
From YAML frontmatter:
- **Dependency Graph**: Visual map of spec dependencies
- **Progress Dashboard**: Implementation status tracking
- **API Documentation**: Auto-generated from specs
- **Test Coverage Report**: Per-spec coverage metrics

---

## 📋 SPEC LIFECYCLE

### States:
1. **DRAFT** - Being written, not reviewed
2. **REVIEW** - Under review, not approved
3. **ACTIVE** - Approved, being implemented or in use
4. **DEPRECATED** - Superseded, being phased out
5. **ARCHIVED** - Historical reference only

### Transitions:
```
DRAFT → REVIEW (when PR submitted)
REVIEW → ACTIVE (when approved by 2+ reviewers)
ACTIVE → DEPRECATED (when superseded)
DEPRECATED → ARCHIVED (after migration complete)
```

---

## 🎯 CATEGORY DECISION TREE

**Which category should I use?**

```
Is it a functional feature or tool?
├─ YES → MODULES
└─ NO ↓

Is it architecture or framework?
├─ YES → SCAFFOLD
└─ NO ↓

Is it configuration or setup?
├─ YES → CONFIGURATION
└─ NO ↓

Is it policy or standards?
├─ YES → GOVERNANCE
└─ NO ↓

Is it operations or monitoring?
└─ YES → OPS
```

---

## ✅ VALIDATION CHECKLIST

### File Naming
- [ ] Follows pattern: `SPEC_[CATEGORY]_[Name].md`
- [ ] Category is one of: MODULES, SCAFFOLD, CONFIGURATION, GOVERNANCE, OPS
- [ ] Name is PascalCase with underscores

### YAML Frontmatter
- [ ] All required fields present
- [ ] spec_id follows pattern: `CMCP-[CATEGORY]-NNN`
- [ ] Category in frontmatter matches filename category
- [ ] Dependencies reference valid spec IDs
- [ ] Status is valid: DRAFT|REVIEW|ACTIVE|DEPRECATED|ARCHIVED

### Content Structure
- [ ] All 12 sections present
- [ ] Each section has required subsections
- [ ] Requirements have test criteria
- [ ] Performance targets specified
- [ ] Acceptance criteria checkboxes present

### Quality
- [ ] No typos or grammar errors
- [ ] Code examples valid
- [ ] Links reference existing files
- [ ] Diagrams clear and accurate

---

## 📊 EXAMPLE: PROPER SPEC

**Filename**: `SPEC_MODULES_RunPod_GPU_Integration.md`

**Category**: MODULES (functional feature)

**Frontmatter**:
```yaml
---
spec_id: CMCP-MODULES-002
title: "RunPod GPU Integration - Multi-Cloud VM Coordination"
category: MODULES
layer: INFRASTRUCTURE
priority: P1-High
dependencies: [CMCP-MODULES-001, CMCP-CONFIGURATION-001]
---
```

**Sections**: All 12 sections present with required content

---

## 🚀 BENEFITS OF THIS SCHEMA

### For Developers
- ✅ Clear structure, easy to follow
- ✅ Know exactly what to include
- ✅ Automated validation catches errors

### For Project Management
- ✅ Track dependencies automatically
- ✅ Calculate implementation time from estimates
- ✅ Monitor progress via CI/CD

### For Documentation
- ✅ Auto-generate API docs
- ✅ Build dependency graphs
- ✅ Create progress dashboards

### For Quality
- ✅ Enforced standards
- ✅ Required test coverage
- ✅ Mandatory acceptance criteria

---

## 📖 RELATED DOCUMENTATION

- `TEMPLATE_OFFICIAL_V1.md` - The canonical template
- `SPECBASE_STATUS_REPORT.md` - Current state audit
- `scripts/validate-spec.ts` - Validation tool
- `scripts/create-spec.ts` - Spec generator

---

## 🎯 MIGRATION PLAN

### Phase 1: Fix Existing Specs (This Week)
- [ ] Rename to follow category naming
- [ ] Update frontmatter with category field
- [ ] Ensure all 12 sections present

### Phase 2: Create Validation Tools (This Week)
- [ ] Frontmatter validator
- [ ] Section structure validator
- [ ] Dependency checker
- [ ] Naming convention checker

### Phase 3: CI/CD Integration (Next Week)
- [ ] GitHub Actions workflow
- [ ] Automated documentation generation
- [ ] Dependency graph visualization

---

**Status**: CANONICAL - This is the official schema
**Applies To**: ALL future specfiles
**Enforcement**: Automated via CI/CD

---

**Next Action**: Migrate all existing specs to this schema!
