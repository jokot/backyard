# Stage 3 Implementation Plan: the Ark group and the Fizzy mirror

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one Telegram supergroup where each specialist owns one
topic and answers there by default, and mirror every root kanban task to
a Fizzy card that Crazy Dave creates and closes.

**Architecture:** Three Hermes gateways stay separate, one per profile,
each with its own bot token. Each profile receives `require_mention:
true` plus one `free_response_topics` entry naming its own topic. The
Fizzy mirror is one-way. Crazy Dave creates a card when it files a root
task, and closes that card when the root task completes. No agent reads
Fizzy.

**Tech Stack:** Hermes Agent CLI (profiles, gateway, kanban), Telegram
supergroup with Topics, the official Fizzy command line interface
(`basecamp/fizzy-cli`, Go, MIT license), the `teach` skill's lesson
format (one self-contained HTML file per hands-on step).

**Spec:** `docs/superpowers/specs/2026-09-09-stage3-ark-and-fizzy-design.md`

## Global Constraints

- The user runs every mutating command in their own terminal or in the
  Telegram application. Never run a mutating command for them. The goal
  is user learning, not a finished system.
- Never assert a diagnosis without real command output or real Hermes
  source. Quote the output that supports each claim.
- Every real bug gets a fix plus a learning record. Never a workaround.
- Learning records continue from `0013`. Lessons continue from `0018`.
- Lesson HTML must have balanced tags. Verify balance before every
  commit.
- Lesson body prose and commit messages follow the STE-flavored writing
  style already used in lessons `0001` through `0017`.
- After every edit to a real profile's `SOUL.md` or `config.yaml`, copy
  the file into `hermes-config/<profile>/` in this repository and commit
  it. Never copy `.env` or `auth.json`.
- Telegram configuration keys go directly under the top-level
  `telegram:` block of `~/.hermes/profiles/<profile>/config.yaml`. The
  hook `_apply_yaml_config` at
  `plugins/platforms/telegram/adapter.py:9228` reads them from that
  block.
- Use no `ignored_threads` entry in any profile. That key is checked
  before the mention check and would make a bot unreachable by mention.
- One commit per task. A commit carries the lesson file, any learning
  record, and any mirrored configuration file together.

## Verified facts

These facts come from Hermes source and from the Fizzy repository. Each
one was read during planning, not recalled.

- **`free_response_topics` overrides `require_mention`.** The group gate
  in `plugins/platforms/telegram/adapter.py` runs in this order:
  `allowed_chats`, guest mention, `free_response_chats`,
  `free_response_topics`, `require_mention`, reply-to-bot, mention,
  mention patterns. The `free_response_topics` check returns `True`
  before the `require_mention` check runs. The combination in this plan
  works. Spec risk 1 is resolved.
- **`free_response_topics` reaches the adapter by two paths.** The hook
  `_apply_yaml_config` sets `TELEGRAM_FREE_RESPONSE_TOPICS` from the
  YAML value, and also copies the value into `PlatformConfig.extra`. The
  reader `_telegram_free_response_topics` at line 7251 checks `extra`
  first and the environment variable second.
- **An entry is the string `<chat_id>:<thread_id>`.** The General topic
  is thread `1`, because `_GENERAL_TOPIC_THREAD_ID = "1"` at line 583.
- **`free_response_topics` is undocumented.** The file
  `website/docs/user-guide/messaging/telegram.md` never names it. Only
  the adapter source describes it.
- **Groups are open by default.** The comment at `gateway/run.py:490`
  states that adapters default `dm_policy` and `group_policy` to
  `open`. The Ark group needs no pairing step.
- **The current `telegram:` block holds two keys.** In all three
  mirrored configuration files the block is `reactions: false` and
  `allowed_chats: ''`. An empty `allowed_chats` disables that gate.
- **Fizzy command shapes.** From the repository `basecamp/fizzy-cli`,
  branch `master`, files `README.md` and `SURFACE.txt`:
  `brew install --cask basecamp/tap/fizzy`,
  `fizzy auth login "$TOKEN" --profile <name> --account <id>`,
  `fizzy board list`, `fizzy card show 42`,
  `fizzy card create --board <id> --title "..." --description "..."`,
  `fizzy comment create --card 42 --body "..."`. The flag `--jq` is
  built in and needs no external `jq`.

---

## File Structure

- `teach/lessons/0018-the-ark-group.html` — create. Telegram side of the
  group: creation, topics, bot administration, privacy mode, and the
  identifiers.
- `teach/lessons/0019-one-topic-one-listener.html` — create. The three
  configuration edits and the five routing tests.
- `teach/lessons/0020-dave-answers-the-room.html` — create. The two
  `SOUL.md` exceptions that let Crazy Dave reply without filing a task.
- `teach/lessons/0021-the-exception-that-changes-something.html` —
  create. The `SOUL.md` exception that lets Crazy Dave archive tasks on
  the board itself, and the four limits that come from `archive_task`.
