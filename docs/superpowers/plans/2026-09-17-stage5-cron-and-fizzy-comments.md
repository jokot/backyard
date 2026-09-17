# Stage 5 Implementation Plan: Cron jobs and the Fizzy comment path

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task by task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the roster one reporting command that reaches Telegram and
the Fizzy card, then create three scheduled jobs that run without Jokot.

**Architecture:** One script, `hermes-report.sh`, owns both destinations.
Three soul files call that one script instead of `hermes send`. Three cron
jobs run under the `crazydave` profile with `--no-agent`, so no job spends
a model call. Every cron script prints nothing when the checked rule
holds, so a message always means a defect.

**Tech Stack:** Bash, the Hermes Agent CLI (`send`, `kanban`, `cron`,
`config`), the Fizzy CLI (`comment create`), SQLite, and the `teach` skill
lesson format.

**Spec:** `docs/superpowers/specs/2026-09-17-stage5-cron-and-the-fizzy-comment-path-design.md`

## Global Constraints

- Jokot runs every command that changes the machine. Never run a mutating
  command for him. The goal is a learning user, not a finished system.
- Never assert a diagnosis without real command output or real Hermes
  source. Quote the output that supports the claim.
- Every real defect gets a fix and a learning record. Never write a
  workaround.
- Lessons continue at `0032`. Learning records continue at `0048`.
- Every lesson links `../assets/style.css`, which is the only asset today.
- Lesson HTML must hold balanced tags. Verify the balance before each
  commit.
- Run a link existence check over every relative `href` in a new lesson or
  record before the commit.
- Lesson prose and commit messages follow the STE-flavored style of
  lessons `0001` through `0031`.
- After Jokot edits a real file under `~/.hermes/profiles/<name>/`, copy
  that file into `hermes-config/<name>/`. Never copy `.env`, `auth.json`,
  `channel_directory.json`, `memories/USER.md`, or `memories/MEMORY.md`.
- Run this secret scan before every commit. Replace `<DM>` with the
  9-digit private chat id of Jokot. This plan never prints that id, and no
  tracked file in this repository holds it:
  `git diff --cached | grep -nE '<DM>|TELEGRAM_BOT_TOKEN=|FIZZY_TOKEN=|[0-9]{9,10}:[A-Za-z0-9_-]{35}' | grep -v 'grep -nE'`
  The final `grep -v` matters. A commit that adds this document also adds
  the text of the pattern, and the scan then matches itself. The first run
  of the scan on this plan produced exactly that false result.
- Use `assert s.count(old) == 1` before every scripted string replacement.
- End every commit message with
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

## Verified facts

Every fact below comes from a command that ran on 17 September 2026
during planning. No fact comes from memory.

**The kanban words name dependency edges, not a tree.** A parent must
reach `done` first. A child waits. The root task `t_e6f5dc9f` lists five
worker ids in `parents` and holds an empty `children` list. Each worker
task lists the root id in `children`. A script that walks `parents` from a
worker task never reaches the root task.

**`hermes kanban show <id> --json` returns `comments`.** The JSON holds
the keys `task`, `parents`, `children`, `comments`, `events`, `runs`, and
`latest_summary`.

**A kanban comment lives in the `task_comments` table, not in
`task_events`.** The table holds the columns `id`, `task_id`, `author`,
`body`, and `created_at`. A query for `payload LIKE '%fizzy%'` over
`task_events` returns 0 rows. This query finds every card marker:

```sql
SELECT task_id, body FROM task_comments WHERE body LIKE 'fizzy:%';
```

On 17 September 2026 the query returned seven rows, `fizzy:13` through
`fizzy:19`.

**A `task_links` row holds the worker id first and the root id second.**
The columns are `parent_id` and `child_id`. The row
`t_8e9c7cfb|t_7e862706` names a worker and then its root task. This
layout confirms the edge direction above.

**The card resolution of Task 1 was tested against five real worker
tasks.** Each one found no marker on itself and found the correct card
through the walk:

```
worker t_8e9c7cfb   direct=[] walked=[17] via t_7e862706
worker t_34115dfd   direct=[] walked=[17] via t_7e862706
worker t_1fb4f81c   direct=[] walked=[18] via t_46c04c5a
worker t_902013ff   direct=[] walked=[14] via t_ff5eb6e8
worker t_a8f78687   direct=[] walked=[13] via t_7a44199b
```

