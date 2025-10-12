# 🚀 Central Intelligence - Deployment Guide
## Deploy to Railway (FREE Tier)

**Time to Deploy**: 15 minutes
**Cost**: $0/month (free tier)
**Requirements**: GitHub account only

---

## ⚡ QUICK DEPLOY (5 Steps - 15 Minutes)

### **Step 1: Sign Up for Railway** (2 minutes)

```bash
1. Go to: https://railway.app
2. Click "Start a New Project"
3. Login with GitHub
4. No credit card required for free tier!
```

### **Step 2: Create New Project** (3 minutes)

```bash
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Authorize Railway to access your GitHub
4. Select repository: "localbrain-task-registry"
5. Select branch: "main"
```

### **Step 3: Add PostgreSQL Database** (2 minutes)

```bash
1. In your Railway project dashboard
2. Click "+ New" → "Database" → "PostgreSQL"
3. Railway automatically provisions database
4. DATABASE_URL environment variable auto-created
5. Wait ~30 seconds for database to be ready
```

### **Step 4: Configure Environment Variables** (3 minutes)

Railway automatically sets:
- ✅ `DATABASE_URL` - PostgreSQL connection string
- ✅ `PORT` - Server port (auto-assigned)

You need to add:
```bash
# In Railway dashboard, go to Variables tab:

NODE_ENV=production
MCP_TRANSPORT=websocket
AUTO_HEAL_ENABLED=true
ENABLE_DISCOVERY=true
ENABLE_MULTI_PROJECT=true
```

### **Step 5: Deploy!** (5 minutes)

```bash
Railway automatically:
├─ Detects Node.js project
├─ Runs: npm install
├─ Runs: npm run build
├─ Runs migrations (automatic on startup)
├─ Starts: node dist/index.js
└─ Assigns public URL: https://your-app.up.railway.app

Total deploy time: ~3-5 minutes
Status: LIVE! ✅
```

---

## 🔧 MANUAL DEPLOYMENT (If Needed)

### **Option A: Railway CLI**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy
railway up

# View logs
railway logs

# Open in browser
railway open
```

### **Option B: Git Push Deploy**

```bash
# Railway watches your main branch
git add .
git commit -m "Deploy to Railway"
git push origin main

# Railway automatically deploys!
# Check status: https://railway.app/project/your-project
```

---

## 🗄️ DATABASE MIGRATION

### **Automatic Migration (Recommended)**

Railway runs migrations automatically on deploy via startup script.

Add to `package.json`:
```json
{
  "scripts": {
    "start": "npm run migrate && node dist/index.js",
    "migrate": "npx tsx scripts/migrate-database.ts"
  }
}
```

### **Manual Migration** (If Needed)

```bash
# Connect to Railway PostgreSQL
railway run npx tsx scripts/migrate-database.ts

# Or via DATABASE_URL
DATABASE_URL="postgresql://..." npx tsx scripts/migrate-database.ts
```

---

## 🌐 CONNECTING TO CLOUD MCP

### **From Your Local Machine:**

```typescript
import { BrainClient } from '@lech/brain-sdk';  // Future

const brain = await BrainClient.connect({
  url: 'https://your-app.up.railway.app',
  apiKey: process.env.BRAIN_API_KEY
});

// Or with current MCP client:
const client = new Client({ name: 'agent-a', version: '1.0.0' });

// Connect via WebSocket (future)
const transport = new WebSocketTransport({
  url: 'wss://your-app.up.railway.app/mcp'
});

await client.connect(transport);
```

---

## 🔒 SECURITY CHECKLIST

### **Before Going Live:**

```bash
✅ Set NODE_ENV=production
✅ Configure DATABASE_URL (Railway auto-sets)
✅ Enable HTTPS (Railway provides free)
⚠️ Add authentication (T009 - future)
⚠️ Set up rate limiting (future)
⚠️ Configure CORS (if needed)
⚠️ Add API keys (T009 - future)
```

### **Railway Security (Built-in):**

```
✅ HTTPS by default
✅ Private networking
✅ Environment variable encryption
✅ Automatic backups (PostgreSQL)
✅ DDoS protection
```

---

## 📊 MONITORING

### **Railway Dashboard:**

```
Available Metrics:
├─ CPU usage
├─ Memory usage
├─ Network traffic
├─ Response times
├─ Error rates
└─ Build/deploy logs

