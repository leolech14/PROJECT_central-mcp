#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# ENTERPRISE-GRADE 24/7 MONITORING DEPLOYMENT
# ═══════════════════════════════════════════════════════════════════════════
#
# Deploys complete observability stack:
# - Prometheus (metrics collection)
# - Grafana (visualization)
# - AlertManager (alerting)
# - Node Exporter (system metrics)
# - All configured for Central-MCP monitoring
#
# ═══════════════════════════════════════════════════════════════════════════

set -e

VM_HOST="lech_walesa2000@34.41.115.199"
VM_ZONE="us-central1-a"
INSTANCE_NAME="central-mcp-server"

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   🚀 DEPLOYING ENTERPRISE MONITORING STACK                   ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# STEP 1: CREATE MONITORING CONFIGURATION FILES
# ═══════════════════════════════════════════════════════════════════════════

echo "📝 Creating monitoring configuration files..."

# Create Prometheus configuration
cat > prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'central-mcp'
    environment: 'production'

# AlertManager configuration
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

# Load alert rules
rule_files:
  - '/etc/prometheus/alert_rules.yml'

# Scrape configurations
scrape_configs:
  # Central-MCP application metrics
  - job_name: 'central-mcp'
    static_configs:
      - targets: ['host.docker.internal:8001']
        labels:
          service: 'central-mcp-core'

  # Node Exporter (system metrics)
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
        labels:
          service: 'system'

  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
        labels:
          service: 'prometheus'
EOF

# Create alert rules
cat > alert_rules.yml << 'EOF'
groups:
  - name: central_mcp_alerts
    interval: 30s
    rules:
      # System health alerts
      - alert: HighCPUUsage
        expr: node_cpu_seconds_total{mode="idle"} < 20
        for: 5m
        labels:
          severity: warning
          component: system
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is above 80% for 5 minutes"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: critical
          component: system
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 90% for 5 minutes"

      - alert: DiskSpaceRunningOut
        expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) < 0.1
        for: 5m
        labels:
          severity: warning
          component: system
        annotations:
          summary: "Disk space running low"
          description: "Less than 10% disk space available"

      # Central-MCP specific alerts
      - alert: AutoProactiveLoopDown
        expr: central_mcp_loop_execution_count{loop_name=~".*"} == 0
        for: 10m
        labels:
          severity: critical
          component: auto-proactive
        annotations:
          summary: "Auto-Proactive loop stopped"
          description: "Loop {{ $labels.loop_name }} has not executed in 10 minutes"

      - alert: NoActiveAgents
        expr: central_mcp_active_agents_total == 0
        for: 15m
        labels:
          severity: warning
          component: agents
        annotations:
          summary: "No active agents detected"
          description: "No agents have connected in 15 minutes"

      - alert: HighTaskFailureRate
        expr: rate(central_mcp_task_completions_total{status="failed"}[5m]) > 0.2
        for: 5m
        labels:
          severity: warning
          component: tasks
        annotations:
          summary: "High task failure rate"
          description: "More than 20% of tasks are failing"

      - alert: CentralMCPDown
        expr: up{job="central-mcp"} == 0
        for: 2m
        labels:
          severity: critical
          component: system
        annotations:
          summary: "Central-MCP is down"
          description: "Central-MCP server is not responding"
EOF

# Create AlertManager configuration
cat > alertmanager.yml << 'EOF'
global:
  resolve_timeout: 5m

# Route configuration
route:
  receiver: 'default-receiver'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h

  routes:
    # Critical alerts - immediate notification
    - match:
        severity: critical
      receiver: 'critical-alerts'
      continue: true

    # Warning alerts - grouped notifications
    - match:
        severity: warning
      receiver: 'warning-alerts'
      group_wait: 30s
      group_interval: 5m

