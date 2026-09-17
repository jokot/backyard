# Stage 5 Design: Cron and the Fizzy comment path

**Date:** 2026-09-17
**Stage:** 5
**Status:** Approved for planning. Jokot approved approach B on 2026-09-17.

## Background

Stage 4 completed the roster. Four profiles run today. Crazy Dave routes,
Peashooter writes code, Sunflower plans, and Torchwood writes prompts.

Two facts start this stage.

The first fact is silence. The Hermes gateway runs a cron scheduler on a
60 second tick. The scheduler holds zero jobs. The command
`hermes -p <profile> cron list` prints "No scheduled jobs." for all four
profiles. Every action of the roster begins when Jokot types a message.

The second fact is a gap in the Fizzy mirror. Crazy Dave writes one
comment on the card, and Crazy Dave writes it at root task completion.
A blocked task never reaches root task completion. On 14 September 2026
two tasks blocked, and [record 0043](../../../teach/learning-records/0043-a-report-that-went-to-the-wrong-room.md)
named the time of each block. The Fizzy card showed nothing for either
one. The card cannot report the state that most needs a reader.

## Goals

1. Every worker report reaches two destinations. The report reaches the
   Telegram group, and the report reaches the Fizzy card as a comment.
2. The roster runs work that Jokot never started.
3. A scheduled job proves a rule and stays silent when the rule holds.

## Non-goals

1. A Fizzy webhook receiver. The receiver needs a public HTTPS endpoint
   and HMAC-SHA256 signature verification. The endpoint is cheap after
   the roster moves to a server, and awkward on a laptop. This stage
   does not build it.
2. Any read from Fizzy into Hermes. The Stage 3 decision stands.
3. A fifth profile.
4. A patch of the Hermes source under `~/.hermes/hermes-agent/`.

## Research findings

Each finding below comes from a command that ran on 17 September 2026.

**Cron supports a script without an agent.** The help text of
`hermes cron create` documents `--no-agent`: "Skip the LLM entirely — run
--script on schedule and deliver its stdout directly. Empty stdout =
silent." The command also takes `--deliver telegram`, `--workdir`, and a
schedule in the form `30m`, `every 2h`, or `0 9 * * *`.

**A worker can read any task.** The function `_handle_show` at
`tools/kanban_tools.py:367` takes a `task_id` and returns the task row,
`parents`, `children`, `comments`, `runs`, and `events`. The function
applies no guard that limits a worker to the task of that worker. The
command line equivalent is `hermes kanban show <task_id> --json`.

**One Fizzy identity exists.** The command `fizzy auth status` reports
one profile, named `crazydave`, with `"using_keyring": true`. Every
profile runs the same `fizzy` binary as the same operating system user,
so every profile reaches the same token.

**The dispatcher names the task.** The dispatcher sets
`HERMES_KANBAN_TASK` in the environment of a dispatched worker.
[Record 0044](../../../teach/learning-records/0044-a-tool-that-was-never-turned-on.md)
proved this fact when it explained why both kanban gates open for a
worker and stay closed for Crazy Dave.

**A script for cron already exists and has never run.** The file
`~/.hermes/scripts/kanban-autosubscribe.sh` carries the date 9 September
2026 and the comment "Designed for `hermes cron --no-agent`. It prints
nothing when there is nothing to do." No cron job calls it.

## The kanban edge direction

The words `parents` and `children` in the kanban board name dependency
edges. The words do not name a task tree. A parent is a task that must
reach `done` first. A child is a task that waits.

The decomposer therefore records the relation in the direction that
reverses a reader's expectation. The root task lists every worker task
in `parents`. Every worker task lists the root task in `children`.

This output from the real board states the rule:

```
t_e6f5dc9f  root    parents: 5 worker ids       children: 0
t_29e6cbb8  worker  parents: ['t_3ce59841']     children: [... , 't_e6f5dc9f']
t_3ce59841  worker  parents: []                 children: [... , 't_e6f5dc9f']
```

A script that walks `parents` from a worker task never reaches the root
task. The card resolution algorithm below walks `children`.

## Decisions

**One script owns both destinations.** A worker never calls `fizzy`
directly, and a worker never calls `hermes send` directly. A worker calls
one script. The script holds the card lookup and the two sends.

The reason is drift. A soul file that states a four step lookup asks a
language model to perform four steps correctly on every report.
[Record 0017](../../../teach/learning-records/0017-three-correct-rules-that-never-combined.md)
recorded the cost of that shape once already. It took two extra edits of
`SOUL.md` to stop other regions of the file from offering a competing
procedure.

**A soul file states one command.** Each worker soul file loses the line
`hermes send --to telegram "your message here"` and gains one call of the
script. The soul file becomes shorter, not longer.

