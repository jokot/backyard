# 0051 — Stage 5 complete

**Date:** 2026-09-17
**Stage:** 5, cron and the Fizzy comment path
**Specification:** [2026-09-17 Stage 5 design](../../docs/superpowers/specs/2026-09-17-stage5-cron-and-the-fizzy-comment-path-design.md)
**Score:** 6 of 7 criteria pass. Criterion 7 stays open.

## Section 0 — The seven criteria, scored

Every line below names the command that decided the score. A criterion
passes only when the real output appears under it.

### 1. The report script sends one Telegram message. PASS

```bash
unset HERMES_KANBAN_TASK
~/.hermes/scripts/hermes-report.sh sunflower "Criterion 1 again: this should arrive under the Sunflower name."
echo "exit=$?"
```

The script printed nothing and returned `exit=0`. The message arrived in
the group. A silent run is the correct result, because the script writes
to standard error only when a send fails.

The first run of this criterion used the script as Lesson 32 shipped it,
with one argument and no profile name. That run passed, and it sent the
message under the wrong bot. Section 3 holds the defect and the repair.
The output above comes from the second run, with the corrected script.
Only sunflower recorded a row:

```
  torchwood   0
  peashooter  0
  sunflower   1 Criterion 1 again: this should arrive under the Sunflow
  crazydave   0
```

### 2. With a kanban task set, the same command comments on the card. PASS

The worker task `t_33a76257` carries no Fizzy comment of its own. The
root task `t_70d81d4d` carries `fizzy:15`. The script must find the root
through the child probe.

```bash
HERMES_KANBAN_TASK=t_33a76257 \
  ~/.hermes/scripts/hermes-report.sh peashooter "Criterion 2 again: Peashooter name, Telegram plus card 15."
```

Card 15 held 2 comments before the run and 3 after it. The new comment
`03gvvo6k6t4g5razpogas13c0` held the exact message text. The test
comment was then deleted, and the card returned to 2 comments. The same
message count ran across the four databases, and only peashooter
recorded a row.

This criterion also ran twice, for the reason given under criterion 1.

The child probe was checked against the whole board first. Ten worker
tasks resolved to a card through a root task, and every resolution named
the correct card:

```
worker t_053ba4ce -> via t_46c04c5a -> card 18
worker t_33a76257 -> via t_70d81d4d -> card 15
worker t_37885b57 -> via t_7a44199b -> card 13
worker t_769e13af -> via t_ff5eb6e8 -> card 14
```

### 3. The cron list prints three jobs. FAIL AS WRITTEN, REPLACED BY TWO

```
c05dce47d5db [active]  roster-audit   0 9 * * *      next 2026-09-18T09:00
f9b05a451c28 [active]  blocked-watch  every 60m      next 2026-09-17T19:07
```

Stage 5 ships two cron jobs, not three. The plan asked for a third job
named `kanban-autosubscribe` on a 15 minute schedule. That job would
have rebuilt the message loop that
[record 0010](0010-a-fix-that-amplified-the-defect.md) measured and
that Lesson 17 deleted.
[Record 0050](0050-a-plan-that-rebuilt-a-deleted-loop.md) holds the two
source lines that prove both loop conditions are still live. No live
command ever ran, so the machine never carried the job.

The criterion is wrong, not the machine. Read criterion 3 as two jobs.

### 4. No soul file calls the Telegram send command. PASS

```bash
grep -c 'hermes send --to telegram' ~/.hermes/profiles/*/SOUL.md
```

```
/Users/jokot/.hermes/profiles/crazydave/SOUL.md:0
/Users/jokot/.hermes/profiles/peashooter/SOUL.md:0
/Users/jokot/.hermes/profiles/sunflower/SOUL.md:0
/Users/jokot/.hermes/profiles/torchwood/SOUL.md:0
```

Four files, four zeros. Every report now travels through
`~/.hermes/scripts/hermes-report.sh`.

### 5. The audit prints nothing on a healthy roster. PASS

```bash
bash ~/.hermes/profiles/crazydave/scripts/roster-audit.sh
```

The script printed nothing and returned exit 0.

This criterion failed for most of the day. Check 4 counts the Telegram
sessions that never ended and that started more than 604800 seconds ago.
Section 1 holds the reason and the repair.

### 6. The audit prints one line after one deliberate change. PASS

One value of `TELEGRAM_HOME_CHANNEL` was changed in the file
`~/.hermes/profiles/torchwood/.env`. The audit then printed one line:

```
home channel: 2 distinct values across profiles, expected 1
```

The file was restored, and the sha256 sum matched the sum from before
the change. The audit then printed nothing again.

### 7. A real decomposed job produces one comment for each report. OPEN

