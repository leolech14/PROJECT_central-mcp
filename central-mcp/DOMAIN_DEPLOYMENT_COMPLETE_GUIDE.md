# 🌐 CENTRAL-MCP DOMAIN DEPLOYMENT - COMPLETE GUIDE

**Date**: October 12, 2025
**Status**: READY FOR DEPLOYMENT
**Goal**: Transform IP-based access to professional domain infrastructure

---

## 🎯 CURRENT VS TARGET ARCHITECTURE

### Current (IP-Based):
```
❌ http://34.41.115.199:8000 → Landing page
❌ http://34.41.115.199:9000-9004 → VM terminals
❌ http://localhost:3003 → Dashboard (local only)
❌ ws://34.41.115.199:3000 → WebSocket

Problems:
- IP changes on VM restart (ephemeral)
- No SSL/TLS encryption
- Unprofessional appearance
- Can't share URLs easily
```

### Target (Domain-Based):
```
✅ https://central-mcp.com → Landing page
✅ https://dashboard.central-mcp.com → Dashboard
✅ https://terminals.central-mcp.com → VM terminals
✅ wss://api.central-mcp.com → WebSocket (secure)

Benefits:
- Static IP (never changes)
- SSL/TLS encryption (secure)
- Professional URLs
- Easy to share and remember
```

---

## 📋 DEPLOYMENT PHASES

### Phase 1: Reserve Static IP (5 minutes)
### Phase 2: Choose & Configure Domain (15 minutes)
### Phase 3: Deploy Next.js Dashboard to VM (20 minutes)
### Phase 4: Configure Nginx Reverse Proxy (30 minutes)
### Phase 5: Set up SSL/TLS with Let's Encrypt (15 minutes)
### Phase 6: Update All URLs & Test (20 minutes)

**Total Time**: ~2 hours

---

## 🚀 PHASE 1: RESERVE STATIC IP

### Step 1.1: Reserve Static IP Address

```bash
# Reserve static IP in us-central1 region
gcloud compute addresses create central-mcp-static-ip \
  --region=us-central1 \
  --description="Static IP for Central-MCP production"

# Get the reserved IP
gcloud compute addresses describe central-mcp-static-ip \
  --region=us-central1 \
  --format="get(address)"

# Expected output: 34.41.115.199 (or new IP)
```

### Step 1.2: Assign Static IP to VM

```bash
# Stop VM first (required)
gcloud compute instances stop central-mcp-server \
  --zone=us-central1-a

# Assign static IP
gcloud compute instances delete-access-config central-mcp-server \
  --zone=us-central1-a \
  --access-config-name="External NAT"

gcloud compute instances add-access-config central-mcp-server \
  --zone=us-central1-a \
  --access-config-name="External NAT" \
  --address=$(gcloud compute addresses describe central-mcp-static-ip --region=us-central1 --format="get(address)")

# Start VM
gcloud compute instances start central-mcp-server \
  --zone=us-central1-a

# Verify static IP
gcloud compute instances describe central-mcp-server \
  --zone=us-central1-a \
  --format="get(networkInterfaces[0].accessConfigs[0].natIP)"
```

**Result**: VM now has permanent IP address that survives restarts ✅

---

## 🌐 PHASE 2: DOMAIN SETUP

### Option A: Register New Domain (Recommended)

**Domain Suggestions**:
- `central-mcp.com` ($12/year - Google Domains)
- `central-mcp.ai` ($60/year - AI domain extension)
- `centralmcp.com` ($12/year)
- `mcp-central.com` ($12/year)

**How to Register**:
```bash
# Option 1: Google Domains
1. Go to domains.google.com
2. Search for "central-mcp.com"
3. Add to cart ($12/year)
4. Complete purchase

# Option 2: Cloudflare Registrar (cheaper)
1. Go to cloudflare.com/products/registrar
2. Search for domain
3. Register at cost price ($8-10/year)
```

