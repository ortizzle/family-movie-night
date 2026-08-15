#!/usr/bin/env bash
# Build, then run every suite. One argument runs a single one: ./run.sh claude
set -uo pipefail
cd "$(dirname "$0")"

if [ ! -d node_modules/playwright-core ]; then
  echo "playwright-core missing — run:  cd tests && npm install"
  echo "(dev only; the app itself still ships with zero dependencies)"
  exit 2
fi

echo "building index.html…"
python3 ../build.py || exit 1
echo

pick="${1:-}"
fails=0
for f in *.test.js; do
  [ -e "$f" ] || continue
  if [ -n "$pick" ] && [ "$f" != "$pick.test.js" ]; then continue; fi
  echo "── $f ─────────────────────────────"
  # a suite that wedges shouldn't wedge the run; each writes <name>.log as it goes
  timeout 600 node "$f"
  code=$?
  [ $code -ne 0 ] && fails=$((fails+1)) && echo "(exit $code)"
  echo
done

if [ $fails -eq 0 ]; then echo "ALL SUITES GREEN"; else echo "$fails SUITE(S) FAILED"; fi
exit $fails