The first two rows are the two tasks that blocked in silence on 14
September 2026, which record 0043 names. Both resolve to card 17. That
card is the one the Fizzy board never showed a block on.

**`hermes send` needs no `-p` flag inside a worker.** The docstring of
`_check_send_message` at `tools/send_message_tool.py:1837` states that
workers "run with the assignee profile's `HERMES_HOME`". The worker
therefore sends with its own bot token and its own home channel.

**`hermes -p crazydave config get` prints one entry for each line.** The
key `command_allowlist` prints three lines that each start with `- `. The
key `toolsets` prints `- hermes-cli` and `- kanban`.

**In SQLite, `||` binds tighter than `-` and `/`.** The expression
`'blocked ' || (a - b)/60 || 'm'` parses as a division of two strings and
returns `0`. The arithmetic needs its own parentheses. This defect
appeared in the first draft of `blocked-watch.sh` and a test found it.

**`sqlite3 -readonly` fails on `kanban.db`.** The command returns
`Error: in prepare, unable to open database file (14)`. The database runs
in WAL mode, and the `-shm` and `-wal` sidecar files exist only while a
writer holds the database open. A read-only connection cannot create the
`-shm` file that WAL mode needs. The same flag works on every
`state.db`, because the gateway holds those files open and the sidecars
stay present.

**Sunflower holds four open Telegram sessions.** Each one started on 9 or
10 September 2026 and each holds a system prompt of about 12,209
characters. One of them uses thread 3, which is the `#Planning` topic that
Sunflower answers today. A `SOUL.md` edit does not reach that chat until
`/new` runs there. This fact repeats
[record 0045](../../../teach/learning-records/0045-a-rule-that-reached-no-session.md)
for a second profile.

**`kanban-autosubscribe.sh` points at the wrong room.** Line 14 reads
`CHAT_ID="${HERMES_TELEGRAM_CHAT_ID:-<the private chat id>}"`. No profile
sets `HERMES_TELEGRAM_CHAT_ID`, so the fallback always fires. The file
carries the date 9 September 2026 and no cron job has ever run it.

## File structure

**New scripts**, which live under `~/.hermes/scripts/` and are mirrored
into `hermes-config/scripts/`:

| File | Responsibility |
| --- | --- |
| `hermes-report.sh` | Send one message to Telegram and to the Fizzy card |
| `roster-audit.sh` | Check four roster rules once each day |
| `blocked-watch.sh` | Name every task blocked for more than 60 minutes |

**Changed files:**

| File | Change |
| --- | --- |
| `peashooter/SOUL.md` | Line 23 calls the report script |
| `sunflower/SOUL.md` | Line 25 calls the report script |
| `crazydave/SOUL.md` | Line 97 calls the report script |
| `kanban-autosubscribe.sh` | Line 14 uses the group id |

**New lessons:** `0032` through `0035`.
**New learning records:** `0048` and `0049`.

---

### Task 1: A report that reaches two rooms (Lesson 32)

**Files:**
- Create: `teach/lessons/0032-a-report-that-reaches-two-rooms.html`
- Create: `teach/learning-records/0048-two-words-that-name-the-opposite-edge.md`
- Create: `hermes-config/scripts/hermes-report.sh`
- Modify: `teach/reference/glossary.html`

**Interfaces:**
- Produces: the command `hermes-report.sh "<the message>"`, which Task 2
  writes into three soul files.
- Produces: the card resolution rule that walks `children`, which Lesson
  33 cites and does not repeat.

- [ ] **Step 1: Write the reason section of Lesson 32.** State the gap in
  one paragraph. Crazy Dave writes one Fizzy comment, and Crazy Dave
  writes it at root task completion. A blocked task never reaches root
  task completion. Cite record 0043 for the two tasks that blocked on 14
  September 2026. State that the Fizzy card showed neither one.

- [ ] **Step 2: Teach the inverted edge direction.** This is the one idea
  the lesson must land. Give the real board output:

