# A plan that rebuilt a deleted loop

The Stage 5 plan created a cron job named `kanban-autosubscribe` on a
15-minute schedule. Lesson 35 carried that step as written. The step
would have rebuilt the message amplification loop that
[[0010-a-fix-that-amplified-the-defect]] measured and that
[[0017-workers-report-their-own-results]] deleted.

The final review of the branch found the step. No live command had run
yet, so the machine never carried the job.

## What record 0010 already stated

Record 0010 measured one message every two minutes for six hours on 9
September 2026. It named four steps:

1. The cron job subscribes a task at cursor zero.
2. The gateway replays every past event and delivers it.
3. One failed send drops the subscription row.
4. The next cron tick subscribes the same task again.

The record stated the fix as a deletion, not a repair: delete the
notifier path rather than repair it.

## Why the step looked safe

The file `kanban-autosubscribe.sh` still existed at
`~/.hermes/scripts/kanban-autosubscribe.sh`, with mode 755 and a date of
9 September 2026. Lesson 17 removed the profile copy and the cron job.
Lesson 17 did not remove the file itself.

A file that still exists reads as a file that still has a job. The plan
found the file, found a real defect in line 14, and treated the repair
of that line as the whole task. The repair was correct. The schedule was
the defect.

## What the source says today

Both conditions that close the loop are still in the installed source:

- `hermes_cli/kanban_db.py:1263` and `:2154` define
  `last_event_id INTEGER NOT NULL DEFAULT 0`.
- `hermes_cli/kanban_db.py:8835` returns only events with
  `id > last_event_id`, so a row at cursor 0 replays every past event.
- `gateway/kanban_watchers.py:457` drops the subscription after
  `MAX_SEND_FAILURES = 3` consecutive send failures.

## Fix

Stage 5 schedules two cron jobs, not three. Lesson 35 now explains why
`kanban-autosubscribe.sh` stays unscheduled, and it gives the two greps
that prove both conditions remain live.

`blocked-watch.sh` stays, because it writes nothing. It runs one
`SELECT` and prints the result. It creates no subscription row.

## What generalizes

**A deletion that leaves the file behind is an incomplete deletion.**
Record 0010 deleted a job and a copy. It left the script. Eight days
later a plan found the script and scheduled it again.

**Ask what deleted the thing before you re-create it.** Record 0010
stated that rule in its own closing section. The rule failed to reach
the plan, because the plan searched the machine and not the records.

See [[0010-a-fix-that-amplified-the-defect]] for the original loop and
[[0017-workers-report-their-own-results]] for the deletion.
