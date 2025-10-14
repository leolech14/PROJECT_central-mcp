# 🔗 BACKEND CONNECTIONS REGISTRY - ARCHITECTURE

**Date:** 2025-10-12
**Purpose:** Consolidate all backend-frontend and external API connections into living registries
**Integration:** Enhancement to `mr-fix-my-project-please.py`

---

## 🎯 VISION

Transform `mr-fix-my-project-please.py` from:
- ✅ Incredible codebase diagrams + analysis

Into:
- ✅ Incredible codebase diagrams + analysis
- ✅ **Backend Connections Registry** (Frontend ↔ Backend)
- ✅ **External APIs Registry** (Backend ↔ External Services)
- ✅ **Commercial Readiness Panel** (Launch Blockers Checklist)

**Core Insight:** "Demãos de tinta" - Multiple simultaneous layers that differentiate internal tools from commercial platforms.

---

## 🏗️ THE 3 REGISTRIES

### Registry 1: Backend Connections (Internal)

**Purpose:** Catalog all internal infrastructure connections

**Categories:**
```yaml
databases:
  - postgres (primary, replica)
  - mongodb
  - sqlite

caching:
  - redis
  - memcached

queues:
  - rabbitmq
  - kafka
  - redis-queue

storage:
  - s3
  - cloudinary
  - local-files

auth:
  - firebase-auth
  - auth0
  - custom-jwt

search:
  - elasticsearch
  - algolia
  - typesense

realtime:
  - websockets
  - sse
  - polling
```

**Data Structure:**
```python
class BackendConnection:
    id: str                    # "postgres-prod"
    category: str              # "database"
    provider: str              # "aws-rds"
    environment: str           # "production"
    owner: str                 # "data-platform@app"

    # Connection details
    endpoints: Dict[str, str]  # {"primary": "postgres://...", "replica": "..."}
    secrets_ref: str           # "aws-secrets://rds/prod/app"

    # Health monitoring
    health_probes: List[HealthProbe]
    slo: SLODefinition
    quotas: QuotaLimits

    # Observability
    otel_service: str
    metrics: List[str]
    alerts: AlertConfig

    # Discovery metadata
    discovered_at: datetime
    used_in_files: List[str]   # Which files use this connection
    usage_patterns: List[str]  # How it's used (read, write, migrate)
```

---

### Registry 2: External APIs (External Services)

**Purpose:** Catalog all external API integrations

**Categories:**
```yaml
llm_providers:
  - openai
  - anthropic
  - openrouter
  - together-ai

payments:
  - stripe
  - paypal
  - mercadopago

email:
  - resend
  - sendgrid
  - postmark

analytics:
  - google-analytics
  - mixpanel
  - posthog

identity:
  - clerk
  - auth0
  - firebase-auth

media:
  - cloudinary
  - imgix
  - uploadcare

monitoring:
  - sentry
  - datadog
  - axiom

maps:
  - google-maps
  - mapbox
```

**Data Structure:**
```python
class ExternalAPIConnection:
    id: str                      # "openai-gpt4"
    category: str                # "llm_providers"
    provider: str                # "openai"
    environment: str             # "production"
    owner: str                   # "ai@app"

    # Connection details
    endpoints: Dict[str, str]    # {"api": "https://api.openai.com/v1"}
    auth_type: str               # "bearer", "api_key", "oauth2"
    secrets_ref: str             # "doppler://openai/prod/api_key"

    # Rate limits & quotas
    quotas: Dict[str, Any]       # {"rpm": 3500, "tpm": 90000, "rpd": 10000}
    burst_capacity: int

    # Cost tracking
    cost_model: str              # "per_token", "per_request", "flat"
    pricing: Dict[str, float]    # {"input_token": 0.03, "output_token": 0.06}
    budget_monthly: float        # 1000.00 USD
    current_spend: float         # 347.82 USD (from Langfuse)
    balance: Optional[float]     # API balance if available

    # Health & SLO
    health_probes: List[HealthProbe]
    slo: SLODefinition
    compliance: List[str]        # ["SOC2", "GDPR", "HIPAA"]

    # Usage tracking
    total_requests: int
    last_used: datetime
    top_consumers: List[str]     # Which features use this most

    # Discovery metadata
    discovered_at: datetime
    used_in_files: List[str]
    api_patterns: List[str]      # ["chat.completions", "embeddings"]
```

---

### Registry 3: Commercial Readiness

**Purpose:** Track "demãos de tinta" - layers that make something sellable

