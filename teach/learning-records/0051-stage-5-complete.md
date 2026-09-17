# 0051 — Stage 5 complete

**Date:** 2026-09-17
**Stage:** 5, cron and the Fizzy comment path
**Specification:** [2026-09-17 Stage 5 design](../../docs/superpowers/specs/2026-09-17-stage5-cron-and-the-fizzy-comment-path-design.md)
**Score:** 6 of 7 criteria pass. Criterion 7 is a partial pass: two of
the three reports of the job reached the card, and the closing report of
Crazy Dave reached nothing.

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

### 7. A real decomposed job produces one comment for each report. PARTIAL

Jokot sent one real request to Crazy Dave in the `#General` topic at
20:15. Crazy Dave created the root task `t_a9030408`, opened Fizzy card
20, and decomposed the work into two worker tasks. Both workers ran, and
both reported:

```
card 20 comments: 3
 - Wrote the prompt-drift check spec at teach/drafts/prompt-drift-check-spec.md
 - Implemented check 5 (prompt-drift) in roster-audit.sh
 - Moved to "Done" by Joko Triyanto
```

The first two comments are worker reports. The third is the card-close
notice of Fizzy, and it is not a report. Both worker messages also
reached Telegram under the correct bot name, at 20:27 and at 20:35.

The closing report of Crazy Dave reached neither Telegram nor the card.
Section 4 holds the reason. The path works, and one of three reports was
lost to an approval prompt that nobody answered.

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
the current text of the soul file. No marker string is needed, because
the stored prompt holds the whole soul text. The roster wrote that check
in the job of criterion 7, and check 4 now runs it. Section 4 holds the
work and the two defects that the review found.

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
databases during the forced audit run, because that path never calls
`hermes send`. Jokot read the audit message of 18:07 and reported the
sender name as Crazy Dave, which is the correct name.

So the defect reached one path and not the other. A script that calls
`hermes send` needs a name. A script whose text the gateway delivers
already runs inside a named process.

### The room is not part of the defect

Every profile sets `TELEGRAM_HOME_CHANNEL=-1004371805465`, with no topic
suffix. A send with no topic reaches the group root, and Telegram renders
the group root as `#General`. That looked like a second symptom of the
same defect, and it is not one.

[Record 0043](0043-a-report-that-went-to-the-wrong-room.md) already ruled
on the room: "The General topic is the chosen destination, not only the
reachable one." Crazy Dave listens there, and Crazy Dave is the agent
that can unblock a task. Jokot reads one room instead of four. Check 1 of
the audit enforces that choice, because it fails when the four profiles
hold more than one value.

So the defect had one symptom, not two. The name was wrong. The room was
right. A shared cause is not the same thing as a shared defect, and the
proof that separates them is a prior decision, not a log line.

## Section 4 — One report of three met an approval prompt

Criterion 7 needed a real job, so Jokot sent a real request. The roster
had to write a check that record 0045 asks for and that Section 2 of
this record names as a gap. Crazy Dave opened the card, decomposed the
work, and both workers finished.

### The refusal

All three agents called the report script, and all three met the same
answer. The turn of Crazy Dave is the clearest, because his whole
closing sequence sits in four rows of
`~/.hermes/profiles/crazydave/state.db`:

```
20:36:54  kanban comment                 -> {"ok": true, "comment_id": 59}
20:36:58  fizzy card close 20            -> {"ok": true}
20:37:02  ~/.hermes/scripts/hermes-report.sh crazydave "The prompt-drift ..."
          -> {"exit_code": -1, "status": "pending_approval",
              "approval_pending": true,
              "description": "Security scan - [HIGH] Nested executable
               body could not be resolved"}
20:37:06  kanban complete                -> {"ok": true, "run_id": 70}
```

The command is correct. The profile name `crazydave` is the first
argument, which is what the repair of Section 3 requires. The tool did
not refuse the command, and it did not run it either. The value
`pending_approval` means that the machine asked a question and that
nobody answered.

Crazy Dave completed the task four seconds later. He never called the
script again, and his report reached no room and no card.

### The same prompt, two recoveries

Sunflower met the prompt at 20:26:57. Sunflower then read the script at
20:27:01 and sent the report a few seconds later. Peashooter met the
prompt at 20:29:36 and again at 20:35:11. Peashooter wrote a two-line
wrapper in the task workspace and ran that instead.

Each refusal carried the same key:

```
"pattern_key": "tirith:analysis_incomplete",
"smart_denied": false, "allow_permanent": true
```

`tools/approval.py:3363` builds that key as `f"tirith:{rule_id}"`, and
it builds the key only when the scanner returns `block` or `warn`. So
the security scanner raised the prompt.

### The scanner does not raise it today

`tools/tirith_security.py:730` runs the scanner as
`tirith check --json --non-interactive --shell posix -- <command>`. That
exact form, on the exact 584-byte command of Crazy Dave, answers:

```
action: allow   tier_reached: 1   findings: 0
```

The answer is the same with `HERMES_HOME` set to the profile directory.
The strings `analysis_incomplete` and `Nested executable body` appear in
no Python file of Hermes and in no string of the scanner binary. So this
record names the symptom, names the code that formats the key, and does
not name the rule. A cause without evidence is a guess, and record 0035
holds the cost of one.

### The lesson for the roster

Two agents recovered and one did not. Nothing in a soul file tells an
agent what to do when a report does not send. Crazy Dave read
`exit_code: -1`, read no error text, and treated the task as finished.

