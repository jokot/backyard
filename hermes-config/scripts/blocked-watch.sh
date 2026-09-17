#!/usr/bin/env bash
# Print one line for each kanban task that stayed blocked for more than 60
# minutes. Print nothing otherwise, so a healthy run delivers no message.
#
# The script opens kanban.db without `-readonly`. A read-only connection to
# a WAL database fails when the -shm and -wal sidecar files are absent, and
# those files exist only while a process holds the database open. This query
# is a SELECT and changes nothing.
set -uo pipefail
DB="${HERMES_KANBAN_DB:-$HOME/.hermes/kanban.db}"
[ -f "$DB" ] || exit 0
sqlite3 "$DB" <<'SQL' 2>/dev/null
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
exit 0
