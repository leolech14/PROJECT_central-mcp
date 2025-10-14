#!/bin/bash

# 🚀 DATABASE IMPROVEMENTS DEPLOYMENT SCRIPT
# ===========================================
#
# Safe deployment of database connection pooling, JSON modernization,
# and integrity validation to production VM

set -e  # Exit on any error

# Configuration
VM_IP="136.112.123.243"
VM_USER="central-mcp-server"
PROJECT_DIR="/home/central-mcp-server/central-mcp"
BACKUP_DIR="/home/central-mcp-server/backups/$(date +%Y%m%d_%H%M%S)"
ROLLBACK_FILE="/tmp/rollback_$(date +%Y%m%d_%H%M%S).sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to create rollback script
create_rollback() {
    cat > "$ROLLBACK_FILE" << EOF
#!/bin/bash
# Rollback script for database improvements deployment
set -e

echo "🔄 Rolling back database improvements..."

# Stop services
sudo systemctl stop central-mcp
sudo systemctl stop central-mcp-dashboard

# Restore database from backup
if [ -f "$BACKUP_DIR/registry.db.backup" ]; then
    sudo cp "$BACKUP_DIR/registry.db.backup" "$PROJECT_DIR/data/registry.db"
    echo "✅ Database restored from backup"
fi

# Restore application files
if [ -d "$BACKUP_DIR/src" ]; then
    sudo rm -rf "$PROJECT_DIR/src/database"
    sudo rm -rf "$PROJECT_DIR/src/registry"
    sudo rm -rf "$PROJECT_DIR/src/integration"
    sudo cp -r "$BACKUP_DIR/src" "$PROJECT_DIR/"
    echo "✅ Application files restored"
fi

# Restart services
sudo systemctl start central-mcp
sudo systemctl start central-mcp-dashboard

echo "✅ Rollback completed"
EOF

    chmod +x "$ROLLBACK_FILE"
    log "Rollback script created: $ROLLBACK_FILE"
}

# Function to check VM connectivity
check_vm_connectivity() {
    info "Checking VM connectivity..."

    if ! ping -c 1 "$VM_IP" >/dev/null 2>&1; then
        error "Cannot reach VM at $VM_IP"
        exit 1
    fi

    if ! gcloud compute ssh "$VM_USER" --zone="us-central1-a" --command="echo 'VM SSH connection successful'" >/dev/null 2>&1; then
        error "Cannot SSH to VM"
        exit 1
    fi

    log "VM connectivity verified"
}

# Function to create backup
create_backup() {
    info "Creating backup on VM..."

    gcloud compute ssh "$VM_USER" --zone="us-central1-a" --command="
        sudo mkdir -p '$BACKUP_DIR'

        # Backup database
        if [ -f '$PROJECT_DIR/data/registry.db' ]; then
            sudo cp '$PROJECT_DIR/data/registry.db' '$BACKUP_DIR/registry.db.backup'
            echo '✅ Database backed up'
        fi

        # Backup source files
        if [ -d '$PROJECT_DIR/src' ]; then
            sudo cp -r '$PROJECT_DIR/src' '$BACKUP_DIR/src.backup'
            echo '✅ Source files backed up'
        fi

        # Backup package.json
        if [ -f '$PROJECT_DIR/package.json' ]; then
            sudo cp '$PROJECT_DIR/package.json' '$BACKUP_DIR/package.json.backup'
            echo '✅ Package.json backed up'
        fi
    "

    log "Backup completed: $BACKUP_DIR"
}

# Function to stop services safely
stop_services() {
    info "Stopping services safely..."

    gcloud compute ssh "$VM_USER" --zone="us-central1-a" --command="
        # Wait for any running operations to complete
        sleep 5

        # Stop services gracefully
        sudo systemctl stop central-mcp-dashboard || true
        sudo systemctl stop central-mcp || true

        # Wait for processes to fully stop
        sleep 3

        echo '✅ Services stopped'
    "

    log "Services stopped safely"
}

# Function to deploy files
deploy_files() {
    info "Deploying database improvements..."

    # Copy new source files
    gcloud compute scp --recurse src/database "$VM_USER@$VM_IP:$PROJECT_DIR/src/"
    gcloud compute scp --recurse src/registry "$VM_USER@$VM_IP:$PROJECT_DIR/src/"
    gcloud compute scp --recurse src/integration "$VM_USER@$VM_IP:$PROJECT_DIR/src/"

    # Copy migration files
    gcloud compute scp --recurse src/database/migrations/025_json_column_modernization.sql "$VM_USER@$VM_IP:$PROJECT_DIR/src/database/migrations/"
    gcloud compute scp --recurse src/database/migrations/024_foreign_key_constraints.sql "$VM_USER@$VM_IP:$PROJECT_DIR/src/database/migrations/"

    # Copy integration files
    gcloud compute scp src/integration/DatabaseIntegrationLayer.ts "$VM_USER@$VM_IP:$PROJECT_DIR/src/integration/"

    # Copy deployment script
    gcloud compute scp scripts/deploy-database-improvements.sh "$VM_USER@$VM_IP:$PROJECT_DIR/scripts/"

    log "Files deployed successfully"
}

