#!/bin/sh

set -eu

current_dump=""
sleep_pid=""

log() {
  printf '%s %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*"
}

cleanup() {
  if [ -n "$current_dump" ] && [ -f "$current_dump" ]; then
    rm -f "$current_dump"
  fi
  current_dump=""
}

stop() {
  log "Stop requested; cleaning up."
  if [ -n "$sleep_pid" ]; then
    kill "$sleep_pid" 2>/dev/null || true
  fi
  cleanup
  exit 0
}

require_value() {
  variable_name="$1"
  variable_value="$2"

  if [ -z "$variable_value" ]; then
    log "ERROR: Required variable $variable_name is missing."
    return 1
  fi
}

require_positive_integer() {
  variable_name="$1"
  variable_value="$2"

  case "$variable_value" in
    ''|*[!0-9]*)
      log "ERROR: $variable_name must be a positive integer."
      return 1
      ;;
    0)
      log "ERROR: $variable_name must be greater than zero."
      return 1
      ;;
  esac
}

wait_for_postgres() {
  waited=0

  while ! PGPASSWORD="$POSTGRES_PASSWORD" pg_isready \
    --host="$POSTGRES_BACKUP_HOST" \
    --port="$POSTGRES_BACKUP_PORT" \
    --username="$POSTGRES_USER" \
    --dbname="$POSTGRES_DB" >/dev/null 2>&1; do
    if [ "$waited" -ge "$POSTGRES_BACKUP_WAIT_SECONDS" ]; then
      log "ERROR: PostgreSQL did not become ready within ${POSTGRES_BACKUP_WAIT_SECONDS}s."
      return 1
    fi

    sleep 2
    waited=$((waited + 2))
  done
}

configure_rclone() {
  export RCLONE_CONFIG_R2_TYPE=s3
  export RCLONE_CONFIG_R2_PROVIDER=Cloudflare
  export RCLONE_CONFIG_R2_ACCESS_KEY_ID="$POSTGRES_BACKUP_R2_ACCESS_KEY_ID"
  export RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$POSTGRES_BACKUP_R2_SECRET_ACCESS_KEY"
  export RCLONE_CONFIG_R2_ENDPOINT="${POSTGRES_BACKUP_R2_ENDPOINT%/}"
  export RCLONE_CONFIG_R2_REGION=auto
  export RCLONE_CONFIG_R2_ACL=private
  export RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true
}

run_backup() {
  timestamp="$(date -u '+%Y%m%dT%H%M%SZ')"
  year="$(date -u '+%Y')"
  month="$(date -u '+%m')"
  object_key="kita/postgres/${year}/${month}/${POSTGRES_DB}-${timestamp}.dump"
  current_dump="$(mktemp "/tmp/${POSTGRES_DB}-${timestamp}.dump.XXXXXX")"

  log "Starting PostgreSQL backup for database $POSTGRES_DB."

  if ! wait_for_postgres; then
    cleanup
    return 1
  fi

  if ! PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    --host="$POSTGRES_BACKUP_HOST" \
    --port="$POSTGRES_BACKUP_PORT" \
    --username="$POSTGRES_USER" \
    --dbname="$POSTGRES_DB" \
    --format=custom \
    --compress=6 \
    --no-owner \
    --no-acl \
    --file="$current_dump"; then
    log "ERROR: pg_dump failed."
    cleanup
    return 1
  fi

  if ! pg_restore --list "$current_dump" >/dev/null; then
    log "ERROR: pg_restore could not read the generated archive."
    cleanup
    return 1
  fi

  dump_size="$(wc -c < "$current_dump" | tr -d ' ')"
  if [ "$dump_size" -le 0 ]; then
    log "ERROR: Generated archive is empty."
    cleanup
    return 1
  fi

  log "Archive validated: object=$object_key bytes=$dump_size; starting R2 upload."
  configure_rclone

  if ! rclone copyto \
    --config=/dev/null \
    "$current_dump" \
    "r2:${POSTGRES_BACKUP_R2_BUCKET}/${object_key}" \
    --no-traverse \
    --transfers=1 \
    --checkers=1 \
    --log-level=NOTICE; then
    log "ERROR: Upload to R2 failed."
    cleanup
    return 1
  fi

  log "Backup completed: object=$object_key bytes=$dump_size."
  cleanup
  return 0
}

sleep_for() {
  delay="$1"
  sleep "$delay" &
  sleep_pid=$!
  wait "$sleep_pid" || true
  sleep_pid=""
}

trap stop HUP INT TERM
trap cleanup EXIT