```
t_e6f5dc9f  root    parents: 5 worker ids       children: 0
t_29e6cbb8  worker  parents: ['t_3ce59841']     children: [..., 't_e6f5dc9f']
```

  State the rule in one sentence. A parent must reach `done` first, and a
  child waits. Then state the consequence. A worker reaches its root task
  through `children`, never through `parents`.

- [ ] **Step 3: Write the script in full inside the lesson.** Give this
  exact text. Do not summarize it and do not omit a comment.

```bash
#!/usr/bin/env bash
# Report one message to Telegram, and to the Fizzy card when a card exists.
#
# A worker calls this script instead of `hermes send --to telegram`.
# Telegram always receives the message. Fizzy receives a comment only when
# the task chain carries a `fizzy:<number>` comment.

set -uo pipefail

MSG="${1:-}"
if [ -z "$MSG" ]; then
  echo "usage: hermes-report.sh \"<the message>\"" >&2
  exit 2
fi

# Telegram first. This send is the report that Jokot reads, so a Fizzy
# defect never costs a report.
if ! hermes send --to telegram "$MSG" >/dev/null 2>&1; then
  echo "report: telegram send failed" >&2
  exit 1
fi

TASK="${HERMES_KANBAN_TASK:-}"
[ -z "$TASK" ] && exit 0

# Print the card number held in a `fizzy:<number>` comment, or print
# nothing. The quotation marks anchor the match, so a comment that only
# mentions the word fizzy never matches.
card_of() {
  hermes kanban show "$1" --json 2>/dev/null \
    | grep -o '"fizzy:[0-9][0-9]*"' | head -1 | tr -d '"' | cut -d: -f2
}

CARD="$(card_of "$TASK")"

# A dispatched worker owns a child task, and the card belongs to the root
# task. In this board `children` means "waits for me", so the root task
# appears in the children list of the worker task. Probe every task id
# that the worker task mentions. Only a root task carries a fizzy comment.
if [ -z "$CARD" ]; then
  for id in $(hermes kanban show "$TASK" --json 2>/dev/null \
                | grep -o 't_[0-9a-f]\{8\}' | sort -u); do
    [ "$id" = "$TASK" ] && continue
    CARD="$(card_of "$id")"
    [ -n "$CARD" ] && break
  done
fi

if [ -z "$CARD" ]; then
  echo "report: no fizzy card for $TASK" >&2
  exit 0
fi

if ! fizzy comment create --profile crazydave --card "$CARD" \
       --body "$MSG" >/dev/null 2>&1; then
  echo "report: fizzy comment failed for card $CARD" >&2
fi
exit 0
```

- [ ] **Step 4: State the three rules the script obeys.** Telegram runs
  first, because that send is the report Jokot reads. A Fizzy failure
  never changes the exit code. An absent `HERMES_KANBAN_TASK` means the
  caller is not a dispatched worker, so the script stops after Telegram.

- [ ] **Step 5: Write the install steps for Jokot.** Give the commands:

```bash
# Write the file with a text editor, then:
chmod +x ~/.hermes/scripts/hermes-report.sh
```

- [ ] **Step 6: Write the three tests for Jokot, in order.** Test 1 proves
  the Telegram half with no card:

```bash
unset HERMES_KANBAN_TASK
~/.hermes/scripts/hermes-report.sh "stage 5 test one, telegram only"
echo "exit=$?"
```

  Expected: one message in the group, and `exit=0`.

  Test 2 proves the script refuses an empty argument:

```bash
~/.hermes/scripts/hermes-report.sh; echo "exit=$?"
```

  Expected: the usage line on standard error, and `exit=2`.

  Test 3 proves the card lookup against a finished job. Use the worker
  task `t_8e9c7cfb`, which belongs to root task `t_7e862706` and card 17:

```bash
HERMES_KANBAN_TASK=t_8e9c7cfb \
  ~/.hermes/scripts/hermes-report.sh "stage 5 test three, card lookup"
```

  Expected: one Telegram message, and one new comment on Fizzy card 17.

  If that task is archived by the time Jokot runs the lesson, this query
  lists every root task that carries a card, and the worker tasks of each:

```bash
sqlite3 ~/.hermes/kanban.db "
SELECT c.body, l.parent_id AS worker
FROM task_comments c JOIN task_links l ON l.child_id = c.task_id
WHERE c.body LIKE 'fizzy:%';"
```

