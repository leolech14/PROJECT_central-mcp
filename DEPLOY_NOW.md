# 🚀 DEPLOY CENTRAL-MCP TO GOOGLE CLOUD - READY NOW!

## ✅ You Have Everything Ready!
- ✅ gcloud CLI configured
- ✅ Doppler credentials
- ✅ Google Cloud project

## 💰 Cost: $49/Month (First 3 Months FREE!)
```yaml
Central-MCP Server: E2-micro = $0/month (FREE TIER FOREVER!)
Agent VM: E2-standard-4 (preemptible) = $46/month
Network: $3/month
───────────────────────────────────────────────────
TOTAL: $49/month

Months 1-3: $0 (using $300 free trial credit)
Month 4+: $49/month
```

## 🎯 THREE SIMPLE STEPS TO DEPLOY

### Step 1: Run Deployment Script (5 minutes)
```bash
cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp

# Deploy to Google Cloud (uses your existing gcloud + Doppler)
./scripts/deploy-with-doppler.sh
```

**What this does:**
- ✅ Uses your existing gcloud authentication
- ✅ Creates E2-micro VM (free forever) for Central-MCP
- ✅ Creates E2-standard-4 preemptible VM for Agent A
- ✅ Configures firewall rules
- ✅ Installs Node.js, Git, SQLite on both VMs
- ✅ Returns SSH commands for access

### Step 2: Copy Setup Script to Server (1 minute)
```bash
# After deployment completes, copy setup script
gcloud compute scp scripts/setup-central-mcp-server.sh central-mcp-server:/tmp/ --zone=us-central1-a
```

### Step 3: Run Setup on Server (10 minutes)
```bash
# SSH into Central-MCP server
gcloud compute ssh central-mcp-server --zone=us-central1-a

# Run setup script
sudo mv /tmp/setup-central-mcp-server.sh /opt/central-mcp/
cd /opt/central-mcp
sudo bash setup-central-mcp-server.sh
```

**The setup script will ask you for:**
1. Your GitHub repository URL (for Central-MCP)
2. Your Doppler token (one-time authentication)

**What setup script does:**
- ✅ Installs Doppler CLI on the VM
- ✅ Clones Central-MCP repository
- ✅ Configures Doppler credentials
- ✅ Installs Node.js dependencies
- ✅ Initializes SQLite database
- ✅ Creates systemd service (auto-start on boot)
- ✅ Starts Central-MCP server
- ✅ Verifies health check

## 🎉 DONE! Central-MCP Running 24/7

After Step 3 completes, you have:

```
✅ Central-MCP server running 24/7 (FREE!)
✅ Agent VM ready for work ($46/month preemptible)
✅ SQLite database initialized
✅ Doppler credentials configured
✅ Auto-restart on VM reboot
✅ Spec generator ready
✅ Thread auto-save ready
```

## 📊 Verify Deployment

```bash
# Check server status
sudo systemctl status central-mcp

# View logs
sudo journalctl -u central-mcp -f

# Health check
curl http://localhost:3000/health

# From outside VM
EXTERNAL_IP=$(gcloud compute instances describe central-mcp-server --zone=us-central1-a --format='get(networkInterfaces[0].accessConfigs[0].natIP)')
curl http://$EXTERNAL_IP:3000/health
```

## 🔧 Useful Commands

```bash
# Access Central-MCP server
gcloud compute ssh central-mcp-server --zone=us-central1-a

# Access Agent VM
gcloud compute ssh central-mcp-agent-A --zone=us-central1-a

# Restart Central-MCP service
sudo systemctl restart central-mcp

# Update Doppler secrets
doppler secrets set API_KEY=value

# View Doppler secrets
doppler secrets

# Stop VMs (save money during testing)
gcloud compute instances stop central-mcp-server --zone=us-central1-a
gcloud compute instances stop central-mcp-agent-A --zone=us-central1-a

# Start VMs
gcloud compute instances start central-mcp-server --zone=us-central1-a
gcloud compute instances start central-mcp-agent-A --zone=us-central1-a
```

## 💰 Monitor Costs

```bash
# View current billing
gcloud billing accounts list
gcloud beta billing projects describe $(gcloud config get-value project)

# Set up billing alerts
gcloud alpha billing budgets create \
  --billing-account=$(gcloud beta billing projects describe $(gcloud config get-value project) --format='value(billingAccountName)') \
  --display-name='Central-MCP Budget Alert' \
  --budget-amount=100 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90
```

## 🎯 What's Next?

After deployment:

1. **Test Spec Generator**:
   ```bash
   # SSH into server
   gcloud compute ssh central-mcp-server --zone=us-central1-a

   # Generate a test spec
   cd /opt/central-mcp
   doppler run -- npx tsx scripts/generate-spec.ts \
     --project localbrain \
     --module "Test Module" \
     --context README.md \
     --output test-spec.md
   ```

2. **Test Thread Auto-Save**:
   ```bash
   # Import a conversation
   doppler run -- npx tsx scripts/save-thread-to-central-mcp.ts conversation-export.md

   # Verify in database
   sqlite3 data/registry.db "SELECT * FROM conversations;"
   ```

3. **Connect Agents**: Configure agents to connect to Central-MCP server using the external IP

4. **Monitor Performance**: Track spec generation time, thread saves, agent coordination

5. **Scale When Ready**: Upgrade to production configuration when validated

## 🚨 Troubleshooting

**If deployment fails:**
```bash
# Check gcloud authentication
gcloud auth list

# Check project
gcloud config get-value project

# Check billing enabled
gcloud beta billing projects describe $(gcloud config get-value project)
```

**If setup script fails:**
```bash
# View logs
sudo journalctl -u central-mcp -n 100

# Check Node.js version
node --version  # Should be 20.x

# Check Doppler
doppler --version

# Manually test server
cd /opt/central-mcp
doppler run -- npm start
```

**If server won't start:**
```bash
# Check port 3000
sudo netstat -tlnp | grep 3000

# Check database
ls -la data/registry.db

# Check permissions
sudo chown -R $USER:$USER /opt/central-mcp

# Rebuild dependencies
doppler run -- npm install
```

## 🎁 FREE TIER VERIFICATION

**Verify you're using free tier:**

1. VM is in us-central1, us-west1, or us-east1 ✅
2. Only 1 E2-micro VM created ✅
3. Disk is standard (not SSD) on E2-micro ✅
4. Disk is ≤30 GB on E2-micro ✅

**Google Cloud Console:**
- https://console.cloud.google.com/compute/instances
- Check machine type: e2-micro
- Check region: us-central1
- Check disk: 30 GB standard

## 📞 Support

**Logs:**
```bash
# Central-MCP logs
sudo journalctl -u central-mcp -f

# VM system logs
sudo tail -f /var/log/syslog

# Node.js errors
cd /opt/central-mcp && doppler run -- npm start
```

**Status:**
```bash
# Service status
sudo systemctl status central-mcp

# VM status
gcloud compute instances describe central-mcp-server --zone=us-central1-a

# Health endpoint
curl http://localhost:3000/health | jq .
```

---

## ⚡ READY TO DEPLOY?

```bash
cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp
./scripts/deploy-with-doppler.sh
```

**Time to complete: ~15 minutes**
**Cost: $0 for first 3 months, then $49/month**

🚀 Let's go!