**Structure:**
```python
class CommercialReadiness:
    # Core Product
    core_functionality_tested: bool
    e2e_tests_passing: bool
    api_contracts_validated: bool

    # Identity & Auth
    authentication: {
        "oidc_oauth2": bool,
        "mfa_available": bool,
        "session_management": bool,
        "device_management": bool,
        "password_recovery": bool
    }

    # Payments
    payments: {
        "provider_configured": bool,  # Stripe, PayPal, etc.
        "plans_defined": bool,
        "trial_configured": bool,
        "refund_flow": bool,
        "webhooks_idempotent": bool,
        "taxation_handled": bool,
        "pci_compliant": bool  # SAQ-A for hosted checkout
    }

    # Email Infrastructure
    email: {
        "transactional_configured": bool,  # Login, purchase, etc.
        "marketing_with_unsubscribe": bool,
        "spf_configured": bool,
        "dkim_configured": bool,
        "dmarc_configured": bool,
        "deliverability_monitored": bool
    }

    # Support
    support: {
        "help_center": bool,
        "sla_defined": bool,
        "support_macros": bool,
        "status_page": bool,
        "incident_postmortems": bool
    }

    # Legal & Privacy
    legal: {
        "terms_of_service": bool,
        "privacy_policy": bool,
        "lgpd_gdpr_compliant": bool,
        "consent_management": bool,
        "data_retention_policy": bool,
        "dsar_process": bool  # Data Subject Access Requests
    }

    # Security
    security: {
        "secrets_in_vault": bool,  # Doppler, Vault, KMS
        "asvs_level": str,  # "L1", "L2", "L3"
        "sast_scan": bool,
        "dast_scan": bool,
        "dependency_scan": bool,
        "backup_tested": bool,
        "ssl_configured": bool
    }

    # Observability
    observability: {
        "structured_logs": bool,
        "distributed_tracing": bool,
        "metrics_collected": bool,
        "golden_signals_visible": bool,
        "alerts_configured": bool,
        "runbooks_documented": bool
    }

    # Infrastructure
    infrastructure: {
        "ci_cd_pipeline": bool,
        "rollback_capability": bool,
        "blue_green_or_canary": bool,
        "disaster_recovery": bool,
        "rto_rpo_defined": bool,
        "infrastructure_as_code": bool
    }

    # Accessibility & UX
    ux: {
        "wcag_compliant": bool,
        "i18n_configured": bool,
        "responsive_design": bool,
        "performance_optimized": bool,
        "seo_optimized": bool
    }

    # Analytics
    analytics: {
        "user_analytics": bool,
        "conversion_tracking": bool,
        "error_tracking": bool,
        "performance_monitoring": bool
    }

    # Scoring
    total_layers: int = 80  # Total checkpoints
    completed_layers: int   # How many are done
    completion_percentage: float
    blocking_layers: List[str]  # Critical missing layers
```

---

## 🔍 DISCOVERY ENGINE

### Phase 1: Codebase Scanning

**Backend Connection Detection:**
```python
BACKEND_PATTERNS = {
    'postgres': [
        r'pg\.Pool',
        r'psycopg2\.connect',
        r'postgresql://',
        r'DATABASE_URL',
        r'from sqlalchemy import'
    ],
    'redis': [
        r'redis\.Redis',
        r'redis\.createClient',
        r'ioredis',
        r'REDIS_URL'
    ],
    'mongodb': [
        r'MongoClient',
        r'mongoose\.connect',
        r'mongodb://'
    ],
    's3': [
        r'boto3\.client\([\'"]s3[\'"]\)',
        r'aws-sdk.*S3',
        r's3\.amazonaws\.com'
    ],
    'firebase': [
        r'firebase\.initializeApp',
        r'firebaseConfig',
        r'getFirestore'
    ]
}
```

**External API Detection:**
```python
EXTERNAL_API_PATTERNS = {
    'openai': [
        r'openai\.ChatCompletion',
        r'OPENAI_API_KEY',
        r'api\.openai\.com'
    ],
    'stripe': [
        r'stripe\.charges',
        r'STRIPE_SECRET_KEY',
        r'api\.stripe\.com'
    ],
    'sendgrid': [
        r'sendgrid\.SendGridAPIClient',
        r'SENDGRID_API_KEY'
    ],
    'resend': [
        r'Resend\(',
        r'RESEND_API_KEY',
        r'api\.resend\.com'
    ]
}
```

---

## 📊 HEALTH MONITORING

### Health Probe Types

```python
class HealthProbe:
    type: str  # "tcp", "http", "sql", "redis", "custom"
    target: str
    interval_seconds: int
    timeout_ms: int
    expected_response: Optional[str]
    auth_required: bool

# Examples:
probes = [
    # TCP connectivity
    HealthProbe(
        type="tcp",
        target="db.prod.internal:5432",
        interval_seconds=30,
        timeout_ms=1500
    ),

    # HTTP health endpoint
    HealthProbe(
        type="http",
        target="https://api.stripe.com/v1/charges?limit=1",
        interval_seconds=300,
        timeout_ms=5000,
        expected_response="200",
        auth_required=True
    ),

    # SQL query
    HealthProbe(
        type="sql",
        target="SELECT 1",
        interval_seconds=60,
        timeout_ms=1000
    ),

    # Redis ping
    HealthProbe(
        type="redis",
        target="redis://cache.prod:6379",
        interval_seconds=30,
        timeout_ms=500
    )
]
```

