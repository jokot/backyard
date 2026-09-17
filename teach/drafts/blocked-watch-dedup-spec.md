# Spec: dedup for blocked-watch.sh (stateful suppression of repeat alerts)

`blocked-watch.sh` runs on a cron tick and prints one line per kanban task
that has been blocked for more than 60 minutes (record 0051 §2: output only
on failure). Today it is stateless, so every tick after the first re-emits
the same lines — the 15-second Telegram watch-pattern cooldown plus the
watch-pattern strike limit (promoted to `notify_on_complete` after three
dropped 15-second windows) mean a steady blocked set produces a constant
stream instead of one useful alert per change. This spec adds a small
persistent state file so the script reports only changes: new blockers,
re-blocks after an unblock, and the initial baseline. It is behavioral
only; the SQL and the output line format stay as they are.

## Current behavior (read 2026-09-17, read-only)

`~/.hermes/profiles/crazydave/scripts/blocked-watch.sh`:

- `DB="${HERMES_KANBAN_DB:-$HOME/.hermes/kanban.db}"`; exits 0 silently if
  the file does not exist.
- Opens the DB without `-readonly` (deliberate: a read-only connection to a
  WAL database fails when `-shm`/`-wal` sidecars are absent) and runs one
  SELECT joining `tasks` to the latest `blocked` event per task, filtered to
  `status='blocked'` and age > 3600 s. It writes nothing to the DB.
- One stdout line per hit:
  `blocked <N>m: <task id> (<assignee>) <first 120 chars of block reason>`.
- `set -uo pipefail`; always `exit 0`. **No state of any kind is kept**
  between runs.

The dedup version must keep honoring `HERMES_KANBAN_DB` (see §6) so the
query can be pointed at a scratch copy for testing.

## 1. Remembered state and atomic update

State is a single JSON object holding the exact set of task ids the script
last emitted an alert for, with the epoch-seconds wall-clock time of that
emission:

```json
{"version": 1, "notified": {"t_ab12cd34": 1789656000, "t_ef90gh12": 1789656100}, "updated_at": 1789656105}
```

- `notified` keys are kanban task ids exactly as the SELECT returns them
  (the script never parses ids further).
- Values are the `strftime('%s','now')` timestamp of the run that alerted;
  informational only — retention is driven by membership, not age.

Update procedure, once per run, after computing the hit set:

1. Build the new-state JSON in a variable (old notified map with hits
   removed and re-added / fresh ids added, as per §3–§4 below).
2. Write it to `"$STATE.tmp"` with `umask 077` in effect.
3. `mv -f "$STATE.tmp" "$STATE"` — rename within the same directory is
   atomic on macOS and Linux, so a reader (next cron tick) never observes a
   half-written file.
4. If the script dies between the query and the rename, the old state file
   stands and the next run re-derives everything; no cleanup needed.
5. On any failure to write (disk full, permissions), print a one-line
   `blocked-watch: cannot update state file: <reason>` to stderr, still
   emit the query output for this run, and exit 0. Never crash the cron
   job over state-bookkeeping; an unwritable state file degrades to
   today's always-notify behavior.

The temp file lives next to the state file (same directory), so `mv` never
crosses filesystems.

## 2. State file location and permissions

- Default: `$HOME/.hermes/profiles/crazydave/scripts/.blocked-watch-state.json`
  — hidden file, next to the script, inside the drafts/script directory
  rather than a temp dir so it survives reboot and is visible next to the
  job that owns it.
- Override: `BLOCKED_WATCH_STATE` env var, if set, replaces the default
  path entirely (used for tests; see §6).
- The script creates the parent directory with `mkdir -p` if missing (only
  when it has something to write; a read-only DB run with no hits writes
  nothing).
- Permissions: created with `umask 077` → `0600` file. If an existing state
  file is group- or world-readable, `chmod 600` it on load before use. The
  file holds only task ids and reasons-derived state, but block reasons can
  contain user text, so treat it as private.

## 3. Unchanged blocked set: suppress output entirely

Let `HITS` be the set of task ids the SELECT returns this run, and `NOTIFIED`
the ids in the state file's `notified` map.

