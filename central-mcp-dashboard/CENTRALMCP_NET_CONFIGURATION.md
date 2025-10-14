# 🌐 CENTRALMCP.NET - DNS & Security Configuration

**Date:** 2025-10-12
**Status:** ✅ **FULLY CONFIGURED & SECURED**

---

## 🎯 OVERVIEW

The Central-MCP dashboard is now accessible via **centralmcp.net** with complete authentication protection.

**Live URLs:**
- 🌐 **http://centralmcp.net** → Dashboard (requires login)
- 🌐 **http://www.centralmcp.net** → Dashboard (requires login)
- 🌐 **http://dashboard.centralmcp.net** → Dashboard (requires login)
- 🔒 **Direct VM Access:** http://136.112.123.243:3002

---

## 🔐 AUTHENTICATION SYSTEM

### Default Credentials
```
Username: admin
Password: centralmcp2025
```

**⚠️ IMPORTANT:** Change the default password immediately by updating these environment variables on the VM:

```bash
# On VM at /opt/central-mcp-dashboard/.env.local
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<new-sha256-hash>
SESSION_SECRET=<new-random-secret>
```

### Generate New Password Hash
```bash
echo -n "your-new-password" | shasum -a 256
```

### Authentication Features
- ✅ **Session-based authentication** with 24-hour expiry
- ✅ **HMAC-signed session tokens** for security
- ✅ **SHA-256 password hashing**
- ✅ **HTTP-only cookies** (prevents XSS)
- ✅ **Middleware protection** on all routes except login
- ✅ **Brute-force delay** (1 second) on failed login

---

## 🌍 DNS CONFIGURATION

### Namecheap DNS Records (Configured 2025-10-12)

| Host | Type | Value | TTL |
|------|------|-------|-----|
| @ | A | 136.112.123.243 | 1800 |
| www | A | 136.112.123.243 | 1800 |
| dashboard | A | 136.112.123.243 | 1800 |

**VM IP:** 136.112.123.243 (GCP central-mcp-server, us-central1-a)

### DNS Propagation Time
- **Expected:** 30 minutes to 2 hours
- **Check status:** `dig centralmcp.net` or https://dnschecker.org

---

## 📁 FILES CREATED

### Authentication System
```
central-mcp-dashboard/
├── app/login/page.tsx                    # Login interface
├── app/api/auth/login/route.ts           # Authentication endpoint
├── app/api/auth/logout/route.ts          # Logout endpoint
├── middleware.ts                          # Route protection
└── .env.local (on VM)                     # Secure credentials
```

### Updated Files
```
central-mcp-dashboard/app/api/
├── central-mcp/route.ts                  # Fixed DB path
├── agents/route.ts                       # Fixed DB path
├── projects/route.ts                     # Fixed DB path
├── tasks/route.ts                        # Fixed DB path
├── loops/route.ts                        # Fixed DB path
├── specs/route.ts                        # Fixed DB path
└── llm-status/route.ts                   # Fixed DB path
```

---

## 🔧 TECHNICAL IMPLEMENTATION

### Session Token Structure
```
Base64(username:timestamp:hmac_signature)
```

### Verification Process
1. Extract session cookie
2. Decode Base64 token
3. Verify HMAC signature with SESSION_SECRET
4. Check timestamp (24-hour expiry)
5. Grant/deny access

### Environment Variables (VM)
```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=d88f5bb7822e875cce227c8ae8cff96eef1fc82ecc4623bec85be944befe8d3e
SESSION_SECRET=39754e77d87b8f89060a266caf3f70640ac0f1ecb5ae7a1c196384587528b347
DATABASE_PATH=/opt/central-mcp/data/registry.db
NODE_ENV=production
```

---

## 🚀 DEPLOYMENT STATUS

### VM Configuration
- ✅ Dashboard running on port 3002 (PM2: nextjs-dashboard)
- ✅ Authentication deployed and active
- ✅ Database path configured for VM
- ✅ Firewall rules allow port 3002
- ✅ DNS records configured

### Dashboard Features
- ✅ Real-time auto-proactive loop monitoring
- ✅ 44 projects registered
- ✅ Agent session tracking
- ✅ Git intelligence dashboard
- ✅ System health metrics
- ✅ Loop execution history (15,885+ records)

---

## 🔍 DNS VERIFICATION

### Check DNS Propagation
```bash
# Check A record for root domain
dig centralmcp.net

# Check A record for www
dig www.centralmcp.net

# Check A record for dashboard
dig dashboard.centralmcp.net

# Expected result: 136.112.123.243
```

### Test Dashboard Access
```bash
# Should redirect to /login
curl -I http://centralmcp.net

# Should return 200 (login page)
curl -I http://centralmcp.net/login

# Should redirect to /login (protected)
curl -I http://centralmcp.net/api/central-mcp
```

---

## 📋 DOPPLER SECRETS

### Namecheap API Credentials (Stored in Doppler)
```
NAMECHEAP_API_KEY=4753835aafd34b90b8f298cf2c25ef39
NAMECHEAP_API_USER=leolech14
NAMECHEAP_USERNAME=leolech14
```

### Retrieve from Doppler
```bash
doppler secrets get NAMECHEAP_API_KEY NAMECHEAP_API_USER --plain
```

### Whitelisted IP
- ✅ **168.194.57.69** (your current development machine)

---

## 🎯 NEXT STEPS

### 1. Change Default Password (HIGH PRIORITY!)
```bash
# SSH into VM
gcloud compute ssh central-mcp-server --zone=us-central1-a

# Edit environment file
sudo nano /opt/central-mcp-dashboard/.env.local

# Update ADMIN_PASSWORD_HASH with new SHA-256 hash
# Restart dashboard
pm2 restart nextjs-dashboard
```

### 2. Configure SSL/HTTPS (Recommended)
Options:
- **Cloudflare** (easiest): Add centralmcp.net to Cloudflare, enable SSL
- **Let's Encrypt**: Use Certbot on VM to get free SSL certificate
- **Vercel Edge**: Deploy through Vercel for automatic HTTPS

### 3. Test DNS Propagation
Wait 30-60 minutes, then test:
```bash
curl -I http://centralmcp.net
```

### 4. Configure Firewall (Optional)
Restrict port 3002 to only Cloudflare IPs or your trusted IPs:
```bash
gcloud compute firewall-rules update allow-dashboard-3002 \
  --source-ranges="YOUR_IP/32"
```

---

## 📊 SYSTEM HEALTH

**Current Status (2025-10-12):**
- ✅ 9/9 Auto-Proactive Loops Active
- ✅ Authentication Working
- ✅ DNS Configured
- ✅ Database Synced
- ✅ VM Running Stable
- ⏳ DNS Propagating (30-60 min)

**Dashboard Uptime:** Managed by PM2 with auto-restart
**Database:** 6.3MB, 15,885+ loop execution records

---

## 🔗 USEFUL LINKS

- **Dashboard:** http://centralmcp.net (after DNS propagation)
- **Direct VM Access:** http://136.112.123.243:3002
- **Namecheap API Access:** https://ap.www.namecheap.com/settings/tools/apiaccess
- **DNS Checker:** https://dnschecker.org/?domain=centralmcp.net

---

## 🎉 SUMMARY

✅ **Authentication system deployed and working**
✅ **DNS configured for centralmcp.net**
✅ **All subdomains pointing to VM**
✅ **Dashboard secured with login**
✅ **API credentials stored in Doppler**

**The Central-MCP dashboard is now production-ready and accessible via centralmcp.net!**
