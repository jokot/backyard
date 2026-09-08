#!/usr/bin/env bash
# Subscribe every open kanban task to Telegram, then clear notifier_profile.
#
# Why this script exists: `hermes kanban decompose` does not subscribe the
# children it creates. Only the root task Crazy Dave files gets a
# subscription. See teach/learning-records/0008-blocked-child-tasks-report-to-nobody.md
#
# The NULL stamp is the second half. The notifier has two gates that reject
# opposite profile names, and NULL is the only value that passes both.
# The CLI cannot write NULL, so this needs a direct update.
#
# Usage: ./hermes-config/subscribe-children.sh
# Safe to run repeatedly. Subscribing an already-subscribed task is a no-op.

set -euo pipefail

CHAT_ID="${HERMES_TELEGRAM_CHAT_ID:-<PERSONAL-DM>}"
KANBAN_DB="${HERMES_KANBAN_DB:-$HOME/.hermes/kanban.db}"

ids=$(hermes kanban list | grep -o 't_[0-9a-f]\{8\}' | sort -u)

if [ -z "$ids" ]; then
  echo "No open tasks on the board."
  exit 0
fi

for id in $ids; do
  hermes kanban notify-subscribe "$id" --platform telegram --chat-id "$CHAT_ID" || true
done

sqlite3 "$KANBAN_DB" \
  "UPDATE kanban_notify_subs SET notifier_profile = NULL WHERE platform = 'telegram';"

echo
echo "Done. Current subscriptions:"
hermes kanban notify-list
