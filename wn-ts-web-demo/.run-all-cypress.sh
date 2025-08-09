#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/workspace"
APP_DIR="/workspace/wn-ts-web-demo"
DEV_LOG="$APP_DIR/.dev.log"
CYPRESS_LOG="$APP_DIR/.cypress-all.log"
ORCH_LOG="$APP_DIR/.orchestrator.log"

# Start fresh logs
: > "$DEV_LOG"
: > "$CYPRESS_LOG"
: > "$ORCH_LOG"

exec > >(tee -a "$ORCH_LOG") 2>&1

echo "[orchestrator] Starting at $(date -Iseconds)"

cd "$ROOT_DIR"

# Ensure pnpm
if ! command -v pnpm >/dev/null 2>&1; then
  echo "[orchestrator] Installing pnpm globally..."
  npm i -g pnpm
  hash -r || true
fi

echo "[orchestrator] pnpm version: $(pnpm -v)"

echo "[orchestrator] Installing workspace dependencies..."
pnpm install

echo "[orchestrator] Launching dev server..."
cd "$APP_DIR"
export VITE_E2E=1; pnpm exec vite --port 5173 --strictPort > "$DEV_LOG" 2>&1 & echo $! > "$APP_DIR/.dev.pid"
DEV_PID=$(cat "$APP_DIR/.dev.pid")
echo "[orchestrator] Dev server PID: $DEV_PID"

# Wait for Vite to be ready
ATTEMPTS=180
SLEEP_SECS=2
READY=0
for i in $(seq 1 $ATTEMPTS); do
  if curl -fsS http://localhost:5173 >/dev/null; then
    READY=1
    echo "[orchestrator] Dev server is ready (attempt $i)"
    break
  fi
  if ! kill -0 "$DEV_PID" 2>/dev/null; then
    echo "[orchestrator] Dev server exited early. See $DEV_LOG"
    exit 1
  fi
  sleep "$SLEEP_SECS"
  if (( i % 10 == 0 )); then
    echo "[orchestrator] Waiting for dev server... ($i/$ATTEMPTS)"
  fi

done

if [[ "$READY" -ne 1 ]]; then
  echo "[orchestrator] Timed out waiting for dev server. See $DEV_LOG"
  exit 1
fi

# Run Cypress for all specs (wordnet + examples)
echo "[orchestrator] Running Cypress end-to-end tests (all specs)..."
set +e
pnpm exec cypress run \
  --config specPattern='cypress/e2e/**/*.{cy,spec}.{js,ts,jsx,tsx}',supportFile='cypress/support/e2e.ts' \
  | tee -a "$CYPRESS_LOG"
CYPRESS_STATUS=${PIPESTATUS[0]}
set -e

# Cleanup
if kill -0 "$DEV_PID" 2>/dev/null; then
  echo "[orchestrator] Stopping dev server (PID $DEV_PID)"
  kill "$DEV_PID" || true
  # Give it a moment to exit
  sleep 2 || true
  kill -9 "$DEV_PID" 2>/dev/null || true
fi

if [[ "$CYPRESS_STATUS" -eq 0 ]]; then
  echo "[orchestrator] Cypress completed successfully"
else
  echo "[orchestrator] Cypress failed with status $CYPRESS_STATUS"
fi

echo "[orchestrator] Finished at $(date -Iseconds)"
exit "$CYPRESS_STATUS"