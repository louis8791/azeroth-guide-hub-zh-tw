#!/bin/zsh
set -euo pipefail

PROJECT_DIR="/Users/louis8791/Documents/魔獸攻略/azeroth-guide-hub-zh-tw"
SOURCE_PLIST="$PROJECT_DIR/config/com.louis.azeroth-guide-refresh.plist"
TARGET_PLIST="${HOME}/Library/LaunchAgents/com.louis.azeroth-guide-refresh.plist"
SERVICE_NAME="com.louis.azeroth-guide-refresh"

mkdir -p "${HOME}/Library/LaunchAgents"
cp "$SOURCE_PLIST" "$TARGET_PLIST"
chmod 644 "$TARGET_PLIST"
chmod +x "$PROJECT_DIR/scripts/run-scheduled-refresh.sh"
launchctl bootout "gui/$(id -u)/$SERVICE_NAME" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$TARGET_PLIST"
launchctl kickstart "gui/$(id -u)/$SERVICE_NAME"
echo "Installed $SERVICE_NAME"