- `teach/lessons/0022-fizzy-the-visible-board.html` — create. Fizzy
  account, board, command line interface, and authentication.
- `teach/lessons/0023-crazy-dave-writes-the-card.html` — create. The
  `SOUL.md` edit that adds the two Fizzy moments.
- `teach/lessons/0024-the-stage3-end-to-end-check.html` — create. One
  cross-domain request from the group through to a closed Fizzy card.
- `teach/lessons/0017-workers-report-their-own-results.html` — modify
  line 229. The `<span></span>` becomes a forward link to Lesson 18.
- `teach/reference/glossary.html` — modify in Task 2 and Task 3. Add
  "Forum topic", "Free-response topic", "Mention gating", and "One-way
  mirror" as `<dt>`/`<dd>` pairs, matching the 20 entries already there.
- `teach/learning-records/0013-*.md` onward — create one per real
  finding. Content cannot be predicted before the real run.
- `hermes-config/peashooter/config.yaml`,
  `hermes-config/sunflower/config.yaml`,
  `hermes-config/crazydave/config.yaml` — modify in Task 2.
- `hermes-config/crazydave/SOUL.md` — modify in Task 3 and Task 6.
- `docs/superpowers/specs/2026-09-09-stage3-ark-and-fizzy-design.md` —
  modify in Task 2 (risk 1 resolved) and Task 8 (status).

---

### Task 1: The Ark group and its identifiers

**Files:**
- Create: `teach/lessons/0018-the-ark-group.html`
- Modify: `teach/lessons/0017-workers-report-their-own-results.html:229`

**Interfaces:**
- Consumes: the three Telegram bots from Stage 1 and Stage 2.
- Produces: one supergroup chat id, and three thread ids for #General,
  #Coding and #Planning. Task 2 writes those four numbers into three
  configuration files.

- [ ] **Step 1: Write Lesson 18.** Cover the reason for the group first.
  Three direct message threads give three separate rooms. The reference
  project uses one room with one topic per specialist, so a cross-domain
  conversation stays in one place. Then give the exact Telegram steps:

  1. Create a new group. Add all three bots. Telegram converts a group
     to a supergroup when you enable Topics.
  2. Open group settings and enable Topics.
  3. Create the topics `Coding` and `Planning`. The General topic
     already exists and needs no creation.
  4. Promote each of the three bots to administrator.

  State the reason for administrator rights plainly. A non-administrator
  bot in a supergroup can miss messages that Telegram delivers only to
  administrators.

- [ ] **Step 2: Write the privacy mode section of Lesson 18.** This is
  the failure that produces silence with no error message. Cover:

  - Open a chat with `@BotFather`.
  - Send `/mybots`, choose the bot, choose `Bot Settings`, choose
    `Group Privacy`, choose `Turn off`.
  - Repeat for all three bots.
  - Remove each bot from the group and add it again. Telegram can keep
    the earlier delivery behavior for a bot that is already a member.

  Explain the effect in one sentence. A bot with group privacy enabled
  receives only messages that name it, so a default listener never sees
  an unnamed message.

- [ ] **Step 3: Write the identifiers section of Lesson 18.** The chat
  id and the thread ids are not shown in the Telegram interface. Give
  the reliable method:

  - Open each topic in Telegram Web at `https://web.telegram.org/a/`.
  - Read the address bar. It shows `#-1001234567890_3`, where
    `-1001234567890` is the chat id and `3` is the thread id.
  - The General topic shows no thread number. Its thread id is `1`.

  Tell the reader to write the four numbers in a note. Task 2 needs all
  four.

- [ ] **Step 4: Add the forward navigation link.** Replace the empty
  `<span></span>` on line 229 of
  `teach/lessons/0017-workers-report-their-own-results.html`:

```html
  <span><a href="0018-the-ark-group.html">Lesson 18 →</a></span>
```

- [ ] **Step 5: Verify the HTML tag balance of both files.**

```bash
python3 - <<'EOF'
import re, sys
for p in ["teach/lessons/0018-the-ark-group.html",
          "teach/lessons/0017-workers-report-their-own-results.html"]:
    s = open(p).read()
    void = {"br","hr","img","input","meta","link"}
    stack = []
    for m in re.finditer(r"<(/?)([a-zA-Z0-9]+)[^>]*?(/?)>", s):
        close, name, self_close = m.group(1), m.group(2).lower(), m.group(3)
        if name in void or self_close:
            continue
        if close:
            if not stack or stack[-1] != name:
                print(f"{p}: unbalanced </{name}> at offset {m.start()}")
                sys.exit(1)
            stack.pop()
        else:
            stack.append(name)
    if stack:
        print(f"{p}: unclosed {stack}")
        sys.exit(1)
    print(f"{p}: balanced")
EOF
```

Expected: two lines, each ending in `balanced`.

- [ ] **Step 6: Ask the user to do the Telegram work** from Lesson 18,
  and to report the chat id and the three thread ids.