# Receiver configurations
receivers:
  - name: 'default-receiver'
    # Placeholder - configure your notification channels

  - name: 'critical-alerts'
    # Example: Slack webhook
    # slack_configs:
    #   - api_url: 'YOUR_SLACK_WEBHOOK_URL'
    #     channel: '#central-mcp-alerts'
    #     title: '🚨 CRITICAL: {{ .GroupLabels.alertname }}'
    #     text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'warning-alerts'
    # Example: Email notifications
    # email_configs:
    #   - to: 'team@example.com'
    #     from: 'alertmanager@central-mcp.com'
    #     smarthost: 'smtp.gmail.com:587'

# Inhibition rules (prevent alert spam)
inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'cluster', 'service']
EOF

# Create Docker Compose stack
cat > docker-compose.monitoring.yml << 'EOF'
version: '3.8'

services:
  # Prometheus - Time-series database & metrics collection
  prometheus:
    image: prom/prometheus:latest
    container_name: central-mcp-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./alert_rules.yml:/etc/prometheus/alert_rules.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    networks:
      - monitoring
    extra_hosts:
      - "host.docker.internal:host-gateway"

  # Grafana - Visualization & dashboards
  grafana:
    image: grafana/grafana:latest
    container_name: central-mcp-grafana
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=central-mcp-2025
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_ROOT_URL=http://34.41.115.199:3000
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana-provisioning:/etc/grafana/provisioning:ro
    networks:
      - monitoring
    depends_on:
      - prometheus

  # AlertManager - Alert routing & notifications
  alertmanager:
    image: prom/alertmanager:latest
    container_name: central-mcp-alertmanager
    restart: unless-stopped
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
      - alertmanager-data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
    networks:
      - monitoring

  # Node Exporter - System metrics
  node-exporter:
    image: prom/node-exporter:latest
    container_name: central-mcp-node-exporter
    restart: unless-stopped
    ports:
      - "9100:9100"
    command:
      - '--path.rootfs=/host'
    volumes:
      - /:/host:ro,rslave
    networks:
      - monitoring

networks:
  monitoring:
    driver: bridge

volumes:
  prometheus-data:
  grafana-data:
  alertmanager-data:
EOF

# Create Grafana provisioning (auto-configure Prometheus datasource)
mkdir -p grafana-provisioning/datasources
cat > grafana-provisioning/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
EOF

mkdir -p grafana-provisioning/dashboards
cat > grafana-provisioning/dashboards/dashboards.yml << 'EOF'
apiVersion: 1

providers:
  - name: 'Central-MCP'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
EOF

echo "✅ Configuration files created"

# ═══════════════════════════════════════════════════════════════════════════
# STEP 2: COPY FILES TO VM
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo "📤 Copying files to VM..."

# Create remote directory
gcloud compute ssh $INSTANCE_NAME --zone=$VM_ZONE --command="mkdir -p ~/monitoring"

# Copy all configuration files
gcloud compute scp prometheus.yml $INSTANCE_NAME:~/monitoring/ --zone=$VM_ZONE
gcloud compute scp alert_rules.yml $INSTANCE_NAME:~/monitoring/ --zone=$VM_ZONE
gcloud compute scp alertmanager.yml $INSTANCE_NAME:~/monitoring/ --zone=$VM_ZONE
gcloud compute scp docker-compose.monitoring.yml $INSTANCE_NAME:~/monitoring/docker-compose.yml --zone=$VM_ZONE

# Copy Grafana provisioning
gcloud compute scp --recurse grafana-provisioning $INSTANCE_NAME:~/monitoring/ --zone=$VM_ZONE

echo "✅ Files copied to VM"

# ═══════════════════════════════════════════════════════════════════════════
# STEP 3: INSTALL DOCKER (if not installed)
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo "🐳 Installing Docker on VM..."

gcloud compute ssh $INSTANCE_NAME --zone=$VM_ZONE --command="
  if ! command -v docker &> /dev/null; then
    echo 'Installing Docker...'
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker \$USER
    echo 'Docker installed successfully'
  else
    echo 'Docker already installed'
  fi

  if ! command -v docker-compose &> /dev/null; then
    echo 'Installing Docker Compose...'
    sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo 'Docker Compose installed successfully'
  else
    echo 'Docker Compose already installed'
  fi
"

echo "✅ Docker environment ready"

