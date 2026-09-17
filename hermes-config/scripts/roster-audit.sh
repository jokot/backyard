#!/usr/bin/env bash
# Check four roster rules. Print one line for each rule that fails. Print
# nothing when every rule holds, so a healthy run delivers no message.
#
# Each check names the learning record that found the defect.
set -uo pipefail

# 1. Every profile speaks into the same room. Record 0043.
n=$(grep -h '^TELEGRAM_HOME_CHANNEL=' "$HOME"/.hermes/profiles/*/.env 2>/dev/null \
      | sort -u | wc -l | tr -d ' ')
[ "$n" = "1" ] || echo "home channel: $n distinct values across profiles, expected 1"

# 2. The allowlist of Crazy Dave holds exactly three entries. Record 0046.
n=$(hermes -p crazydave config get command_allowlist 2>/dev/null | grep -c '^- ')
[ "$n" = "3" ] || echo "allowlist: crazydave holds $n entries, expected 3"

# 3. Crazy Dave keeps the kanban toolset. Record 0044.
hermes -p crazydave config get toolsets 2>/dev/null | grep -q '^- kanban$' \
  || echo "toolsets: crazydave is missing kanban"

# 4. No Telegram session runs on a prompt older than 7 days. Record 0045.
for db in "$HOME"/.hermes/profiles/*/state.db; do
  p=$(basename "$(dirname "$db")")
  old=$(sqlite3 "$db" "SELECT COUNT(*) FROM sessions WHERE source='telegram'
          AND ended_at IS NULL
          AND started_at < strftime('%s','now') - 604800;" 2>/dev/null)
  [ -n "$old" ] && [ "$old" != "0" ] \
    && echo "session: $p holds $old telegram session(s) older than 7 days"
done
exit 0