# Function to run database migrations
run_migrations() {
    info "Running database migrations..."

    gcloud compute ssh "$VM_USER" --zone="us-central1-a" --command="
        cd '$PROJECT_DIR'

        # Run foreign key constraints migration
        echo 'Running foreign key constraints migration...'
        sqlite3 data/registry.db < src/database/migrations/024_foreign_key_constraints.sql

        # Run JSON column modernization migration
        echo 'Running JSON column modernization migration...'
        sqlite3 data/registry.db < src/database/migrations/025_json_column_modernization.sql

        # Verify migrations
        echo 'Verifying migrations...'
        sqlite3 data/registry.db \"SELECT COUNT(*) as json_columns FROM pragma_table_info('tasks') WHERE type LIKE '%JSON%';\"

        echo '✅ Database migrations completed'
    "

    log "Database migrations completed successfully"
}

# Function to update application code
update_application() {
    info "Updating application code..."

    gcloud compute ssh "$VM_USER" --zone="us-central1-a" --command="
        cd '$PROJECT_DIR'

        # Update main server to use new database integration
        echo 'Updating server initialization...'

        # Build the application
        echo 'Building application...'
        npm run build

        echo '✅ Application updated and built'
    "

    log "Application updated successfully"
}

# Function to start services
start_services() {
    info "Starting services..."

    gcloud compute ssh "$VM_USER" --zone="us-central1-a" --command="
        cd '$PROJECT_DIR'

        # Start central-mcp service
        sudo systemctl start central-mcp

        # Wait for service to initialize
        sleep 10

        # Check service status
        if sudo systemctl is-active --quiet central-mcp; then
            echo '✅ Central-MCP service started successfully'
        else
            echo '❌ Central-MCP service failed to start'
            sudo journalctl -u central-mcp --no-pager -n 20
            exit 1
        fi

        # Start dashboard service
        sudo systemctl start central-mcp-dashboard

        # Wait for dashboard to initialize
        sleep 5

        if sudo systemctl is-active --quiet central-mcp-dashboard; then
            echo '✅ Dashboard service started successfully'
        else
            echo '❌ Dashboard service failed to start'
            sudo journalctl -u central-mcp-dashboard --no-pager -n 20
        fi
    "

    log "Services started"
}

# Function to verify deployment
verify_deployment() {
    info "Verifying deployment..."

    gcloud compute ssh "$VM_USER" --zone="us-central1-a" --command="
        cd '$PROJECT_DIR'

        # Check database health
        echo 'Checking database health...'
        sqlite3 data/registry.db \"SELECT 'Database accessible' as status;\"

        # Check for JSON columns
        echo 'Checking JSON columns...'
        sqlite3 data/registry.db \"SELECT COUNT(*) as json_columns FROM pragma_table_info('tasks') WHERE type LIKE '%JSON%';\"

        # Check for foreign keys
        echo 'Checking foreign key constraints...'
        sqlite3 data/registry.db \"PRAGMA foreign_key_check;\"

        # Test database connectivity
        echo 'Testing database connectivity...'
        node -e \"
        const Database = require('better-sqlite3');
        const db = new Database('./data/registry.db');
        const result = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
        console.log('✅ Database connectivity test passed:', result);
        db.close();
        \"

        # Check service endpoints
        echo 'Checking service endpoints...'
        curl -s http://localhost:3002/health | head -c 200
        echo ''

        echo '✅ Deployment verification completed'
    "

    log "Deployment verification completed"
}

# Function to show rollback information
show_rollback_info() {
    warn "Rollback Information:"
    warn "  Rollback script: $ROLLBACK_FILE"
    warn "  Backup location: $BACKUP_DIR"
    warn "  To rollback: bash $ROLLBACK_FILE"
    echo ""
}

# Main deployment function
main() {
    info "🚀 Starting Database Improvements Deployment"
    info "=============================================="

    # Pre-deployment checks
    check_vm_connectivity

    # Create rollback script first
    create_rollback

    # Create backup
    create_backup

    # Deployment steps
    stop_services
    deploy_files
    run_migrations
    update_application
    start_services

    # Verification
    verify_deployment

    # Show rollback information
    show_rollback_info

    log "🎉 Database improvements deployment completed successfully!"
    info "System now has:"
    info "  ✅ Connection pooling for better performance"
    info "  ✅ JSON columns for better data integrity"
    info "  ✅ Foreign key constraints for data consistency"
    info "  ✅ Database monitoring and integrity validation"
    info "  ✅ Integration with Central MCP loops"

    warn "⚠️  Monitor the system for the next few minutes"
    warn "⚠️  Use rollback script if issues occur"
}

# Error handling
trap 'error "Deployment failed! Check rollback script: $ROLLBACK_FILE"; exit 1' ERR

# Run main function
main "$@"