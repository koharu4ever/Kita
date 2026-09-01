#!/bin/sh

set -eu

container_name="kita-payload-integration-postgres"
purpose_label="com.kita.purpose=payload-integration-smoke"
database_name="kita_integration"
database_user="kita_integration"
database_password="kita-integration-password"
created_container="false"

cleanup() {
  if [ "$created_container" != "true" ]; then
    return
  fi

  if ! docker container inspect "$container_name" >/dev/null 2>&1; then
    return
  fi

  actual_label="$(
    docker container inspect \
      --format '{{ index .Config.Labels "com.kita.purpose" }}' \
      "$container_name"
  )"

  if [ "$actual_label" != "payload-integration-smoke" ]; then
    printf '%s\n' "[payload-integration] Refusing to stop an unexpected container named $container_name." >&2
    return 1
  fi

  docker container rm --force "$container_name" >/dev/null
}

trap cleanup EXIT INT TERM

if docker container inspect "$container_name" >/dev/null 2>&1; then
  printf '%s\n' "[payload-integration] $container_name already exists; inspect it manually before retrying." >&2
  exit 1
fi

docker run \
  --detach \
  --health-cmd="pg_isready -U $database_user -d $database_name" \
  --health-interval=1s \
  --health-retries=60 \
  --health-timeout=5s \
  --label "$purpose_label" \
  --name "$container_name" \
  --publish 127.0.0.1::5432 \
  --tmpfs /var/lib/postgresql/data:rw,noexec,nosuid,size=512m \
  --env "POSTGRES_DB=$database_name" \
  --env "POSTGRES_PASSWORD=$database_password" \
  --env "POSTGRES_USER=$database_user" \
  postgres:16 >/dev/null

created_container="true"

attempt=0
while :; do
  container_status="$(docker container inspect --format '{{ .State.Status }}' "$container_name")"
  health_status="$(docker container inspect --format '{{ .State.Health.Status }}' "$container_name")"

  if [ "$health_status" = "healthy" ]; then
    break
  fi

  if [ "$container_status" = "exited" ] || [ "$container_status" = "dead" ] || [ "$health_status" = "unhealthy" ]; then
    docker container logs "$container_name" >&2
    printf '%s\n' "[payload-integration] PostgreSQL stopped before becoming healthy." >&2
    exit 1
  fi

  attempt=$((attempt + 1))

  if [ "$attempt" -ge 60 ]; then
    docker container logs "$container_name" >&2
    printf '%s\n' "[payload-integration] PostgreSQL did not become healthy within 60 seconds." >&2
    exit 1
  fi

  sleep 1
done

port_binding="$(docker port "$container_name" 5432/tcp)"
database_port="${port_binding##*:}"

export DATABASE_URI="postgres://$database_user:$database_password@127.0.0.1:$database_port/$database_name"
export ENABLE_DEV_SEED="false"
export MEDIA_STORAGE_MODE="local"
export NODE_ENV="test"
export PAYLOAD_SECRET="integration-only-payload-secret-at-least-32-characters"
export PAYLOAD_MIGRATING="true"
export SKIP_ENV_VALIDATION="false"

printf '%s\n' "[payload-integration] Running all registered migrations against disposable PostgreSQL 16."
pnpm payload:migrate

printf '%s\n' "[payload-integration] Re-running migrations to verify there are no pending changes."
pnpm payload:migrate

printf '%s\n' "[payload-integration] Verifying schema and access through the Payload Local API."
pnpm exec vitest run --config vitest.integration.config.ts
