#!/usr/bin/env bash
# Integration tests: isolated test database, framework fixtures, live Medusa server.
# Requires the local Postgres from infra/docker-compose.yml (port 55433) and no
# production credentials. Never points at the development database.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DB_URL="${TEST_DATABASE_URL:-postgres://hive:hive_local_dev_pw@127.0.0.1:55433/medusa_hive_test}"
PORT="${MEDUSA_TEST_PORT:-9001}"
LOG_DIR="${TMPDIR:-/tmp}"
ADMIN_EMAIL="${MEDUSA_TEST_ADMIN_EMAIL:-admin@hive-web.local}"
ADMIN_PASSWORD="${MEDUSA_TEST_ADMIN_PASSWORD:-hive-local-admin}"

run_medusa() {
  env -u DATABASE_URL -u REDIS_URL DATABASE_URL="$TEST_DB_URL" "$@"
}

cd "$ROOT/apps/backend"

echo "== migrate test database =="
run_medusa npx medusa db:migrate >"$LOG_DIR/hive-test-migrate.log" 2>&1 || {
  echo "migration failed; see $LOG_DIR/hive-test-migrate.log"
  tail -20 "$LOG_DIR/hive-test-migrate.log"
  exit 1
}

echo "== framework fixtures =="
run_medusa npx medusa exec ./src/scripts/test-fixtures.ts >"$LOG_DIR/hive-test-fixtures.log" 2>&1 || {
  echo "fixtures failed; see $LOG_DIR/hive-test-fixtures.log"
  tail -20 "$LOG_DIR/hive-test-fixtures.log"
  exit 1
}

PUBLISHABLE_KEY="$(grep -o 'publishable_key=[^ ]*' "$LOG_DIR/hive-test-fixtures.log" | tail -1 | cut -d= -f2)"
if [ -z "$PUBLISHABLE_KEY" ]; then
  echo "could not read publishable key from fixtures log"
  exit 1
fi

echo "== admin user for the test database =="
run_medusa npx medusa user -e "$ADMIN_EMAIL" -p "$ADMIN_PASSWORD" >"$LOG_DIR/hive-test-admin.log" 2>&1 || true

echo "== start Medusa on port $PORT =="
run_medusa env PORT="$PORT" npx medusa develop >"$LOG_DIR/hive-test-server.log" 2>&1 &
SERVER_PID=$!
cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

READY=0
for _ in $(seq 1 90); do
  if curl -sf "http://127.0.0.1:$PORT/health" >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 2
done

if [ "$READY" -ne 1 ]; then
  echo "server did not become ready; see $LOG_DIR/hive-test-server.log"
  tail -30 "$LOG_DIR/hive-test-server.log"
  exit 1
fi

echo "== integration tests =="
MEDUSA_TEST_URL="http://127.0.0.1:$PORT" \
PUBLISHABLE_KEY="$PUBLISHABLE_KEY" \
ADMIN_EMAIL="$ADMIN_EMAIL" \
ADMIN_PASSWORD="$ADMIN_PASSWORD" \
node --test "$ROOT/tests/integration/api.test.mjs"