- [ ] **Step 7: Verify the identifiers are plausible.** A supergroup
  chat id starts with `-100`. Three thread ids must be distinct, and
  General must be `1`. If any number fails these checks, ask the user to
  read the address bar again rather than guessing a value.

- [ ] **Step 8: Commit.**

```bash
git add teach/lessons/0018-the-ark-group.html \
        teach/lessons/0017-workers-report-their-own-results.html
git commit -m "Add Lesson 18: the Ark group and its identifiers"
```

---

### Task 2: One topic, one default listener

**Files:**
- Create: `teach/lessons/0019-one-topic-one-listener.html`
- Modify: `~/.hermes/profiles/peashooter/config.yaml` (the `telegram:`
  block, near line 459)
- Modify: `~/.hermes/profiles/sunflower/config.yaml` (the `telegram:`
  block, near line 461)
- Modify: `~/.hermes/profiles/crazydave/config.yaml` (the `telegram:`
  block, near line 461)
- Modify: `hermes-config/peashooter/config.yaml`,
  `hermes-config/sunflower/config.yaml`,
  `hermes-config/crazydave/config.yaml`
- Modify: `teach/reference/glossary.html`
- Modify: `docs/superpowers/specs/2026-09-09-stage3-ark-and-fizzy-design.md`

**Interfaces:**
- Consumes: the chat id and the three thread ids from Task 1.
- Produces: a group where an unnamed message reaches exactly one bot,
  and a named message reaches exactly the named bot. Task 6 tests a
  cross-domain request through this group.

- [ ] **Step 1: Write the mechanism section of Lesson 19.** Explain the
  gate order, because the reader must know why one key was chosen over
  another. The adapter checks, in order: `allowed_chats`, guest
  mention, `free_response_chats`, `free_response_topics`,
  `require_mention`, reply to the bot, mention, mention patterns.

  Two consequences follow. A topic listed in `free_response_topics`
  answers before the mention requirement applies. A topic listed in
  `ignored_threads` is dropped before every one of those checks, so an
  ignored topic blocks mentions too. State that this plan uses
  `free_response_topics` and never uses `ignored_threads`.

- [ ] **Step 2: Write the configuration section of Lesson 19.** Give
  the exact edit. The existing block in each file is two lines:

```yaml
telegram:
  reactions: false
  allowed_chats: ''
```

  The new block for Peashooter, where `-1001234567890` is the chat id
  from Task 1 and `3` is the thread id of #Coding:

```yaml
telegram:
  reactions: false
  allowed_chats: ''
  require_mention: true
  exclusive_bot_mentions: true
  free_response_topics:
    - "-1001234567890:3"
```

  The block for Sunflower differs only in the thread id, which is the
  thread id of #Planning:

```yaml
telegram:
  reactions: false
  allowed_chats: ''
  require_mention: true
  exclusive_bot_mentions: true
  free_response_topics:
    - "-1001234567890:4"
```

  The block for Crazy Dave uses the General topic, which is thread `1`:

```yaml
telegram:
  reactions: false
  allowed_chats: ''
  require_mention: true
  exclusive_bot_mentions: true
  free_response_topics:
    - "-1001234567890:1"
```

  State two rules about the value. Quote the entry, because an unquoted
  value that starts with a minus sign and contains a colon is ambiguous
  in YAML. Leave `allowed_chats` empty, because a non-empty
  `allowed_chats` becomes a second gate that the group must also pass.

- [ ] **Step 3: Ask the user to edit the three files** and to restart
  the three gateways. Give the commands:

```bash
hermes gateway restart --profile peashooter
hermes gateway restart --profile sunflower
hermes gateway restart --profile crazydave
```

  If `hermes gateway restart` does not exist on this machine, the
  equivalent pair is `hermes gateway stop --profile <name>` followed by
  `hermes gateway start --profile <name>`. Ask the user to report the
  output of whichever command they run.

- [ ] **Step 4: Ask the user to run test 1.** Post `hello` in #Coding
  with no mention. Expected: Peashooter answers, and no other bot
  answers. Ask for a screenshot or for the text of every reply.

- [ ] **Step 5: Ask the user to run test 2.** Post `@<sunflower_bot>
  hello` in #Coding. Expected: Sunflower answers, and no other bot
  answers. This tests `exclusive_bot_mentions`.

- [ ] **Step 6: Ask the user to run test 3.** Post `hello` in
  #Planning. Expected: Sunflower answers, and Peashooter stays silent.

- [ ] **Step 7: Ask the user to run test 4.** Send a direct message to
  each of the three bots. Expected: each bot answers exactly as it did
  before this task. This is the regression check for the promise that
  direct messages stay unchanged.

- [ ] **Step 8: If any test fails, diagnose from real evidence.** Do not
  guess. The three diagnostic commands, in order:

```bash
hermes gateway logs --profile peashooter --lines 100
grep -A8 '^telegram:' ~/.hermes/profiles/peashooter/config.yaml
env | grep TELEGRAM_
```

  Two known failure shapes. Silence for an unnamed message with a
  correct configuration points at BotFather group privacy, which Task 1
  step 2 covers. An answer from every bot to one unnamed message points
  at `require_mention` not reaching the adapter, which the second
  command shows.

  If a real defect appears, write a learning record numbered `0013` or
  later. State the root cause, the fix, and the generalization.

- [ ] **Step 9: Resolve risk 1 in the spec.** The planning pass verified
  the gate order in the adapter source. Replace the first bullet under
  "Risks / open questions" in
  `docs/superpowers/specs/2026-09-09-stage3-ark-and-fizzy-design.md`
  with a verified statement:

```markdown
- **Verified: `free_response_topics` overrides `require_mention`.** The
  group gate in `plugins/platforms/telegram/adapter.py` checks
  `free_response_topics` before it checks `require_mention`. The
  combination works. The key is undocumented, so
  `website/docs/user-guide/messaging/telegram.md` never names it.
```

- [ ] **Step 10: Add four glossary entries.** Insert them into
  `teach/reference/glossary.html` after the `Orchestrator profile`
  entry, matching the `<dt>`/`<dd>` pattern already used:

```html
  <dt>Forum topic</dt>
  <dd>A named sub-thread inside a Telegram supergroup. Telegram gives
  each topic a thread id. The General topic always has thread id
  <code>1</code>.</dd>

  <dt>Mention gating</dt>
  <dd>A group setting that keeps a bot silent until a message names it.
  In Hermes the key is <code>require_mention</code>. It applies to group
  chats only, never to direct messages.</dd>

  <dt>Free-response topic</dt>
  <dd>One entry of the form <code>&lt;chat_id&gt;:&lt;thread_id&gt;</code>
  that makes a profile answer unnamed messages in exactly one topic. The
  adapter checks this list before it checks mention gating, so one topic
  opens without opening the whole group.</dd>

  <dt>One-way mirror</dt>
  <dd>A copy of state that a second system displays but never feeds
  back. The copy can drift, and a drifted copy shows a stale view rather
  than causing a wrong action.</dd>
```

- [ ] **Step 11: Copy the three configuration files into the
  repository.** Never copy `.env` or `auth.json`.

```bash
for p in peashooter sunflower crazydave; do
  cp ~/.hermes/profiles/$p/config.yaml hermes-config/$p/config.yaml
done
grep -A8 '^telegram:' hermes-config/peashooter/config.yaml
```

  Expected: the `telegram:` block shows all six keys.

- [ ] **Step 12: Verify the HTML tag balance** of
  `teach/lessons/0019-one-topic-one-listener.html` and
  `teach/reference/glossary.html`, using the script from Task 1 step 5
  with those two paths.

- [ ] **Step 13: Commit.**

```bash
git add teach/lessons/0019-one-topic-one-listener.html \
        teach/reference/glossary.html \
        hermes-config/peashooter/config.yaml \
        hermes-config/sunflower/config.yaml \
        hermes-config/crazydave/config.yaml \
        docs/superpowers/specs/2026-09-09-stage3-ark-and-fizzy-design.md
git commit -m "Add Lesson 19: one topic, one default listener"
```

---

### Task 3: Crazy Dave answers the room (Lesson 20)

**Files:**
- Create: `teach/lessons/0020-dave-answers-the-room.html`
- Modify: `teach/lessons/0019-one-topic-one-listener.html` — the nav
  forward link, and test 4
- Modify: `teach/reference/glossary.html` — add "Silent non-routing"
- Modify: `~/.hermes/profiles/crazydave/SOUL.md` (the user runs this)
- Modify: `hermes-config/crazydave/SOUL.md` (the mirror)

**Interfaces:**
- Consumes: the live group from Task 1, and the three
  `free_response_topics` entries from Task 2. Task 2 test 4 leaves one
  kanban task whose body is the word `hello`.
- Produces: a Crazy Dave that replies in two named moments and files a
  task for every other message. Task 7 relies on this, because the
  end-to-end request in #General must still become a triage task.

- [ ] **Step 1: Archive the task Task 2 left on the board**

The user runs both commands and reports the output.

```bash
hermes kanban list
hermes kanban archive <task_id>
```

- [ ] **Step 2: Add two exceptions to `SOUL.md`**

The user pastes this text directly after the dispatched-work exception
and directly before the line that begins `HARD RULE`.

```
Exception — small talk: a message that only greets, thanks, or
acknowledges, and asks for nothing. Reply in one short sentence. Do not
create a task.

Exception — board questions: a message about the board and the tasks on
it. This covers their status, their content, their assignees, what
happened inside them, how they group, and which of them look wrong. Read
the board, then answer from what you read. Give your own judgement when
the message asks for one. Do not create a task.

Two limits on this exception. The message must be about the board: a
request to build, write, fix, or plan something new is not a board
question, even when it mentions the board. Answering must change
nothing: if the message asks you to archive, edit, close, assign, or run
anything, the HARD RULE applies.
```

- [ ] **Step 3: Correct the exception count**

