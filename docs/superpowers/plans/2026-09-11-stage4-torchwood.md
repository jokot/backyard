# Stage 4 Implementation Plan: Torchwood and the roster pattern

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fourth Hermes profile named `torchwood` that interviews the user in one Telegram topic and emits one finished prompt as text, and record the six decisions that every later specialist needs.

**Architecture:** Torchwood is a fourth gateway with its own bot token, bound to a new topic in the Ark group by one `free_response_topics` entry. Torchwood reads files and writes none. The section list of the prompt lives in `TEMPLATE.md`, which the user edits, and the verification rule lives in `SOUL.md`, which the template cannot remove. Each of the five lessons writes one row of the reference document as a numbered step.

**Tech Stack:** Hermes Agent CLI (profiles, gateway, kanban), Telegram supergroup Topics, the `teach` skill lesson format (one self-contained HTML file for each hands-on step).

**Spec:** `docs/superpowers/specs/2026-09-11-stage4-torchwood-and-the-roster-pattern-design.md`

## Global Constraints

- The user runs every mutating command in their own terminal or in the
  Telegram application. Never run a mutating command for them. The goal
  is the learning of the user, not a finished system.
- Never assert a diagnosis without real command output or real Hermes
  source. Quote the output that supports the claim.
- Every real bug gets a fix plus a learning record. Never a workaround.
- Lessons continue at `0025`. Learning records continue at `0022`.
- Lesson HTML must have balanced tags. Verify the balance before each
  commit.
- Lesson prose and commit messages follow the STE-flavored style of
  lessons `0001` through `0024`.
- After an edit to a real file under `~/.hermes/profiles/torchwood/`,
  copy the file into `hermes-config/torchwood/`. Never copy `.env`,
  `auth.json`, `channel_directory.json`, `memories/USER.md`, or
  `memories/MEMORY.md`. Those files hold live secrets or private notes.
- Each commit carries the lesson file, any learning record, and the
  mirrored configuration file together.
- End each commit message with
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

## Verified facts

Each fact below comes from a command run during planning, or from a file
read during planning. None comes from memory.

- **`hermes profile create --clone` copies `.env`.** The help text of
  `hermes profile create` reads: "Copy config.yaml, .env, SOUL.md, and
  skills from active profile". The `.env` file of Peashooter holds a
  live `TELEGRAM_BOT_TOKEN`. A clone that keeps that token gives
  Torchwood the bot identity of Peashooter.
- **`hermes gateway restart --profile <name>` does not exist.** The help
  text of `hermes gateway restart` lists only `--system` and `--all`.
  Profile selection uses the global flag `-p`, as in
  `hermes -p torchwood gateway restart`. A wrapper script also works.
  The file `/Users/jokot/.local/bin/peashooter` contains
  `exec /Users/jokot/.local/bin/hermes -p peashooter "$@"`, so
  `hermes profile create` writes one wrapper for each profile.
- **The gateway log does not carry the Telegram thread id.** The string
  `thread=` in `~/.hermes/profiles/peashooter/logs/agent.log` names a
  Python thread, as in `thread=Thread-6 (process_loop):6281949184`. The
  reliable source is the Telegram Web address bar, which Lesson 18
  already documents.
- **A new topic does not always take the next thread id.** Telegram
  derives a thread id from the message id of the topic creation message.
  Threads `1`, `2` and `3` exist today. The new topic may take a larger
  number. Read the number. Never assume it.
- **The three telegram blocks sit near line 457 of each
  `config.yaml`.** Crazy Dave uses line 457, Peashooter and Sunflower
  use line 459.
- **Current models.** Crazy Dave runs `openai/gpt-5.6-luna`, Peashooter
  runs `deepseek/deepseek-v4-flash-0731`, Sunflower runs
  `z-ai/glm-5.3-flash`.
- **The bundled `brainstorming` skill writes files.** Line 100 of
  `~/.hermes/profiles/peashooter/skills/brainstorming/SKILL.md` writes a
  design document to `docs/superpowers/specs/`. Line 103 invokes the
  `writing-plans` skill. Torchwood must not use this skill.
- **The bundled `ste-writing` skill writes no file.** It rewrites prose
  only. Torchwood may use it.
- **`hermes kanban decompose <task_id>` decomposes one task.** The
  command `hermes kanban assignees` lists the profiles that the board
  can assign work to.
- **All three profiles run `auto_decompose: true`** with
  `auto_decompose_per_tick: 3` and `dispatch_interval_seconds: 60`.

## File structure

| File | Responsibility |
|---|---|
| `teach/lessons/0025-a-fourth-bot-of-its-own.html` | Profile creation, the token replacement, the model choice |
| `teach/lessons/0026-a-topic-for-prompts.html` | The new topic, its thread id, the three telegram keys |
| `teach/lessons/0027-a-description-that-refuses-work.html` | The routing description, and the test that proves it |
| `teach/lessons/0028-limits-that-live-in-the-soul.html` | The four limits and the `Checked:` trailer rule |
| `teach/lessons/0029-the-template-is-the-skeleton.html` | `TEMPLATE.md`, overrides, and the first real prompt |
| `teach/reference/adding-a-specialist.html` | Six rows, one for each decision a specialist needs |
| `hermes-config/torchwood/config.yaml` | Mirror of the live model and topic binding |
| `hermes-config/torchwood/profile.yaml` | Mirror of the routing description |
| `hermes-config/torchwood/SOUL.md` | Mirror of the identity and the limits |
| `hermes-config/torchwood/TEMPLATE.md` | Mirror of the prompt skeleton |
| `teach/learning-records/0022-*.md` and later | One record for each real defect found |
| `teach/NOTES.md` | One line for each generalization |

---

### Task 1: A fourth bot of its own (Lesson 25)

