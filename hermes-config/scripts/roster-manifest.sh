#!/usr/bin/env bash
# roster-manifest.sh -- print a count and an integrity result for every
# database that Stage 6 copies. Run on the Mac before the copy, and on the
# server after it. The two outputs must be identical.
#
# Keys are relative to HERMES_HOME, so the output does not name a machine.
set -uo pipefail
H="${HERMES_HOME:-$HOME/.hermes}"

row() {  # row <key> <db> <table>
  if [ -f "$2" ]; then
    printf '%-34s %8s  %s\n' "$1" \
      "$(sqlite3 "$2" "SELECT COUNT(*) FROM $3;" 2>/dev/null || echo ERR)" \
      "$(sqlite3 "$2" 'PRAGMA integrity_check;' 2>/dev/null | head -1)"
  else
    printf '%-34s %8s  %s\n' "$1" absent -
  fi
}

row "kanban/tasks"          "$H/kanban.db" tasks
row "kanban/task_events"    "$H/kanban.db" task_events
row "kanban/task_comments"  "$H/kanban.db" task_comments
row "kanban/task_links"     "$H/kanban.db" task_links
row "kanban/task_runs"      "$H/kanban.db" task_runs
row "root/messages"         "$H/state.db"  messages

for d in "$H"/profiles/*/; do
  p="$(basename "$d")"
  row "$p/messages"  "$d/state.db"    messages
  row "$p/sessions"  "$d/state.db"    sessions
  row "$p/projects"  "$d/projects.db" projects
done