The personality line ends "except for the two exceptions above". Change
it to read:

```
Personality: brief. Confirm the task id was created, nothing more —
except for the four exceptions above.
```

- [ ] **Step 4: Check clause order before restarting**

Run: `grep -n 'Exception —\|HARD RULE, not a suggestion' ~/.hermes/profiles/crazydave/SOUL.md`
Expected: four lines, with `HARD RULE` last. If `HARD RULE` is not last,
an exception landed below it and must move up.

- [ ] **Step 5: Restart the Crazy Dave gateway**

```bash
hermes gateway restart -p crazydave
```

- [ ] **Step 6: Run five tests in #General**

The user posts each message and runs `hermes kanban list` after each one.

1. `thanks` — expect one short reply and no new task.
2. `what is on the board right now` — expect an answer naming real tasks
   and no new task. This tests the status half of the clause.
3. Reply to that answer with `which of those is not real engineering
   work` — expect a named task, a reason for the call, and no new task.
   This tests the judgement half of the clause.
4. `@your_peashooter_bot say hello back`, then wait 30 seconds after
   Peashooter replies — expect no reply from Crazy Dave and no new task.
   This measures whether one bot's message reaches another bot.
5. `write a one page spec for a habit tracker` — expect one new triage
   task and no direct answer. This is the regression check.

If test 5 produces a chat reply, the edit reintroduced silent
non-routing. Stop and correct the wording before Task 5.

- [ ] **Step 7: Write the lesson**

Create `teach/lessons/0020-dave-answers-the-room.html`. It carries two
knowledge boxes, one skill box, one amber box, one quiz, a checkpoint,
and the nav. The first knowledge box states that this is the fourth
correction to one file and cites learning record 0009. The second states
why an enumerated set of moments replaces a judgment about message kind,
and defines silent non-routing.

- [ ] **Step 8: Repoint the neighbouring navigation**

`teach/lessons/0019-one-topic-one-listener.html` forward link becomes
Lesson 20. `teach/lessons/0022-fizzy-the-visible-board.html` back link
becomes Lesson 21, which Task 4 creates.

- [ ] **Step 9: Add the glossary entry**

Add "Silent non-routing" to `teach/reference/glossary.html`, before the
"One-way mirror" entry, with `Introduced in: Lesson 20`.

- [ ] **Step 10: Verify tag balance and links**

Run the script from Task 1 step 5 over every file in `teach/lessons/`
and `teach/reference/glossary.html`.
Expected: all balanced, and no missing local link.

- [ ] **Step 11: Mirror and commit**

```bash
cp ~/.hermes/profiles/crazydave/SOUL.md hermes-config/crazydave/SOUL.md
git add teach/lessons/0020-dave-answers-the-room.html \
        teach/lessons/0019-one-topic-one-listener.html \
        teach/lessons/0022-fizzy-the-visible-board.html \
        teach/reference/glossary.html \
        hermes-config/crazydave/SOUL.md
git commit -m "Add Lesson 20: Crazy Dave answers the room"
```

---

### Task 4: Crazy Dave maintains the board (Lesson 21)

**Files:**
- Create: `teach/lessons/0021-the-exception-that-changes-something.html`
- Create: `teach/learning-records/0015-the-line-between-work-and-maintenance.md`
- Modify: `teach/lessons/0020-dave-answers-the-room.html` forward link
- Modify: `teach/lessons/0022-fizzy-the-visible-board.html` back link
- Modify: `~/.hermes/profiles/crazydave/SOUL.md` (the user runs this edit)

**Interfaces:**
- Consumes: the five exceptions and the personality line from Task 3.
- Produces: a Crazy Dave that runs `hermes kanban archive` itself, which
  Task 7 relies on when the end-to-end check leaves junk on the board.

- [ ] **Step 1: Read the two functions before writing the clause**

Run these two commands and read the output. Every limit in step 3 comes
from one of them.

```bash
sed -n '5542,5566p' ~/.hermes/hermes-agent/hermes_cli/kanban_db.py
sed -n '5092,5125p' ~/.hermes/hermes-agent/hermes_cli/kanban_db.py
```

Expected, and all four are load bearing: `archived` is terminal because
`promote_task` accepts only `todo` or `blocked`, the update clears
`claim_lock` and closes the run with outcome `reclaimed`, `archive_task`
calls `recompute_ready` so an archived parent releases its children, and
`--rm` calls `delete_archived_task`.

- [ ] **Step 2: Replace the second limit of the board questions exception**

The user replaces the second half of the paragraph that begins "Two
limits on this exception":

```
Answering must change nothing: if the message asks you to edit,
complete, assign, block, or unblock a task, the HARD RULE applies.
Archiving is the one change you make yourself, and the next exception
covers it.
```

- [ ] **Step 3: Add the board maintenance exception**

The user pastes this text after the board questions exception and above
the line that begins `HARD RULE`:

