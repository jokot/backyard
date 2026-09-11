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

## Second finding, from the same run

The reader read the quiz of Lesson 25 after meeting the renamed bot,
and reported the question as wrong. The reader was correct.

The question stem read:

> You clone Torchwood from Peashooter, start its gateway, and send it a
> message. Replies begin arriving from Peashooter instead. What is the
> cause?

The marked answer was the shared token. The stem holds two faults.

**Fault 1. The stem describes the wrong symptom for its own answer.**
When two profiles hold one token, there is one bot account and no
second sender. No reply can arrive "from Peashooter instead", because
every reply arrives from the only bot. The real symptom of a shared
token is message loss. Telegram gives each update to one poller, so
about half the messages reach the gateway that the reader did not
intend, and the reader sees silence.

**Fault 2. The stem describes the symptom of a different cause.** A
reply that presents itself as Peashooter is the `SOUL.md` carry-over,
which Lesson 28 fixes. The quiz named that symptom and marked a
different cause as the right answer. A reader who had met the real
behavior would mark the quiz wrong, which is what happened.

A third, smaller error sat in the feedback text. It named the flag
`--clone`. Every command in the lesson uses `--clone-from`.

### Fix

Question 1 now states the symptom that a shared token actually
produces. Half of ten messages receive no reply, and the replies that
arrive do not share one voice. Distractor (b) is now the `SOUL.md`
cause, and its feedback states that the claim is true and that it
explains a different symptom.

Question 2 is new. It presents the renamed bot and asks for the cause,
so the lesson teaches both carry-overs and keeps them apart.

### Generalization

*Write the symptom, not the cause in disguise.* A question stem that
paraphrases its own answer tests recall of the lesson text. A stem
that states what the reader would observe tests the model the reader
built. The second kind fails loudly when the model is wrong, which is
the point.

*A distractor must be reachable in reality, and it must be wrong for a
stated reason.* A distractor that is true about the system, and wrong
only about this symptom, is worth more than an invented falsehood. It
forces the reader to separate two real causes instead of scanning for
the odd sentence.
