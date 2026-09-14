# 0035 — A fix that nobody scheduled

**Date:** 2026-09-14
**Stage:** 4, live board, Connect Four
**Status:** Open. The script exists. No scheduler runs it.

## What happened

Three kanban tasks blocked themselves on 14 September 2026. Telegram
delivered no message for any of the three. Jokot found each block by
running `hermes kanban list` by hand.

The notifier reads one table. That table is empty:

```
$ sqlite3 ~/.hermes/kanban.db "select count(*) from kanban_notify_subs;"
0
```

Zero rows means zero recipients. The `blocked` event fired, the notifier
looked for a subscriber, and it found none.

## The fix already exists

Record 0008 diagnosed this same defect and produced a repair script. The
script is on disk and it is executable:

```
$ stat -f '%N %Sm %z %Sp' ~/.hermes/scripts/kanban-autosubscribe.sh
/Users/jokot/.hermes/scripts/kanban-autosubscribe.sh 2026-09-09 00:38:57 1606 -rwxr-xr-x
```

Its header comment names the two defects it repairs:

```
# Two defects make this necessary. `hermes kanban decompose` never subscribes
# the children it creates, so only the root task gets a row. And the notifier
# rejects any stored profile name, so the stamp must be NULL.
```

The script inserts one subscription row for each task that lacks one. It
must run on a timer, because `decompose` creates children at any moment.

## Nothing runs it

The cron file of the orchestrator holds no job:

```
$ cat ~/.hermes/profiles/crazydave/cron/jobs.json
{"jobs": [], "updated_at": "2026-09-09T07:15:18.436799+07:00"}
```

The execution database agrees. The last cron execution of any job
finished at `2026-09-09T07:15:11`, seven seconds before that file was
written. No execution has run since.

Three other schedulers hold nothing either:

```
$ grep -rl kanban-autosubscribe ~/.hermes            (no output)
$ crontab -l                                         crontab: no crontab for jokot
$ ls ~/Library/LaunchAgents | grep -i kanban         (no output)
```

The script is referenced by no job, no crontab line, and no launchd
plist. It has never run on a schedule.

## Root cause

The repair of record 0008 stopped at the script. Writing the script felt
like finishing the work, because the script is the hard part. Scheduling
it is one command, and one command is easy to postpone.

The gap survived five days without notice, because the failure it causes
is silence. A missing message raises no error. Nothing on the board turns
red. The board simply waits, and Jokot reads the board by hand instead
of being told.

## The fix

Register the script as a cron job of the orchestrator profile, then
prove that the job runs:

```
hermes cron add --profile crazydave \
  --schedule '*/2 * * * *' \
  --command ~/.hermes/scripts/kanban-autosubscribe.sh
```

Verify with two commands after four minutes:

```
sqlite3 ~/.hermes/profiles/crazydave/cron/executions.db \
  "select status, finished_at from executions order by rowid desc limit 3;"
sqlite3 ~/.hermes/kanban.db "select count(*) from kanban_notify_subs;"
```

The first must show a recent `completed` row. The second must show a
count above zero. Neither command proves the other.

## Generalization

*A fix that runs nowhere is a note about a fix.* The script passed
review, it passed a manual run, and it changed nothing for five days. A
repair is finished when the machine performs it without a person.

*Silence is the hardest failure to notice.* A crash produces a log line.
A missing notification produces nothing at all. Give every silent path a
positive check, such as a row count, that a person can read on demand.

*Verify the schedule and the effect separately.* A cron job can run and
still do nothing. A table can fill and still have filled by hand. Read
the execution row and the row count as two independent facts.

*Read the timestamps around a change.* The jobs file was emptied seven
seconds after the last execution finished. That ordering says the jobs
were removed deliberately, not lost in a crash. A timestamp pair often
answers the question that a log cannot.

## Related

- Record 0008 — the original diagnosis, which produced the script.
- Record 0036 — the three blocks that this silence hid.
- Record 0021 — another defect whose repair ran once and never again.