```
Exception — board maintenance: a message that asks you to remove,
archive, or cancel tasks that are already on the board. Archive them
yourself with the command below. Do not create a task for it.

hermes kanban archive <task_id> <task_id>

Four limits on this exception. Say every task id and title you are about
to archive, then run the command, then report what changed. If the
message does not tell you which tasks it means, ask which ones and
archive nothing. Never run hermes kanban archive --rm, because that
deletes a task permanently. Run hermes kanban show <task_id> on each
id first: if the output has a children line, archive nothing and say so,
because archiving a parent releases its children to run.
```

- [ ] **Step 4: Correct the exception count**

The personality line says four. It becomes:

```
Personality: brief. Confirm the task id was created, nothing more —
except for the five exceptions above.
```

- [ ] **Step 5: Check clause order, restart, and reset**

```bash
grep -n 'Exception —\|HARD RULE, not a suggestion' ~/.hermes/profiles/crazydave/SOUL.md
hermes gateway restart -p crazydave
```

Expected: six lines, with `HARD RULE, not a suggestion` last. The user
then sends `/new` in the direct chat and in #General.

- [ ] **Step 6: Run four tests in #General**

1. `which tasks on the board are noise` — expect named ids and no new
   task. This repeats Task 3 and proves it still works.
2. `can you remove it?` with no id — expect a question back and nothing
   archived. This is the message that produced `t_bc7c0f90`.
3. Two specific ids — expect both ids and titles in the reply, both gone
   from `hermes kanban list`, both present in
   `hermes kanban list --archived`, and no new task.
4. `write a one page spec for a habit tracker` — expect one triage task
   and no direct answer. This is the regression check.

If test 2 archives anything, stop and tighten the ambiguity limit before
Task 5.

- [ ] **Step 7: Write the lesson and the learning record**

Create `teach/lessons/0021-the-exception-that-changes-something.html`
with two knowledge boxes, one skill box, two amber boxes, two quizzes, a
checkpoint, and the nav. Create
`teach/learning-records/0015-the-line-between-work-and-maintenance.md`,
which records why the read against write boundary was wrong and why the
ownership boundary replaces it.

- [ ] **Step 8: Repoint the neighbouring navigation**

`teach/lessons/0020-dave-answers-the-room.html` forward link becomes
Lesson 21. `teach/lessons/0022-fizzy-the-visible-board.html` back link
becomes Lesson 21.

- [ ] **Step 9: Verify tag balance and links**

Run the script from Task 1 step 5 over every file in `teach/lessons/`
and `teach/reference/glossary.html`.
Expected: all balanced, and no missing local link.

- [ ] **Step 10: Mirror and commit**

```bash
cp ~/.hermes/profiles/crazydave/SOUL.md hermes-config/crazydave/SOUL.md
git add teach/lessons/0021-the-exception-that-changes-something.html \
        teach/learning-records/0015-the-line-between-work-and-maintenance.md \
        teach/lessons/0020-dave-answers-the-room.html \
        teach/lessons/0022-fizzy-the-visible-board.html \
        hermes-config/crazydave/SOUL.md
git commit -m "Add Lesson 21: Crazy Dave maintains the board"
```

---

### Task 5: Fizzy, the visible board

**Files:**
- Create: `teach/lessons/0022-fizzy-the-visible-board.html`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: a working `fizzy` binary, one authenticated profile named
  `crazydave`, one board id, and the exact name of the field that holds
  a new card's identifier. Task 5 writes all four into Crazy Dave's
  `SOUL.md`.

- [ ] **Step 1: Write the framing section of Lesson 22.** State the job
  Fizzy does and the job it does not do. Fizzy shows the board on a
  phone. Fizzy never routes work, and no agent reads Fizzy to decide
  anything. The Hermes kanban board stays the only source of truth.

  Name the cost honestly. The hosted free tier allows 1,000 cards.
  Reports state that a deleted card still counts against that limit, so
  test cards consume the limit permanently. The paid tier costs 20 US
  dollars per month.

- [ ] **Step 2: Write the installation section of Lesson 22.**

```bash
brew install --cask basecamp/tap/fizzy
fizzy --version
```

  Note the upgrade case for a reader who already has the old formula.
  Version 3.x was the `fizzy-cli` formula in the `robzolkos/fizzy-cli`
  tap. The cask will not overwrite a symlink that the formula owns, so
  the old formula must be unlinked first:

```bash
brew tap basecamp/tap
brew unlink fizzy-cli
brew install --cask basecamp/tap/fizzy
brew uninstall --formula --force fizzy-cli
brew untap robzolkos/fizzy-cli
```

- [ ] **Step 3: Write the account section of Lesson 22.** Create a
  hosted account at `https://www.fizzy.do/`. Create one board named
  `plants`. Create a personal access token in the account settings.

- [ ] **Step 4: Ask the user to authenticate and to report the output.**

```bash
fizzy auth login "$FIZZY_TOKEN" --profile crazydave
fizzy auth status
```

  If `fizzy auth login` reports that it needs an account, the account id
  comes from the same settings page and the command becomes
  `fizzy auth login "$FIZZY_TOKEN" --profile crazydave --account <id>`.

