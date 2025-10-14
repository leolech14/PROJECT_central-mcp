#!/usr/bin/env python3
"""
🔗 BACKEND CONNECTIONS REGISTRY - DISCOVERY ENGINE
===================================================

Scans codebases to discover and catalog:
1. Backend connections (DB, Cache, Queue, Storage, Auth)
2. External API integrations (LLM, Payments, Email, Analytics)
3. Commercial readiness assessment

Integration: Enhanced module for mr-fix-my-project-please.py
"""

import re
import os
import json
import yaml
from pathlib import Path
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, asdict, field
from datetime import datetime
from collections import defaultdict

# ═══════════════════════════════════════════════════════════════
# DATA STRUCTURES
# ═══════════════════════════════════════════════════════════════

@dataclass
class HealthProbe:
    type: str  # "tcp", "http", "sql", "redis", "custom"
    target: str
    interval_seconds: int = 60
    timeout_ms: int = 5000
    expected_response: Optional[str] = None
    auth_required: bool = False

@dataclass
class SLODefinition:
    availability_percentage: float  # 99.9, 99.5, 95.0
    latency_p95_ms: int
    latency_p99_ms: int
    error_rate_percentage: float
    error_budget_policy: str = "alert_only"  # "halt_deployments", "gradual_rollback"

@dataclass
class QuotaLimits:
    max_connections: Optional[int] = None
    rpm: Optional[int] = None  # Requests per minute
    tpm: Optional[int] = None  # Tokens per minute
    burst_capacity: Optional[int] = None
    daily_limit: Optional[int] = None

@dataclass
class CostTracking:
    model: str  # "per_token", "per_request", "flat", "tiered"
    currency: str = "USD"
    pricing: Optional[Dict[str, float]] = None
    budget_monthly: Optional[float] = None
    current_spend: Optional[float] = None
    projected_monthly: Optional[float] = None

@dataclass
class BackendConnection:
    id: str
    category: str  # "database", "cache", "queue", "storage", "auth", "search"
    provider: str
    environment: str = "production"
    owner: Optional[str] = None

    # Connection details
    endpoints: Dict[str, str] = field(default_factory=dict)
    secrets_ref: Optional[str] = None

    # Health & monitoring
    health_probes: List[HealthProbe] = field(default_factory=list)
    slo: Optional[SLODefinition] = None
    quotas: Optional[QuotaLimits] = None

    # Discovery metadata
    discovered_at: str = field(default_factory=lambda: datetime.now().isoformat())
    discovered_in_files: List[str] = field(default_factory=list)
    usage_patterns: List[str] = field(default_factory=list)

@dataclass
class ExternalAPIConnection:
    id: str
    category: str  # "llm", "payments", "email", "analytics", "identity", "media"
    provider: str
    environment: str = "production"
    owner: Optional[str] = None

    # Connection details
    endpoints: Dict[str, str] = field(default_factory=dict)
    auth_type: str = "api_key"  # "bearer", "oauth2", "basic"
    secrets_ref: Optional[str] = None

    # Rate limits & quotas
    quotas: Optional[QuotaLimits] = None

    # Cost tracking
    cost: Optional[CostTracking] = None

    # Health & SLO
    health_probes: List[HealthProbe] = field(default_factory=list)
    slo: Optional[SLODefinition] = None
    compliance: List[str] = field(default_factory=list)

    # Usage tracking
    total_requests: int = 0
    last_used: Optional[str] = None
    top_consumers: Dict[str, float] = field(default_factory=dict)

    # Discovery metadata
    discovered_at: str = field(default_factory=lambda: datetime.now().isoformat())
    discovered_in_files: List[str] = field(default_factory=list)
    api_patterns: List[str] = field(default_factory=list)

@dataclass
class CommercialReadinessCategory:
    name: str
    score: int
    max_score: int
    items: Dict[str, bool] = field(default_factory=dict)
    blockers: List[str] = field(default_factory=list)

@dataclass
class CommercialReadiness:
    overall_score: int = 0
    max_score: int = 80
    completion_percentage: float = 0.0

    # Categories
    identity: Optional[CommercialReadinessCategory] = None
    payments: Optional[CommercialReadinessCategory] = None
    email: Optional[CommercialReadinessCategory] = None
    support: Optional[CommercialReadinessCategory] = None
    legal: Optional[CommercialReadinessCategory] = None
    security: Optional[CommercialReadinessCategory] = None
    observability: Optional[CommercialReadinessCategory] = None
    infrastructure: Optional[CommercialReadinessCategory] = None
    ux: Optional[CommercialReadinessCategory] = None
    analytics: Optional[CommercialReadinessCategory] = None

    blocking_layers: List[str] = field(default_factory=list)

