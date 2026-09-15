# Stage 4 Design: Torchwood and the roster pattern

**Date:** 2026-09-11
**Status:** Approved for implementation
**Author:** jokot, with Claude Code

## Background

This document is Stage 4 of the plants multi-agent project. Stage 1 built
Peashooter, a coding specialist reachable over Telegram
(`docs/superpowers/specs/2026-09-06-peashooter-stage1-design.md`). Stage 2
added Sunflower, Crazy Dave, and the shared Hermes kanban board
(`docs/superpowers/specs/2026-09-06-stage2-sunflower-crazydave-design.md`).
Stage 3 built the Ark Telegram group, per-topic default listeners, and the
Fizzy one-way mirror
(`docs/superpowers/specs/2026-09-09-stage3-ark-and-fizzy-design.md`).
Stage 3 is complete. All seven success criteria pass.

The user named four agents to build next, in this order of usefulness and
urgency:

1. A prompt generator, named Torchwood.
2. A file agent that moves, searches, sends, and views files, named
   Magnet-shroom.
3. A finance and budgeting agent, named Marigold.
4. A learning agent that uses the learn-teach skill, named Imitater.

Four agents need four specifications. Stage 4 therefore builds Torchwood
alone, and extracts the repeatable procedure that Stages 5 to 7 follow for
the other three.

Torchwood comes first for three reasons. It multiplies the value of every
other agent, because a better prompt improves the work of the agent that
receives it. The project has already paid for two prompt defects, recorded
in learning records 0016 and 0018. Torchwood is also the lowest-risk agent
in the list, because it produces text and changes no file.

## Goals

- Add a fourth Hermes profile named `torchwood`, bound to a new topic named
  `#Prompts` in the Ark group `-1004371805465`.
- Torchwood interviews the user in that topic, then emits one finished
  prompt as Telegram text.
- The section list of the prompt lives in a file the user can edit.
- Every path in a prompt traces to a command that Torchwood ran.
- Produce `teach/reference/adding-a-specialist.html`, which records the
  seven decisions that a new specialist needs, with the values Torchwood
  used. This document named six decisions when Stage 4 started. Lesson 30
  added the seventh.

## Non-goals

- Torchwood does not write to the kanban board or to Fizzy.
- Torchwood does not accept kanban tasks.
- Torchwood does not write, move, or delete any file.
- Stage 4 does not build Magnet-shroom, Marigold, or Imitater.

## The seven roster decisions

A new specialist needs seven decisions. Each decision has one home. The
reference document holds one row for each.

This section named six decisions on 11 September 2026. The seventh
arrived on 14 September 2026, from a real reply. Torchwood loaded a skill
for kanban workers during an interview, and its `SOUL.md` forbids every
kanban command. The clone had carried the skill kit of the profile it
copied. Lesson 30 cut the kit and wrote row 7.

| Decision | Home | Current values |
|---|---|---|
| Model | `config.yaml`, key `model.default` | Crazy Dave `openai/gpt-5.6-luna`, Peashooter `deepseek/deepseek-v4-flash-0731`, Sunflower `z-ai/glm-5.3-flash` |
| Routing description | `profile.yaml`, keys `description` and `description_auto` | One sentence for each profile, `description_auto: false` |
| Topic binding | `config.yaml`, key `telegram.free_response_topics` | `-1004371805465:1`, `:2`, `:3` |
| Identity and limits | `SOUL.md` | Domain, out-of-scope rule, reporting rule, memory rule |
| Board membership | `config.yaml`, key `kanban.orchestrator_profile` | All three profiles name `crazydave` |
| Bot credentials | `.env`, key `TELEGRAM_BOT_TOKEN` | One token for each profile. Never copied into the repository. |
| Skill kit | The `skills/` directory of the profile | Torchwood keeps `ste-writing` only. A delete alone does not hold, because `skills_sync` rebuilds category directories. Run `hermes skills opt-out` first. |

## Torchwood design

### Identity and limits

Torchwood owns five files in `~/.hermes/profiles/torchwood/`:

| File | Purpose |
|---|---|
| `SOUL.md` | Identity, the four limits, the `Checked:` trailer rule |
| `TEMPLATE.md` | The section list of the prompt. The user edits this file. |
| `config.yaml` | Model and topic binding |
| `profile.yaml` | The description that keeps work away |
| `.env` | The Telegram bot token of Torchwood |

The repository mirrors four of these files into `hermes-config/torchwood/`.
The mirror excludes `.env`, because `.env` holds live secrets.

Four limits apply. Each limit needs a mechanism, not only a sentence.

1. Torchwood is never a work destination. The `description` in
   `profile.yaml` states this. The three existing profiles run
   `auto_decompose: true`, so a description that invites prompt work
   attracts kanban tasks.
2. Torchwood never writes to the kanban board or to Fizzy. `SOUL.md`
   states this as a hard rule.
3. Torchwood reads files and never writes them. `SOUL.md` names the
   permitted commands.
4. Every path in a prompt traces to a command that Torchwood ran. Each
   prompt ends with a `Checked:` trailer that lists those commands.

### The template contract

`TEMPLATE.md` is the skeleton of the output, not a description of the
skeleton. Each `##` heading in the file becomes a `##` heading in the
finished prompt, in file order. To add a section, add a heading. To remove
a section, delete the heading.

The starting content of `TEMPLATE.md`:

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

The `Goal` and `Context` sections exist because a prompt needs a stated
outcome and real paths. The `Deliverable` section exists because learning
record 0018 records a task that named no durable destination, so the
artifact disappeared with the scratch workspace. The `Done when` section
exists because learning record 0016 records a specification that passed
review with `tests_run: 0`.

The `Checked:` trailer does not live in `TEMPLATE.md`. It lives in
`SOUL.md`. A user who edits `TEMPLATE.md` must not be able to delete the
verification rule by accident. The trailer appends after the last template
section on every prompt.

A finished prompt has this shape:

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

A per-prompt override changes one prompt only. The user says "skip
Constraints" or "add a Rollback section" in the topic. Torchwood obeys for
that prompt and does not edit `TEMPLATE.md`.

### The interview

Torchwood runs a read command when a read command answers the question. The
user never types a path that Torchwood can list. This rule produces the
`Checked:` trailer at no extra cost.

Torchwood asks one question for each message, and names the section that
the question serves. An example question reads: "Constraints — does any
file still reference the old `zuma/` path?"

Torchwood stops the interview when it can fill every required heading in
`TEMPLATE.md`. Then Torchwood emits the prompt. Torchwood does not ask for
permission to emit.

Torchwood emits exactly one message that holds exactly one fenced code
block. Telegram renders a triple-backtick block with a copy control, so the
whole prompt reaches the clipboard with one tap.

Torchwood does not use the bundled `brainstorming` skill. That skill ends
by writing a specification file to `docs/superpowers/specs/` and by
invoking the `writing-plans` skill, at `SKILL.md` lines 100 and 103. Both
actions write files, and Torchwood writes no file. `SOUL.md` restates the
one-question rule in three lines instead. Torchwood does use the bundled
`ste-writing` skill, which shapes prose and writes nothing.

### Model

Torchwood runs `openai/gpt-5.6-luna`, the same model as Crazy Dave.

Every failure this design guards against is a failure to follow an
instruction. Examples include a path that no command confirmed, a missing
`Checked:` trailer, a heading that does not match `TEMPLATE.md`, and three
messages in place of one. The daily volume is about five interviews, so the
stronger model costs little.

## The token trap

`hermes profile create --clone` copies `config.yaml`, `.env`, `SOUL.md`,
and the skills directory from the source profile. The `.env` file of
Peashooter holds a live `TELEGRAM_BOT_TOKEN`. A clone that keeps that token
gives Torchwood the bot identity of Peashooter. Two profiles then compete
for the same Telegram update queue.

Lesson 0025 therefore treats the token replacement as its own numbered step
with its own check. The check prints no token. The user sends one message
in the Prompts topic and confirms that the reply arrives from a username other than
the username of Peashooter.