### Option B: Use Existing Domain

If you already own a domain, skip registration and proceed to DNS configuration.

---

### Step 2.1: Configure DNS Records

**Required DNS Records**:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | [STATIC_IP] | 300 |
| A | dashboard | [STATIC_IP] | 300 |
| A | terminals | [STATIC_IP] | 300 |
| A | api | [STATIC_IP] | 300 |
| CNAME | www | central-mcp.com | 300 |

**Example Configuration** (assuming domain is `central-mcp.com`):

```bash
# On Google Domains DNS settings:
A     @          34.41.115.199  300
A     dashboard  34.41.115.199  300
A     terminals  34.41.115.199  300
A     api        34.41.115.199  300
CNAME www        central-mcp.com 300
```

**Verification** (wait 5-10 minutes for DNS propagation):
```bash
# Check DNS propagation
dig central-mcp.com
dig dashboard.central-mcp.com
dig terminals.central-mcp.com
dig api.central-mcp.com

# Expected output for each:
# ANSWER SECTION:
# central-mcp.com.  300  IN  A  34.41.115.199
```

---

## 📦 PHASE 3: DEPLOY NEXT.JS DASHBOARD TO VM

### Step 3.1: Build Dashboard Locally

```bash
cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/central-mcp-dashboard

# Install dependencies
npm install

# Build for production
npm run build

# Result: .next/ folder with production build
```

### Step 3.2: Upload Build to VM

```bash
# Create deployment package
cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/central-mcp-dashboard

# Upload entire app to VM
gcloud compute scp --recurse \
  .next/ \
  package.json \
  package-lock.json \
  next.config.ts \
  tsconfig.json \
  public/ \
  app/ \
  central-mcp-server:/home/lech/central-mcp-dashboard/ \
  --zone=us-central1-a

# SSH to VM
gcloud compute ssh central-mcp-server --zone=us-central1-a

# Install dependencies on VM
cd /home/lech/central-mcp-dashboard
npm install --production

# Test production server
npm run start
# Should start on port 3000 by default
```

### Step 3.3: Create Systemd Service for Dashboard

```bash
# On VM - create systemd service file
sudo tee /etc/systemd/system/central-mcp-dashboard.service > /dev/null << 'EOF'
[Unit]
Description=Central-MCP Next.js Dashboard
After=network.target

[Service]
Type=simple
User=lech
WorkingDirectory=/home/lech/central-mcp-dashboard
Environment="NODE_ENV=production"
Environment="PORT=3001"
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable central-mcp-dashboard
sudo systemctl start central-mcp-dashboard

# Check status
sudo systemctl status central-mcp-dashboard

# View logs
sudo journalctl -u central-mcp-dashboard -f
```

**Result**: Next.js dashboard running on port 3001 ✅

---

## 🔧 PHASE 4: NGINX REVERSE PROXY

### Step 4.1: Install Nginx

```bash
# On VM
sudo apt update
sudo apt install -y nginx

# Check Nginx status
sudo systemctl status nginx
```

### Step 4.2: Configure Nginx for Central-MCP

```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/central-mcp.conf > /dev/null << 'EOF'
# Landing Page (Port 8000)
server {
    listen 80;
    server_name central-mcp.com www.central-mcp.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Dashboard (Port 3001 - Next.js)
server {
    listen 80;
    server_name dashboard.central-mcp.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Terminals (Ports 9000-9004 - GoTTY)
server {
    listen 80;
    server_name terminals.central-mcp.com;

    # Default - Agent A
    location / {
        proxy_pass http://127.0.0.1:9001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Agent-specific routes
    location /agent-a {
        proxy_pass http://127.0.0.1:9001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /agent-b {
        proxy_pass http://127.0.0.1:9002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /agent-c {
        proxy_pass http://127.0.0.1:9003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /agent-d {
        proxy_pass http://127.0.0.1:9004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /system {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# API & WebSocket (Port 3000)
server {
    listen 80;
    server_name api.central-mcp.com;

    # WebSocket route
    location /mcp {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # REST API routes
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable configuration
sudo ln -sf /etc/nginx/sites-available/central-mcp.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

**Test HTTP Access** (before SSL):
```bash
# From your local machine
curl -I http://central-mcp.com
# Should return: HTTP/1.1 200 OK