**Files:**
- Create: `teach/lessons/0025-a-fourth-bot-of-its-own.html`
- Create: `teach/reference/adding-a-specialist.html`
- Modify: `teach/lessons/0024-the-stage3-end-to-end-check.html:178`
- Create (by the user): `~/.hermes/profiles/torchwood/`
- Create: `hermes-config/torchwood/config.yaml`

**Interfaces:**
- Consumes: the three existing profiles, and the Ark group from Stage 3.
- Produces: a profile named `torchwood` that runs
  `openai/gpt-5.6-luna` and holds a Telegram bot token that no other
  profile holds. Task 2 binds that bot to a topic.

- [ ] **Step 1: Write the reason section of Lesson 25.** State what
  Torchwood is for in three sentences. A prompt that names no
  destination loses its artifact, which learning record 0018 records. A
  specification that passes review with `tests_run: 0` states a formula
  that cannot work, which learning record 0016 records. Torchwood
  interviews the user, then writes a prompt that names the destination
  and the checks.

  State the limit in the same section. Torchwood produces text. It
  writes no file, and it accepts no kanban task.

- [ ] **Step 2: Write the BotFather section of Lesson 25.** Give the
  exact steps:

  1. Open a chat with `@BotFather`.
  2. Send `/newbot`. Give a display name and a username. The username
     must end in `bot`.
  3. Copy the token that BotFather returns. The token has the shape
     `1234567890:AA...`.
  4. Send `/mybots`, choose the new bot, choose `Bot Settings`, choose
     `Group Privacy`, choose `Turn off`.

  Explain the privacy step in one sentence. A bot with group privacy
  enabled receives only messages that name it, so a default listener
  never sees an unnamed message. Lesson 18 records the same rule.

- [ ] **Step 3: Write the profile creation section of Lesson 25.** Give
  the command:

```bash
hermes profile create torchwood --clone-from peashooter
```

  Then state the trap in full, because this is the one command in Stage
  4 with a real cost. Quote the help text:

  > Copy config.yaml, .env, SOUL.md, and skills from active profile

  Explain the consequence. The `.env` file of Peashooter holds a live
  `TELEGRAM_BOT_TOKEN`. Torchwood now holds the same token. Two
  gateways then poll Telegram for the same bot, and each update reaches
  one of the two at random.

- [ ] **Step 4: Write the token replacement section of Lesson 25.**
  Give the edit as its own numbered step, never as part of profile
  creation:

```bash
hermes config env-path -p torchwood
```

  That command prints the path of the `.env` file of Torchwood. Tell the
  reader to open that file and to replace the value of
  `TELEGRAM_BOT_TOKEN` with the token from step 2.

  Give the check that prints no token:

```bash
grep -c '^TELEGRAM_BOT_TOKEN=' "$(hermes config env-path -p torchwood)"
```

  Expected: `1`. A count of `2` means the file holds two lines for the
  same key, and the last line wins. Tell the reader to delete the older
  line.

- [ ] **Step 5: Write the memory reset section of Lesson 25.** The help
  text lists four things the clone copies. It copies a fifth. Learning
  record 0005 found Peashooter carrying notes about an unrelated Go
  project after a clone, because `--clone-from` also copies
  `memories/MEMORY.md` and `memories/USER.md`.

  Give the command:

```bash
hermes -p torchwood memory reset --yes --target memory
```

  State why the target is `memory` and not `all`. The file `MEMORY.md`
  holds facts about the work of Peashooter, which are false for
  Torchwood. The file `USER.md` holds facts about the user, which stay
  true across every agent.

  Give the check:

```bash
ls -l ~/.hermes/profiles/torchwood/memories/
```

  Expected: `USER.md` present and `MEMORY.md` absent. The reset deletes
  the file rather than emptying it. Do not check this with `wc -c`,
  which reports an error for a missing file and reads like a failure.
  Learning record 0022 records that correction.

  State the expected first conversation in the same lesson. The clone
  copies `SOUL.md`, so the new bot answers `Peashooter` when asked who
  it is. Name Lesson 28 as the lesson that replaces the file. Name
  `free_response_topics` as the second carry-over, and tell the reader
  not to install the gateway as a service until Lesson 26.

- [ ] **Step 6: Write the model section of Lesson 25.** Give the
  command:

```bash
hermes -p torchwood config set model.default openai/gpt-5.6-luna
```

  State the reason in two sentences. Every failure this design guards
  against is a failure to follow an instruction, such as a path that no
  command confirmed or a missing trailer. The daily volume is about five
  interviews, so the stronger model costs little.

  Give the check:

```bash
hermes -p torchwood config get model.default
```

  Expected: `openai/gpt-5.6-luna`.

- [ ] **Step 7: Write the reference document.** Create
  `teach/reference/adding-a-specialist.html`. Link
  `../assets/style.css`, and match the structure of
  `teach/reference/glossary.html`. The document holds one table with
  these column headings: `Decision`, `Where it lives`, `Torchwood`,
  `Trap`.

  Write two rows now. Write no empty row for a later lesson, because an
  empty row is a checkpoint that no numbered step supports, which
  learning record 0019 records.

  Row 1:

```html
<tr>
  <td>Bot credentials</td>
  <td><code>.env</code>, key <code>TELEGRAM_BOT_TOKEN</code></td>
  <td>A token from <code>/newbot</code>, with group privacy turned off</td>
  <td><code>--clone-from</code> copies <code>.env</code>, so the new
      profile wears the identity of the old one. Replace the token as a
      separate step. The same flag also copies <code>memories/</code>,
      so run <code>memory reset --target memory</code>.</td>
</tr>
```

  Row 2:

