#!/usr/bin/env bash
#
# Configure npm OIDC "trusted publishing" for every public workspace package,
# so .github/workflows/release.yml can publish tokenless.
#
# Prerequisites: npm >= 11.5.1, `npm whoami` succeeds, each package already
# published once (E404 = never published; bootstrap with a token/OTP publish),
# and the npmjs.com "skip 2FA for 5 minutes" option enabled (EOTP otherwise).
#
# Usage: bash scripts/configure-trusted-publishers.sh
set -u

REPO="fustilio/wordnet-playground"
WORKFLOW="release.yml"

cd "$(dirname "$0")/.."

names=$(pnpm -r --filter='./packages/*' ls --depth -1 --json 2>/dev/null \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const a=JSON.parse(s);(Array.isArray(a)?a:[a]).filter(p=>p&&p.name&&!p.private).forEach(p=>console.log(p.name))})')

total=$(printf '%s\n' "$names" | sed '/^$/d' | wc -l)
echo "Configuring trusted publishers for $total packages (repo=$REPO, workflow=$WORKFLOW)"

ok=0; fail=0
while IFS= read -r name; do
  [ -z "$name" ] && continue
  out=$(npm trust github "$name" --file "$WORKFLOW" --repo "$REPO" --allow-publish --yes 2>&1)
  if [ $? -eq 0 ]; then
    ok=$((ok+1)); echo "  ✓ $name"
  elif printf '%s' "$out" | grep -q 'E409'; then
    ok=$((ok+1)); echo "  = $name  (already configured)"
  else
    code=$(printf '%s' "$out" | grep -m1 -o 'npm error code [A-Z0-9]*' | sed 's/npm error code //')
    fail=$((fail+1)); echo "  ✗ $name  (${code:-unknown}: EOTP = 2FA window closed, E404 = never published)"
  fi
  sleep 2
done <<< "$names"

echo "done: configured=$ok failed=$fail / $total"
[ "$fail" -eq 0 ]