- [ ] **Step 5: Ask the user to report the board id.**

```bash
fizzy board list --profile crazydave
```

  Expected: JSON that contains one board named `plants`. Record its
  `id`. Task 5 writes that value into `SOUL.md`.

- [ ] **Step 6: Ask the user to create one probe card and to report the
  full JSON.** The exact field that holds a new card's identifier is not
  documented in the repository files read during planning. This step
  finds it from real output rather than guessing:

```bash
fizzy card create --profile crazydave --board <BOARD_ID> \
  --title "probe: identifier field" \
  --description "Created to learn which JSON field addresses a card."
```

  Read the reported JSON. Record the field that later commands accept as
  a card address. Confirm it with the two commands that Task 5 uses:

```bash
fizzy comment create --profile crazydave --card <VALUE> --body "probe comment"
fizzy card close --help
```

  The second command shows whether `fizzy card close` takes the card as
  a positional argument or as a flag. Record the real form.

- [ ] **Step 7: Ask the user to close the probe card** using the form
  found in step 6, and to confirm on the Fizzy web interface that the
  card is closed and carries the comment.

- [ ] **Step 8: Write the findings back into Lesson 22.** Replace the
  placeholder `<BOARD_ID>` and `<VALUE>` in the lesson text with the
  real board id and the real field name. The lesson must contain the
  commands that actually ran.

- [ ] **Step 9: Verify the HTML tag balance** of
  `teach/lessons/0022-fizzy-the-visible-board.html`, using the script
  from Task 1 step 5.

- [ ] **Step 10: Commit.**

```bash
git add teach/lessons/0022-fizzy-the-visible-board.html
git commit -m "Add Lesson 22: Fizzy, the visible board"
```

---

### Task 6: Crazy Dave writes the card

**Files:**
- Create: `teach/lessons/0023-crazy-dave-writes-the-card.html`
- Modify: `~/.hermes/profiles/crazydave/SOUL.md`
- Modify: `hermes-config/crazydave/SOUL.md`

**Interfaces:**
- Consumes: the board id, the card identifier field, and the real
  `fizzy card close` form from Task 5.
- Produces: a Crazy Dave that creates a Fizzy card on filing a root
  task, and closes that card on completing a root task. Task 6 tests
  both moments in one run.

- [ ] **Step 1: Write the risk section of Lesson 23 first.** Learning
  record `0009` states that a hard rule written for one input channel
  breaks on the second channel. Crazy Dave's `SOUL.md` has already been
  corrected three times for exactly that shape. This task adds a fourth
  rule to the same file.

  State the mitigation in the wording itself. Each new rule names the
  moment it applies to, not the message it saw. "On filing a root task"
  and "on completing a root task" are moments. "Every message" is not.

- [ ] **Step 2: Write the two new `SOUL.md` clauses.** These go after
  the dispatched-work exception that learning record `0009` added, and
  before the personality line. Replace `<BOARD_ID>` with the real board
  id from Task 5, and replace the `fizzy card close` form with the real
  one:

```
Fizzy mirror — you own it, and you never read it.

On filing a root kanban task: after the task exists, run
  fizzy card create --profile crazydave --board <BOARD_ID> --title "<the user's request, one line>"
Read the card identifier from the output. Add a comment on the kanban
task with the exact text fizzy:<identifier> and nothing else.

On completing a root kanban task: read the fizzy:<identifier> comment
from that task. Then run
  fizzy comment create --profile crazydave --card <identifier> --body "<your summary>"
  fizzy card close <identifier>

Never run any other fizzy command. Never read a Fizzy card to decide
anything. The kanban board is the only source of truth.

If a fizzy command fails, say so in your reply and continue. A failed
fizzy command never blocks the kanban task and never changes what you
do next.
```

- [ ] **Step 3: Ask the user to save the file** at
  `~/.hermes/profiles/crazydave/SOUL.md` and to report the result of:

```bash
grep -n 'fizzy' ~/.hermes/profiles/crazydave/SOUL.md
```

  Expected: four command lines are present, one each for
  `fizzy card create`, `fizzy comment create`, `fizzy card close`, and
  the `fizzy:<identifier>` comment text. Read the reported lines and
  confirm all four. A missing line means the paste was truncated.

- [ ] **Step 4: Ask the user to restart Crazy Dave's gateway** so the
  new `SOUL.md` loads:

```bash
hermes gateway restart --profile crazydave
```