- [ ] **Step 7: Write the checkpoint list** with one checkbox for each of
  the three tests, and one for `chmod +x`.

- [ ] **Step 8: Add "dependency edge" to the glossary.** Define it as the
  relation the kanban words `parents` and `children` name. State that a
  parent must finish first and a child waits. State that the root task
  therefore lists its workers as parents. Credit Lesson 32.

- [ ] **Step 9: Verify the lesson HTML tag balance.**

- [ ] **Step 10: Run the link existence check** over every relative
  `href` in Lesson 32.

- [ ] **Step 11: Ask Jokot to run Lesson 32** and to report the output of
  all three tests.

- [ ] **Step 12: Verify the reported output.** Test 1 must print `exit=0`
  and Jokot must see the message in the group. Test 2 must print `exit=2`.
  Test 3 must add a comment that Jokot can see on the Fizzy card. If any
  test fails, fix the script and write the defect into record 0048.

- [ ] **Step 13: Copy the script into the repository.**

```bash
mkdir -p hermes-config/scripts
cp ~/.hermes/scripts/hermes-report.sh hermes-config/scripts/hermes-report.sh
```

- [ ] **Step 14: Write learning record 0048.** Title it "Two words that
  name the opposite edge". Record the `parents` and `children` direction
  with the real board output. Record that a first draft of the card lookup
  walked `parents` and would have found no card. Generalize: a word that
  reads like a tree can name a dependency edge, so test the direction
  before you trust the name.

- [ ] **Step 15: Run the secret scan, then commit.**

```bash
git add teach/lessons/0032-a-report-that-reaches-two-rooms.html \
        teach/learning-records/0048-two-words-that-name-the-opposite-edge.md \
        teach/reference/glossary.html hermes-config/scripts/hermes-report.sh
git diff --cached | grep -nE '<DM>|TELEGRAM_BOT_TOKEN=|FIZZY_TOKEN=|[0-9]{9,10}:[A-Za-z0-9_-]{35}' | grep -v 'grep -nE'
```

  A match means stop and remove the value. No match means commit. Read
  every match before you judge it. A line that only quotes the pattern,
  with no value after the equals sign, is a false result.

---

### Task 2: One command in three soul files (Lesson 33)

**Files:**
- Create: `teach/lessons/0033-one-command-in-three-soul-files.html`
- Modify: `hermes-config/peashooter/SOUL.md`
- Modify: `hermes-config/sunflower/SOUL.md`
- Modify: `hermes-config/crazydave/SOUL.md` (lines 25 and 97, plus the step 3 edit)

**Interfaces:**
- Consumes: `hermes-report.sh` from Task 1.
- Produces: three soul files that hold no `hermes send --to telegram`
  line, which success criterion 4 tests.

- [ ] **Step 1: Write the reason section of Lesson 33.** State why a
  script beats a procedure in a soul file. Cite
  [record 0017](../../../teach/learning-records/0017-three-correct-rules-that-never-combined.md),
  which needed two extra edits of `SOUL.md` to stop other regions of the
  file from offering a competing procedure. State the rule: a soul file
  states one command, and the script holds the steps.

- [ ] **Step 2: Give the exact replacement for Peashooter and
  Sunflower.** Both files hold the same block today. Find this line:

```
  hermes send --to telegram "your message here"
```

  Replace it with:

```
  ~/.hermes/scripts/hermes-report.sh "your message here"
```

  State that the surrounding paragraph does not change. The rule about
  two or three sentences, the full path of every changed file, and one
  message for each task all stay exactly as they are.

- [ ] **Step 3: Give the exact replacement for Crazy Dave. That file holds
  two lines, not one.** Line 97 carries the general reporting rule. Line 25
  carries step 4 of the root task procedure. Both lines run
  `hermes send --to telegram`, so both lines change. A change to line 97
  alone leaves one occurrence, and success criterion 4 then fails.

  Line 97 takes the same replacement as the two worker files:

```
  ~/.hermes/scripts/hermes-report.sh "your message here"
```

  Line 25 takes the same call with the wording of Crazy Dave:

```
     ~/.hermes/scripts/hermes-report.sh "<your summary, in your own voice>"
```

  Keep the five leading spaces on line 25. That line sits inside a numbered
  list, and the indent holds the list item together.

- [ ] **Step 4: Remove `fizzy comment create` from step 3 of the root task
  procedure, and say why.** Step 3 reads:

```
3. Read the fizzy:<number> comment on that task. Then run
     fizzy comment create --profile crazydave --card <number> --body "<your summary>"
     fizzy card close <number> --profile crazydave
```

  It becomes:

```
3. Read the fizzy:<number> comment on that task. Then run
     fizzy card close <number> --profile crazydave
```

  The reason is a duplicate. After step 4 calls the report script, that
  script writes the summary onto the card by itself. If step 3 also ran
  `fizzy comment create`, the card would collect the same summary twice.
  Success criterion 7 of the spec allows one closing comment of Crazy Dave,
  not two.

  Crazy Dave still reads the `fizzy:<number>` comment in step 3, because
  `fizzy card close` needs that number. A missing marker still stops him at
  the same step, so this edit removes no check.

  State the rule the edit follows: one script owns both destinations. That
  rule is the first decision of the spec, and step 3 of Crazy Dave was the
  last place that still wrote to Fizzy by hand.

- [ ] **Step 5: Explain why Torchwood does not change.** Torchwood is not
  a dispatched worker and its soul file forbids every board change.

- [ ] **Step 6: Write the edit method.** Tell Jokot to edit each file with
  a text editor. State the reason from
  [record 0044](../../../teach/learning-records/0044-a-tool-that-was-never-turned-on.md):
  `hermes config set` wrote a string where a list belonged and deleted 22
  lines of comments. Tell Jokot to copy each file first:

```bash
cp ~/.hermes/profiles/peashooter/SOUL.md ~/peashooter-SOUL.bak
```

- [ ] **Step 7: Write the delivery step, and say why it is not optional.**
  A soul file edit does not reach an open chat session. Cite record 0045.
  Tell Jokot to send `/new` inside each topic, then one ordinary message,
  and to wait for the reply:

  - `#Coding` for Peashooter
  - `#Planning` for Sunflower
  - `#General` for Crazy Dave

  State the Sunflower finding from planning. Sunflower holds four open
  Telegram sessions from 9 and 10 September 2026, and one of them serves
  `#Planning`. Without `/new`, the Sunflower edit reaches nobody.

- [ ] **Step 8: Write the file proof command.** This command is success
  criterion 4 of the spec. Give it, and state the expected result:

```bash
grep -c 'hermes send --to telegram' ~/.hermes/profiles/*/SOUL.md
```

  The command prints one `<path>:<count>` line for each of the four
  profiles. Every count must read 0. Torchwood already reads 0 today,
  because that file holds no such line.

- [ ] **Step 9: Write the session proof command.** The file proof shows
  the rule on disk. This command shows the rule in a live chat. Give
  this, and state what each result means:

```bash
for p in peashooter sunflower crazydave; do
  printf '%-11s ' "$p"
  sqlite3 -readonly ~/.hermes/profiles/$p/state.db \
    "SELECT COUNT(*) FROM sessions WHERE source='telegram' AND ended_at IS NULL
       AND system_prompt LIKE '%hermes-report.sh%';"
done
```

  A count of 1 or more means the new rule is live for that profile. A
  count of 0 means either the chat still runs the old prompt, or nobody
  sent a message after `/new`. Read the `system_prompt` column to separate
  the two cases, because `/new` leaves it NULL until the first turn.

- [ ] **Step 10: Write the checkpoint list.** One checkbox for each of the
  three file edits, one for each `/new` plus message, one for the file
  proof reading 0 for all four profiles, and one for the session proof
  reading 1 or more for all three edited profiles.

- [ ] **Step 11: Verify the lesson HTML tag balance and run the link
  existence check.**

- [ ] **Step 12: Ask Jokot to run Lesson 33** and to report the output of
  the proof command.

- [ ] **Step 13: Verify the reported output.** The file proof must print
  0 for all four profiles. The session proof must print 1 or more for all
  three edited profiles. If one prints 0, read that profile's
  `system_prompt` column before naming a cause.

- [ ] **Step 14: Mirror the three soul files.**