curl -I http://dashboard.central-mcp.com
# Should return: HTTP/1.1 200 OK

curl -I http://api.central-mcp.com/health
# Should return: HTTP/1.1 200 OK
```

---

## 🔒 PHASE 5: SSL/TLS WITH LET'S ENCRYPT

### Step 5.1: Install Certbot

```bash
# On VM
sudo apt install -y certbot python3-certbot-nginx
```

### Step 5.2: Obtain SSL Certificates

```bash
# Get certificates for all subdomains
sudo certbot --nginx \
  -d central-mcp.com \
  -d www.central-mcp.com \
  -d dashboard.central-mcp.com \
  -d terminals.central-mcp.com \
  -d api.central-mcp.com \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive \
  --redirect

# Certbot will automatically:
# 1. Verify domain ownership
# 2. Obtain certificates
# 3. Update Nginx config for HTTPS
# 4. Set up auto-renewal
```

**Verification**:
```bash
# Check certificate renewal timer
sudo systemctl status certbot.timer

# Test auto-renewal
sudo certbot renew --dry-run
```

**Result**: All domains now have SSL/TLS encryption ✅

---

## 🔄 PHASE 6: UPDATE ALL URLS

### Step 6.1: Update Dashboard Environment Variables

```bash
# On VM - create .env.production file
cd /home/lech/central-mcp-dashboard

cat > .env.production << 'EOF'
NEXT_PUBLIC_API_URL=https://api.central-mcp.com
NEXT_PUBLIC_WS_URL=wss://api.central-mcp.com/mcp
NEXT_PUBLIC_TERMINAL_BASE_URL=https://terminals.central-mcp.com
NEXT_PUBLIC_LANDING_URL=https://central-mcp.com
EOF

# Rebuild with new environment variables
npm run build

# Restart dashboard service
sudo systemctl restart central-mcp-dashboard
```

### Step 6.2: Update TerminalViewer Component

```typescript
// central-mcp-dashboard/app/components/terminals/TerminalViewer.tsx
// Update terminalSessions array:

const terminalSessions: TerminalSession[] = [
  {
    id: 'agent-a',
    name: 'Agent A (Coordinator)',
    port: 9001,
    agentLetter: 'A',
    url: 'https://terminals.central-mcp.com/agent-a'  // NEW
  },
  {
    id: 'agent-b',
    name: 'Agent B (Architecture)',
    port: 9002,
    agentLetter: 'B',
    url: 'https://terminals.central-mcp.com/agent-b'  // NEW
  },
  {
    id: 'agent-c',
    name: 'Agent C (Backend)',
    port: 9003,
    agentLetter: 'C',
    url: 'https://terminals.central-mcp.com/agent-c'  // NEW
  },
  {
    id: 'agent-d',
    name: 'Agent D (UI)',
    port: 9004,
    agentLetter: 'D',
    url: 'https://terminals.central-mcp.com/agent-d'  // NEW
  },
  {
    id: 'system',
    name: 'System Monitor',
    port: 9000,
    url: 'https://terminals.central-mcp.com/system'  // NEW
  }
];

// Update iframe src to use url property:
<iframe
  src={terminal.url}
  className="w-full h-[calc(100%-4rem)] bg-black rounded-lg"
  title={terminal.name}
/>
```

### Step 6.3: Update Documentation URLs

Update these files with new domain URLs:
- `LIVE_URLS.md`
- `VM_TERMINAL_SYSTEM_COMPLETE.md`
- `ULTRATHINK_SESSION_OCT_12_2025.md`
- `A2A_TERMINAL_INTEGRATION_GUIDE.md`
- `README.md`

**Search & Replace**:
```bash
# From project root
cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp

