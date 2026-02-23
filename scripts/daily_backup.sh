#!/bin/bash
set -o pipefail

# Configuration
PROJECT_ROOT="/var/www/html/NCUE-Scholarship"
BACKUP_DIR="${PROJECT_ROOT}/backups"
ENV_FILE="${PROJECT_ROOT}/.env.local"
LOG_FILE="${BACKUP_DIR}/backup.log"
RETENTION_DAYS=7
DB_CONTAINER_NAME="supabase-db" # Default Supabase DB container name

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting daily backup..."

# Load Environment Variables
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    log "Error: .env file not found at $ENV_FILE"
    exit 1
fi

# 1. Database Backup
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_BACKUP_FILE="${BACKUP_DIR}/db_${TIMESTAMP}.sql.gz"

log "Backing up database from container: $DB_CONTAINER_NAME..."

# Check if docker is available
if ! command -v docker &> /dev/null; then
    log "Error: docker command not found."
    exit 1
fi

# Try to backup
# Note: We use 'postgres' user and database by default for Supabase
if docker exec "$DB_CONTAINER_NAME" pg_dump -U postgres postgres | gzip > "$DB_BACKUP_FILE"; then
    log "Database backup successful: $DB_BACKUP_FILE"
else
    log "Error: Database backup failed. Check container name and permissions."
    # Don't exit, try to backup files at least
fi

# 2. Attachments Backup
FILES_BACKUP_FILE="${BACKUP_DIR}/attachments_${TIMESTAMP}.tar.gz"
ATTACHMENTS_DIR="${PROJECT_ROOT}/public/storage/attachments"

if [ -d "$ATTACHMENTS_DIR" ]; then
    log "Backing up attachments from: $ATTACHMENTS_DIR..."
    tar -czf "$FILES_BACKUP_FILE" -C "${PROJECT_ROOT}/public/storage" attachments
    if [ $? -eq 0 ]; then
        log "Attachments backup successful: $FILES_BACKUP_FILE"
    else
        log "Error: Attachments backup failed."
    fi
else
    log "Warning: Attachments directory not found: $ATTACHMENTS_DIR"
fi

# 3. Cleanup Old Backups
log "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "*.gz" -type f -mtime +$RETENTION_DAYS -delete
log "Cleanup complete."

# 4. Sync Dify Knowledge Base
log "Starting Dify Knowledge Base Full Synchronization..."
NODE_BIN="/home/mingchen4865/.nvm/versions/node/v22.18.0/bin/node"

# Check if node exists at the specified path, fallback to system node if not
if [ ! -f "$NODE_BIN" ]; then
    NODE_BIN=$(which node)
fi

if $NODE_BIN "${PROJECT_ROOT}/scripts/sync-dify-knowledge.js" >> "$LOG_FILE" 2>&1; then
    log "Dify Synchronization successful."
else
    log "Error: Dify Synchronization failed. Check logs for details."
fi

log "Backup process finished."
