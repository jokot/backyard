# 0035 — A fix that nobody scheduled

**Date:** 2026-09-14
**Stage:** 4, live board, Connect Four
**Status:** RETRACTED on 2026-09-16. The conclusion below is wrong. Read
the retraction first.

## Retraction

This record named a defect that does not exist. It read two facts and
called each one a failure:

- `kanban_notify_subs` holds 0 rows.
- No cron job runs `kanban-autosubscribe.sh`.

Both facts describe the intended state. [Record
0010](0010-a-fix-that-amplified-the-defect.md) removed the cron job on
purpose on 2026-09-09, and it removed the notifier path with it.

Record 0010 proved that the job amplified the defect that it repaired.
The column definition reads `last_event_id INTEGER NOT NULL DEFAULT 0`,
so a new subscription row starts at cursor zero and replays every past
event. A second gateway then failed to send and called `_kanban_unsub` at
`gateway/kanban_watchers.py:461`. The next tick subscribed the task
again. Work that finished at 01:33:29 still sent completion messages at
06:53, from three bots, five hours later.

The chosen repair was to delete the notifier path. Each profile holds its
own bot token, so a worker runs `hermes send` and speaks as itself. That
repair is live. `SOUL.md` of crazydave names `hermes send` twice, and
`SOUL.md` of peashooter and of sunflower name it once each. Torchwood
names it zero times, which is correct, because Torchwood is never a work
destination.

Do not create the cron job. The empty table is the fix, not the fault.

The real defect of 14 September stands, and this record states it in the
wrong terms. Three tasks blocked and Telegram delivered no message. The
cause is not a missing cron job. The cause is that a blocked task sends
no message under the `hermes send` design, because the agent that blocks
stops before it reports. That defect needs its own record and its own
fix.

## Why this record was written

The evidence in this record is correct. Every command output below ran
and printed what it shows. The fault is that the record read the machine
and never read the records.

`grep -ril cron teach/learning-records/` returns
`0010-a-fix-that-amplified-the-defect.md` as the first result. That one
command, run before writing, would have stopped this record.

Record 0010 also states the rule that a later correction to this record
rediscovered from source:

> The flag `--script` resolves against the scripts directory of the
> profile, not a global directory, per `cron/scheduler.py:2086`.

Two corrections to the command below cost one session. The answer sat in
the record set for six days.

**Generalization: search the records before you write a record.** A fact
read from a machine names a state. Only the records say whether somebody
chose that state.


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

## The fix as first written — DO NOT RUN

The retraction above cancels this section. The command stays on the page
because two corrections to it carry their own lesson. Running it recreates
the amplification loop of record 0010.


```
hermes -p crazydave cron create '*/2 * * * *' --no-agent \
  --script ~/.hermes/scripts/kanban-autosubscribe.sh \
  --name kanban-autosubscribe
```

**Correction, 2026-09-15.** The first version of this record proposed
`hermes cron add --profile crazydave --schedule ... --command ...`. That
command cannot run. `hermes cron create --help` shows the schedule as a
positional argument. It shows `--script` and `--no-agent`, and it shows no
`--profile` flag and no `--command` flag.

The profile selector is `-p`, and it belongs to `hermes` rather than to
`cron`. The target profile matters. `hermes profile list` marks
`torchwood` as the active profile, and cron jobs live in
`~/.hermes/profiles/<name>/cron/jobs.json`. A bare `hermes cron create`
would therefore schedule a kanban command under the one profile whose
`SOUL.md` forbids every kanban command.

`--no-agent` runs the script alone and delivers its output. Without that
flag the output of the script feeds a language model prompt, which is not
the intent here.

This correction is the finding of this record, repeated. A fix written
into a document and never run is a note about a fix. This note stayed
wrong for six days because nobody typed it.

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
