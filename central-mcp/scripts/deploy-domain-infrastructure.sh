#!/bin/bash
# DEPLOY DOMAIN INFRASTRUCTURE FOR CENTRAL-MCP
# Complete automation for domain setup
set -e

echo "🌐 CENTRAL-MCP DOMAIN DEPLOYMENT"
echo "=================================="
echo ""

# Configuration
DOMAIN="${DOMAIN:-central-mcp.com}"
VM_NAME="central-mcp-server"
VM_ZONE="us-central1-a"
REGION="us-central1"
STATIC_IP_NAME="central-mcp-static-ip"

echo "📋 Configuration:"
echo "  Domain: $DOMAIN"
echo "  VM: $VM_NAME"
echo "  Zone: $VM_ZONE"
echo "  Region: $REGION"
echo ""

# Phase 1: Reserve Static IP
echo "🔧 PHASE 1: Reserve Static IP"
echo "=============================="
echo ""

echo "Checking if static IP already exists..."
if gcloud compute addresses describe $STATIC_IP_NAME --region=$REGION &>/dev/null; then
    echo "✅ Static IP already exists"
    STATIC_IP=$(gcloud compute addresses describe $STATIC_IP_NAME --region=$REGION --format="get(address)")
    echo "   IP: $STATIC_IP"
else
    echo "Creating new static IP..."
    gcloud compute addresses create $STATIC_IP_NAME \
        --region=$REGION \
        --description="Static IP for Central-MCP production"

    STATIC_IP=$(gcloud compute addresses describe $STATIC_IP_NAME --region=$REGION --format="get(address)")
    echo "✅ Static IP created: $STATIC_IP"
fi

echo ""
echo "📌 IMPORTANT: Configure DNS with this IP address:"
echo "   A     @          $STATIC_IP  300"
echo "   A     dashboard  $STATIC_IP  300"
echo "   A     terminals  $STATIC_IP  300"
echo "   A     api        $STATIC_IP  300"
echo "   CNAME www        $DOMAIN     300"
echo ""

read -p "Press Enter after DNS is configured (wait 5-10 minutes for propagation)..."

# Assign static IP to VM
echo "Assigning static IP to VM..."
echo "⚠️  This will briefly restart the VM..."
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted"
    exit 1
fi

echo "Stopping VM..."
gcloud compute instances stop $VM_NAME --zone=$VM_ZONE

echo "Removing old external IP..."
gcloud compute instances delete-access-config $VM_NAME \
    --zone=$VM_ZONE \
    --access-config-name="External NAT" || true

echo "Adding static IP..."
gcloud compute instances add-access-config $VM_NAME \
    --zone=$VM_ZONE \
    --access-config-name="External NAT" \
    --address=$STATIC_IP

echo "Starting VM..."
gcloud compute instances start $VM_NAME --zone=$VM_ZONE

echo "Waiting for VM to boot..."
sleep 30

echo "✅ Static IP assigned to VM"
echo ""

# Phase 2: Build and Deploy Dashboard
echo "🏗️  PHASE 2: Build & Deploy Dashboard"
echo "===================================="
echo ""

cd "$(dirname "$0")/../central-mcp-dashboard"

echo "Installing dependencies..."
npm install

echo "Building production bundle..."
npm run build

echo "Creating deployment package..."
DEPLOY_DIR="/tmp/central-mcp-dashboard-deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy necessary files
cp -r .next $DEPLOY_DIR/
cp package.json package-lock.json $DEPLOY_DIR/
cp -r public $DEPLOY_DIR/ 2>/dev/null || true
cp next.config.ts tsconfig.json $DEPLOY_DIR/ 2>/dev/null || true