# ═══════════════════════════════════════════════════════════════
# DETECTION PATTERNS
# ═══════════════════════════════════════════════════════════════

BACKEND_PATTERNS = {
    'postgres': {
        'patterns': [
            r'pg\.Pool',
            r'psycopg2\.connect',
            r'postgresql://',
            r'DATABASE_URL.*postgres',
            r'from sqlalchemy import',
            r'import psycopg',
        ],
        'category': 'database',
        'provider': 'postgresql',
        'usage_indicators': {
            'read': [r'\.execute\(.*SELECT', r'\.query\('],
            'write': [r'\.execute\(.*INSERT', r'\.execute\(.*UPDATE', r'\.execute\(.*DELETE'],
            'migrate': [r'alembic', r'migrations/', r'prisma migrate']
        }
    },
    'mongodb': {
        'patterns': [
            r'MongoClient',
            r'mongoose\.connect',
            r'mongodb://',
            r'MONGODB_URI',
        ],
        'category': 'database',
        'provider': 'mongodb',
    },
    'redis': {
        'patterns': [
            r'redis\.Redis',
            r'redis\.createClient',
            r'ioredis',
            r'REDIS_URL',
            r'from redis import',
        ],
        'category': 'cache',
        'provider': 'redis',
    },
    's3': {
        'patterns': [
            r'boto3\.client\([\'"]s3[\'"]\)',
            r'aws-sdk.*S3',
            r's3\.amazonaws\.com',
            r'AWS_S3_BUCKET',
        ],
        'category': 'storage',
        'provider': 'aws-s3',
    },
    'firebase': {
        'patterns': [
            r'firebase\.initializeApp',
            r'firebaseConfig',
            r'getFirestore',
            r'getAuth',
            r'firebase/app',
        ],
        'category': 'backend-as-service',
        'provider': 'firebase',
    },
}

EXTERNAL_API_PATTERNS = {
    'openai': {
        'patterns': [
            r'openai\.ChatCompletion',
            r'OPENAI_API_KEY',
            r'api\.openai\.com',
            r'from openai import',
        ],
        'category': 'llm',
        'provider': 'openai',
        'cost_model': 'per_token',
        'compliance': ['SOC2', 'GDPR'],
    },
    'anthropic': {
        'patterns': [
            r'anthropic\.Anthropic',
            r'ANTHROPIC_API_KEY',
            r'api\.anthropic\.com',
            r'from anthropic import',
        ],
        'category': 'llm',
        'provider': 'anthropic',
        'cost_model': 'per_token',
    },
    'stripe': {
        'patterns': [
            r'stripe\.charges',
            r'STRIPE_SECRET_KEY',
            r'api\.stripe\.com',
            r'import stripe',
        ],
        'category': 'payments',
        'provider': 'stripe',
        'compliance': ['PCI-DSS', 'SOC2'],
    },
    'sendgrid': {
        'patterns': [
            r'sendgrid\.SendGridAPIClient',
            r'SENDGRID_API_KEY',
            r'api\.sendgrid\.com',
        ],
        'category': 'email',
        'provider': 'sendgrid',
    },
    'resend': {
        'patterns': [
            r'Resend\(',
            r'RESEND_API_KEY',
            r'api\.resend\.com',
        ],
        'category': 'email',
        'provider': 'resend',
    },
}

COMMERCIAL_READINESS_PATTERNS = {
    'identity': {
        'oauth2': [r'oauth2', r'oidc', r'openid-connect'],
        'mfa': [r'totp', r'mfa', r'two-factor', r'2fa'],
        'session_mgmt': [r'express-session', r'cookie-session', r'jwt'],
        'password_recovery': [r'forgot-password', r'reset-password'],
    },
    'payments': {
        'provider': [r'stripe', r'paypal', r'mercadopago'],
        'plans': [r'subscription', r'pricing', r'plans'],
        'trial': [r'trial', r'free-tier'],
        'webhooks': [r'webhook', r'stripe-webhook'],
    },
    'email': {
        'transactional': [r'sendgrid', r'resend', r'postmark', r'ses'],
        'spf': [r'spf', r'sender-policy-framework'],
        'dkim': [r'dkim', r'domain-keys'],
    },
    'security': {
        'secrets_vault': [r'doppler', r'vault', r'aws-secrets', r'kms'],
        'ssl': [r'https', r'ssl', r'tls'],
    },
}