**Torchwood reports to neither destination.** Torchwood is not a
dispatched worker, and the soul file of Torchwood forbids every board
change. Torchwood receives no change in this stage.

**Crazy Dave keeps card create and card close.** The script writes a
comment and nothing else. Crazy Dave alone runs `fizzy card create` and
`fizzy card close`. Card ownership does not move.

**A Fizzy failure never blocks the kanban task.** This rule comes from
Stage 3 and this stage repeats it. The script exits 0 after a failed
`fizzy` command, and the script prints the failure on standard error.

**Silence means pass.** Every cron script in this stage prints nothing
when the checked rule holds. A message therefore always means a defect.

## Design: the report script

### Contract

Path: `~/.hermes/scripts/hermes-report.sh`

Usage: `hermes-report.sh "<the message>"`

The script reads one positional argument. The script reads
`HERMES_KANBAN_TASK` from the environment. The script takes no flags.

The script always sends the message to Telegram first. The Telegram send
is the report that Jokot reads, so a Fizzy defect never costs a report.

Exit code 0 means the Telegram send succeeded. Exit code 1 means the
Telegram send failed. The Fizzy result never changes the exit code.

### Which bot sends the Telegram message

The script calls `hermes send --to telegram "<the message>"` with no `-p`
flag. The flag is not needed, and adding one would be wrong.

The docstring of `_check_send_message` at `tools/send_message_tool.py:1837`
states the reason. Workers "run with the assignee profile's
`HERMES_HOME`". So `hermes send` reads the `.env` file of the assignee.
The message carries the bot token of that worker and the home channel of
that worker.

Peashooter therefore speaks as Peashooter, which is the design of
[record 0010](../../../teach/learning-records/0010-a-fix-that-amplified-the-defect.md).
The destination is the group, which is the fix of record 0043.

### The card resolution algorithm

1. Read `HERMES_KANBAN_TASK`. If the variable is empty, stop. The caller
   is not a dispatched worker, so no card exists.
2. Run `hermes kanban show "$HERMES_KANBAN_TASK" --json`. Search the
   `comments` array for a body that matches `^fizzy:[0-9]+$`. If a match
   exists, use that number and stop.
3. For each id in the `children` array of that task, run
   `hermes kanban show <id> --json` and apply the same search. Use the
   first number found.
4. If no number is found, stop. Report only to Telegram.

Step 2 covers a root task that Crazy Dave files without decomposition.
Step 3 covers a dispatched worker on a child task. Step 3 reads at most
one task for each sibling, which is four extra reads for a job of five
tasks.

The comment command carries the profile name, because the keyring stores
the token under that name:

```
fizzy comment create --profile crazydave --card <number> --body "<the message>"
```

### Failure handling

The script writes one line to standard error for each failure and
continues. A failed `hermes kanban show` means the script reports only to
Telegram. A failed `fizzy comment create` means the same.

## Design: the cron jobs

All three jobs belong to the `crazydave` profile, because Crazy Dave
coordinates the roster. All three use `--no-agent`, so no job spends a
model call. All three deliver to Telegram, which resolves to the group
through `TELEGRAM_HOME_CHANNEL`.

All three scripts live under `~/.hermes/profiles/crazydave/scripts/`. The
`--script` flag takes a bare filename, because `tools/cronjob_tools.py`
rejects an absolute path and rejects a leading tilde. That filename resolves
under `$HERMES_HOME/scripts`, and the flag `-p crazydave` sets `HERMES_HOME`
to `~/.hermes/profiles/crazydave`. The directory `~/.hermes/scripts/` holds
the report script instead, because a soul file calls that script by full
path and no cron job resolves it.

### Job 1: the roster audit

Path: `~/.hermes/profiles/crazydave/scripts/roster-audit.sh`
Schedule: `0 9 * * *`

The script runs four checks and prints one line for each failure.

1. The home channel agrees across profiles. The command
   `grep -h '^TELEGRAM_HOME_CHANNEL=' ~/.hermes/profiles/*/.env | sort -u`
   must print exactly one line. This check comes from record 0043.
2. The `command_allowlist` of Crazy Dave holds exactly three entries.
   A fourth entry means somebody pressed an "always" button.
   This check comes from
   [record 0046](../../../teach/learning-records/0046-a-button-that-answered-a-wider-question.md).
3. The `toolsets` list of Crazy Dave contains `kanban`. This check comes
   from record 0044.
4. No Telegram session stays open for more than 7 days. A long open
   session holds a stale system prompt. This check comes from
   [record 0045](../../../teach/learning-records/0045-a-rule-that-reached-no-session.md).

### Job 2: the stale block watch

Path: `~/.hermes/profiles/crazydave/scripts/blocked-watch.sh`
Schedule: `every 1h`

The script reads the kanban database for every task with status
`blocked`. For each task blocked for more than 60 minutes, the script
prints the task id, the assignee, and the blocked reason. The script
prints nothing when no task qualifies.

