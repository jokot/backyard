# 0034 — A path that lost a segment

**Date:** 2026-09-14
**Stage:** 4, Lesson 29, test 1
**Status:** Fixed in Lesson 28, in the plan, and in the repository mirror.

## What happened

Torchwood produced its first complete prompt. The interview worked. It
read TEMPLATE.md with `cat "$HERMES_HOME/TEMPLATE.md"`, found the
project with one `find`, read four files, and asked one question that no
command could answer.

The prompt holds nine paths. Five are correct. Four name a file that
does not exist.

| Heading | Path | Real |
|---|---|---|
| Goal | `/Users/jokot/dev/plants/projects/tetris/test.js` | yes |
| Context | `.../projects/tetris/game.js` | yes |
| Context | `.../projects/tetris/SPEC.md` | yes |
| Context | `.../projects/tetris/index.html` | yes |
| Constraints | `.../projects/tetris/test.js` | yes |
| Rollback | `/Users/jokot/dev/plants/tetris/test.js` | no |
| Deliverable | `/Users/jokot/dev/plants/tetris/test.js` | no |
| Done when | `/Users/jokot/dev/plants/tetris/test.js` | no |
| Done when | `/Users/jokot/dev/plants/tetris/test.js` | no |

Every wrong path drops the same segment, `projects/`.

The Rollback command fails:

```
$ git restore -- /Users/jokot/dev/plants/tetris/test.js
error: pathspec '/Users/jokot/dev/plants/tetris/test.js' did not match
any file(s) known to git
```

## The pattern in the failure

The first three headings hold correct paths. The last three headings
hold wrong paths. The error starts at heading four and never stops.

Torchwood wrote the correct path five times, then wrote a shortened
version four times. Nothing in the interview introduced the short form.
No command printed it. The `Checked:` trailer lists twelve commands, and
every one of them names `projects/tetris`.

So the agent did not read the wrong path anywhere. It generated the path
from memory while it wrote the later headings, and it lost one segment.

## Root cause

`SOUL.md` already carries the rule that catches this:

> Every path that appears in the prompt must trace to one of those
> commands.

The rule states a requirement. It states no method. The agent that
believes it satisfied the requirement never tests the belief, because
the file never says to test it.

This repeats the shape of [record 0033](0033-a-path-that-sat-in-memory.md).
There, a prohibition without a method produced the prohibited act. Here,
a requirement without a method produced the unmet requirement.

The `Checked:` trailer measures the wrong thing. It records the commands
that the agent ran during the interview. It never compares those commands
against the finished text. An agent can write a true trailer above a
false prompt.

## The fix

Four sentences after the trailer rule in `SOUL.md`:

```
Check every path before you send. Run ls on each path in the prompt that
the work does not create. If ls reports no such file, correct the path.
Add that ls to the Checked: trailer. Write a path once, then copy it into
every later heading.
```

Three reasons this works.

`ls` already sits in the permitted command list, so the rule needs no new
permission.

The check runs against the finished text, not against the interview. It
turns the trailer from a record of the past into a test of the output.

The last sentence removes the cause. A path that the agent copies cannot
lose a segment. A path that the agent retypes can.

## Why the test still taught something

Checks 1, 2 and 3 of Lesson 29 test 1 pass. The reply is one message
with one fenced block. The six headings match TEMPLATE.md in file order.
The trailer lists real commands.

Check 4 exists for exactly this failure, and check 4 caught it. The
lesson did its job. The soul file did not.

Every factual claim in the prompt is also true. `game.js` lines 456 to
459 map both `p` and `P` to `togglePause()`. `test.js` touches
`game.paused` six times and never calls `togglePause()`. `node test.js`
runs without a browser and prints `RESULT  20/20 checks passed`.

The prompt is correct work with four broken addresses.

## Generalization

*A requirement without a method produces the unmet requirement.* This is
the twin of record 0033. Both rules named an outcome. Neither named a
command. State the check, then state how to run the check.

*A record of the process is not a test of the product.* The `Checked:`
trailer lists what the agent did. It proves nothing about what the agent
wrote. Verify the artifact, never the history.

*Copy a value, never retype it.* The agent wrote the correct path five
times before it wrote a wrong one. Repetition is where a long output
drifts. Write once, then copy.

*Read the position of an error, not only the error.* Five correct paths
then four wrong paths is drift during generation. Nine wrong paths would
be a wrong input. The position named the cause.

*A partial pass is a pass on the parts you tested.* Three checks passed
and hid a prompt that cannot run. Score every check, then report the one
that failed.

## Related

- Record 0033 — a prohibition without a method, from the same test.
- Record 0031 — a prompt that shipped with no path at all, which the
  trailer rule was written to stop.
- Lesson 28 — the lesson corrected here.
- Lesson 29 — the lesson whose check 4 caught the failure.
