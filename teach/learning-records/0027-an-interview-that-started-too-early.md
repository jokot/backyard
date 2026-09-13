# 0027 — An interview that started too early

**Date:** 2026-09-14
**Stage:** 4, Lesson 28
**Status:** Fixed in `SOUL.md`, in the lesson, and in the plan.

## What happened

The reader replaced the soul file of Torchwood, restarted the gateway,
and posted one message in the `Prompts` topic:

```
who are you
```

Torchwood replied:

```
📖 Reading TEMPLATE.md L1-200
TEMPLATE.md does not exist at /Users/jokot/.hermes/profiles/torchwood/TEMPLATE.md.

What task should I turn into a finished prompt?
```

The question was never answered. The reader asked about the agent and
received the first question of an interview about a task that nobody
named.

## What passed

Two rules worked on their first run.

The missing-file rule fired and produced the exact sentence it asks
for. Record 0026 added that rule one hour before this run.

The path resolved. The agent read
`/Users/jokot/.hermes/profiles/torchwood/TEMPLATE.md`, which matches
the working directory that `lsof -a -p 39228 -d cwd` reports for the
gateway process.

## Root cause

The soul file of Torchwood says when an interview ends. It never says
when an interview starts. With no start condition, every message is the
start.

Crazy Dave carries the missing rule already, at `SOUL.md` line 53:

```
Exception — small talk: a message that only greets, thanks, or
acknowledges, and asks for nothing. Reply in one short sentence. Do not
create a task.
```

That exception was written for a coordinator, so it names the wrong
consequence for a prompt specialist. Crazy Dave must not create a task.
Torchwood must not start an interview. I wrote the new soul file from
the duties of the role and not from the exceptions that three earlier
profiles had already earned.

## Fix

One paragraph, placed before the interview rules:

```
Exception — a message that only greets, thanks, or asks who you are.
Answer it in one or two sentences. Do not read TEMPLATE.md, and do not
start an interview. An interview starts when Jokot names a task.
```

The smoke test in Lesson 28 now sends two messages rather than one. The
first is `who are you`, which must not start an interview. The second
is `write me a prompt`, which must.

## Generalization

*State the start condition of a mode, not only the end condition.* The
file said "stop asking when you can fill every required heading" and
said nothing about the first message. A mode with an exit and no
entrance is always on.

*The exceptions of an earlier profile are a checklist for the next
one.* Record 0015 counts seven edits to the soul file of Crazy Dave,
and each edit came from one real message. Those seven cover identity,
small talk, and questions that look like work. A new profile inherits
the same message traffic, so reading the earlier exceptions costs one
minute and saves one round trip.

Torchwood now has one edit. It came from one real message, exactly as
the seven did.

## Related

- Record 0015 — the line between work and maintenance, and the edit count.
- Record 0022 — a clone that answered to the wrong name.
- Record 0026 — an instruction to read a missing file.
- Lesson 28 — the lesson corrected here.