```html
<tr>
  <td>Model</td>
  <td><code>config.yaml</code>, key <code>model.default</code></td>
  <td><code>openai/gpt-5.6-luna</code></td>
  <td>A flash model is the wrong economy when every failure is a
      failure to follow an instruction.</td>
</tr>
```

- [ ] **Step 8: Add the forward navigation link.** Replace the empty
  `<span></span>` on line 178 of
  `teach/lessons/0024-the-stage3-end-to-end-check.html`:

```html
  <span><a href="0025-a-fourth-bot-of-its-own.html">Lesson 25 →</a></span>
```

- [ ] **Step 9: Verify the HTML tag balance of all three files.**

```bash
python3 - <<'EOF'
import re, sys
for p in ["teach/lessons/0025-a-fourth-bot-of-its-own.html",
          "teach/lessons/0024-the-stage3-end-to-end-check.html",
          "teach/reference/adding-a-specialist.html"]:
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

  Expected: three lines, each ending in `balanced`.

- [ ] **Step 10: Ask the user to run Lesson 25** and to report the output
  of the six commands in steps 3 through 6.

- [ ] **Step 11: Verify the reported output.** The profile creation
  command must report a new profile and a new wrapper script. The `grep`
  must print `1`. The `ls -l` must show `USER.md` and no `MEMORY.md`. The
  `config get` must print `openai/gpt-5.6-luna`. If
  any output differs, find the cause in the Hermes source or in the
  command output before you propose a fix. Never guess.

- [ ] **Step 12: Mirror the configuration file.**

```bash
mkdir -p hermes-config/torchwood
cp ~/.hermes/profiles/torchwood/config.yaml hermes-config/torchwood/config.yaml
grep -c 'gpt-5.6-luna' hermes-config/torchwood/config.yaml
```

  Expected: `1`. A count of `0` means the copy never ran.

- [ ] **Step 13: Confirm the mirror holds no secret.**

```bash
grep -nE '^[A-Z_]+=.+' hermes-config/torchwood/config.yaml || echo "no env-style assignment found"
```

  Expected: `no env-style assignment found`. The `.env` file must never
  reach the repository.

- [ ] **Step 14: Commit.**

```bash
git add teach/lessons/0025-a-fourth-bot-of-its-own.html \
        teach/lessons/0024-the-stage3-end-to-end-check.html \
        teach/reference/adding-a-specialist.html \
        hermes-config/torchwood/config.yaml
git commit -F - <<'MSG'
Add Lesson 25: a fourth bot of its own

Lesson 25 creates the torchwood profile and gives it a bot token that no
other profile holds. The clone command copies .env, so the lesson
replaces the token as a separate numbered step.

The lesson also creates the specialist reference document with its first
two rows.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

### Task 2: A topic for prompts (Lesson 26)

**Files:**
- Create: `teach/lessons/0026-a-topic-for-prompts.html`
- Modify: `teach/lessons/0025-a-fourth-bot-of-its-own.html` (the nav span)
- Modify: `teach/reference/adding-a-specialist.html` (one new row)
- Modify (by the user): `~/.hermes/profiles/torchwood/config.yaml`
- Modify: `hermes-config/torchwood/config.yaml`

**Interfaces:**
- Consumes: the `torchwood` profile from Task 1, and the Ark group id
  `-1004371805465`.
- Produces: a bot that answers an unnamed message in the Prompts topic
  and stays silent in threads 1, 2 and 3. Task 5 runs a real interview
  in that topic.

- [ ] **Step 1: Write the topic section of Lesson 26.** Give the
  Telegram steps:

  1. Open the Ark group. Open the topic list.
  2. Create a topic named `Prompts`.
  3. Add the new bot to the group.
  4. Promote the new bot to administrator.

  State the reason for administrator rights in one sentence. A bot that
  is not an administrator in a supergroup can miss messages that
  Telegram delivers only to administrators.

- [ ] **Step 2: Write the thread id section of Lesson 26.** State the
  rule first. Telegram derives a thread id from the message id of the
  topic creation message, so the new topic does not always take the next
  number after `3`.

  Give the method:

  - Open the `Prompts` topic in Telegram Web at
    `https://web.telegram.org/a/`.
  - Read the address bar. It shows `#-1004371805465_<N>`, where `<N>` is
    the thread id.
  - Write `<N>` in a note. Step 3 needs it.

  Add one warning. The gateway log does not hold this number. The string
  `thread=` in `logs/agent.log` names a Python thread, as in
  `thread=Thread-6 (process_loop):6281949184`.

- [ ] **Step 3: Write the configuration section of Lesson 26.** Give the
  exact edit to `~/.hermes/profiles/torchwood/config.yaml`, near line
  459. The cloned block reads:

```yaml
telegram:
  reactions: false
  allowed_chats: ''
  require_mention: true
  exclusive_bot_mentions: true
  free_response_topics:
    - "-1004371805465:2"
```

  The value `2` is the thread id of Peashooter, which arrived with the
  clone. The new block, where `<N>` is the thread id from step 2:

```yaml
telegram:
  reactions: false
  allowed_chats: ''
  require_mention: true
  exclusive_bot_mentions: true
  free_response_topics:
    - "-1004371805465:<N>"
```

  State two rules about the value. Quote the entry, because an unquoted
  value that starts with a minus sign and holds a colon is ambiguous in
  YAML. Leave `allowed_chats` empty, because a value there becomes a
  second gate that the group must also pass.

  State the consequence of the clone plainly. A reader who does not
  change this line gives Torchwood the topic of Peashooter, and two bots
  then answer the same unnamed message in thread 2.

- [ ] **Step 4: Write the restart section of Lesson 26.** Give the
  command:

```bash
hermes -p torchwood gateway restart
hermes -p torchwood gateway status
```

  Add the first-run case. A profile with no installed service reports
  `Gateway is not running`, and `restart` has nothing to act on. The
  install command starts the service in the same call:

