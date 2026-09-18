#!/usr/bin/env bash
# blocked-watch-dedup.sh
#
# Stateful version of blocked-watch.sh: same SELECT and same output line
# format, but suppresses output when the blocked set is UNCHANGED since the
# last run that notified. A steady blocked set emits one alert instead of a
# constant cron stream. Re-blocks after an unblock re-notify automatically.
#
# Behavioral only -- the SQL and output format are unchanged from the
# original. The original blocked-watch.sh is left untouched.
#
# State: a JSON file mapping last-notified task ids -> timestamp. Default
# location is next to this script (drafts/), overridable via BLOCKED_WATCH_STATE.
#
# STATUS: this draft is installed. The running copy lives at
# `~/.hermes/profiles/crazydave/scripts/blocked-watch.sh`, and the repo
# mirror is `hermes-config/scripts/blocked-watch.sh`. Read those two, not
# this one. The addendum of record 0051 holds the reason for the change.
set -uo pipefail

# Same DB resolution as the original -- overridable via HERMES_KANBAN_DB.
DB="${HERMES_KANBAN_DB:-$HOME/.hermes/kanban.db}"

# State file: default sits beside this script (drafts/), overridable for tests.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE="${BLOCKED_WATCH_STATE:-$SCRIPT_DIR/.blocked-watch-state.json}"

# Missing DB is "not my business" -- exit 0 silently, write nothing.
[ -f "$DB" ] || exit 0

OUTPUT="$(sqlite3 "$DB" <<'SQL' 2>/dev/null
SELECT 'blocked ' || ((strftime('%s','now') - e.created_at)/60) || 'm: '
       || t.id || ' (' || COALESCE(t.assignee,'unassigned') || ') '
       || substr(COALESCE(json_extract(e.payload,'$.reason'),''),1,120)
FROM tasks t
JOIN task_events e ON e.task_id = t.id AND e.kind = 'blocked'
WHERE t.status = 'blocked'
  AND e.created_at = (SELECT MAX(created_at) FROM task_events
                      WHERE task_id = t.id AND kind = 'blocked')
  AND e.created_at < strftime('%s','now') - 3600;
SQL
)"

# Canonical form of a newline-list of ids: drop empties, sort, dedupe.
canon() { printf '%s\n' "$1" | sed '/^$/d' | sort -u; }

# Current hit ids (query order; order is irrelevant for set comparison).
CURRENT_HITS="$(printf '%s\n' "$OUTPUT" | sed -E 's/^blocked [0-9]+m: ([^ ]+) .*/\1/')"

# --- Load previous notified set -------------------------------------------
NOTIFIED_IDS=""
STATE_OK=1
if [ -f "$STATE" ]; then
  if STATE_CONTENT="$(cat "$STATE" 2>/dev/null)" \
     && printf '%s' "$STATE_CONTENT" | grep -q '"version"[[:space:]]*:[[:space:]]*1'; then
    chmod 600 "$STATE" 2>/dev/null   # tighten perms if group/world-readable
    # Task ids are the only quoted strings in the file (values are numeric
    # timestamps); version/updated_at never match the id pattern.
    NOTIFIED_IDS="$(printf '%s' "$STATE_CONTENT" | grep -oE '"t_[a-zA-Z0-9_]+"' | tr -d '"')"
  else
    # Missing/empty-valid but unparsable (no version 1, bad JSON): first run.
    STATE_OK=0
    printf '%s\n' "blocked-watch: unreadable state file, treating as first run: $STATE" >&2
  fi
else
  # No state file yet.
  STATE_OK=0
fi

# --- Decide: any set change? ----------------------------------------------
C_C="$(canon "$CURRENT_HITS")"
N_C="$(canon "$NOTIFIED_IDS")"
CHANGED=0
[ "$C_C" = "$N_C" ] || CHANGED=1

# We write state on: any set change, a missing baseline (first run even with
# zero hits), or a malformed state file we need to overwrite.
NEED_WRITE=0
[ "$CHANGED" = 1 ] && NEED_WRITE=1
if [ "$NEED_WRITE" = 0 ]; then
  if [ ! -f "$STATE" ] || [ "$STATE_OK" = 0 ]; then NEED_WRITE=1; fi
fi

# --- Emit ----------------------------------------------------------------
# Only when the blocked set changed. Unchanged => nothing, not even a summary.
if [ "$CHANGED" = 1 ] && [ -n "$OUTPUT" ]; then
  printf '%s\n' "$OUTPUT"
fi

# --- Update state (only after the output above was emitted successfully) --
if [ "$NEED_WRITE" = 1 ]; then
  NOW="$(date +%s)"
  # Rebuild notified = exactly the current hits, freshly timestamped. Ids
  # pruned (removed from the notification history) are automatically dropped,
  # which is what makes re-block re-notify on the next run.
  BUILT=""
  while IFS= read -r _id; do
    [ -n "$_id" ] && BUILT="${BUILT}\"$_id\": $NOW, "
  done <<<"$C_C"
  BUILT="${BUILT%, }"
  STATE_JSON="{\"version\": 1, \"notified\": {$BUILT}, \"updated_at\": $NOW}"

  # Ensure parent dir exists (drafts/ or the override's dir).
  mkdir -p "$(dirname "$STATE")" 2>/dev/null || true

  # Atomic write: tmp file in the same dir, umask 077, then rename.
  if (
    umask 077
    if ! printf '%s\n' "$STATE_JSON" > "${STATE}.tmp" 2>/dev/null; then
      exit 2
    fi
    if ! mv -f "${STATE}.tmp" "$STATE" 2>/dev/null; then
      rm -f "${STATE}.tmp"
      exit 3
    fi
  ) 2>/dev/null; then
    :
  else
    # Unwritable state degrades to always-notify; never crash the cron job.
    # The subshell's stderr is discarded, because a failed redirection prints
    # its own message from the shell, and that message reaches Telegram.
    printf '%s\n' "blocked-watch: cannot update state file: ${STATE}" >&2
  fi
fi

exit 0