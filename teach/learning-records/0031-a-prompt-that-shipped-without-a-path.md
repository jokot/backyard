# 0031 — A prompt that shipped without a path

**Date:** 2026-09-14
**Stage:** 4, Lesson 29
**Status:** Fixed in Lesson 28 and in the plan.

## What happened

Jokot asked Torchwood for a prompt about the Fizzy command line tool:

```
I want to add a --description flag to fizzy card create
```

Torchwood searched, read `MEMORY.md` and `USER.md`, ran `git status` in
`/Users/jokot/dev/plants`, and then sent a finished prompt. Two of its
six sections held no path:

```
## Context
The relevant repository and implementation path have not yet been
confirmed.

## Deliverable
The repository's existing `fizzy card create` implementation, including
its tests and user-facing help or documentation where applicable.
```

`TEMPLATE.md` states the requirement for that heading in one sentence:
"The exact path that must hold the artifact when the work is done."
A worker cannot act on this prompt.

## Root cause

Two rules in `SOUL.md` pointed in opposite directions.

Line 31 said: "Stop asking when you can fill every required heading.
Then send the prompt."

Line 39 said: "If you never confirmed a path, say so in the prompt
rather than listing a command you did not run."

Line 39 grants an escape from line 31. The intent of line 39 was narrow.
A prompt may name a file that does not exist yet, because the work
creates it, and no command can confirm such a path. Torchwood applied
the escape to a different case. It could not find a repository that the
work must change, and it shipped the gap as prose.

The model obeyed the honesty rule and lost the completeness rule. Both
readings of the soul file are correct, which makes this a defect in the
soul file rather than in the reply.

## The second cause

`SOUL.md` on disk still omits `which` and `command -v` from the
permitted command list. Record 0029 recorded that gap, and Lesson 28
carries the repair at line 55, but the live file at
`~/.hermes/profiles/torchwood/SOUL.md` lines 7 and 8 does not.

The cost is visible in the transcript. Torchwood ran `ls -la /Users/jokot`,
then a wildcard file search, then two more searches for the string
`fizzy`. One permitted command answers the question:

```
$ which fizzy
/opt/homebrew/bin/fizzy
$ ls -l /opt/homebrew/bin/fizzy
... -> /opt/homebrew/Caskroom/fizzy/4.0.1/fizzy
```

Fizzy is a Homebrew cask binary. No source for it exists on this
machine. With `which`, Torchwood could have written that fact into
Context. Without it, the tool spent four searches and still wrote
"not yet been confirmed".

## Fix

The trailer rule in `SOUL.md` now names the one case the escape covers,
and it closes the other:

```
Never list a command that you did not run. A path for a file that the
work creates needs no command, so mark that path as new. If you cannot
find a path that the work must change, ask Jokot for it. Never send a
prompt whose Context or Deliverable holds no path.
```

Lesson 28 and the plan both carry the new wording.

## Generalization

*An honesty rule and a completeness rule need an order.* A file that
holds both, with no statement of which one wins, lets the agent choose.
The agent will choose the rule that permits an answer over the rule that
demands more work.

*Name the case that an exception covers.* An exception written as a
condition, such as "if you never confirmed a path", matches every
unconfirmed path. An exception written as a case, such as "a file that
the work creates", matches one.

*A missing tool shows as extra work, not as an error.* Torchwood never
reported that `which` was unavailable. It ran four searches instead.
Count the commands in a transcript, and a gap in a permitted list
appears as repetition.

## Related

- Record 0029 — the clone that kept the skills of its parent, where the
  same missing `which` produced a question instead of a command.
- Record 0026 — an instruction to read a missing file.
- Lesson 28 — the lesson corrected here.