```bash
for p in peashooter sunflower crazydave; do
  cp ~/.hermes/profiles/$p/SOUL.md hermes-config/$p/SOUL.md
done
```

- [ ] **Step 15: Confirm the mirror holds no secret, then commit.** Run
  the secret scan from the global constraints.

---

### Task 3: A job that speaks only on failure (Lesson 34)

**Files:**
- Create: `teach/lessons/0034-a-job-that-speaks-only-on-failure.html`
- Create: `hermes-config/scripts/roster-audit.sh`
- Modify: `teach/reference/glossary.html`

**Interfaces:**
- Produces: the first cron job, which Lesson 35 extends with two more.

- [ ] **Step 1: Write the reason section of Lesson 34.** State the idea
  plainly. Records 0043 through 0046 each produced a check command, and
  each command runs only when somebody remembers it. A scheduled command
  needs no memory. State the design rule: the script prints nothing when
  the rule holds, so a message always means a defect.

- [ ] **Step 2: Teach the cron mechanism in three facts.** The scheduler
  runs inside the gateway on a 60 second tick. The flag `--no-agent`
  skips the model, so the job costs no tokens. The help text states
  "Empty stdout = silent."

- [ ] **Step 3: Write the script in full inside the lesson.** Give this
  exact text:

```bash
#!/usr/bin/env bash
# Check four roster rules. Print one line for each rule that fails. Print
# nothing when every rule holds, so a healthy run delivers no message.
#
# Each check names the learning record that found the defect.
set -uo pipefail

# 1. Every profile speaks into the same room. Record 0043.
n=$(grep -h '^TELEGRAM_HOME_CHANNEL=' "$HOME"/.hermes/profiles/*/.env 2>/dev/null \
      | sort -u | wc -l | tr -d ' ')
[ "$n" = "1" ] || echo "home channel: $n distinct values across profiles, expected 1"

# 2. The allowlist of Crazy Dave holds exactly three entries. Record 0046.
n=$(hermes -p crazydave config get command_allowlist 2>/dev/null | grep -c '^- ')
[ "$n" = "3" ] || echo "allowlist: crazydave holds $n entries, expected 3"

# 3. Crazy Dave keeps the kanban toolset. Record 0044.
hermes -p crazydave config get toolsets 2>/dev/null | grep -q '^- kanban$' \
  || echo "toolsets: crazydave is missing kanban"

# 4. No Telegram session runs on a prompt older than 7 days. Record 0045.
for db in "$HOME"/.hermes/profiles/*/state.db; do
  p=$(basename "$(dirname "$db")")
  old=$(sqlite3 "$db" "SELECT COUNT(*) FROM sessions WHERE source='telegram'
          AND ended_at IS NULL
          AND started_at < strftime('%s','now') - 604800;" 2>/dev/null)
  [ -n "$old" ] && [ "$old" != "0" ] \
    && echo "session: $p holds $old telegram session(s) older than 7 days"
done
exit 0
```

- [ ] **Step 4: State what the script found during planning.** The run on
  17 September 2026 printed one line:

```
session: sunflower holds 3 telegram session(s) older than 7 days
```

  Say plainly that the audit found a real defect on its first run, before
  any schedule existed. If Task 2 already cleared those sessions with
  `/new`, the line no longer appears, and the lesson states that too.

- [ ] **Step 5: Write the install and test steps.**

```bash
chmod +x ~/.hermes/scripts/roster-audit.sh
~/.hermes/scripts/roster-audit.sh; echo "exit=$?"
```

  Expected: `exit=0`, with no line or with one session line.

- [ ] **Step 6: Write the deliberate break test.** This is the step that
  proves the job is worth having. Tell Jokot to change one value, run the
  script, and change the value back:

```bash
cp ~/.hermes/profiles/torchwood/.env ~/torchwood-env.bak
# Change TELEGRAM_HOME_CHANNEL in ~/.hermes/profiles/torchwood/.env to -1
~/.hermes/scripts/roster-audit.sh
# Expected: home channel: 2 distinct values across profiles, expected 1
cp ~/torchwood-env.bak ~/.hermes/profiles/torchwood/.env
~/.hermes/scripts/roster-audit.sh
# Expected: that line is gone
```

