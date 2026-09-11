# 0022 — A clone that answered to the wrong name

**Date:** 2026-09-11
**Stage:** 4, Lesson 25
**Status:** Fixed in the lesson. No defect in Hermes.

## What happened

Lesson 25 created the `torchwood` profile with
`hermes profile create torchwood --clone-from peashooter`. The lesson
then replaced the bot token, reset `MEMORY.md`, and set
`model.default` to `openai/gpt-5.6-luna`. Every check in the lesson
passed.

The reader connected the new bot to Telegram and asked it who it is.
The bot answered that it is Peashooter.

## Root cause

The file `~/.hermes/profiles/torchwood/SOUL.md` was byte for byte
identical to `~/.hermes/profiles/peashooter/SOUL.md`. Line 1 reads:

```
You are Peashooter, the engineering and coding specialist in Jokot's
personal agent team.
```

Hermes is correct here. The help text for `hermes profile create`
names `SOUL.md` as one of the four files the clone copies. The Stage 4
plan assigns the replacement of `SOUL.md` to Lesson 28, which is three
lessons later.

The fault is in the teaching. Lesson 25 listed six numbered steps and
seven checkpoint lines, and none of them told the reader what the bot
would say. A reader who finishes a lesson talks to the thing the
lesson built. The lesson left that first conversation undescribed, so
a correct result looked like a failure.

## Fix

Lesson 25 now carries a forward note that states the expected answer
before the reader asks for it. The note names both things the clone
carried that the lesson does not replace:

1. `SOUL.md`, which makes the bot answer `Peashooter` until Lesson 28.
2. `free_response_topics`, which still names thread 2 and would make
   Torchwood answer in `#Coding` until Lesson 26.

The checkpoint gained one line: ask the bot who it is, and expect the
answer `Peashooter`.

A second correction came from the same run. The checkpoint expected
`wc -c` to print `0` for `MEMORY.md`. The command
`hermes memory reset --target memory` deletes the file instead of
emptying it, so `wc -c` reports `no such file or directory`, which
reads as a failure. The check is now
`ls -l ~/.hermes/profiles/torchwood/memories/`, and the pass is
`USER.md` present with no `MEMORY.md`.

## Generalization

*A lesson that builds a thing owes the reader the first thing that
thing will say.*

A staged build leaves the product wrong on purpose between stages.
That is sound engineering and confusing teaching. Where a lesson ends
with a half-built artifact, the lesson must state which parts are
still wrong, name the lesson that fixes each one, and say what the
wrong state looks like from the outside. A reader cannot tell a
planned gap from a mistake by looking at the artifact.

The same rule caught record 0019, where a checkpoint had no step
behind it. Both are failures of the same kind. The checkpoint is a
contract about what the reader will observe, and every line of it
must match what the machine actually does.

A related check applies to commands used as evidence. Prefer a command
that reports a pass and a fail as two different successful outputs.
`ls -l` on a directory answers in both cases. `wc -c` on a file that
should not exist answers only in one.

## Related

- Record 0005 — the clone also copies the memory files.
- Record 0019 — a checkpoint with no step behind it.
- Lesson 25 — the lesson corrected here.
- Lesson 28 — the lesson that replaces `SOUL.md`.
