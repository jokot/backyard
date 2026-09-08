#!/usr/bin/env bash
# Subscribe every open kanban task to Telegram, then clear notifier_profile.
#
# Two defects make this necessary. `hermes kanban decompose` never subscribes
# the children it creates, so only the root task gets a row. And the notifier
# rejects any stored profile name, so the stamp must be NULL.
# See teach/learning-records/0008-blocked-child-tasks-report-to-nobody.md
#
# Designed for `hermes cron --no-agent`. It prints nothing when there is
# nothing to do, so a silent run delivers no message.

set -uo pipefail

CHAT_ID="${HERMES_TELEGRAM_CHAT_ID:-<PERSONAL-DM>}"
KANBAN_DB="${HERMES_KANBAN_DB:-$HOME/.hermes/kanban.db}"

command -v hermes >/dev/null 2>&1 || exit 0
[ -f "$KANBAN_DB" ] || exit 0

# Clear the stamp on every row. The create path rewrites it each time a new
# task appears, so this runs on every tick, not only when a row was added.
sqlite3 "$KANBAN_DB" \
  "UPDATE kanban_notify_subs SET notifier_profile = NULL
   WHERE platform='telegram' AND notifier_profile IS NOT NULL;" 2>/dev/null

open_ids=$(hermes kanban list 2>/dev/null | grep -o 't_[0-9a-f]\{8\}' | sort -u)
[ -z "$open_ids" ] && exit 0

subscribed=$(sqlite3 "$KANBAN_DB" \
  "SELECT task_id FROM kanban_notify_subs WHERE platform='telegram' AND chat_id='$CHAT_ID';" 2>/dev/null)

added=""
for id in $open_ids; do
  case " $subscribed " in
    *" $id "*) continue ;;
  esac
  if hermes kanban notify-subscribe "$id" --platform telegram --chat-id "$CHAT_ID" >/dev/null 2>&1; then
    added="$added $id"
  fi
done

# Silence when nothing was added.
[ -z "$added" ] && exit 0
echo "kanban: subscribed$added"