Access: https://railway.app/project/your-project/metrics
```

### **Application Health:**

```bash
# Call health check endpoint (future)
curl https://your-app.up.railway.app/api/health

# Or use MCP tool
await client.callTool('get_system_health', { autoHeal: true });
```

---

## 💰 COST BREAKDOWN

### **Railway FREE Tier:**

```
✅ $5 credit/month (renews monthly)
✅ Usage-based pricing: $0.000231/GB-hour

Estimated Monthly Usage (Central Intelligence):
├─ Compute: ~500 hours @ $0.01/hour = $5.00
├─ PostgreSQL: Included in free tier
├─ Bandwidth: ~10GB (included)
└─ Total: ~$5/month (within free tier)

Cost: $0/month with free tier ✅
```

### **When You Exceed Free Tier:**

```
Small Scale ($20/month):
├─ 1500 hours compute
├─ 1GB PostgreSQL
├─ 100GB bandwidth

Medium Scale ($50/month):
├─ Unlimited compute
├─ 8GB PostgreSQL
├─ Unlimited bandwidth

You're billed only for what you use!
```

---

## 🚨 TROUBLESHOOTING

### **Build Fails:**

```bash
# Check logs
railway logs --deployment

# Common issues:
1. Missing dependencies → Check package.json
2. TypeScript errors → Run npm run build locally first
3. Migration fails → Check DATABASE_URL is set
```

### **Database Connection Fails:**

```bash
# Verify DATABASE_URL is set
railway variables

# Test connection
railway run node -e "console.log(process.env.DATABASE_URL)"

# Check database status
railway status
```

### **Application Won't Start:**

```bash
# Check start command
railway logs --deployment

# Verify migrations ran
railway run npx tsx scripts/migrate-database.ts

# Check health
railway run node dist/index.js
```

---

## 📋 POST-DEPLOYMENT CHECKLIST

```bash
After Railway deployment:

✅ Verify application is running
   → Check Railway dashboard

✅ Test database connection
   → Run health check

✅ Run migrations
   → Verify all 5 migrations applied

✅ Test MCP tools
   → Connect from local client
   → Call discover_environment

✅ Monitor performance
   → Check Railway metrics
   → Watch for errors

✅ Test self-healing
   → Call get_system_health
   → Verify auto-recovery works

✅ Update documentation
   → Add Railway URL to docs
   → Update README with cloud instructions
```

---

## 🔄 UPDATING DEPLOYMENT

### **Continuous Deployment:**

```bash
# Railway watches your main branch
git add .
git commit -m "Update feature X"
git push origin main

# Railway automatically:
├─ Detects new commit
├─ Builds application
├─ Runs tests (if configured)
├─ Deploys new version
└─ Zero downtime deployment!
```

### **Rollback (If Needed):**

```bash
# In Railway dashboard:
1. Go to Deployments tab
2. Find previous working deployment
3. Click "Redeploy"
4. Instant rollback!
```

---

## 🎯 NEXT STEPS AFTER DEPLOYMENT

### **Immediate:**
1. Test cloud MCP connection
2. Verify all 12 tools work
3. Test discovery engine from cloud
4. Monitor performance

### **Short-Term:**
1. Implement WebSocket transport (T008)
2. Add authentication (T009)
3. Build CLI tool (T017-T020)
4. Complete testing (75% coverage)

### **Medium-Term:**
1. Deploy to production
2. Add monitoring/alerting
3. Scale horizontally
4. Launch publicly

---

**Deployment Guide Created By**: Agent D
**Status**: ✅ READY TO DEPLOY
**Estimated Deploy Time**: 15 minutes
**Cost**: $0/month (free tier)
**Next**: Ready to deploy? Say "DEPLOY" and I'll guide you through Railway setup! 🚀
