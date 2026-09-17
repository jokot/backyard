# blocked-watch-dedup.sh — validation report

Script under test: /Users/jokot/dev/plants/teach/drafts/blocked-watch-dedup.sh
DB copy used:      /Users/jokot/dev/plants/teach/drafts/test-blocked-dedup.db (fixture)
State file used:   /Users/jokot/dev/plants/teach/drafts/.test-state-a.json
Method: env overrides HERMES_KANBAN_DB -> copy and BLOCKED_WATCH_STATE -> drafts dir.

The real DB had 0 blocked tasks, so copy was seeded with 2 fixture blocked
tasks (t_fixblock1, t_fixblock2) via blocked events backdated past the 3600s
filter. Run C and D backdate events the same way so the changed set emits.

## RUN A — first run, no state file present
expect: full output, state file created in drafts.
stdout (exit=0):
  blocked 120m: t_fixblock1 (crazydave) fixture one: needs human decision
  blocked 120m: t_fixblock2 (peashooter) fixture two: missing credentials
stderr: (empty)
state file created: {"version": 1, "notified": {"t_fixblock1": ..., "t_fixblock2": ...}, ...}
RESULT: MATCH — full output, state written, mode 600.

## RUN B — immediate second run, no DB change
expect: deduplicated / suppressed output.
stdout: (0 bytes)
stderr: (0 bytes)
exit=0
state file unchanged.
RESULT: MATCH — no output, set unchanged.

## RUN C — modify copy: unblock t_fixblock2, block new t_fixblock3, re-block t_fixblock1
expect: output reflects only the change; re-notification for re-blocked task.
stdout (exit=0):
  blocked 120m: t_fixblock1 (crazydave) fixture one: REBLOCKED run C
  blocked 120m: t_fixblock3 (crazydave) fixture three: new block run C
stderr: (empty)
state after: {"notified": {"t_fixblock1":..., "t_fixblock3":...}} (t_fixblock2 pruned)
RESULT: MATCH — unblocked t_fixblock2 gone, new t_fixblock3 appeared, re-blocked
t_fixblock1 re-notified (re-emitted with fresh reason).

## RUN D (bonus) — isolate re-block re-notify
D1: unblock both -> stdout (0 bytes) — suppression on set-emptying change, exit=0.
D2: re-block only t_fixblock1 -> stdout (exit=0):
  blocked 120m: t_fixblock1 (crazydave) fixture one: REBLOCKED AGAIN run D2
RESULT: MATCH — a task that left the blocked set re-notifies on re-block.

## Behavior-vs-spec note
dedup (B):  matched. first-run (A): matched. re-block re-notify (C, D): matched.
All runs exit 0, stderr empty. Unwritable-state and no-DB paths (exit 0 silently)
were not separately exercised here but code path is identical to reviewed version.

## Live-system checks
live DB (~/.hermes/kanban.db): blocked count = 0 (unchanged), 0 fixture tasks.
~/.hermes/profiles/crazydave/scripts/blocked-watch.sh: mtime Sep 17 18:09 unchanged.
no stray default state file (.blocked-watch-state.json) written next to script.
DB copy lives in drafts (not /tmp), so left in place for reference.
## Reviewer note (Claude, 2026-09-17)

The DB copy `teach/drafts/test-blocked-dedup.db` was deleted and never
committed. It was a copy of the live kanban board, so it held 90 real tasks
with real titles and real comment text. A test fixture must not carry that
into git. To rebuild it, copy the live DB, then seed the fixture rows with
the SQL files in this directory.

The line "expect: output reflects only the change" in RUN C is loose. The
actual output holds every current hit, which is what section 3 and section 4
of the spec require. The run matched the spec. The expectation line did not.

Two defects were found in the script and repaired:

  - A failed redirection printed a second message from the shell itself.
    The `2>/dev/null` on the `printf` never suppressed it, because the shell
    writes that message before `printf` starts. The cron job runs in
    `no-agent` mode, so both lines reached Telegram. The subshell now
    discards its own stderr.
  - The failure message named the temporary file, not the state file.

Independent replay by the reviewer, on a fresh state path: first run emits,
second run is silent, state file mode is 0600, a malformed state file logs
one line and rebuilds, an unwritable state file degrades to always-notify
and still exits 0, and a missing DB exits 0 in silence.