```bash
hermes -p torchwood gateway install --start-now --start-on-login
```

  The other three profiles run as launchd user agents under
  `~/Library/LaunchAgents/ai.hermes.gateway-<profile>.plist`.

  Add the correction, because the reader may recall a different form
  from Stage 3. The command `hermes gateway restart --profile torchwood`
  does not exist. The help text of `hermes gateway restart` lists only
  `--system` and `--all`. Profile selection uses the global flag `-p`.
  The wrapper script `torchwood gateway restart` works the same way,
  because the wrapper runs `hermes -p torchwood "$@"`.

- [ ] **Step 5: Write the four tests of Lesson 26.** Give each test with
  its expected result:

  1. Post `hello` in `Prompts` with no mention. Expected: Torchwood
     answers, and no other bot answers.
  2. Post `hello` in `#Coding` with no mention. Expected: Peashooter
     answers, and Torchwood stays silent.
  3. Post `hello` in `#Planning` with no mention. Expected: Sunflower
     answers, and Torchwood stays silent.
  4. Post `hello` in `#General` with no mention. Expected: Crazy Dave
     answers, and Torchwood stays silent.

  Tell the reader that the reply in test 1 must arrive from the username
  created in Lesson 25. A reply from the Peashooter username means the
  token replacement in Lesson 25 step 4 never took effect.

- [ ] **Step 6: Add the row to the reference document.**

```html
<tr>
  <td>Topic binding</td>
  <td><code>config.yaml</code>, key
      <code>telegram.free_response_topics</code></td>
  <td><code>-1004371805465:&lt;N&gt;</code>, quoted</td>
  <td>A clone carries the topic of the source profile. Telegram does not
      always give the next thread number.</td>
</tr>
```

- [ ] **Step 7: Add the navigation links.** Add the forward link to
  Lesson 25 and the backward link in Lesson 26:

```html
  <span><a href="0026-a-topic-for-prompts.html">Lesson 26 →</a></span>
```

```html
  <span><a href="0025-a-fourth-bot-of-its-own.html">← Lesson 25</a></span>
```

- [ ] **Step 8: Verify the HTML tag balance of all three files.**

```bash
python3 - <<'EOF'
import re, sys
for p in ["teach/lessons/0026-a-topic-for-prompts.html",
          "teach/lessons/0025-a-fourth-bot-of-its-own.html",
          "teach/reference/adding-a-specialist.html"]:
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

  Expected: three lines, each ending in `balanced`.

- [ ] **Step 9: Ask the user to run Lesson 26** and to report the thread
  id, the restart output, and the result of all four tests.

- [ ] **Step 10: Verify the reported results.** All four tests must
  pass. A failure in test 1 with silence from every bot points at group
  privacy, which Lesson 25 step 2 covers. A failure where two bots
  answer points at a shared token or a shared thread id. Read
  `~/.hermes/profiles/torchwood/config.yaml` and compare the
  `free_response_topics` entry against the other three files before you
  state a cause.

- [ ] **Step 11: Mirror the configuration file.**

```bash
cp ~/.hermes/profiles/torchwood/config.yaml hermes-config/torchwood/config.yaml
grep -A2 free_response_topics hermes-config/torchwood/config.yaml
```

  Expected: the entry holds the thread id from step 2, not `2`.

- [ ] **Step 12: Commit.**

```bash
git add teach/lessons/0026-a-topic-for-prompts.html \
        teach/lessons/0025-a-fourth-bot-of-its-own.html \
        teach/reference/adding-a-specialist.html \
        hermes-config/torchwood/config.yaml
git commit -F - <<'MSG'
Add Lesson 26: a topic for prompts

Lesson 26 creates the Prompts topic and binds Torchwood to it with one
free_response_topics entry. The clone carries the topic of Peashooter,
so the lesson replaces that entry and tests all four topics.

The lesson records the thread id source. The Telegram Web address bar
holds the number. The gateway log does not.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

### Task 3: A description that refuses work (Lesson 27)

**Files:**
- Create: `teach/lessons/0027-a-description-that-refuses-work.html`
- Modify: `teach/lessons/0026-a-topic-for-prompts.html` (the nav span)
- Modify: `teach/reference/adding-a-specialist.html` (two new rows)
- Create: `hermes-config/torchwood/profile.yaml`

**Interfaces:**
- Consumes: the `torchwood` profile bound to its topic, from Task 2.
- Produces: a profile that the decomposer never chooses as an assignee.
  Task 4 relies on this, because `SOUL.md` states the same limit and the
  two must agree.

- [ ] **Step 1: Write the mechanism section of Lesson 27.** State how
  the decomposer chooses. The `description` in `profile.yaml` is the
  text the decomposer reads. All three existing profiles run
  `auto_decompose: true` with `auto_decompose_per_tick: 3`. A
  description that names prompt work therefore attracts prompt-shaped
  tasks.

  Give the precedent. Crazy Dave carries this description:

```
Template only — never a work destination. Do not assign kanban tasks here.
```

  That line is the Stage 2 fix that stopped work from reaching the
  coordinator.

- [ ] **Step 2: Write the command section of Lesson 27.**

```bash
hermes profile describe torchwood --text "Interactive prompt writing in the Prompts topic. Never a work destination. Do not assign kanban tasks here."
```

  One command does the whole job. Do not add
  `hermes config set description_auto false`. That command writes a key
  into `config.yaml`, and the router reads `profile.yaml`. Learning
  record 0023 holds the correction.

  State the real rule instead. `hermes_cli/main.py` line 11751 shows the
  `--text` path writing `description_auto=False` in the same call.
  `hermes_cli/profile_describer.py` line 191 then skips any profile that
  holds a description with `description_auto: false`. So
  `hermes profile describe --auto --all` cannot replace the text, and
  `--auto --overwrite` on that profile can.

  Give the check:

```bash
cat ~/.hermes/profiles/torchwood/profile.yaml
```

  Expected: a `description` that holds the sentence above, and
  `description_auto: false`.

- [ ] **Step 3: Write the test section of Lesson 27.** State the rule
  first. This lesson tests the claim and does not assert it, because the
  cost of a wrong claim here is silent misrouting.

  Give the test:

```bash
hermes kanban create --triage "write a prompt for the flappy refactor, then apply the prompt"
hermes kanban list
```

  The flag `--triage` is required. A task created without it lands in
  `ready`, and `hermes_cli/kanban_decompose.py` line 288 refuses every
  status except `triage`. Learning record 0024 holds that correction.

  Read the task id from the second command, and confirm the status reads
  `triage`. Do not decompose by hand. Every profile runs
  `auto_decompose: true` with `dispatch_interval_seconds: 60`, so the
  board decomposes the task within one minute and starts a child.
  Learning record 0025 holds that correction.

  Read what the board did:

```bash
hermes kanban show <task_id>
hermes kanban list
```

  Keep `hermes kanban decompose <task_id>` as the branch for a full
  minute with one event and no children.

  Expected: a line reading `Decomposed <task_id> → N children`, and
  every child task carries `peashooter` or `sunflower` as the assignee.
  A child assigned to `torchwood` fails the test.

  Check that the test ran at all. `hermes kanban show` must list more
  than one event. One event means the task was created and nothing
  else happened, which is what a refused decompose looks like.

  Give the stop procedure, in this order. The second child is a live
  instruction to change files in a real project:

```bash
hermes kanban block <child_id> "Lesson 27 routing test, not real work"
hermes kanban reclaim <running_child_id>
hermes kanban archive <root_id> <child_id> <child_id>
hermes kanban list
```

  State the reason for the order. Archiving a task that a worker holds
  leaves the worker running against a task that is no longer on the
  board.

  Tell the reader to read the stop procedure before creating the task.
  The board is the production board of three working agents, and a task
  in triage is a work order.

- [ ] **Step 4: Write the failure branch of Lesson 27.** State what to
  do when a child reaches `torchwood`. Do not weaken the test. Change
  the description so that it names no work verb, then run the same test
  again. Record the wording that failed and the wording that passed,
  because the next three specialists need that difference.

- [ ] **Step 5: Add two rows to the reference document.**

```html
<tr>
  <td>Routing description</td>
  <td><code>profile.yaml</code>, keys <code>description</code> and
      <code>description_auto</code></td>
  <td>"Interactive prompt writing in the Prompts topic. Never a work
      destination. Do not assign kanban tasks here."</td>
  <td>Set <code>description_auto: false</code>, or an
      <code>--auto --all</code> sweep replaces the text.</td>
</tr>
<tr>
  <td>Board membership</td>
  <td><code>config.yaml</code>, key
      <code>kanban.orchestrator_profile</code></td>
  <td><code>crazydave</code>, and no work ever assigned</td>
  <td>Test the claim with one decompose run. Never assert it.</td>
</tr>
```

- [ ] **Step 6: Add the navigation links.** Add the forward link to
  Lesson 26 and the backward link in Lesson 27:

```html
  <span><a href="0027-a-description-that-refuses-work.html">Lesson 27 →</a></span>
```

```html
  <span><a href="0026-a-topic-for-prompts.html">← Lesson 26</a></span>
```

- [ ] **Step 7: Verify the HTML tag balance of all three files.**

```bash
python3 - <<'EOF'
import re, sys
for p in ["teach/lessons/0027-a-description-that-refuses-work.html",
          "teach/lessons/0026-a-topic-for-prompts.html",
          "teach/reference/adding-a-specialist.html"]:
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

  Expected: three lines, each ending in `balanced`.

- [ ] **Step 8: Ask the user to run Lesson 27** and to report the
  `profile.yaml` content and the full output of `hermes kanban show`.

- [ ] **Step 9: Verify the reported output.** Read the assignee of every
  child task. If any child names `torchwood`, write a learning record
  before you change the wording. Record what the decomposer read and
  what it chose.

- [ ] **Step 10: Mirror the profile file.**

```bash
cp ~/.hermes/profiles/torchwood/profile.yaml hermes-config/torchwood/profile.yaml
grep -c description_auto hermes-config/torchwood/profile.yaml
```

  Expected: `1`.

- [ ] **Step 11: Commit.**

```bash
git add teach/lessons/0027-a-description-that-refuses-work.html \
        teach/lessons/0026-a-topic-for-prompts.html \
        teach/reference/adding-a-specialist.html \
        hermes-config/torchwood/profile.yaml
git commit -F - <<'MSG'
Add Lesson 27: a description that refuses work

Lesson 27 writes the routing description of Torchwood and sets
description_auto to false. The decomposer reads that text, and all three
existing profiles run auto_decompose.

The lesson tests the claim with one decompose run on a task worded to
invite the mistake. It does not assert the claim.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

### Task 4: Limits that live in the soul (Lesson 28)

**Files:**
- Create: `teach/lessons/0028-limits-that-live-in-the-soul.html`
- Modify: `teach/lessons/0027-a-description-that-refuses-work.html` (the nav span)
- Modify: `teach/reference/adding-a-specialist.html` (one new row)
- Modify (by the user): `~/.hermes/profiles/torchwood/SOUL.md`
- Create: `hermes-config/torchwood/SOUL.md`

**Interfaces:**
- Consumes: the routing description from Task 3.
- Produces: a `SOUL.md` that holds the four limits, the `Checked:`
  trailer rule, the one-message rule, and the one-question rule. Task 5
  tests every one of them with a real interview.

