#!/usr/bin/env bash
set -Eeuo pipefail

# VM SERVICE FIX - Update running service to latest code
# Gate A: systemctl is-active central-mcp = active

SRC=${SRC:-/home/lech/PROJECTS_all/PROJECT_central-mcp}
DEST=${DEST:-/opt/central-mcp}
SVC=${SVC:-central-mcp}
BACKUP_DIR=${BACKUP_DIR:-$HOME}
TS=$(date -u +%Y%m%d-%H%M%SZ)

echo "=== 🚀 VM SERVICE FIX - Update to Latest ==="
echo "Source: $SRC"
echo "Destination: $DEST"
echo "Service: $SVC"
echo ""

if [[ ! -d "$SRC/.git" ]]; then
  echo "❌ Source repo not found: $SRC" >&2
  exit 1
fi

# Backup current service tree
if [[ -d "$DEST" ]]; then
  echo "📦 Backing up $DEST → $BACKUP_DIR/backup_${SVC}_${TS}.tgz"
  sudo tar -C / -czf "$BACKUP_DIR/backup_${SVC}_${TS}.tgz" "${DEST#/}" 2>/dev/null || true
fi

# Rsync latest code
echo "➡️  Syncing $SRC → $DEST"
sudo rsync -a --delete \
  --exclude .git --exclude node_modules --exclude .next --exclude dist \
  --exclude 'data/*.db*' \
  "$SRC/" "$DEST/"

# Install dependencies
cd "$DEST"
if [[ -f "package-lock.json" ]]; then
  echo "📦 npm ci --omit=dev"
  sudo npm ci --omit=dev 2>&1 | tail -10
else
  echo "📦 npm install --production"
  sudo npm install --production 2>&1 | tail -10
fi

# Restart service
echo "🔄 Restarting $SVC..."
sudo systemctl daemon-reload
sudo systemctl restart "$SVC"

# Health check
sleep 3
if systemctl is-active --quiet "$SVC"; then
  echo "✅ Service $SVC is ACTIVE"
else
  echo "❌ Service $SVC not active"
  sudo journalctl -u "$SVC" -n 100 --no-pager
  exit 1
fi

echo ""
echo "🪵 Recent logs (last 30 lines):"
sudo journalctl -u "$SVC" -n 30 --no-pager

echo ""
echo "=== ✅ GATE A PASSED: Service active and healthy ==="
