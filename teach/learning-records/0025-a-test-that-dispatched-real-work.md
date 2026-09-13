# 0025 — A test that dispatched real work

**Date:** 2026-09-14
**Stage:** 4, Lesson 27
**Status:** Fixed in the lesson and in the plan.

## What happened

Lesson 27 tested whether the decomposer sends prompt-shaped work to
Torchwood. The corrected step 3 told the reader to create a triage
task, and step 4 told the reader to run `hermes kanban decompose` by
hand.

The reader created the task and reported the board before running
`decompose`:

```
t_2c9f7149  todo      crazydave    write a prompt for the flappy refactor, then appy the prompt
t_db020b96  running   sunflower    Write the refactor prompt for the flappy codebase
t_7ae96c4d  todo      peashooter   Apply the flappy refactor prompt to the codebase
```

The task was already decomposed, and one child was already running.
The audit comment names the actor:

```
[00:18] auto-decomposer: Decomposed into t_db020b96, t_7ae96c4d.
```

## The test result

The routing was correct. Two children carry `sunflower` and
`peashooter`. No child carries `torchwood`, in a task whose title
holds the word prompt twice. The description of Torchwood does the job
that Lesson 27 claims for it.

## Root cause of the defect

Two faults, and both come from writing the test as though the board
were idle.

**Fault 1. The manual step is unreachable.** Every profile runs
`auto_decompose: true` with `auto_decompose_per_tick: 3` and
`dispatch_interval_seconds: 60`. A task in triage is decomposed within
one minute by whichever gateway ticks first. A reader cannot win that
race by typing, so `hermes kanban decompose` is a fallback and not the
method.

**Fault 2. The test started real work against a real project.** The
second child, `t_7ae96c4d`, is a live instruction to refactor the code
in `projects/flappy`. It was waiting only for its sibling. The lesson
had one archive step at the end and no stop step, so a reader who
followed the lesson exactly would have let it run.

Lesson 27 treated the board as a test fixture. It is the production
board of three working agents.

## Fix

Step 3 now tells the reader to read the stop procedure before creating
anything. Step 4 creates the task and states that the reader has about
60 seconds. Step 5 reads the result from `show` and `list`, and offers
the manual `decompose` only when a full minute passes with one event.

Step 6 is new, and it has an order:

```bash
hermes kanban block <child_id> "Lesson 27 routing test, not real work"
hermes kanban reclaim <running_child_id>
hermes kanban archive <root_id> <child_id> <child_id>
```

Block before archive. Archiving a task that a worker holds leaves the
worker running against a task that is no longer on the board.

A warning box now carries the real board output from this run, and
tells the reader to read the titles of the children as soon as they
appear. A child that only writes text may finish. A child that changes
files must be stopped.

## Generalization

*A test on a live system is an instruction to that system.* Writing a
test task on a working board is not observation. The board acts on it
within one dispatch interval, and the work is as real as any other
work. Before writing such a test, answer one question: what does the
system do if I walk away now?

*Where automation and a manual step compete, the automation wins, and
the lesson must teach the automation.* A step that says "do this by
hand so you can watch it" is fiction when a timer does the same thing
every 60 seconds. Teach the reader to read what the machine did, and
keep the manual command as the branch for when nothing happened.

This pairs with record 0024, from the same lesson and the same run.
That record covers a test that never ran. This one covers a test that
ran further than intended. Both come from one habit, which is writing
a procedure from a mental model of the system rather than from the
system.

## Related

- Record 0024 — a test that never ran.
- Record 0023 — a setting written to the wrong file.
- Record 0011 — a report that was true when it was sent.
- Lesson 27 — the lesson corrected here.