### SLO Definitions

```python
class SLODefinition:
    availability_percentage: float  # 99.9, 99.5, 95.0
    latency_p95_ms: int
    latency_p99_ms: int
    error_rate_percentage: float

    # Error budget
    error_budget_policy: str  # "halt_deployments", "alert_only", "gradual_rollback"

# Examples:
database_slo = SLODefinition(
    availability_percentage=99.9,
    latency_p95_ms=50,
    latency_p99_ms=100,
    error_rate_percentage=0.1
)

llm_slo = SLODefinition(
    availability_percentage=99.5,
    latency_p95_ms=1200,
    latency_p99_ms=3000,
    error_rate_percentage=2.0
)
```

---

## 💰 COST TRACKING

### LLM Cost Calculator

```python
class LLMCostTracker:
    provider: str
    model: str
    pricing: Dict[str, float]

    # Usage tracking
    total_input_tokens: int
    total_output_tokens: int
    total_requests: int

    # Cost calculation
    def calculate_cost(self) -> float:
        input_cost = (self.total_input_tokens / 1000) * self.pricing['input_per_1k']
        output_cost = (self.total_output_tokens / 1000) * self.pricing['output_per_1k']
        return input_cost + output_cost

    # Budget management
    budget_monthly: float
    current_spend: float
    budget_remaining: float

    def get_budget_status(self) -> str:
        usage_pct = (self.current_spend / self.budget_monthly) * 100
        if usage_pct >= 90:
            return "CRITICAL"
        elif usage_pct >= 75:
            return "WARNING"
        else:
            return "OK"

# Example:
openai_tracker = LLMCostTracker(
    provider="openai",
    model="gpt-4-turbo",
    pricing={
        "input_per_1k": 0.01,
        "output_per_1k": 0.03
    },
    budget_monthly=1000.00,
    current_spend=347.82
)
```

---

## 🎨 VISUALIZATION PANELS

### Panel 1: Backend Connections Dashboard

**Sections:**
- **Connection Topology Map** (visual graph)
- **Health Status Grid** (green/yellow/red indicators)
- **SLO Compliance** (percentage bars)
- **Quota Usage** (gauge charts)
- **Recent Errors** (timeline)

### Panel 2: External APIs Dashboard

**Sections:**
- **API Inventory** (categorized list)
- **Cost Analytics** (spending trends)
- **Budget Alerts** (warnings)
- **Rate Limit Usage** (percentage)
- **Latency Trends** (charts)
- **Provider Status** (external status pages)

### Panel 3: Commercial Readiness Scorecard

**Sections:**
- **Overall Score** (big number: 67/80 = 84%)
- **Category Breakdown** (progress bars)
- **Blocking Layers** (red alerts)
- **Recent Improvements** (timeline)
- **Next Actions** (prioritized checklist)

---

## 🔧 INTEGRATION WITH mr-fix-my-project-please.py

### New Modules:

```python
# 1. Registry Discovery
class RegistryDiscoveryEngine:
    def scan_backend_connections(self) -> List[BackendConnection]
    def scan_external_apis(self) -> List[ExternalAPIConnection]
    def assess_commercial_readiness(self) -> CommercialReadiness

# 2. Health Monitoring
class HealthMonitor:
    def execute_probes(self, connections: List[Connection]) -> Dict[str, HealthStatus]
    def calculate_slo_compliance(self, metrics: Dict) -> float
    def generate_alerts(self, violations: List[SLOViolation])

# 3. Cost Tracking
class CostAnalyzer:
    def track_llm_usage(self, requests: List[LLMRequest]) -> Dict[str, float]
    def calculate_monthly_costs(self) -> Dict[str, CostBreakdown]
    def predict_budget_exhaustion(self) -> datetime

# 4. HTML Generation
class RegistryDashboardGenerator:
    def generate_backend_panel(self, connections: List[BackendConnection]) -> str
    def generate_apis_panel(self, apis: List[ExternalAPIConnection]) -> str
    def generate_readiness_panel(self, readiness: CommercialReadiness) -> str
```

### Enhanced Output:

```python
# Existing output
report.generate_diagrams()        # Current functionality
report.generate_analysis()        # Current functionality

# NEW: Registry outputs
report.generate_registries():
    - connections_registry.yaml   # Backend connections
    - apis_registry.yaml          # External APIs
    - readiness_scorecard.yaml    # Commercial readiness

# NEW: Interactive dashboards
report.generate_dashboards():
    - backend_connections_panel.html
    - external_apis_panel.html
    - commercial_readiness_panel.html
    - unified_registry_dashboard.html  # All 3 combined
```