echo "Uploading to VM..."
gcloud compute scp --recurse $DEPLOY_DIR/* \
    $VM_NAME:/home/lech/central-mcp-dashboard/ \
    --zone=$VM_ZONE

echo "Installing dependencies on VM..."
gcloud compute ssh $VM_NAME --zone=$VM_ZONE --command="
cd /home/lech/central-mcp-dashboard
npm install --production
"

echo "Creating systemd service..."
gcloud compute ssh $VM_NAME --zone=$VM_ZONE --command="
sudo tee /etc/systemd/system/central-mcp-dashboard.service > /dev/null << 'EOF'
[Unit]
Description=Central-MCP Next.js Dashboard
After=network.target

[Service]
Type=simple
User=lech
WorkingDirectory=/home/lech/central-mcp-dashboard
Environment=\"NODE_ENV=production\"
Environment=\"PORT=3001\"
Environment=\"NEXT_PUBLIC_API_URL=https://api.$DOMAIN\"
Environment=\"NEXT_PUBLIC_WS_URL=wss://api.$DOMAIN/mcp\"
Environment=\"NEXT_PUBLIC_TERMINAL_BASE_URL=https://terminals.$DOMAIN\"
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable central-mcp-dashboard
sudo systemctl restart central-mcp-dashboard
"

echo "✅ Dashboard deployed and running"
echo ""

# Phase 3: Configure Nginx
echo "⚙️  PHASE 3: Configure Nginx"
echo "============================"
echo ""

echo "Installing Nginx..."
gcloud compute ssh $VM_NAME --zone=$VM_ZONE --command="
sudo apt update
sudo apt install -y nginx
"

echo "Creating Nginx configuration..."
gcloud compute ssh $VM_NAME --zone=$VM_ZONE --command="
sudo tee /etc/nginx/sites-available/central-mcp.conf > /dev/null << 'NGINXEOF'
# Landing Page
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
    }
}

# Dashboard
server {
    listen 80;
    server_name dashboard.$DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }
}

# Terminals
server {
    listen 80;
    server_name terminals.$DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:9001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
    }

    location /agent-a {
        proxy_pass http://127.0.0.1:9001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
    }

    location /agent-b {
        proxy_pass http://127.0.0.1:9002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
    }

    location /agent-c {
        proxy_pass http://127.0.0.1:9003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
    }

    location /agent-d {
        proxy_pass http://127.0.0.1:9004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
    }

    location /system {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
    }
}

# API
server {
    listen 80;
    server_name api.$DOMAIN;

    location /mcp {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_read_timeout 86400;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }
}
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/central-mcp.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
"

echo "✅ Nginx configured"
echo ""

# Phase 4: SSL with Let's Encrypt
echo "🔒 PHASE 4: SSL/TLS Setup"
echo "========================="
echo ""

echo "Installing Certbot..."
gcloud compute ssh $VM_NAME --zone=$VM_ZONE --command="
sudo apt install -y certbot python3-certbot-nginx
"

echo ""
echo "⚠️  IMPORTANT: You need to provide an email for SSL certificate notifications"
read -p "Enter your email address: " EMAIL

echo "Obtaining SSL certificates..."
gcloud compute ssh $VM_NAME --zone=$VM_ZONE --command="
sudo certbot --nginx \
    -d $DOMAIN \
    -d www.$DOMAIN \
    -d dashboard.$DOMAIN \
    -d terminals.$DOMAIN \
    -d api.$DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --non-interactive \
    --redirect
"

echo "✅ SSL certificates obtained and configured"
echo ""

# Phase 5: Update Firewall
echo "🔥 PHASE 5: Update Firewall"
echo "============================"
echo ""

echo "Opening HTTPS port..."
gcloud compute firewall-rules create allow-https \
    --allow=tcp:443 \
    --source-ranges=0.0.0.0/0 \
    --description="Allow HTTPS traffic" || echo "Firewall rule already exists"

echo "✅ Firewall updated"
echo ""

# Final Verification
echo "✅ DEPLOYMENT COMPLETE!"
echo "======================="
echo ""
echo "🌐 Your Central-MCP is now live at:"
echo ""
echo "   🏠 Landing Page:  https://$DOMAIN"
echo "   📊 Dashboard:     https://dashboard.$DOMAIN"
echo "   🖥️  Terminals:     https://terminals.$DOMAIN"
echo "   🔌 API:           https://api.$DOMAIN"
echo "   💬 WebSocket:     wss://api.$DOMAIN/mcp"
echo ""
echo "🔒 All endpoints secured with SSL/TLS"
echo "💰 Total cost: ~\$1/month (domain registration only)"
echo ""
echo "🎯 Next Steps:"
echo "   1. Visit https://$DOMAIN to see your landing page"
echo "   2. Open https://dashboard.$DOMAIN and press Ctrl+6"
echo "   3. Watch your VM terminals in real-time!"
echo ""
echo "🚀 CENTRAL-MCP IS LIVE!"