A report is the product of the work, so a lost report is a lost task.
All three soul files now carry that rule. A successful call prints
nothing and exits 0. A non-zero exit code, a line on standard error, and
an approval prompt are all failures, and each one asks for the same
command a second time. If the second call also fails, the agent writes
the report text into a kanban comment on the task and says "telegram
report failed". That path worked in the same turn where the report
failed, so the report reaches the board even when it reaches no room.

The rule is live in the files and dead in the sessions, because a soul
file edit reaches no open session. Jokot sends `/new` in the three
topics to activate it.

### The card lost the name that the group kept

The same job showed a second gap. Telegram gives each profile its own
bot token, so the group showed the correct sender name on both worker
messages. Fizzy has one account, and Crazy Dave owns it. Every comment
posts through `--profile crazydave`, so the card showed one human name
on all three comments.

The report script now names the writer in the first line of the Fizzy
body:

```
Sunflower: Wrote the prompt-drift check spec at teach/drafts/...
```

Telegram needs no prefix, because the bot name is already correct there.
One test comment on card 15 printed `Sunflower: Name prefix test.`, and
the comment was then deleted. Card 15 holds 2 comments again.

### The work that the job produced

The job is real work, and the work needs a review. The roster delivered
two files:

- `teach/drafts/prompt-drift-check-spec.md`, written by Sunflower. The
  spec reads every `sessions` row of all four profiles. It reports that
  every non-empty Telegram prompt is the soul text of its birth,
  followed by boilerplate that starts with `You run on Hermes Agent`.
  The spec sets the test as exact string equality after that cut.
- Check 5 of `roster-audit.sh`, written by Peashooter. The check runs
  the query of the spec.

The review found two defects, and both are the same kind of defect.

**The check reported 43 dead sessions.** The query judged every Telegram
session that holds a prompt. It never tested `ended_at`. A run printed
43 lines, and every one of the 43 names a session that ended. An ended
session is never reused, so its old prompt is history:

```
crazydave   drift=18  ended=18  OPEN=0
peashooter  drift= 6  ended= 6  OPEN=0
sunflower   drift= 5  ended= 5  OPEN=0
torchwood   drift=14  ended=14  OPEN=0
```

The spec predicted the correct result in one sentence: "The only open
sessions today are the exact-match ones, so the audit prints nothing on
the roster as it stands." The implementation of that spec printed 43
lines. The clause `AND s.ended_at IS NULL` closes the gap.

**The check was added, and the check it replaces stayed.** The spec says
that the new check replaces check 4. The script kept check 4 and added
check 5, so the audit ran the proxy and the rule together. Check 4 is
removed, and the drift check is now check 4.

Both defects passed a worker and passed the report of that worker. Both
are visible in one run of the script.

### The repaired check

The audit now runs silent again, and one control proves that the check
still fires. One comment line was added to
`~/.hermes/profiles/crazydave/SOUL.md`, and the audit answered:

```
prompt-drift: crazydave session 20260917_200908_bf1b2e1f runs a prompt
that does not match the current SOUL.md
```

The line was removed, the sha256 sum matched the sum before the change,
and the audit printed nothing again.

Check 4 now tests the rule that record 0045 states, and it no longer
counts days. The gap that Section 2 named is closed.

## Section 5 — What Stage 5 delivered

- `~/.hermes/scripts/hermes-report.sh`, 3139 bytes, mode 755. One script
  carries every report. The profile name is the first argument. Telegram
  receives the message first, so a Fizzy defect never costs a report.
- `~/.hermes/profiles/crazydave/scripts/roster-audit.sh`, mode 755.
  Four checks, one line for each failure, silence on success. Check 4
  compares the stored prompt of every open Telegram session against the
  current soul file.
- `~/.hermes/profiles/crazydave/scripts/blocked-watch.sh`, 1062 bytes,
  mode 755. One line for each task that stayed blocked for more than
  3600 seconds.
- Two cron jobs. `roster-audit` runs at `0 9 * * *`. `blocked-watch`
  runs `every 60m`.
- Three soul files that name the report script and name no send command.
  Each file carries the name rule and the retry rule.
- Lessons 32 through 35.
- Records 0050 and 0051.

## Section 6 — What generalizes

**A scheduled job needs a reason to stay silent.** Both jobs print
nothing when the roster is healthy. A job that speaks on every run
teaches a person to ignore it. The `blocked-watch` job printed nothing
on every run of the day, and that silence is the correct report.

**Ask what deleted a thing before you re-create it.** The plan asked for
a cron job whose script was already on disk, already executable, and
already dated. The file looked like a finished step that nobody
scheduled. Lesson 17 had deleted the job and the profile copy, and left
the file. Record 0050 holds the full account.

**A threshold is not the rule it stands for.** The first check 4
counted days, because days are easy to count. The rule is about stale
text. Section 2 holds the session that passes the check and breaks the
rule, and Section 4 holds the check that replaced it.

**A tool answer that is neither yes nor no is still an answer.** The
report of Crazy Dave returned `exit_code: -1` and `status:
pending_approval`. No error text appeared, so the turn looked finished.
Two agents read the same answer as a failure and recovered. One read it
as nothing and moved on.

**A default is a decision that nobody made.** `hermes send` with no
`--profile` flag never failed. It read one file and it sent the message.
The report looked correct on every screen except the one that shows the
sender name. A fallback that always succeeds hides the question it
answers.

**Test a soft verb before you trust it.** The name `archive` suggests
that a session retires. The source shows one column change and no effect
on reuse. The verb that matched the intent was the destructive one.
