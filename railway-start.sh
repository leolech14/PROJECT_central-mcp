#!/bin/bash
###############################################################################
# Railway Startup Script
# ======================
#
# Runs on Railway deployment:
# 1. Run database migrations
# 2. Start MCP server
#
# This ensures database is always up-to-date before server starts
###############################################################################

set -e  # Exit on error

echo "🚀 Starting Central Intelligence on Railway..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set, using local SQLite"
  export DATABASE_PATH="./data/registry.db"
else
  echo "✅ PostgreSQL connection configured"
fi

# Run database migrations
echo "🔄 Running database migrations..."
npx tsx scripts/migrate-database.ts

if [ $? -eq 0 ]; then
  echo "✅ Migrations complete"
else
  echo "❌ Migration failed!"
  exit 1
fi

# Start MCP server
echo "🎯 Starting MCP server..."
node dist/index.js