# Replace all IP-based URLs with domain URLs
find . -name "*.md" -type f -exec sed -i '' \
  's|http://34.41.115.199:8000|https://central-mcp.com|g' {} +
find . -name "*.md" -type f -exec sed -i '' \
  's|http://34.41.115.199:9001|https://terminals.central-mcp.com/agent-a|g' {} +
find . -name "*.md" -type f -exec sed -i '' \
  's|http://localhost:3003|https://dashboard.central-mcp.com|g' {} +
find . -name "*.md" -type f -exec sed -i '' \
  's|ws://34.41.115.199:3000|wss://api.central-mcp.com|g' {} +
```

---

## ✅ VERIFICATION CHECKLIST

### DNS Verification:
- [ ] `central-mcp.com` resolves to static IP
- [ ] `dashboard.central-mcp.com` resolves to static IP
- [ ] `terminals.central-mcp.com` resolves to static IP
- [ ] `api.central-mcp.com` resolves to static IP

### SSL Verification:
- [ ] `https://central-mcp.com` shows SSL padlock
- [ ] `https://dashboard.central-mcp.com` shows SSL padlock
- [ ] `https://terminals.central-mcp.com` shows SSL padlock
- [ ] `https://api.central-mcp.com` shows SSL padlock

### Service Verification:
- [ ] Landing page loads at `https://central-mcp.com`
- [ ] Dashboard loads at `https://dashboard.central-mcp.com`
- [ ] Agent A terminal loads at `https://terminals.central-mcp.com/agent-a`
- [ ] WebSocket connects at `wss://api.central-mcp.com/mcp`
- [ ] Health check responds at `https://api.central-mcp.com/health`

### Dashboard Integration:
- [ ] Dashboard Ctrl+6 shows terminal iframes
- [ ] Terminal iframes use HTTPS URLs
- [ ] Connection status indicators work
- [ ] No mixed content warnings

---

## 🎯 FINAL URL STRUCTURE

### User-Facing URLs:
```
🏠 Landing Page:     https://central-mcp.com
📊 Dashboard:        https://dashboard.central-mcp.com
🖥️ VM Terminals:     https://terminals.central-mcp.com
   └─ Agent A:       https://terminals.central-mcp.com/agent-a
   └─ Agent B:       https://terminals.central-mcp.com/agent-b
   └─ Agent C:       https://terminals.central-mcp.com/agent-c
   └─ Agent D:       https://terminals.central-mcp.com/agent-d
   └─ System:        https://terminals.central-mcp.com/system
```

### API Endpoints:
```
🔌 WebSocket:        wss://api.central-mcp.com/mcp
🏥 Health Check:     https://api.central-mcp.com/health
📊 System Status:    https://api.central-mcp.com/status
🤖 Agent Status:     https://api.central-mcp.com/agents
```

---

## 💰 COST BREAKDOWN

**Domain Registration**: $12/year (Google Domains)
**GCP VM e2-micro**: $0/month (free tier)
**Static IP**: $0/month (while in use)
**SSL Certificates**: $0/month (Let's Encrypt)

**Total**: $12/year = **$1/month** 🎉

---

## 🎉 SUCCESS!

After deployment, you'll have:

✅ **Professional domain** instead of IP address
✅ **SSL/TLS encryption** on all endpoints
✅ **Static IP** that never changes
✅ **Production-ready** infrastructure
✅ **Subdomain organization** for clean URLs
✅ **Automatic SSL renewal** via Certbot

**Next**: Share your beautiful URLs with the world! 🚀

---

**Generated**: October 12, 2025
**System**: Central-MCP Domain Infrastructure
**Status**: ✅ **READY FOR DEPLOYMENT**