# ═══════════════════════════════════════════════════════════════
# REGISTRY DISCOVERY ENGINE
# ═══════════════════════════════════════════════════════════════

class RegistryDiscoveryEngine:
    """
    Scans codebase to discover connections and assess commercial readiness.
    """

    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.backend_connections: List[BackendConnection] = []
        self.external_apis: List[ExternalAPIConnection] = []
        self.commercial_readiness: Optional[CommercialReadiness] = None

        # Exclude patterns
        self.exclude_dirs = {
            'node_modules', '.git', '.next', 'dist', 'build',
            '__pycache__', '.venv', 'venv', 'coverage'
        }
        self.include_extensions = {
            '.py', '.js', '.ts', '.tsx', '.jsx',
            '.go', '.java', '.rb', '.php', '.cs'
        }

    def scan_all(self) -> Dict[str, Any]:
        """
        Run complete scan: backend connections + external APIs + commercial readiness.
        """
        print("🔍 Starting Registry Discovery Scan...")

        # Phase 1: Scan backend connections
        print("\n📊 Phase 1: Scanning Backend Connections...")
        self.backend_connections = self.scan_backend_connections()
        print(f"   ✅ Found {len(self.backend_connections)} backend connections")

        # Phase 2: Scan external APIs
        print("\n🌐 Phase 2: Scanning External APIs...")
        self.external_apis = self.scan_external_apis()
        print(f"   ✅ Found {len(self.external_apis)} external API integrations")

        # Phase 3: Assess commercial readiness
        print("\n🎯 Phase 3: Assessing Commercial Readiness...")
        self.commercial_readiness = self.assess_commercial_readiness()
        print(f"   ✅ Commercial Readiness: {self.commercial_readiness.completion_percentage:.1f}%")

        return {
            'backend_connections': [asdict(conn) for conn in self.backend_connections],
            'external_apis': [asdict(api) for api in self.external_apis],
            'commercial_readiness': asdict(self.commercial_readiness),
        }

    def scan_backend_connections(self) -> List[BackendConnection]:
        """
        Scan codebase for backend connections (DB, Cache, Queue, Storage, etc.)
        """
        connections = []
        file_matches = defaultdict(list)  # connection_type -> [files]

        # Scan all code files
        for file_path in self._get_code_files():
            try:
                content = file_path.read_text(encoding='utf-8', errors='ignore')

                # Check each backend pattern
                for conn_type, config in BACKEND_PATTERNS.items():
                    for pattern in config['patterns']:
                        if re.search(pattern, content, re.IGNORECASE):
                            file_matches[conn_type].append(str(file_path.relative_to(self.project_path)))
                            break  # Found in this file, move to next connection type

            except Exception as e:
                print(f"   ⚠️  Error reading {file_path}: {e}")
                continue

        # Create BackendConnection objects
        for conn_type, files in file_matches.items():
            config = BACKEND_PATTERNS[conn_type]

            connection = BackendConnection(
                id=f"{conn_type}-prod",
                category=config['category'],
                provider=config['provider'],
                discovered_in_files=files,
                usage_patterns=self._detect_usage_patterns(files, config.get('usage_indicators', {})),
            )

            # Add default health probes
            connection.health_probes = self._create_default_health_probes(conn_type, config)

            # Add default SLO
            connection.slo = self._create_default_slo(config['category'])

            connections.append(connection)

        return connections

    def scan_external_apis(self) -> List[ExternalAPIConnection]:
        """
        Scan codebase for external API integrations (LLM, Payments, Email, etc.)
        """
        apis = []
        file_matches = defaultdict(list)  # api_provider -> [files]

        # Scan all code files
        for file_path in self._get_code_files():
            try:
                content = file_path.read_text(encoding='utf-8', errors='ignore')

                # Check each external API pattern
                for api_provider, config in EXTERNAL_API_PATTERNS.items():
                    for pattern in config['patterns']:
                        if re.search(pattern, content, re.IGNORECASE):
                            file_matches[api_provider].append(str(file_path.relative_to(self.project_path)))
                            break

            except Exception as e:
                continue

        # Create ExternalAPIConnection objects
        for api_provider, files in file_matches.items():
            config = EXTERNAL_API_PATTERNS[api_provider]

            api = ExternalAPIConnection(
                id=f"{api_provider}-prod",
                category=config['category'],
                provider=config['provider'],
                discovered_in_files=files,
                compliance=config.get('compliance', []),
            )

            # Add cost tracking for LLM providers
            if config['category'] == 'llm':
                api.cost = self._create_default_cost_tracking(api_provider)

            # Add default health probes
            api.health_probes = self._create_api_health_probes(api_provider, config)

            # Add default SLO
            api.slo = self._create_default_slo(config['category'])

            apis.append(api)

        return apis

    def assess_commercial_readiness(self) -> CommercialReadiness:
        """
        Assess commercial readiness by scanning for capabilities.
        """
        readiness = CommercialReadiness()

        # Scan all code files for commercial readiness patterns
        pattern_matches = defaultdict(lambda: defaultdict(list))  # category -> capability -> [files]

        for file_path in self._get_code_files():
            try:
                content = file_path.read_text(encoding='utf-8', errors='ignore')

                for category, capabilities in COMMERCIAL_READINESS_PATTERNS.items():
                    for capability, patterns in capabilities.items():
                        for pattern in patterns:
                            if re.search(pattern, content, re.IGNORECASE):
                                pattern_matches[category][capability].append(str(file_path.relative_to(self.project_path)))
                                break

            except Exception as e:
                continue

        # Build categories
        readiness.identity = self._build_identity_category(pattern_matches.get('identity', {}))
        readiness.payments = self._build_payments_category(pattern_matches.get('payments', {}))
        readiness.email = self._build_email_category(pattern_matches.get('email', {}))
        readiness.security = self._build_security_category(pattern_matches.get('security', {}))

        # Calculate overall score
        categories = [
            readiness.identity,
            readiness.payments,
            readiness.email,
            readiness.security,
        ]

        total_score = sum(cat.score for cat in categories if cat)
        max_score = sum(cat.max_score for cat in categories if cat)

        readiness.overall_score = total_score
        readiness.max_score = max_score
        readiness.completion_percentage = (total_score / max_score * 100) if max_score > 0 else 0

        # Collect blocking layers
        for cat in categories:
            if cat:
                readiness.blocking_layers.extend(cat.blockers)

        return readiness

    # ═══════════════════════════════════════════════════════════════
    # HELPER METHODS
    # ═══════════════════════════════════════════════════════════════

    def _get_code_files(self):
        """Iterator for all code files in project."""
        for root, dirs, files in os.walk(self.project_path):
            # Exclude directories
            dirs[:] = [d for d in dirs if d not in self.exclude_dirs]

            for file in files:
                file_path = Path(root) / file
                if file_path.suffix in self.include_extensions:
                    yield file_path

    def _detect_usage_patterns(self, files: List[str], indicators: Dict[str, List[str]]) -> List[str]:
        """Detect how a connection is used (read, write, migrate, etc.)"""
        patterns = []
        # Simplified - in real implementation, would scan files for usage patterns
        if indicators:
            patterns = list(indicators.keys())
        return patterns

    def _create_default_health_probes(self, conn_type: str, config: Dict) -> List[HealthProbe]:
        """Create default health probes based on connection type."""
        probes = []

        if config['category'] == 'database':
            probes.append(HealthProbe(
                type="sql",
                target="SELECT 1",
                interval_seconds=60,
                timeout_ms=1000
            ))
        elif config['category'] == 'cache':
            probes.append(HealthProbe(
                type="redis",
                target="PING",
                interval_seconds=30,
                timeout_ms=500
            ))

        return probes

    def _create_api_health_probes(self, api_provider: str, config: Dict) -> List[HealthProbe]:
        """Create default health probes for external APIs."""
        return [
            HealthProbe(
                type="http",
                target=f"health_check_endpoint",
                interval_seconds=300,
                timeout_ms=5000,
                auth_required=True
            )
        ]

    def _create_default_slo(self, category: str) -> SLODefinition:
        """Create default SLO based on category."""
        slos = {
            'database': SLODefinition(99.9, 50, 100, 0.1),
            'cache': SLODefinition(99.5, 10, 50, 0.5),
            'llm': SLODefinition(99.5, 1200, 3000, 2.0),
            'payments': SLODefinition(99.9, 300, 1000, 0.1),
            'email': SLODefinition(99.5, 500, 2000, 1.0),
        }
        return slos.get(category, SLODefinition(99.0, 500, 1000, 1.0))

    def _create_default_cost_tracking(self, api_provider: str) -> CostTracking:
        """Create default cost tracking for LLM providers."""
        pricing = {
            'openai': {'input_per_1k': 0.01, 'output_per_1k': 0.03},
            'anthropic': {'input_per_1k': 0.008, 'output_per_1k': 0.024},
        }

        return CostTracking(
            model="per_token",
            currency="USD",
            pricing=pricing.get(api_provider, {}),
            budget_monthly=1000.00,
        )

    def _build_identity_category(self, matches: Dict) -> CommercialReadinessCategory:
        """Build identity category from pattern matches."""
        items = {
            'oauth2': bool(matches.get('oauth2')),
            'mfa': bool(matches.get('mfa')),
            'session_mgmt': bool(matches.get('session_mgmt')),
            'password_recovery': bool(matches.get('password_recovery')),
        }

        blockers = [f"identity.{k}" for k, v in items.items() if not v and k in ['oauth2', 'password_recovery']]

        return CommercialReadinessCategory(
            name="Identity & Auth",
            score=sum(items.values()),
            max_score=len(items),
            items=items,
            blockers=blockers
        )

    def _build_payments_category(self, matches: Dict) -> CommercialReadinessCategory:
        """Build payments category."""
        items = {
            'provider': bool(matches.get('provider')),
            'plans': bool(matches.get('plans')),
            'trial': bool(matches.get('trial')),
            'webhooks': bool(matches.get('webhooks')),
        }

        blockers = [f"payments.{k}" for k, v in items.items() if not v and k in ['provider', 'webhooks']]

        return CommercialReadinessCategory(
            name="Payments",
            score=sum(items.values()),
            max_score=len(items),
            items=items,
            blockers=blockers
        )

    def _build_email_category(self, matches: Dict) -> CommercialReadinessCategory:
        """Build email category."""
        items = {
            'transactional': bool(matches.get('transactional')),
            'spf': bool(matches.get('spf')),
            'dkim': bool(matches.get('dkim')),
        }

        blockers = [f"email.{k}" for k, v in items.items() if not v and k == 'transactional']

        return CommercialReadinessCategory(
            name="Email Infrastructure",
            score=sum(items.values()),
            max_score=len(items),
            items=items,
            blockers=blockers
        )

    def _build_security_category(self, matches: Dict) -> CommercialReadinessCategory:
        """Build security category."""
        items = {
            'secrets_vault': bool(matches.get('secrets_vault')),
            'ssl': bool(matches.get('ssl')),
        }

        blockers = [f"security.{k}" for k, v in items.items() if not v]

        return CommercialReadinessCategory(
            name="Security",
            score=sum(items.values()),
            max_score=len(items),
            items=items,
            blockers=blockers
        )

    # ═══════════════════════════════════════════════════════════════
    # OUTPUT GENERATION
    # ═══════════════════════════════════════════════════════════════

    def export_to_yaml(self, output_path: str):
        """Export registries to YAML file."""
        data = {
            'version': '1.0',
            'project': self.project_path.name,
            'generated_at': datetime.now().isoformat(),
            'environment': 'production',
            'backend_connections': [asdict(conn) for conn in self.backend_connections],
            'external_apis': [asdict(api) for api in self.external_apis],
            'commercial_readiness': asdict(self.commercial_readiness) if self.commercial_readiness else None,
        }

        with open(output_path, 'w') as f:
            yaml.dump(data, f, default_flow_style=False, sort_keys=False)

        print(f"✅ Registry exported to: {output_path}")

    def export_to_json(self, output_path: str):
        """Export registries to JSON file."""
        data = self.scan_all()

        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"✅ Registry exported to: {output_path}")


