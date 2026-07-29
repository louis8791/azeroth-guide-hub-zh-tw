#!/bin/zsh
set -euo pipefail

PROJECT_DIR="/Users/louis8791/Documents/魔獸攻略/azeroth-guide-hub-zh-tw"
CURRENT_HOUR="$(date +%H)"
CURRENT_WEEKDAY="$(date +%u)"
TRANSLATOR="${TRANSLATION_PROVIDER:-argos}"
TRANSLATION_PYTHON="${TRANSLATION_PYTHON:-/Users/louis8791/Documents/魔獸攻略/icy-veins-zh-tw/.venv/bin/python}"

cd "$PROJECT_DIR"

node scripts/crawl-sources.mjs --tier=urgent
node scripts/crawl-sources.mjs --tier=stats

if [[ "$CURRENT_HOUR" == "03" ]]; then
  node scripts/crawl-sources.mjs --tier=guides
fi

if [[ "$CURRENT_HOUR" == "04" ]]; then
  node scripts/crawl-sources.mjs --tier=questions
fi

if [[ "$CURRENT_WEEKDAY" == "7" && "$CURRENT_HOUR" == "02" ]]; then
  node scripts/crawl-sources.mjs --tier=backfill
fi

"$TRANSLATION_PYTHON" scripts/translate-content.py --provider="$TRANSLATOR"

git add data/content-source.json data/crawl-report.json data/translation-cache.json public/data/live-index.json
if git diff --cached --quiet; then
  exit 0
fi

git commit -m "data: refresh guide index"
git push origin main