- If `HITS == NOTIFIED`, print **nothing** to stdout — not a summary, not a
  heartbeat. Exit 0 without touching the state file (the update is a no-op;
  skipping the write avoids churn and preserves `updated_at` accuracy).
- The alert-per-id semantics are once per continuous blocking episode.
  Suppression applies to the whole output when the set is identical. If the
  set changed at all — any add or remove — see §4; the full current hit list
  is re-emitted for changed runs, which is the deliberate shape: one message
  per change, containing the complete current picture.

## 4. Re-block after unblock must re-notify

The state file records the last-alerted set. When a task leaves `HITS`
(unblocked, completed, or its latest event stopped being `blocked`), the
update step **removes** its id from `notified` (pruning happens every run
for all ids not in the current `HITS`, before adding new ones).

Consequences:

- A task that blocks again later re-enters `HITS` as a fresh id absent from
  the pruned `notified` map → it is "new" again → the script emits output
  and re-adds it. No per-episode history is kept; membership is the only
  memory, which makes the reset automatic and stateless to implement.
- A task blocked continuously across many runs stays in `notified` the
  whole time and is silent after its first alert, regardless of how long
  the episode lasts. (Re-alert escalation on episode age is out of scope.)
- Mixed runs (one id new, one id unchanged) re-emit all current hits —
  including the unchanged one — because the suppressed/notify decision is
  per-run, not per-id. This keeps each notification self-contained.

## 5. First run with no state file

- Missing state file ⇒ `NOTIFIED = ∅`. Every hit is new, so the script
  emits the normal output for the full current hit set and then writes the
  initial state (§1 procedure).
- Malformed or unparsable state file (bad JSON, wrong version, not a JSON
  object): log `blocked-watch: unreadable state file, treating as first run`
  to stderr, treat `NOTIFIED = ∅`, emit normally, and overwrite the bad file
  with the new state on the same run's update.
- Empty-but-valid file (`{}` or `{"version":1,"notified":{}}`): same as
  missing — emit everything, then write state.
- No hits and no state file: emit nothing, write the empty initial state
  anyway (so run 2 has a baseline to compare against).

## 6. Honoring HERMES_KANBAN_DB (testability)

The existing line `DB="${HERMES_KANBAN_DB:-$HOME/.hermes/kanban.db}"` is
kept verbatim. Consequences for the new script:

- All queries flow from `$DB`; the state file path is independent of it
  (state follows `BLOCKED_WATCH_STATE`/default), so two runs against
  different DBs with the same default state path would fight — tests must
  set both vars, which the test harness in the checklist below does.
- Copy the real DB for a test: `cp ~/.hermes/kanban.db /tmp/test.db` plus
  its live `-wal`/`-shm` sidecars if present (or
  `sqlite3 ~/.hermes/kanban.db ".backup /tmp/test.db"` — the safe way to
  get a consistent snapshot while the WAL is active), then
  `HERMES_KANBAN_DB=/tmp/test.db BLOCKED_WATCH_STATE=/tmp/state.json ./blocked-watch.sh`.
- The script must never create or write the kanban DB itself; if `$DB` is
  missing it exits 0 silently exactly as today, without writing a state
  file for the empty result (a missing DB is "not my business", not
  "fresh baseline").

## Acceptance checklist

- [ ] Spec covers all five required behaviors (state content + atomic
      update; state path/override/permissions; unchanged-set suppression;
      re-block re-notify via membership reset; first-run semantics).
- [ ] `HERMES_KANBAN_DB` override path verified with a copied DB
      (`sqlite3 ~/.hermes/kanban.db ".backup /tmp/test.db"`), two
      consecutive runs: run 1 emits hits, run 2 emits nothing.
- [ ] Re-block test: with `/tmp/test.db`, flip one task's status away from
      `blocked` and back (`UPDATE tasks SET status='ready' ...` then
      `UPDATE tasks SET status='blocked' ...` on the copy), re-run, and
      confirm the task re-appears in output.
- [ ] `no file under ~/.hermes/profiles/ was modified` — the current
      blocked-watch.sh is read-only reference; the dedup script itself is
      to be written elsewhere (e.g. drafts dir) when this spec is picked up.