# ═══════════════════════════════════════════════════════════════════════════
# STEP 4: DEPLOY MONITORING STACK
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo "🚀 Deploying monitoring stack on VM..."

gcloud compute ssh $INSTANCE_NAME --zone=$VM_ZONE --command="
  cd ~/monitoring

  # Stop any existing containers
  docker-compose down 2>/dev/null || true

  # Pull latest images
  docker-compose pull

  # Start the monitoring stack
  docker-compose up -d

  # Wait for services to be healthy
  echo 'Waiting for services to start...'
  sleep 10

  # Show status
  docker-compose ps
"

echo "✅ Monitoring stack deployed"

# ═══════════════════════════════════════════════════════════════════════════
# STEP 5: CONFIGURE FIREWALL RULES
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo "🔥 Configuring firewall rules..."

# Allow Grafana (port 3000)
gcloud compute firewall-rules create allow-grafana \
  --allow tcp:3000 \
  --source-ranges 0.0.0.0/0 \
  --target-tags central-mcp \
  --description "Allow Grafana access" 2>/dev/null || echo "Firewall rule already exists"

# Allow Prometheus (port 9090) - optional, for debugging
gcloud compute firewall-rules create allow-prometheus \
  --allow tcp:9090 \
  --source-ranges 0.0.0.0/0 \
  --target-tags central-mcp \
  --description "Allow Prometheus access" 2>/dev/null || echo "Firewall rule already exists"

# Allow AlertManager (port 9093) - optional
gcloud compute firewall-rules create allow-alertmanager \
  --allow tcp:9093 \
  --source-ranges 0.0.0.0/0 \
  --target-tags central-mcp \
  --description "Allow AlertManager access" 2>/dev/null || echo "Firewall rule already exists"

echo "✅ Firewall rules configured"

# ═══════════════════════════════════════════════════════════════════════════
# STEP 6: HEALTH CHECKS
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo "🏥 Running health checks..."

sleep 5

# Check Prometheus
echo "Checking Prometheus..."
curl -s http://34.41.115.199:9090/-/healthy > /dev/null && echo "✅ Prometheus is healthy" || echo "⚠️  Prometheus is not responding"

# Check Grafana
echo "Checking Grafana..."
curl -s http://34.41.115.199:3000/api/health > /dev/null && echo "✅ Grafana is healthy" || echo "⚠️  Grafana is not responding"

# Check AlertManager
echo "Checking AlertManager..."
curl -s http://34.41.115.199:9093/-/healthy > /dev/null && echo "✅ AlertManager is healthy" || echo "⚠️  AlertManager is not responding"

# ═══════════════════════════════════════════════════════════════════════════
# DEPLOYMENT COMPLETE
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   ✅ ENTERPRISE MONITORING DEPLOYED SUCCESSFULLY!            ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║                                                               ║"
echo "║   📊 Grafana Dashboard:                                       ║"
echo "║      http://34.41.115.199:3000                                ║"
echo "║      Username: admin                                          ║"
echo "║      Password: central-mcp-2025                               ║"
echo "║                                                               ║"
echo "║   📈 Prometheus:                                              ║"
echo "║      http://34.41.115.199:9090                                ║"
echo "║                                                               ║"
echo "║   🚨 AlertManager:                                            ║"
echo "║      http://34.41.115.199:9093                                ║"
echo "║                                                               ║"
echo "║   📋 Real-Time Dashboard (existing):                          ║"
echo "║      http://34.41.115.199:8000                                ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "🎯 NEXT STEPS:"
echo ""
echo "1. Access Grafana and create dashboards"
echo "2. Configure AlertManager notifications (Slack/Email)"
echo "3. Add Central-MCP /metrics endpoint (see below)"
echo ""
echo "📝 To add metrics endpoint to Central-MCP:"
echo "   See: INTEGRATE_PROMETHEUS_METRICS.md"
echo ""
echo "🔧 Useful commands:"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$VM_ZONE 'cd ~/monitoring && docker-compose logs -f'"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$VM_ZONE 'cd ~/monitoring && docker-compose ps'"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$VM_ZONE 'cd ~/monitoring && docker-compose restart'"
echo ""
