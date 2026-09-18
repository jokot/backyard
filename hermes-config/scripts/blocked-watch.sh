#!/usr/bin/env bash
# Print one line for each kanban task that stayed blocked for more than 60
# minutes, but only when the set of blocked tasks changed since the last
# run that spoke. A task that stays blocked is reported one time, not on
# every hour. A healthy run delivers no message.
#
# The script opens kanban.db without `-readonly`. A read-only connection to
# a WAL database fails when the -shm and -wal sidecar files are absent, and
# those files exist only while a process holds the database open. This query
# is a SELECT and changes nothing.
#
# State lives in a JSON file beside this script. The file holds the exact
# set of task ids of the last run that spoke:
#   {"version": 1, "notified": {"t_ab12cd34": 1789656000}, "updated_at": ...}
# Set BLOCKED_WATCH_STATE to move the file. Set HERMES_KANBAN_DB to point
# the query at a copy of the database. Tests need both.
set -uo pipefail

DB="${HERMES_KANBAN_DB:-$HOME/.hermes/kanban.db}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE="${BLOCKED_WATCH_STATE:-$SCRIPT_DIR/.blocked-watch-state.json}"

# A missing database is not the business of this job. Write no state file,
# because an empty answer from a database that is absent is not a baseline.
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

# Canonical form of a list of ids: drop the empty lines, sort, remove
# duplicates. Two sets are equal when their canonical forms are equal.
canon() { printf '%s\n' "$1" | sed '/^$/d' | sort -u; }

CURRENT_HITS="$(printf '%s\n' "$OUTPUT" | sed -E 's/^blocked [0-9]+m: ([^ ]+) .*/\1/')"

# --- Read the set of the last run that spoke -----------------------------
NOTIFIED_IDS=""
STATE_OK=1
if [ -f "$STATE" ]; then
  if STATE_CONTENT="$(cat "$STATE" 2>/dev/null)" \
     && printf '%s' "$STATE_CONTENT" | grep -q '"version"[[:space:]]*:[[:space:]]*1'; then
    chmod 600 "$STATE" 2>/dev/null
    # Task ids are the only quoted strings in the file. The values are
    # numbers, and the names version and updated_at do not start with t_.
    NOTIFIED_IDS="$(printf '%s' "$STATE_CONTENT" | grep -oE '"t_[a-zA-Z0-9_]+"' | tr -d '"')"
  else
    # The file exists but this script cannot read it. Treat the run as the
    # first run, and overwrite the bad file below.
    STATE_OK=0
    printf '%s\n' "blocked-watch: unreadable state file, treating as first run: $STATE" >&2
  fi
else
  STATE_OK=0
fi

# --- Did the set change? -------------------------------------------------
C_C="$(canon "$CURRENT_HITS")"
N_C="$(canon "$NOTIFIED_IDS")"
CHANGED=0
[ "$C_C" = "$N_C" ] || CHANGED=1

# Write the state file when the set changed, when no baseline exists, or
# when the old file was unreadable.
NEED_WRITE=0
[ "$CHANGED" = 1 ] && NEED_WRITE=1
if [ "$NEED_WRITE" = 0 ]; then
  if [ ! -f "$STATE" ] || [ "$STATE_OK" = 0 ]; then NEED_WRITE=1; fi
fi

# --- Speak ---------------------------------------------------------------
# Only when the set changed. An unchanged set gets no message at all, not
# even a summary. A changed set gets the full current list, so that each
# message stands on its own.
if [ "$CHANGED" = 1 ] && [ -n "$OUTPUT" ]; then
  printf '%s\n' "$OUTPUT"
fi

# --- Write the state file ------------------------------------------------
if [ "$NEED_WRITE" = 1 ]; then
  NOW="$(date +%s)"
  # The new set is exactly the current hits. An id that left the set is
  # dropped, and that is what makes a second block report again. The loop
  # reads the canonical list, not the raw list, because two blocked events
  # that share one timestamp give the same id two times. A raw list writes
  # that id as a duplicate name in the JSON object.
  BUILT=""
  while IFS= read -r _id; do
    [ -n "$_id" ] && BUILT="${BUILT}\"$_id\": $NOW, "
  done <<<"$C_C"
  BUILT="${BUILT%, }"
  STATE_JSON="{\"version\": 1, \"notified\": {$BUILT}, \"updated_at\": $NOW}"

  mkdir -p "$(dirname "$STATE")" 2>/dev/null || true

  # Write to a temporary file in the same directory, then rename. A rename
  # inside one directory is atomic, so the next run never reads half a file.
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
    # A state file that this script cannot write degrades the job to the
    # old behaviour, which speaks on every run. The job never fails.
    # The subshell sends its stderr to /dev/null, because a failed
    # redirection prints a message of its own, and that message reaches
    # Telegram.
    printf '%s\n' "blocked-watch: cannot update state file: ${STATE}" >&2
  fi
fi

exit 0