- [ ] **Step 5: Ask the user to run the single-moment test.** Send one
  simple request in #General, for example `write a haiku about
  descriptors`. Expected: Crazy Dave files a kanban task, creates one
  Fizzy card, and adds a `fizzy:<identifier>` comment on the task.

  Verify from real output, not from Crazy Dave's report:

```bash
hermes kanban list
hermes kanban show <task_id>
fizzy card list --profile crazydave --board <BOARD_ID>
```

  The `hermes kanban show` output must contain the `fizzy:` comment. The
  `fizzy card list` output must contain one card with the same title.

- [ ] **Step 6: Copy `SOUL.md` into the repository.**

```bash
cp ~/.hermes/profiles/crazydave/SOUL.md hermes-config/crazydave/SOUL.md
```

- [ ] **Step 7: Verify the HTML tag balance** of
  `teach/lessons/0023-crazy-dave-writes-the-card.html`, using the script
  from Task 1 step 5.

- [ ] **Step 8: Commit.**

```bash
git add teach/lessons/0023-crazy-dave-writes-the-card.html \
        hermes-config/crazydave/SOUL.md
git commit -m "Add Lesson 23: Crazy Dave writes the Fizzy card"
```

---

### Task 7: The Stage 3 end-to-end check

**Files:**
- Create: `teach/lessons/0024-the-stage3-end-to-end-check.html`

**Interfaces:**
- Consumes: the routing from Task 2, the reply moments from Task 3, and
  the mirror from Task 6.
- Produces: evidence for all six success criteria in the spec.

- [ ] **Step 1: Write Lesson 24.** State the request the reader sends,
  and state what each of the seven criteria proves. Use a request that
  genuinely needs both specialists, so `decompose` produces at least two
  children with different assignees. An example that worked in Stage 2
  is a small game with a written specification first, then an
  implementation, then a test run.

- [ ] **Step 2: Ask the user to send one cross-domain request in
  #General.** Ask for the exact text they sent, so later verification
  matches the real input.

- [ ] **Step 3: Verify the card was created.**

```bash
fizzy card list --profile crazydave --board <BOARD_ID>
```

  Expected: one new card whose title matches the request.

- [ ] **Step 4: Verify the decomposition.**

```bash
hermes kanban list
```

  Expected: one root task assigned to `crazydave`, and two or more child
  tasks assigned to `peashooter` or `sunflower`.

- [ ] **Step 5: Wait for the run and collect the reports.** Ask the user
  for the text of every Telegram message the bots sent, and for the
  topic or chat each one arrived in. Do not accept a summary. Learning
  record `0011` states that a report can be true when sent and wrong
  later, so each claim needs its own check below.

- [ ] **Step 6: Verify the closing half of the mirror.**

```bash
hermes kanban list
fizzy card list --profile crazydave --board <BOARD_ID>
```

  Expected: the root task reads `done`, and the Fizzy card is closed and
  carries a summary comment.

- [ ] **Step 7: Verify any claim the bots made about a running
  service.** If any report claims that a server or a URL is live, check
  the structure that keeps the claim true, not the claim itself:

```bash
lsof -p <pid>
```

  Expected: file descriptors 1 and 2 both open to a real file. Learning
  record `0011` records why a passing HTTP check predicts nothing.

- [ ] **Step 8: Score the seven criteria.** Write the result of each
  criterion into Lesson 24, with the real output that supports it. A
  criterion met by a different mechanism than the spec names is recorded
  as such, not as a plain pass.

- [ ] **Step 9: Write a learning record for every real defect found.**
  Continue the numbering from the highest record written so far. Each
  record states the root cause, the fix, and the generalization.

- [ ] **Step 10: Verify the HTML tag balance** of
  `teach/lessons/0024-the-stage3-end-to-end-check.html`, using the
  script from Task 1 step 5.

- [ ] **Step 11: Commit.**

```bash
git add teach/lessons/0024-the-stage3-end-to-end-check.html \
        teach/learning-records/
git commit -m "Add Lesson 24: the Stage 3 end-to-end check"
```

---

### Task 8: Stage 3 completion record

**Files:**
- Create: `teach/learning-records/<next number>-stage3-complete.md`
- Modify: `docs/superpowers/specs/2026-09-09-stage3-ark-and-fizzy-design.md:3`

**Interfaces:**
- Consumes: the scored criteria from Task 7.
- Produces: the closing record for Stage 3.

- [ ] **Step 1: Write the completion record,** following the shape of
  `teach/learning-records/0012-stage2-complete.md`. Four sections: the
  criteria and their evidence, any criterion met by a different
  mechanism, what the stage cost in lessons and records, and a
  generalization.

  The generalization must come from the real run, not from this plan. A
  candidate to test against the evidence: Stage 2 found bugs in the
  seams between parts, and Stage 3 added a second room and a second
  system, so it is the first stage where a message has more than one
  correct destination.

- [ ] **Step 2: Update the spec status.** Replace line 3 of
  `docs/superpowers/specs/2026-09-09-stage3-ark-and-fizzy-design.md`:

```markdown
**Status:** Complete (<date>) — all six success criteria verified in one
run. See learning record <number>.
```

  If a criterion was met by a different mechanism than the spec names,
  say so in the status, as the Stage 2 spec does.

- [ ] **Step 3: Commit.**

```bash
git add teach/learning-records/ \
        docs/superpowers/specs/2026-09-09-stage3-ark-and-fizzy-design.md
git commit -m "Record Stage 3 as complete"
```
