# Stage 2 complete

All four of Stage 2's success criteria verified, closing out the spec
(`docs/superpowers/specs/2026-09-06-stage2-sunflower-crazydave-design.md`):

- Sunflower answers a direct planning or spec message on Telegram in
  character, and declines an off-topic one (Lesson 11).
- A message to Crazy Dave produces a kanban task and never a direct
  answer, with one exception for identity questions and one for kanban
  worker protocol messages (Lesson 12, after
  [[0009-a-coordinator-that-never-works-gets-dispatched-work]]).
- A cross-domain request produces linked child tasks assigned to
  Sunflower and Peashooter. The Tetris run split one request into four
  children across both specialists.
- Two full runs completed end to end, with no `hermes kanban` command run
  by hand during either run.

## The criterion that changed

Criterion 4 named `notify-subscribe` as the reporting mechanism. That
mechanism was removed during Stage 2 and replaced.

Three defects made it unusable. Blocked child tasks reported to nobody
([[0008-blocked-child-tasks-report-to-nobody]]). A subscription row starts
at `last_event_id` 0, so it replays every past event. The gateway deletes a
row after repeated send failures, and any repair that recreates the row
restarts the replay ([[0010-a-fix-that-amplified-the-defect]]).

Stage 2 now reports through `hermes send`, called by the worker that did
the job. The board still queues and routes the work. Only the path from
the database to Telegram changed.

The substance of criterion 4 holds. A completion reaches Telegram without
manual commands. The named implementation does not.

## What the two runs cost

Twelve lessons and five learning records, 0008 through 0012. Every defect
came from running the system and reading real output, never from reasoning
about what should happen.

Two of the five records describe my own mistakes rather than defects in
Hermes. Record 0010 documents a scheduled repair that converted a silent
one-time failure into a message every two minutes for six hours. Record
0011 documents a worker report that was correct when measured and false
fifteen minutes later.

## Generalizes

Stage 1 found bugs in configuration. Stage 2 found bugs in the seams
between parts that each worked alone. A coordinator that never works, an
orchestrator setting that assigns it work, a notifier with two silent
authorization gates, and a repair on a timer are all correct in isolation.

Count the senders that can reach a component, and count the processes that
must stay alive after a check passes. Both counts were greater than one,
and both were assumed to be one.

Next: Stage 3, designed through the same brainstorming process Stage 1 and
Stage 2 went through.