- [ ] **Step 1: Write the replacement `SOUL.md` in full** inside Lesson
  28. The clone carries the `SOUL.md` of Peashooter, so the whole file
  changes. Give this content:

```markdown
You are Torchwood, the prompt specialist in Jokot's personal agent team.

Domain: you interview Jokot about a task, then you write one finished
prompt that another agent or another tool can run.

You produce text. You write no file, you move no file, and you delete no
file. You may read. Permitted commands include ls, cat, sed -n, grep,
find, head, tail, git log, git status, and git diff. If Jokot asks you to
edit a file, decline in one sentence and give him the prompt instead.

You never create, claim, comment on, or close a kanban task. You never
run fizzy. You are not a work destination.

Read TEMPLATE.md at the start of every interview. Each `##` heading in
that file becomes a `##` heading in your finished prompt, in file order.
Jokot may ask you to skip a heading or to add one for a single prompt.
Obey that request for that prompt only, and never edit TEMPLATE.md.

Run a read command whenever a read command answers your question. Never
ask Jokot for a path that you can list yourself.

Ask one question in each message. Name the section that the question
serves, as in "Constraints — does any file still reference the old zuma
path?". Stop asking when you can fill every required heading. Then send
the prompt. Do not ask for permission to send it.

Send exactly one message. That message holds exactly one fenced code
block, and the whole prompt sits inside that block.

End every prompt with a Checked: trailer inside the same block. List the
commands that you actually ran. Every path that appears in the prompt
must trace to one of those commands. If you never confirmed a path, say
so in the prompt rather than listing a command you did not run.

Do not use the brainstorming skill. It ends by writing a design document
and by invoking another skill, and you write no file. You may use the
ste-writing skill, which changes prose only.

Personality: direct and economical, no filler. Admit uncertainty plainly
rather than guessing. Always respond in English, even if Jokot writes in
another language.

You have persistent memory (MEMORY.md, USER.md). Record the conventions
of Jokot's stack, so that a later interview asks fewer questions.
```

- [ ] **Step 2: Write the reasoning section of Lesson 28.** Explain two
  choices, because a reader who copies the file without the reasons
  cannot adapt it for Magnet-shroom.

  First, the `Checked:` rule lives in `SOUL.md` and not in
  `TEMPLATE.md`. A user edits `TEMPLATE.md`, so a rule placed there can
  disappear by accident. The verification rule must survive every
  template edit.

  Second, the one-message rule exists for a practical reason. Telegram
  renders a triple-backtick block with a copy control, so one block
  reaches the clipboard with one tap. A prompt split across several
  messages needs manual selection.

- [ ] **Step 3: Write the honest limit section of Lesson 28.** State the
  gap plainly. The read-only rule above is prose. Learning record 0015
  states that a limit must come from the implementation, not from the
  wording. Torchwood carries `toolsets: [hermes-cli]` and terminal
  access, exactly as Peashooter does, so no mechanism stops a write.

  State what Stage 4 does about it. Lesson 29 tests the rule with a
  direct request to edit a file. Stage 5 closes the gap with a probe of
  `terminal.backend`, because Magnet-shroom moves and deletes files.
  Nobody has run that probe, so this lesson claims no result for it.

- [ ] **Step 4: Add the row to the reference document.**

```html
<tr>
  <td>Identity and limits</td>
  <td><code>SOUL.md</code></td>
  <td>Four limits, the Checked trailer, one message with one fenced
      block, one question for each message</td>
  <td>A rule the user can edit is a rule the user can delete. Keep the
      verification rule out of the editable file.</td>
</tr>
```

- [ ] **Step 5: Add the navigation links.** Add the forward link to
  Lesson 27 and the backward link in Lesson 28:

```html
  <span><a href="0028-limits-that-live-in-the-soul.html">Lesson 28 →</a></span>
```

```html
  <span><a href="0027-a-description-that-refuses-work.html">← Lesson 27</a></span>
```

- [ ] **Step 6: Verify the HTML tag balance of all three files.**

```bash
python3 - <<'EOF'
import re, sys
for p in ["teach/lessons/0028-limits-that-live-in-the-soul.html",
          "teach/lessons/0027-a-description-that-refuses-work.html",
          "teach/reference/adding-a-specialist.html"]:
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

  Expected: three lines, each ending in `balanced`.

- [ ] **Step 7: Ask the user to replace `SOUL.md`** and to restart the
  gateway:

```bash
hermes -p torchwood gateway restart
```

- [ ] **Step 8: Ask the user for one smoke test.** Post `hi` in the
  `Prompts` topic. Expected: Torchwood asks one question, and that
  question names a section. A reply that answers `hi` with a greeting
  and no question means the interview rule did not take effect.

- [ ] **Step 9: Mirror the soul file.**

```bash
cp ~/.hermes/profiles/torchwood/SOUL.md hermes-config/torchwood/SOUL.md
grep -c 'Checked:' hermes-config/torchwood/SOUL.md
```

  Expected: a count of `1` or more.

- [ ] **Step 10: Commit.**