# ═══════════════════════════════════════════════════════════════
# CLI INTERFACE
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python registry_discovery_engine.py <project_path> [output_format]")
        print("  output_format: yaml (default) or json")
        sys.exit(1)

    project_path = sys.argv[1]
    output_format = sys.argv[2] if len(sys.argv) > 2 else 'yaml'

    # Initialize engine
    engine = RegistryDiscoveryEngine(project_path)

    # Run scan
    results = engine.scan_all()

    # Export results
    output_file = f"connections_registry.{output_format}"
    if output_format == 'yaml':
        engine.export_to_yaml(output_file)
    else:
        engine.export_to_json(output_file)

    # Print summary
    print("\n" + "="*60)
    print("📊 REGISTRY DISCOVERY SUMMARY")
    print("="*60)
    print(f"Backend Connections: {len(engine.backend_connections)}")
    print(f"External APIs: {len(engine.external_apis)}")
    if engine.commercial_readiness:
        print(f"Commercial Readiness: {engine.commercial_readiness.completion_percentage:.1f}%")
        if engine.commercial_readiness.blocking_layers:
            print(f"\n🚨 Blocking Layers ({len(engine.commercial_readiness.blocking_layers)}):")
            for blocker in engine.commercial_readiness.blocking_layers:
                print(f"   - {blocker}")
    print("="*60)