This criterion needs a genuine request to Crazy Dave inside Telegram.
Crazy Dave decomposes the request into worker tasks, and each worker
calls the report script. Only Jokot can send that request, because the
gateway routes a decomposition from a human message. The controller can
send a message as a bot, and a bot message never starts a decomposition.

Criterion 2 proves the comment path on one real worker task and one real
card. Criterion 7 proves the same path across a whole job. The first is
evidence for the second, and it is not a replacement for it.

## Section 1 — The rule that the audit could not see

Check 4 of the audit reported the same line for the whole day:

```
session: sunflower holds 3 telegram session(s) older than 7 days
```

The rule comes from
[record 0045](0045-a-rule-that-reached-no-session.md). The gateway
builds a system prompt one time for each session, then stores the prompt
in the `sessions` table. `agent/conversation_loop.py:281` names the
state that decides the case:

> `present` — row exists with a usable prompt → **reused verbatim**.

So an edit of a soul file never reaches a session that is already open.
Stage 5 edited three soul files. Every session that started before those
edits still carried the Stage 2 rule.

Jokot sent `/new` in three topics. The table below holds the result:

```
crazydave  thread 1    age 0d  new_rule=True
peashooter thread 2    age 0d  new_rule=True
sunflower  thread 3    age 0d  new_rule=True
sunflower  thread NULL age 8d  old_rule=True
sunflower  thread 2    age 7d  old_rule=True
sunflower  thread 1    age 7d  old_rule=True
```

The column `new_rule` tests the prompt for `hermes-report.sh`. The
column `old_rule` tests the prompt for `hermes send --to telegram`.

The count stayed at 3, and that answer is correct. The `/new` command in
`#Planning` ended sunflower thread 3, which was 6 days old and which the
check never counted.

**One `/new` command cannot reach every stale session.** The gateway
routes the command to the profile that listens in that topic. Sunflower
does not listen in `#General`, in `#Coding`, or in the private chat, so
no `/new` command reaches those three rows.

**The archive verb does not end a session.** `hermes_state.py:6681`
shows that `archive_sessions` sets `archived = 1` and never writes
`ended_at`. The reuse query at `hermes_state.py:2200` filters on
`source`, on `chat_id`, on `thread_id` and on `ended_at IS NULL`, and it
never reads the `archived` column. An archived session is still reused,
and the audit still counts it.

Only `sessions delete` ends the row, and that command destroys the
conversation. Jokot authorized the delete. A backup ran first:

```bash
sqlite3 -readonly ~/.hermes/profiles/sunflower/state.db \
  ".backup '$HOME/sunflower-state-before-delete-20260917.db'"
hermes -p sunflower sessions delete 20260909_081124_cbf2e938 --yes
hermes -p sunflower sessions delete 20260909_220844_0719c44e --yes
hermes -p sunflower sessions delete 20260909_232531_924787cd --yes
```

The backup holds 9.3 MB. The session count fell from 33 to 30. The audit
then printed nothing, and criterion 5 passed.

## Section 2 — Seven days is a proxy, not the rule

The audit passed criterion 5 while one agent still ran the Stage 2
reporting rule. Crazy Dave held an open session in the private chat that
started 6 days ago and that carried `old_rule=True`. Check 4 counts 7
days, so the check stayed silent and the roster was not healthy.

The real rule is "no session runs a prompt older than the last soul file
edit". Check 4 tests age against a fixed number instead. The two agree
only when no soul file changed inside the last 7 days.

Jokot authorized the delete of that session as well. A backup ran first:

```bash
sqlite3 -readonly ~/.hermes/profiles/crazydave/state.db \
  ".backup '$HOME/crazydave-state-before-delete-20260917.db'"
hermes -p crazydave sessions delete 20260910_193106_6716cd38 --yes
```

The backup holds 8.9 MB. The session count fell from 37 to 36. Every
open Telegram session of the three reporting profiles now carries
`new_rule=True`:

```
crazydave  thread 1  age 0d  new_rule=True  old_rule=False
peashooter thread 2  age 0d  new_rule=True  old_rule=False
sunflower  thread 3  age 0d  new_rule=True  old_rule=False
```

Torchwood holds three open sessions that test False on both columns.
Torchwood writes prompts and never reports, so neither string belongs in
its soul file. A False in both columns means "the rule does not apply
here", and it never means "the rule is missing".

The delete fixed one session. It did not fix the check.

A better check reads the `system_prompt` column and compares it against
the current text of the soul file. Stage 5 does not write that check,
because the comparison needs one marker string for each rule, and the
roster has no marker convention yet. The gap is named here so that a
later stage can close it.

## Section 3 — Every report arrived under one name

