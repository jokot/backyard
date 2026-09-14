# 0029 — A clone that kept the skills of its parent

**Date:** 2026-09-14
**Stage:** 4, Lesson 30
**Status:** Fixed by Lesson 30. The reference document holds a seventh row.

## What happened

The reader ran test 1 of Lesson 29 and posted this in the `Prompts`
topic:

```
I want to add a --description flag to fizzy card create
```

Torchwood replied:

```
📚 Reading skill kanban-worker
📖 Reading TEMPLATE.md L1-200
🔎 Searching files for *

Context — which repository contains the fizzy CLI?
```

The first line is the defect. The soul file of Torchwood states: "You
never create, claim, comment on, or close a kanban task." The profile
still carries the skill that documents how to do exactly that.

## Root cause

`hermes profile create --clone-from peashooter` copies the `skills/`
directory. Peashooter is a worker that writes code, so its kit fits a
worker that writes code.

The kit had already been cut once. Lesson 9 cut it for Peashooter and
Sunflower, and Lesson 13 cut it for Crazy Dave, where it removed
`devops/kanban-worker` by name. A clone of a cut profile looks cut, so
Stage 4 never asked the question.

The counts show the gap:

```
hermes skills list -p crazydave --enabled-only   ->  0 enabled shown
hermes skills list -p torchwood --enabled-only   -> 24 enabled shown
```

A twenty fifth skill does not appear in either count.
`devops/kanban-worker` declares `environments: [kanban]`, so the listing
hides it and the model still loads it. Lesson 13 recorded the same
behaviour for `kanban-orchestrator`.

The enabled list also holds `brainstorming`, which the soul file of
Torchwood bans by name. The ban is one sentence, and the directory is
on disk. Record 0015 states the rule this breaks: set the limits from
the implementation, not from the conversation.

## Fix

Lesson 30 deletes twenty one directories and keeps `ste-writing`, which
is the one skill the soul file permits. The check is the count:

```
hermes skills list -p torchwood --enabled-only | tail -1
```

Expected after the cut: `1 enabled shown`.

The reference document holds a seventh row, named Skill kit. Its trap
reads: a clone of a cut profile looks cut, and the kit that survived
the earlier cut belongs to the earlier role.

## Second finding — a permitted list that omitted `which`

The same reply ends with a question about the repository of the fizzy
CLI. That question is correct. `fizzy` resolves to
`/opt/homebrew/bin/fizzy`, which links to
`/opt/homebrew/Caskroom/fizzy/4.0.1/fizzy`. The binary comes from a
Homebrew cask, and no fizzy source repository exists on this machine.

The agent could not confirm that, because the permitted command list in
`SOUL.md` read `ls, cat, sed -n, grep, find, head, tail, git log, git
status, git diff`. It holds no `which` and no `command -v`. The soul
file also says "Never ask Jokot for a path that you can list yourself",
so the agent obeyed both rules at once and asked.

The list now holds `which` and `command -v`.

## Generalization

*A clone inherits capability, not only configuration.* Six decisions in
the roster pattern describe what a profile is. The skill kit describes
what it knows how to do, and it arrives whole from the parent. Count it
rather than look at it.

*A permitted list is a limit on the agent, so an incomplete list
produces a question rather than a command.* The agent did the right
thing with a list that was too short. When an agent asks something it
should have looked up, read the list before blaming the model.

## Related

- Record 0015 — the line between work and maintenance.
- Record 0027 — an interview that started too early.
- Lesson 9 and Lesson 13 — the two earlier cuts of a skill kit.
- Lesson 30 — the lesson written from this record.