- [ ] **Step 7: Write the cron creation step.**

```bash
hermes -p crazydave cron create '0 9 * * *' \
  --name roster-audit \
  --script roster-audit.sh \
  --no-agent \
  --deliver telegram
```

  State that `--script` documents a path "under `~/.hermes/scripts/`", so
  the basename is the first thing to try. Tell Jokot to run
  `hermes -p crazydave cron list` and report the stored value. If the job
  shows no script or fails, retry with the absolute path.

- [ ] **Step 8: Write the immediate proof step.** A daily job proves
  nothing today. Tell Jokot to force one run:

```bash
hermes -p crazydave cron run roster-audit
hermes -p crazydave cron runs roster-audit
```

- [ ] **Step 9: Write the checkpoint list.** One checkbox each for
  `chmod +x`, the healthy run, the deliberate break, the restore, the job
  creation, and the forced run.

- [ ] **Step 10: Add "watchdog" to the glossary.** Define it as a
  scheduled job that prints nothing when the checked rule holds. State
  that silence is the pass result, so every delivered message names a
  defect. Credit Lesson 34.

- [ ] **Step 11: Verify tag balance, run the link existence check, ask
  Jokot to run Lesson 34, and verify the reported output.** The deliberate
  break must produce the `home channel: 2` line, and the restore must
  remove it. A break that produces no line means the check does not work,
  so fix it before the commit.

- [ ] **Step 12: Copy the script into the repository and commit** after
  the secret scan.

---

### Task 4: The watch for a task that stopped (Lesson 35)

**Files:**
- Create: `teach/lessons/0035-the-watch-for-a-task-that-stopped.html`
- Create: `teach/learning-records/0049-a-read-only-connection-that-could-not-read.md`
- Create: `hermes-config/scripts/blocked-watch.sh`
- Create: `hermes-config/scripts/kanban-autosubscribe.sh`

  The repository holds no copy of `kanban-autosubscribe.sh` today. Jokot
  modifies the live file at `~/.hermes/scripts/`, and this task creates the
  first mirror of it.

**Interfaces:**
- Consumes: the cron pattern from Task 3.
- Produces: the third cron job, which completes success criterion 3.

- [ ] **Step 1: Write the reason section of Lesson 35.** State the one
  case the report script cannot cover. The script runs when a worker
  reports. A worker that stops before it reports sends nothing, and the
  task stays blocked in silence. Name the two tasks from record 0043 and
  state that the board held both states correctly the whole time. Only a
  reader was missing.

- [ ] **Step 2: Teach the SQLite precedence trap.** Give the wrong
  expression and the result:

```sql
'blocked ' || (a - b)/60 || 'm'   -- returns 0
```

  State the rule. In SQLite, `||` binds tighter than `-` and `/`, so that
  expression divides one string by another. Give the correct form:

```sql
'blocked ' || ((a - b)/60) || 'm'
```

- [ ] **Step 3: Write the script in full inside the lesson.**

```bash
#!/usr/bin/env bash
# Print one line for each kanban task that stayed blocked for more than 60
# minutes. Print nothing otherwise, so a healthy run delivers no message.
#
# The script opens kanban.db without `-readonly`. A read-only connection to
# a WAL database fails when the -shm and -wal sidecar files are absent, and
# those files exist only while a writer holds the database open. This query
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
```

- [ ] **Step 4: Write the test that proves the formatting.** The healthy
  board prints nothing, which proves little. Tell Jokot to relax both
  filters into a copy and run that copy:

```bash
sed -e "s/t.status = 'blocked'/1=1/" \
    -e "s/e.created_at < strftime('%s','now') - 3600/1=1/" \
    ~/.hermes/scripts/blocked-watch.sh > /tmp/blocked-watch-relaxed.sh
bash /tmp/blocked-watch-relaxed.sh
```

  Expected: six lines, one for each historical block, each starting with
  `blocked <minutes>m:`. Two of them name `t_8e9c7cfb` and `t_34115dfd`,
  which are the two tasks of record 0043.

- [ ] **Step 5: Write the autosubscribe repair.** State the defect first.
  Line 14 falls back to the private chat, no profile sets
  `HERMES_TELEGRAM_CHAT_ID`, so the fallback always fires. Give the
  replacement, and state that the group id is the value record 0043
  established:

```bash
CHAT_ID="${HERMES_TELEGRAM_CHAT_ID:--1004371805465}"
```

  Warn about the two colons. The first colon belongs to the `:-` default
  operator and the minus sign belongs to the group id.

- [ ] **Step 6: Write the repair test.**

```bash
bash -c 'set -u; CHAT_ID="${HERMES_TELEGRAM_CHAT_ID:--1004371805465}"; echo "$CHAT_ID"'
```

  Expected: `-1004371805465`.

- [ ] **Step 7: Write the two cron creation commands.**

```bash
hermes -p crazydave cron create 'every 1h' \
  --name blocked-watch --script blocked-watch.sh --no-agent --deliver telegram

hermes -p crazydave cron create 'every 15m' \
  --name kanban-autosubscribe --script kanban-autosubscribe.sh \
  --no-agent --deliver telegram
```

- [ ] **Step 8: Write the final proof command** for success criterion 3:

```bash
hermes -p crazydave cron list
```

  Expected: three jobs named `roster-audit`, `blocked-watch`, and
  `kanban-autosubscribe`.

- [ ] **Step 9: Write the checkpoint list** with one checkbox for each of
  `chmod +x`, the relaxed-filter test, the line 14 repair, the repair
  test, the two job creations, and the three-job list.

- [ ] **Step 10: Verify tag balance, run the link existence check, ask
  Jokot to run Lesson 35, and verify the reported output.**

- [ ] **Step 11: Write learning record 0049.** Title it "A read-only
  connection that could not read". Record that `sqlite3 -readonly` fails
  on `kanban.db` with error 14 while the same flag works on every
  `state.db`. Record the cause: WAL mode needs an `-shm` file, the
  sidecars exist only while a writer holds the database open, and a
  read-only connection cannot create them. Record the SQLite `||`
  precedence defect in the same file. Generalize: a read-only flag
  describes an intention, and the file layout decides whether the
  intention works.

- [ ] **Step 12: Copy both scripts into the repository and commit** after
  the secret scan. The copy of `kanban-autosubscribe.sh` now holds the
  group id, so the scan must still pass.

---

### Task 5: Close the stage

**Files:**
- Create: `teach/learning-records/0050-stage-5-complete.md`
- Modify: `teach/MISSION.md`
- Modify: `teach/NOTES.md`

- [ ] **Step 1: Run every success criterion from the spec** and record the
  real output of each one.

- [ ] **Step 2: Run criterion 7 as a real job.** Give the roster a genuine
  task through Crazy Dave, not a test task. Confirm that the Fizzy card
  collects one comment for each worker report plus the closing comment of
  Crazy Dave.

- [ ] **Step 3: Write record 0050** with the seven criteria and the output
  that proves each one.

- [ ] **Step 4: Split the mission criterion, and mark only the cron half
  met.** Line 27 of `teach/MISSION.md` reads "Run work that Jokot never
  started, through cron and through the Fizzy webhook receiver. **Open,
  deferred since Stage 1 and Stage 3.**" Stage 5 delivers cron. The spec
  puts the Fizzy webhook receiver out of scope, because that receiver needs
  a public HTTPS endpoint. Write the criterion as two sentences:

  > Run work that Jokot never started. **The cron half is met in Stage 5.**
  > The Fizzy webhook receiver stays open, because it needs a public HTTPS
  > endpoint.

  Do not write "Met in Stage 5" alone. That wording claims a receiver that
  no stage has built. Leave the server criterion open.

- [ ] **Step 5: Commit.**

---

## Rollback

Each task reverses on its own.

| Task | Reverse step |
| --- | --- |
| 1 | Delete `~/.hermes/scripts/hermes-report.sh`. Nothing calls it yet. |
| 2 | Restore each `SOUL.md` from the backup, then send `/new` in each topic. |
| 3 | `hermes -p crazydave cron rm roster-audit` |
| 4 | `hermes -p crazydave cron rm blocked-watch` and `cron rm kanban-autosubscribe`, then restore line 14. |

A cron job never changes a soul file or a profile, so removing a job
returns the roster to the state before Task 3.