```bash
git add teach/lessons/0028-limits-that-live-in-the-soul.html \
        teach/lessons/0027-a-description-that-refuses-work.html \
        teach/reference/adding-a-specialist.html \
        hermes-config/torchwood/SOUL.md
git commit -F - <<'MSG'
Add Lesson 28: limits that live in the soul

Lesson 28 replaces the cloned SOUL.md with the identity of Torchwood.
The file holds four limits, the Checked trailer rule, the one-message
rule, and the one-question rule.

The lesson records one honest gap. The read-only limit is prose, which
learning record 0015 rejects as a limit. Stage 5 closes the gap with a
terminal backend probe.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

### Task 5: The template is the skeleton (Lesson 29)

**Files:**
- Create: `teach/lessons/0029-the-template-is-the-skeleton.html`
- Modify: `teach/lessons/0028-limits-that-live-in-the-soul.html` (the nav span)
- Modify: `teach/reference/adding-a-specialist.html` (close the document)
- Create (by the user): `~/.hermes/profiles/torchwood/TEMPLATE.md`
- Create: `hermes-config/torchwood/TEMPLATE.md`

**Interfaces:**
- Consumes: the `SOUL.md` rules from Task 4.
- Produces: a working Torchwood. Task 6 scores the ten success criteria
  against the results of this lesson.

- [ ] **Step 1: Write the template file in full** inside Lesson 29. Give
  this content for `~/.hermes/profiles/torchwood/TEMPLATE.md`:

```markdown
# Prompt template

Torchwood reads this file at the start of every interview.
Each heading below becomes a heading in the finished prompt.

## Goal
One sentence. State the outcome, not the method.

## Context
What exists now. Give every path. Confirm each path with a command.

## Constraints
What the worker must not do. Omit this section when the interview
finds nothing for it.

## Deliverable
The exact path that must hold the artifact when the work is done.
Never a scratch directory.

## Done when
Checks the worker can run without asking a question. One checkbox
for each check.
```

- [ ] **Step 2: Mirror the template file now, before any test.** The
  override test in step 7 compares the live file against the mirror, so
  the mirror must exist first.

```bash
cp ~/.hermes/profiles/torchwood/TEMPLATE.md hermes-config/torchwood/TEMPLATE.md
git add hermes-config/torchwood/TEMPLATE.md
git commit -m "Mirror the starting prompt template of Torchwood

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

  A `diff` against a file that does not exist reports an error rather
  than a difference, so a missing mirror turns step 7 into a check that
  passes without testing anything.

- [ ] **Step 3: Write the contract section of Lesson 29.** State the
  rule in one sentence. The file is the skeleton of the output, not a
  description of the skeleton. To add a section, add a heading. To
  remove a section, delete the heading.

  Give the reason for two of the headings, because a reader who knows
  the reason keeps the heading. The `Deliverable` heading exists because
  learning record 0018 records a task that named no durable destination,
  so the artifact disappeared with the scratch workspace. The `Done
  when` heading exists because learning record 0016 records a
  specification that passed review with `tests_run: 0`.

- [ ] **Step 4: Write the worked example into Lesson 29.** Show the
  shape of a finished prompt:

```markdown
## Goal
Make the Zuma server survive a directory move.

## Context
projects/zuma/start_servers.sh line 12 hardcodes the old path
/Users/jokot/dev/plants/zuma. The directory now lives at
projects/zuma.

## Deliverable
projects/zuma/start_servers.sh

## Done when
- [ ] curl -s -o /dev/null -w '%{http_code}' localhost:8000/index.html prints 200
- [ ] python3 projects/zuma/check_public.py exits 0

Checked:
- sed -n '12p' projects/zuma/start_servers.sh
- ls projects/zuma/
```

- [ ] **Step 5: Write test 1 of Lesson 29, the real interview.** Ask the
  user to post this in the `Prompts` topic:

```
I want to add a --description flag to fizzy card create
```

  Give the expected shape of the run. Torchwood asks one question for
  each message, and each question names a section. Torchwood runs read
  commands rather than asking for paths. Torchwood then sends one
  message that holds one fenced block.

  Give the four checks the user runs by eye on that block:

  1. The message count is one, and the fenced block count is one.
  2. The headings match `TEMPLATE.md` in file order. The `Constraints`
     heading may be absent when the interview found nothing for it.
  3. A `Checked:` trailer closes the block and lists at least one
     command.
  4. Every path above the trailer traces to a listed command.

- [ ] **Step 6: Write test 2 of Lesson 29, the durable template edit.**
  Ask the user to add this heading to `TEMPLATE.md`, after
  `## Constraints`:

```markdown
## Rollback
How to undo the change in one command, when an undo is possible.
```

  Then ask for a second interview on any small task. Expected: the new
  prompt holds a `## Rollback` heading in that position. Then ask the
  user to delete the heading and to run a third interview. Expected: the
  heading is gone.

  State the rule this proves. The file changed the output with no change
  to `SOUL.md` and no gateway restart.

- [ ] **Step 7: Write test 3 of Lesson 29, the per-prompt override.**
  Ask the user to post this in the topic:

```
write me a prompt for the tetris score bug, and skip the Constraints section
```

  Expected: that prompt holds no `Constraints` heading. Then give the
  check that the file did not change:

```bash
git diff --stat hermes-config/torchwood/TEMPLATE.md
diff ~/.hermes/profiles/torchwood/TEMPLATE.md hermes-config/torchwood/TEMPLATE.md
```

  Expected: `git diff --stat` prints nothing, and `diff` prints nothing.

- [ ] **Step 8: Write test 4 of Lesson 29, the write refusal.** Ask the
  user to post this in the topic:

```
please edit projects/zuma/start_servers.sh and fix line 12 for me
```

  Expected: Torchwood declines in one sentence and offers a prompt
  instead. Then give the check:

```bash
git status --short
```

  Expected: no change to any file under `projects/`.

  State the limit of this test plainly. The test proves the behaviour of
  one run. It does not prove that a write cannot happen, because the
  rule is prose. Stage 5 closes that gap.

- [ ] **Step 9: Close the reference document.** The table now holds six
  rows. Add a short closing section under the table with this content,
  as three list items:

  - Create the bot before the profile. The token replacement is a
    separate step, because `--clone-from` copies `.env`.
  - Read the thread id. Never assume the next number.
  - Test the routing description with one decompose run. Never assert
    it.

- [ ] **Step 10: Add the navigation links.** Add the forward link to
  Lesson 28 and the backward link in Lesson 29:

```html
  <span><a href="0029-the-template-is-the-skeleton.html">Lesson 29 →</a></span>
```

```html
  <span><a href="0028-limits-that-live-in-the-soul.html">← Lesson 28</a></span>
```

- [ ] **Step 11: Verify the HTML tag balance of all three files.**

```bash
python3 - <<'EOF'
import re, sys
for p in ["teach/lessons/0029-the-template-is-the-skeleton.html",
          "teach/lessons/0028-limits-that-live-in-the-soul.html",
          "teach/reference/adding-a-specialist.html"]:
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

  Expected: three lines, each ending in `balanced`.

- [ ] **Step 12: Verify the reference document holds six rows.**

```bash
grep -c '<tr>' teach/reference/adding-a-specialist.html
```

  Expected: `7`. Six rows of content plus one heading row.

- [ ] **Step 13: Ask the user to run Lesson 29** and to report the full
  text of every prompt that Torchwood produced, plus the output of the
  three checks in steps 7 and 8.

- [ ] **Step 14: Verify the reported output against the four checks in
  step 5.** Read the heading set of each prompt against `TEMPLATE.md`.
  Read each path above a `Checked:` trailer against the commands listed
  in that trailer. A path with no matching command is a real defect, and
  it needs a learning record before any change to `SOUL.md`.

- [ ] **Step 15: Refresh the mirror and verify the heading count.**
  Step 6 added a heading and then removed it, so copy the file again.

```bash
cp ~/.hermes/profiles/torchwood/TEMPLATE.md hermes-config/torchwood/TEMPLATE.md
grep -c '^## ' hermes-config/torchwood/TEMPLATE.md
```

  Expected: `5`. Five headings, after the user deleted the `Rollback`
  heading in step 6.

- [ ] **Step 16: Commit.**

```bash
git add teach/lessons/0029-the-template-is-the-skeleton.html \
        teach/lessons/0028-limits-that-live-in-the-soul.html \
        teach/reference/adding-a-specialist.html \
        hermes-config/torchwood/TEMPLATE.md
git commit -F - <<'MSG'
Add Lesson 29: the template is the skeleton

Lesson 29 writes TEMPLATE.md and runs Torchwood end to end. Each heading
in the file becomes a heading in the finished prompt.

Four tests cover the real interview, a durable template edit, a
per-prompt override, and a request to edit a file. The lesson closes the
specialist reference document with six rows.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

### Task 6: Stage 4 completion record

**Files:**
- Create: `teach/learning-records/00NN-stage4-complete.md`, where `NN`
  is the next free number after the records written during Tasks 1 to 5
- Modify: `docs/superpowers/specs/2026-09-11-stage4-torchwood-and-the-roster-pattern-design.md:3`
- Modify: `teach/NOTES.md`

**Interfaces:**
- Consumes: the results of all four tests in Task 5, and every learning
  record written during Tasks 1 to 5.
- Produces: a scored specification, and one generalization for Stage 5.

- [ ] **Step 1: Score the ten success criteria.** Read each criterion
  from the specification, section "Success criteria". For each one,
  write the criterion number, the word `pass` or `fail`, and the
  evidence that decided it. Evidence means reported command output or
  reported Telegram text. A criterion with no evidence is not a pass.

- [ ] **Step 2: Write section 1 of the record, "What the stage
  built".** Name the profile, the topic, the model, and the six rows of
  the reference document. Give the thread id that Telegram actually
  assigned.

- [ ] **Step 3: Write section 2 of the record, "What it cost".** Count
  the lessons and the learning records. Lessons `0025` to `0029` is
  five. Count the records written during Tasks 1 to 5, and name each
  defect in one line.

- [ ] **Step 4: Write section 3 of the record, "Where the design was
  wrong".** Answer one question for each criterion that passed. Did the
  criterion pass by the mechanism the specification names, or by a
  different one? Name every difference. A criterion that passed by
  another mechanism means the specification described something that
  does not exist.

- [ ] **Step 5: Write section 4 of the record, the generalization.**
  Test the candidate below against every record from this stage before
  you use it. Reject it if it covers fewer than half of them.

  Candidate: Stage 1 found defects in configuration. Stage 2 found
  defects in the seams between parts. Stage 3 found defects in the
  writing. Stage 4 found defects in what a file copy carries.

  If the candidate fails, write the generalization that the records
  actually support, and say why the candidate failed.

- [ ] **Step 6: Update the status line of the specification.** Replace
  the exact string `**Status:** Approved for implementation` on line 3
  with a status line that states the date, the score, the mechanism
  differences from step 4, and the record number.

- [ ] **Step 7: Add one line to `teach/NOTES.md`** holding the
  generalization from step 5.

- [ ] **Step 8: Verify the record count and the specification edit.**

```bash
ls teach/learning-records/ | tail -3
sed -n '3p' docs/superpowers/specs/2026-09-11-stage4-torchwood-and-the-roster-pattern-design.md
```

  Expected: the new record appears, and line 3 no longer reads
  `**Status:** Approved for implementation`.

- [ ] **Step 9: Commit.**

```bash
git add teach/learning-records/ teach/NOTES.md \
        docs/superpowers/specs/2026-09-11-stage4-torchwood-and-the-roster-pattern-design.md
git commit -F - <<'MSG'
Record Stage 4 as complete

The record scores all ten success criteria against reported output, names
every mechanism that differed from the design, and states the
generalization that the stage records support.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

## Open item carried into Stage 5

Stage 5 builds Magnet-shroom, the file agent. Stage 5 starts with a probe
of `terminal.backend` and a read-only mount, because the read-only limit
of Torchwood is prose and learning record 0015 rejects prose as a limit.
Nobody has run that probe. This plan claims no result for it.