---

## 📋 YAML REGISTRY FORMAT

### connections_registry.yaml

```yaml
version: "1.0"
project: "my-saas-app"
generated_at: "2025-10-12T12:00:00Z"
environment: "production"

backend_connections:
  - id: postgres-prod
    category: database
    provider: aws-rds
    owner: data-platform@app
    endpoints:
      primary: postgres://db.prod.internal:5432/app
      replica: postgres://db-ro.prod.internal:5432/app
    health:
      status: healthy
      last_check: "2025-10-12T12:00:00Z"
      probes:
        - type: tcp
          interval_s: 30
        - type: sql
          query: "SELECT 1"
    slo:
      availability: 99.9%
      latency_p95_ms: 50
      current_compliance: 99.94%
    quotas:
      max_connections: 400
      current_connections: 87
    discovered_in:
      - src/database/connection.ts
      - src/models/*.ts
    usage_patterns:
      - read_queries
      - write_queries
      - migrations

external_apis:
  - id: openai-gpt4
    category: llm_providers
    provider: openai
    owner: ai@app
    endpoints:
      api: https://api.openai.com/v1
    health:
      status: healthy
      last_check: "2025-10-12T12:00:00Z"
    quotas:
      rpm: 3500
      current_rpm: 127
      tpm: 90000
      current_tpm: 4821
    cost:
      model: per_token
      pricing:
        input_per_1k: 0.01
        output_per_1k: 0.03
      budget_monthly: 1000.00
      current_spend: 347.82
      budget_status: OK
      projected_monthly: 892.45
    discovered_in:
      - src/ai/chat-completions.ts
      - src/ai/embeddings.ts
    top_consumers:
      - chat_feature: 67%
      - embeddings: 23%
      - summaries: 10%

commercial_readiness:
  overall_score: 67/80  # 84%

  identity:
    score: 4/5
    oauth2: true
    mfa: true
    session_mgmt: true
    device_mgmt: true
    password_recovery: false  # BLOCKER

  payments:
    score: 5/7
    provider: stripe
    plans: true
    trial: true
    refunds: true
    webhooks: true
    taxation: false  # BLOCKER
    pci: true  # SAQ-A

  email:
    score: 5/6
    transactional: true
    marketing: true
    spf: true
    dkim: true
    dmarc: false  # WARNING
    monitoring: true

  blocking_layers:
    - identity.password_recovery
    - payments.taxation
    - legal.dsar_process
```

---

## 🚀 IMPLEMENTATION ROADMAP

### Phase 1: Discovery (Week 1)
- ✅ Scan codebase for backend connections
- ✅ Scan codebase for external API calls
- ✅ Extract connection patterns
- ✅ Generate connections_registry.yaml

### Phase 2: Health Monitoring (Week 2)
- ✅ Implement health probe executor
- ✅ Add SLO tracking
- ✅ Create health status dashboard

### Phase 3: Cost Tracking (Week 2)
- ✅ LLM usage tracker
- ✅ Cost calculator
- ✅ Budget alerts
- ✅ Integration with Langfuse (if available)

### Phase 4: Commercial Readiness (Week 3)
- ✅ Capability scanner
- ✅ Checklist generator
- ✅ Gap analysis
- ✅ Prioritization engine

### Phase 5: Visualization (Week 3-4)
- ✅ Backend connections panel (HTML)
- ✅ External APIs panel (HTML)
- ✅ Commercial readiness scorecard (HTML)
- ✅ Unified dashboard
- ✅ Interactive topology map

### Phase 6: Integration & Polish (Week 4)
- ✅ Integrate with mr-fix-my-project-please.py
- ✅ Add CLI flags for registry generation
- ✅ Documentation
- ✅ Example outputs

---

## 🎯 SUCCESS METRICS

**For AI-Native Developers:**
- ✅ Clear visibility into "what's connected to what"
- ✅ Real-time health status of all connections
- ✅ Cost tracking for expensive APIs (LLMs)
- ✅ Commercial readiness score
- ✅ Gap analysis for "internal tool → sellable product"

**Answers These Questions:**
1. "What backend services does my app depend on?"
2. "Are all my connections healthy right now?"
3. "How much am I spending on LLM APIs this month?"
4. "What's missing to make this commercially ready?"
5. "Where are my single points of failure?"
6. "Which external APIs are approaching rate limits?"
7. "What's my compliance posture?" (LGPD, PCI, OWASP)

---

**Generated:** 2025-10-12
**By:** Claude Code (Sonnet 4.5)
**Purpose:** Bridge gap between "código que funciona" and "plataforma comercializável"
**Integration:** Enhanced mr-fix-my-project-please.py
