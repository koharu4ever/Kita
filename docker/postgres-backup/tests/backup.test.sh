#!/bin/sh

set -eu

script_dir="$(CDPATH= cd "$(dirname "$0")" && pwd)"
backup_script="$(CDPATH= cd "$script_dir/.." && pwd)/backup.sh"
test_root="$(mktemp -d)"
passed=0

cleanup_test_root() {
  rm -rf "$test_root"
}

trap cleanup_test_root EXIT HUP INT TERM

fail() {
  printf 'not ok - %s\n' "$*" >&2
  exit 1
}

assert_contains() {
  file="$1"
  expected="$2"

  if ! grep -F "$expected" "$file" >/dev/null; then
    printf '%s\n' "--- output ---" >&2
    cat "$file" >&2
    printf '%s\n' "--------------" >&2
    fail "expected output to contain: $expected"
  fi
}

assert_not_contains() {
  file="$1"
  unexpected="$2"

  if grep -F "$unexpected" "$file" >/dev/null; then
    printf '%s\n' "--- output ---" >&2
    cat "$file" >&2
    printf '%s\n' "--------------" >&2
    fail "expected output not to contain: $unexpected"
  fi
}

assert_dump_removed() {
  state_dir="$1"
  record="$state_dir/dump-path"

  [ -f "$record" ] || fail "fake pg_dump did not record the temporary dump path"
  dump_path="$(cat "$record")"
  [ ! -e "$dump_path" ] || fail "temporary dump still exists: $dump_path"
}

write_fakes() {
  case_dir="$1"
  fake_bin="$case_dir/bin"
  mkdir -p "$fake_bin"

  cat > "$fake_bin/pg_isready" <<'EOF'
#!/bin/sh
exit 0
EOF

  cat > "$fake_bin/pg_dump" <<'EOF'
#!/bin/sh
set -eu

dump_file=""

for argument in "$@"; do
  case "$argument" in
    --file=*)
      dump_file="${argument#--file=}"
      ;;
  esac
done

[ -n "$dump_file" ] || exit 64
printf '%s\n' "$dump_file" > "$TEST_STATE_DIR/dump-path"

if [ "$TEST_SCENARIO" = "pg_dump_failure" ]; then
  exit 7
fi

printf '%s' 'fake-postgresql-custom-archive' > "$dump_file"
EOF

  cat > "$fake_bin/pg_restore" <<'EOF'
#!/bin/sh
set -eu

printf '%s\n' "$*" > "$TEST_STATE_DIR/pg-restore-arguments"

if [ "$TEST_SCENARIO" = "pg_restore_failure" ]; then
  exit 8
fi
EOF

  cat > "$fake_bin/rclone" <<'EOF'
#!/bin/sh
set -eu

printf '%s\n' "$@" > "$TEST_STATE_DIR/rclone-arguments"

if [ "$TEST_SCENARIO" = "rclone_failure" ]; then
  exit 9
fi
EOF

  cat > "$fake_bin/sleep" <<'EOF'
#!/bin/sh

kill -TERM "$PPID"
exit 0
EOF

  chmod +x "$fake_bin/pg_isready" "$fake_bin/pg_dump" "$fake_bin/pg_restore" "$fake_bin/rclone" "$fake_bin/sleep"
}

run_scenario() {
  scenario="$1"
  case_dir="$test_root/$scenario"
  state_dir="$case_dir/state"
  output="$case_dir/output.log"

  mkdir -p "$state_dir"
  write_fakes "$case_dir"

  set +e
  env \
    PATH="$case_dir/bin:$PATH" \
    TEST_SCENARIO="$scenario" \
    TEST_STATE_DIR="$state_dir" \
    POSTGRES_BACKUP_ENABLED=true \
    POSTGRES_BACKUP_HOST=postgres.test \
    POSTGRES_BACKUP_PORT=5432 \
    POSTGRES_BACKUP_INTERVAL_SECONDS=1 \
    POSTGRES_BACKUP_RETRY_SECONDS=1 \
    POSTGRES_BACKUP_WAIT_SECONDS=1 \
    POSTGRES_DB=kita_test \
    POSTGRES_USER=kita_test \
    POSTGRES_PASSWORD=unit-test-password \
    POSTGRES_BACKUP_R2_ENDPOINT=https://test-account.r2.cloudflarestorage.com \
    POSTGRES_BACKUP_R2_BUCKET=test-bucket \
    POSTGRES_BACKUP_R2_ACCESS_KEY_ID=unit-test-access-key \
    POSTGRES_BACKUP_R2_SECRET_ACCESS_KEY=unit-test-secret-key \
    sh "$backup_script" > "$output" 2>&1
  status=$?
  set -e

  [ "$status" -eq 0 ] || fail "$scenario exited with status $status"

  printf '%s\n' "$case_dir"
}

pass() {
  passed=$((passed + 1))
  printf 'ok %s - %s\n' "$passed" "$1"
}

case_dir="$(run_scenario pg_dump_failure)"
assert_contains "$case_dir/output.log" "ERROR: pg_dump failed."
assert_contains "$case_dir/output.log" "Backup failed; retrying in 1s."
assert_not_contains "$case_dir/output.log" "Backup completed:"
assert_dump_removed "$case_dir/state"
pass "pg_dump failure is reported and cleaned up"

case_dir="$(run_scenario pg_restore_failure)"
assert_contains "$case_dir/output.log" "ERROR: pg_restore could not read the generated archive."
assert_not_contains "$case_dir/output.log" "Backup completed:"
[ ! -e "$case_dir/state/rclone-arguments" ] || fail "rclone ran after archive validation failed"
assert_dump_removed "$case_dir/state"
pass "invalid archive stops before upload and is cleaned up"

case_dir="$(run_scenario rclone_failure)"
assert_contains "$case_dir/output.log" "Archive validated:"
assert_contains "$case_dir/output.log" "ERROR: Upload to R2 failed."
assert_contains "$case_dir/output.log" "Backup failed; retrying in 1s."
assert_not_contains "$case_dir/output.log" "Backup completed:"
assert_dump_removed "$case_dir/state"
pass "R2 upload failure is reported and cleaned up"

case_dir="$(run_scenario success)"
assert_contains "$case_dir/output.log" "Archive validated:"
assert_contains "$case_dir/output.log" "Backup completed:"
assert_contains "$case_dir/output.log" "Next backup attempt in 1s."
assert_not_contains "$case_dir/output.log" "unit-test-password"
assert_not_contains "$case_dir/output.log" "unit-test-secret-key"
assert_contains "$case_dir/state/rclone-arguments" "r2:test-bucket/kita/postgres/"
assert_dump_removed "$case_dir/state"
pass "successful backup uploads once, reports success, and cleans up"

printf '1..%s\n' "$passed"
