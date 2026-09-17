# 0049 — A read-only connection that could not read

**Date:** 2026-09-17
**Stage:** 5, cron and Fizzy comments
**Status:** Active. `blocked-watch.sh` reads `kanban.db` directly, and
this session found the reason a safer flag could not be used.

## The failed attempt

The first draft of `blocked-watch.sh` opened the database with
`sqlite3 -readonly`, the safer flag, because the script runs one
`SELECT` and changes nothing. The flag failed:

```
sqlite3 -readonly ~/.hermes/kanban.db "SELECT 1;"
Error: in prepare, unable to open database file (14)
```

The same flag succeeds on every `state.db` on the machine:

```
sqlite3 -readonly ~/.hermes/profiles/crazydave/state.db "SELECT 1;"
1
```

## Why the flag fails on one file and not the other

`kanban.db` runs in WAL mode. A WAL database keeps its recent writes in
two sidecar files, `kanban.db-shm` and `kanban.db-wal`, next to the main
file. A connection opened `-readonly` holds no permission to create the
sidecar files it needs, so SQLite refuses to open the database until
those files already exist. The sidecar files exist only while a process
holds the database open.

`kanban.db` sits idle between cron runs, with no process holding it
open, so its sidecar files are absent when the script starts. Every profile's
`state.db` stays open inside a running gateway process, so its sidecar
files are already present when a script opens a read-only connection.

The fix drops the flag. `blocked-watch.sh` opens `kanban.db` with a
plain `sqlite3` call. The query is a `SELECT`, so the missing flag
changes nothing about what the script can do to the file.

## A second defect, found while writing the query

The query that finds a task's blocked duration used this expression:

```sql
SELECT 'blocked ' || (1000 - 400)/60 || 'm';
-- returns 0
```

In SQLite, the `||` operator binds tighter than `-` and `/`, so both
concatenations run before the division. The expression groups as
`('blocked ' || (1000 - 400)) / (60 || 'm')`, which reduces to
`'blocked 600' / '60m'`, a string divided by a string. SQLite casts
each string operand to a number before it divides them, and
`'blocked 600'` casts to `0`, so the whole expression returns the
integer `0`. Parentheses around the arithmetic fix the order:

```sql
SELECT 'blocked ' || ((1000 - 400)/60) || 'm';
-- returns blocked 10m
```

## What generalizes

**A read-only flag describes an intention, not a guarantee.** The flag
asks the database driver to open the file without writing to it.
Whether that request succeeds depends on the file layout: which sidecar
files exist, and who created them. The flag names an intention. The
file layout decides whether the intention works.

**A concatenation operator can outrank arithmetic around it.** A reader
easily assumes the familiar order and skips a check of operator
precedence. Parentheses around the arithmetic settle the question once,
and every future run of the query then trusts that answer.

See [record 0043](0043-a-report-that-went-to-the-wrong-room.md), which
named the two tasks that blocked on 14 September 2026 and that this
record's script finds by reading `kanban.db` directly.