Jokot read the group and saw two messages from Torchwood. Both messages
were the criterion tests of this record, and neither test ran as
Torchwood. Torchwood writes prompts. Torchwood sends no report at all.

### What the machine shows

`hermes-report.sh` called `hermes send --to telegram "$MSG"` with no
`--profile` flag. With no flag, `hermes send` reads the file
`~/.hermes/active_profile`. That file holds `torchwood`, and it was last
written on 11 September 2026. So every report of every agent arrived
under the Torchwood name.

Two live tests separate the two candidate fixes. The first ran against
the script as Lesson 32 shipped it, with one argument:

```bash
# Ignored. The row landed in the torchwood messages table.
HERMES_PROFILE=peashooter ~/.hermes/scripts/hermes-report.sh "test"

# Correct. The row landed in the peashooter messages table.
hermes -p peashooter send --to telegram "test"
```

The environment variable is not the path. The flag is.

### A worker cannot supply its own name

The four gateways each start with the profile name as a command line
flag, in the form `python -m hermes_cli.main --profile peashooter gateway`.
`HERMES_PROFILE` is absent from all four gateway process environments,
and no code outside the test suite assigns it. `tools/code_execution_tool.py:1343`
builds the child environment with `_scrub_child_env(os.environ)`, and the
allow list at `:164` does name `HERMES_PROFILE`. An allow list can only
pass through a variable that already exists.

So a worker shell holds no record of the agent that started it. The name
must arrive as an argument, or it does not arrive.

### The repair

The script now takes the profile as a required first argument. Three
paths reject a call, and each one exits 2 before any send:

```
=== no args ===          usage: hermes-report.sh <profile> "<the message>"
=== profile only ===     usage: hermes-report.sh <profile> "<the message>"
=== unknown profile ===  report: no profile named wallnut
```

The directory test is the third guard. A typed name with no directory
under `~/.hermes/profiles/` would otherwise reach `hermes send` and send
under the fallback name again.

Three soul files carry the new call, and each call names its own profile.
Each file also carries a four line note that states why the first word
never changes.

### This defect is older than Stage 5

The Stage 2 soul files said `hermes send --to telegram` with no profile
flag as well. Every report of every agent since 11 September 2026 arrived
under the Torchwood name. Stage 5 did not cause the defect. Stage 5 put
every report through one script, and one script is a place a defect can
be fixed one time.

The cron path never carried the defect. Both jobs run in the mode
`no-agent (script stdout delivered directly)`, and the gateway of Crazy
Dave delivers that text. No message row appeared in any of the four
databases during the forced audit run.

### The room has the same cause

Every profile sets `TELEGRAM_HOME_CHANNEL=-1004371805465`, with no topic
suffix. A send with no topic reaches the group root, and Telegram renders
the group root as `#General`. So the wrong name and the wrong room are
one defect with two symptoms, and the topic half stays open.

## Section 4 — What Stage 5 delivered

- `~/.hermes/scripts/hermes-report.sh`, 2529 bytes, mode 755. One script
  carries every report. The profile name is the first argument. Telegram
  receives the message first, so a Fizzy defect never costs a report.
- `~/.hermes/profiles/crazydave/scripts/roster-audit.sh`, 1395 bytes,
  mode 755. Four checks, one line for each failure, silence on success.
- `~/.hermes/profiles/crazydave/scripts/blocked-watch.sh`, 1062 bytes,
  mode 755. One line for each task that stayed blocked for more than
  3600 seconds.
- Two cron jobs. `roster-audit` runs at `0 9 * * *`. `blocked-watch`
  runs `every 60m`.
- Three soul files that name the report script and name no send command.
- Lessons 32 through 35.
- Records 0050 and 0051.

## Section 5 — What generalizes

**A scheduled job needs a reason to stay silent.** Both jobs print
nothing when the roster is healthy. A job that speaks on every run
teaches a person to ignore it. The `blocked-watch` job printed nothing
on every run of the day, and that silence is the correct report.

**Ask what deleted a thing before you re-create it.** The plan asked for
a cron job whose script was already on disk, already executable, and
already dated. The file looked like a finished step that nobody
scheduled. Lesson 17 had deleted the job and the profile copy, and left
the file. Record 0050 holds the full account.

**A threshold is not the rule it stands for.** Check 4 counts days
because days are easy to count. The rule is about stale text. Section 2
holds the session that passes the check and breaks the rule.

**A default is a decision that nobody made.** `hermes send` with no
`--profile` flag never failed. It read one file and it sent the message.
The report looked correct on every screen except the one that shows the
sender name. A fallback that always succeeds hides the question it
answers.

**Test a soft verb before you trust it.** The name `archive` suggests
that a session retires. The source shows one column change and no effect
on reuse. The verb that matched the intent was the destructive one.
