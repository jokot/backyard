# 0039 — A test task that named no defect

**Date:** 2026-09-14
**Stage:** 4, Lesson 29, test 3
**Status:** Fixed in Lesson 29 and in the plan.

## What happened

Jokot posted test 3 of Lesson 29:

```
write me a prompt for the tetris score bug, and skip the Constraints section
```

Torchwood replied with one question:

```
Goal — what score behavior is wrong, and what score should the game show instead?
```

The question has no honest answer. No score bug exists in
`projects/tetris`.

## The check that found no defect

Every scoring rule of `SPEC.md` matches `game.js`:

| SPEC.md rule | game.js | Match |
| --- | --- | --- |
| line 65, soft drop scores 1 for each row | line 275, on success only | yes |
| line 66, hard drop scores 2 for each row | line 286 | yes |
| line 72, `[100, 300, 500, 800]` times level | line 205 | yes |
| line 73, `level = 1 + floor(lines / 10)` | line 150 | yes |
| line 78, reset to 0, 0 and 1 | lines 214 to 216 | yes |

The suite agrees:

```
$ node projects/tetris/test.js
RESULT  20/20 checks passed
```

## Root cause

The test task was written to exercise one feature of the profile. The
feature is the per-prompt override, and the task was a vehicle for it.
Nobody checked the vehicle against the repository.

This is the second time in one lesson. Test 1 first named the fizzy CLI,
whose source is absent from this machine, so Torchwood asked which
repository held it. Test 3 named a defect that the repository does not
hold, so Torchwood asked which behaviour was wrong. The two tasks fail
for one reason in two costumes. An interview ends in a prompt only when
the work has a destination, and neither task had one.

The agent behaved correctly both times. A question is the honest output
when a premise is false.

## The fix

Test 3 now names a gap that exists:

```
write me a prompt for the missing level multiplier test in projects/tetris, and skip the Constraints section
```

`test.js` line 188 asserts that a one-row clear scores 100. That is 100
multiplied by level 1, so the multiplication is invisible. No line of
`test.js` assigns `game.level` or `game.lines` before a clear:

```
$ grep -n '\.level *=' projects/tetris/test.js
(no output)
```

So the multiplier is never measured above level 1. The destination is
`projects/tetris/test.js`, which exists, and the check that test 3
actually performs stays the same.

Lesson 29 now carries a warning box that holds the failed reply and the
evidence above. The plan carries the same correction at step 7 of task 5.

## Generalization

*A task invented to exercise a feature still has to be true.* The
premise is not scenery. The agent reads it, tests it, and stops when it
fails.

*Check a premise against the code before you post it.* One `grep` and
one test run answered this in under a minute. The same minute before the
test would have prevented the failure.

*The same defect wears different costumes.* An absent repository and an
absent defect are one fault, which is a task with no destination. Name
the fault once, then check every remaining task against that name.

*A question from an agent is data about the task.* Torchwood asked
rather than inventing a bug. Read the question as a report on the input,
not as a failure of the agent.

## Related

- Record 0034 — test 1 of the same lesson, a path that lost a segment.
- Record 0029 — the first version of test 1, which named absent source.
- Record 0037 — another prompt whose premise nobody checked.