enabled="$(printf '%s' "${POSTGRES_BACKUP_ENABLED:-false}" | tr '[:upper:]' '[:lower:]')"

if [ "$enabled" != "true" ]; then
  log "PostgreSQL R2 backup is disabled. Set POSTGRES_BACKUP_ENABLED=true in production to enable it."
  exec tail -f /dev/null
fi

POSTGRES_BACKUP_HOST="${POSTGRES_BACKUP_HOST:-postgres}"
POSTGRES_BACKUP_PORT="${POSTGRES_BACKUP_PORT:-5432}"
POSTGRES_BACKUP_INTERVAL_SECONDS="${POSTGRES_BACKUP_INTERVAL_SECONDS:-86400}"
POSTGRES_BACKUP_RETRY_SECONDS="${POSTGRES_BACKUP_RETRY_SECONDS:-3600}"
POSTGRES_BACKUP_WAIT_SECONDS="${POSTGRES_BACKUP_WAIT_SECONDS:-120}"
POSTGRES_DB="${POSTGRES_DB:-}"
POSTGRES_USER="${POSTGRES_USER:-}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"
POSTGRES_BACKUP_R2_ENDPOINT="${POSTGRES_BACKUP_R2_ENDPOINT:-}"
POSTGRES_BACKUP_R2_BUCKET="${POSTGRES_BACKUP_R2_BUCKET:-}"
POSTGRES_BACKUP_R2_ACCESS_KEY_ID="${POSTGRES_BACKUP_R2_ACCESS_KEY_ID:-}"
POSTGRES_BACKUP_R2_SECRET_ACCESS_KEY="${POSTGRES_BACKUP_R2_SECRET_ACCESS_KEY:-}"

validate_config() {
  valid=true

  require_value POSTGRES_DB "$POSTGRES_DB" || valid=false
  require_value POSTGRES_USER "$POSTGRES_USER" || valid=false
  require_value POSTGRES_PASSWORD "$POSTGRES_PASSWORD" || valid=false
  require_value POSTGRES_BACKUP_R2_ENDPOINT "$POSTGRES_BACKUP_R2_ENDPOINT" || valid=false
  require_value POSTGRES_BACKUP_R2_BUCKET "$POSTGRES_BACKUP_R2_BUCKET" || valid=false
  require_value POSTGRES_BACKUP_R2_ACCESS_KEY_ID "$POSTGRES_BACKUP_R2_ACCESS_KEY_ID" || valid=false
  require_value POSTGRES_BACKUP_R2_SECRET_ACCESS_KEY "$POSTGRES_BACKUP_R2_SECRET_ACCESS_KEY" || valid=false

  require_positive_integer POSTGRES_BACKUP_PORT "$POSTGRES_BACKUP_PORT" || valid=false
  require_positive_integer POSTGRES_BACKUP_INTERVAL_SECONDS "$POSTGRES_BACKUP_INTERVAL_SECONDS" || valid=false
  require_positive_integer POSTGRES_BACKUP_RETRY_SECONDS "$POSTGRES_BACKUP_RETRY_SECONDS" || valid=false
  require_positive_integer POSTGRES_BACKUP_WAIT_SECONDS "$POSTGRES_BACKUP_WAIT_SECONDS" || valid=false

  case "$POSTGRES_DB" in
    *[!A-Za-z0-9_.-]*)
      log "ERROR: POSTGRES_DB may only contain letters, numbers, dots, underscores, and hyphens."
      valid=false
      ;;
  esac

  case "$POSTGRES_BACKUP_R2_ENDPOINT" in
    https://*.r2.cloudflarestorage.com|https://*.r2.cloudflarestorage.com/)
      ;;
    *)
      log "ERROR: POSTGRES_BACKUP_R2_ENDPOINT must be a Cloudflare R2 HTTPS S3 endpoint."
      valid=false
      ;;
  esac

  [ "$valid" = true ]
}

log "PostgreSQL R2 backup is enabled; an initial backup will run now."

while :; do
  if ! validate_config; then
    log "Backup configuration is invalid; retrying validation in ${POSTGRES_BACKUP_RETRY_SECONDS}s."
    sleep_for "$POSTGRES_BACKUP_RETRY_SECONDS"
  elif run_backup; then
    log "Next backup attempt in ${POSTGRES_BACKUP_INTERVAL_SECONDS}s."
    sleep_for "$POSTGRES_BACKUP_INTERVAL_SECONDS"
  else
    log "Backup failed; retrying in ${POSTGRES_BACKUP_RETRY_SECONDS}s."
    sleep_for "$POSTGRES_BACKUP_RETRY_SECONDS"
  fi
done