This job covers the one case that the report script cannot cover. The
script runs when a worker reports. A worker that stops before it reports
sends nothing, and the task stays blocked in silence. Record 0043 named
two blocked tasks on 14 September 2026, and the board held both states
correctly the whole time. Only the reader was missing.

### Job 3: the autosubscribe repair

Path: `~/.hermes/profiles/crazydave/scripts/kanban-autosubscribe.sh`
Schedule: `every 15m`

The script exists at `~/.hermes/scripts/kanban-autosubscribe.sh` and needs
two repairs before any schedule starts it. The first repair moves the file
into the profile directory of Crazy Dave.
Line 14 reads the chat id with a fallback to the private chat of Jokot:

```bash
CHAT_ID="${HERMES_TELEGRAM_CHAT_ID:-<the private chat id of Jokot>}"
```

The real file holds that id as a literal number. This spec masks it.

No profile sets `HERMES_TELEGRAM_CHAT_ID`, so the fallback fires. Every
subscription that the script creates therefore points at the private
chat. Record 0043 moved the roster out of that room on 16 September 2026.
The script kept the old destination, because nobody read it.

The repair sets the fallback to the group id `-1004371805465`. The repair
runs before the cron job starts.

## Soul file changes

Three files change. Torchwood does not change.

| File | Line today | Line after |
| --- | --- | --- |
| `peashooter/SOUL.md` | 23 | The script call replaces `hermes send --to telegram` |
| `sunflower/SOUL.md` | 25 | The script call replaces `hermes send --to telegram` |
| `crazydave/SOUL.md` | 25 and 97 | The script call replaces `hermes send --to telegram` on both lines |

**Correction, found while the plan ran.** This table first named line 97
alone, and the paragraph below it first said that step 3 does not change.
Both statements were wrong, and the two contradicted each other.

`crazydave/SOUL.md` runs `hermes send --to telegram` on two lines. Line 25
is step 4 of the root task procedure. Line 97 is the general reporting
rule. Success criterion 4 requires a count of 0 for every profile, so both
lines change.

Step 3 of the root task procedure also changes. It drops
`fizzy comment create` and keeps `fizzy card close`. The report script now
writes the card comment, so an unchanged step 3 would post the same
summary onto the card twice. Success criterion 7 allows one closing
comment of Crazy Dave, not two.

Crazy Dave still owns card create and card close. He still reads the
`fizzy:<number>` comment in step 3, because `fizzy card close` needs that
number.

Each edit needs `/new` in the matching Telegram topic, then one message.
Record 0045 states the reason. The gateway builds a system prompt once
for each session and reuses the stored text.

## Lesson sequence

1. **Lesson 32 — The report that goes to two rooms.** Write and test
   `hermes-report.sh` by hand, outside any agent. Teach the inverted
   direction of `parents` and `children`.
2. **Lesson 33 — One command in three soul files.** Edit the three soul
   files. Send `/new` in each topic. Prove the new prompt.
3. **Lesson 34 — A job that speaks only on failure.** Write
   `roster-audit.sh`. Create the cron job. Break one rule on purpose and
   watch the job report it.
4. **Lesson 35 — The watch for a task that stopped.** Write
   `blocked-watch.sh`. Repair `kanban-autosubscribe.sh`. Create both
   jobs.

## Success criteria

Each criterion names a command that fails when the rule breaks.

1. `hermes-report.sh "test"` sends one Telegram message and exits 0 with
   `HERMES_KANBAN_TASK` unset.
2. With `HERMES_KANBAN_TASK` set to a worker task of a decomposed job,
   the same command adds one comment to the correct Fizzy card.
3. `hermes -p crazydave cron list` prints three jobs.
4. `grep -c 'hermes send --to telegram' ~/.hermes/profiles/*/SOUL.md`
   prints a count of 0 for every one of the four profiles. The command
   prints one `<path>:<count>` line for each file.
5. `roster-audit.sh` prints nothing on a healthy roster.
6. `roster-audit.sh` prints one line after a deliberate change of one
   `TELEGRAM_HOME_CHANNEL` value.
7. A real decomposed job produces one Fizzy comment for each worker
   report, plus the closing comment of Crazy Dave.

## Defects found during this design

1. `kanban-autosubscribe.sh` line 14 defaults to the private chat id.
   Job 3 repairs it.
2. The script has never run, because no cron job exists. The script was
   written for a schedule that nobody created.

## Out of scope, deferred to later stages

1. The Fizzy webhook receiver, which needs a public HTTPS endpoint and
   HMAC-SHA256 signature verification.
2. Any read from Fizzy into Hermes.
3. The move of all four profiles to a server.
4. A Fizzy card for a child task. One card for each root task remains the
   rule.