## Lesson sequence

Each lesson writes its own row of `teach/reference/adding-a-specialist.html`
as a numbered step. No lesson defers a row to a later stage. Learning record
0019 records the cost of a checkpoint that no numbered step supports.

| Lesson | Builds | Row |
|---|---|---|
| 0025 | The profile and its own bot. `hermes profile create torchwood --clone-from peashooter`, then replace `TELEGRAM_BOT_TOKEN`, then set `model.default`. | Bot credentials, Model |
| 0026 | The topic and the listener. Create the `#Prompts` topic, read its thread id from the Telegram Web address bar, set the three telegram keys, mirror `config.yaml`. | Topic binding |
| 0027 | The description that keeps work away. `hermes profile describe torchwood --text "..."`, `description_auto: false`, then test the decomposer. | Routing description, Board membership |
| 0028 | `SOUL.md`. The four limits, the `Checked:` trailer rule, one message and one fenced block, the one-question rule. | Identity and limits |
| 0029 | `TEMPLATE.md` and the first real prompt, end to end. | Closes the document |

Lesson 0025 creates the reference document together with its first two
rows. It does not create an empty skeleton.

Lesson 0027 tests the routing claim and does not assert it. The test creates
one kanban task with wording that invites the mistake, such as "write a
prompt for the flappy refactor". The test waits one `auto_decompose` tick of
60 seconds, then reads the assignee.

## Success criteria

1. A fourth bot answers in the Prompts topic, under a username other than
   the three existing usernames.
2. Torchwood answers in the Prompts topic and stays silent in threads 1,
   2, and 3.
3. After one `auto_decompose` tick of 60 seconds, a task worded "write a
   prompt for the flappy refactor" carries Peashooter or Sunflower as the
   assignee, and never `torchwood`.
4. A prompt request produces exactly one message that holds exactly one
   fenced code block.
5. The headings inside that block match the `##` headings of
   `TEMPLATE.md`, in file order.
6. The block ends with a `Checked:` trailer that lists at least one
   command. Every path in `Context` and `Deliverable` traces to a listed
   command. The user reads this criterion by eye, once.
7. A new heading in `TEMPLATE.md` changes the next prompt. Removal of that
   heading changes the prompt back.
8. A per-prompt override changes one prompt only. The command
   `git diff hermes-config/torchwood/TEMPLATE.md` prints nothing afterward.
9. Torchwood declines a direct request to edit a file, and `git status` in
   the target repository stays clean.
10. `teach/reference/adding-a-specialist.html` holds seven rows. Each row
    carries the value that Torchwood used. This criterion asked for six
    rows when Stage 4 started, because the skill kit decision was not
    known then.

## Known gap

Criterion 9 is the only check between the read-only rule and a write. The
rule behind it is prose in `SOUL.md`. Learning record 0015 states that a
limit must come from the implementation, not from the wording. This design
does not meet that standard. Torchwood carries `toolsets: [hermes-cli]` and
terminal access, exactly as Peashooter does. No mechanism stops a write.

Stage 4 accepts this gap for two reasons. Torchwood produces text, so a
stray write has a small blast radius. Criterion 9 is a real test rather
than an assertion.

Stage 5 must close the gap, because Magnet-shroom moves and deletes files.
Stage 5 starts with a probe of `terminal.backend: docker` and a read-only
mount. This design does not claim that the probe succeeds. Nobody has run
it.

## Out of scope, deferred to later stages

- The read-only terminal probe. Deferred to Stage 5, Magnet-shroom.
- Magnet-shroom, Marigold, and Imitater. Each needs its own specification.
- The blocked-child notification gap of learning record 0008. This defect
  has occurred twice and remains open.
- Crazy Dave uses the kanban command line instead of the kanban tool,
  because `_check_kanban_mode` returns False. This defect remains open.
- Cron and scheduled automation, deferred since Stage 1.
- The Fizzy webhook receiver, deferred in Stage 3.
