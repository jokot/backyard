# 0048 — Two words that name the opposite edge

**Date:** 2026-09-17
**Stage:** 5, report command
**Status:** Active. `hermes-report.sh` walks the corrected direction, and
this session ran its card-resolution half against five real worker tasks.

Lesson 32 needed one function, `card_of`, to find the Fizzy card of a
worker task's root task. The board stores two lists on every task,
`parents` and `children`. A first draft chose `parents`, because the word
reads as "the task above me in the tree."

## The direction a real query shows

A query against a root task and one of its workers gives the true shape:

```
t_e6f5dc9f  root    parents: 5 worker ids       children: 0
t_29e6cbb8  worker  parents: ['t_3ce59841']     children: [..., 't_e6f5dc9f']
```

The worker task `t_29e6cbb8` carries its own root id, `t_e6f5dc9f`, inside
`children`, not inside `parents`. Its `parents` list names an earlier
worker, `t_3ce59841`, never a root task.

## Why the first draft found no card

The first draft looped over the `parents` list of the worker task, and
called `card_of` on each id there. A worker's `parents` list holds another
worker or nothing, and only a root task ever carries a `fizzy:<number>`
comment. The loop found no card for any worker task, because it never
reached the one id that could hold one.

## The rule this board obeys

State it in one sentence. A parent must reach `done` before its child
starts, so the child waits on the parent. A root task waits on every one
of its workers, so the root task lists its workers as parents. A worker
therefore reaches its own root task through `children`, never through
`parents`.

The corrected loop walks every id inside the worker task's `children`
list instead, and stops at the first id that carries a fizzy comment. Run
against five real worker tasks this session, it found the correct card
for every one.

## What generalizes

**A word that reads like a tree can name a dependency edge instead.**
`parents` and `children` sound like a family tree, where a child descends
from a parent. This board uses the two words for an ordering constraint,
where a parent finishes first and a child waits. The two readings point
in opposite directions.

**Test the direction before you trust the name.** A field name states an
intention, not a proof. One real query against one root task and one
worker task settled the question that the two words alone could not.

See [record 0043](0043-a-report-that-went-to-the-wrong-room.md), which
found the two tasks that blocked on 14 September 2026 and never reached a
Fizzy card, the gap this record's script closes.

## Confirmed on a second job, 17 September 2026

The card-21 job gives the same shape on four fresh tasks:

```
t_4370e930  parents: ['t_bbfe307d']                         children: ['t_0949c9e5', 't_b9849715']
t_0949c9e5  parents: ['t_4370e930']                          children: ['t_b9849715']
t_b9849715  parents: ['t_bbfe307d','t_4370e930','t_0949c9e5'] children: []
```

The chain reads in one direction. Each task lists every task before it in
`parents`, and every task after it in `children`. The closing task of
Crazy Dave, `t_b9849715`, holds all three workers in `parents` and holds
nothing in `children`, because nothing runs after it.

This sharpens the earlier reading. The two words are not reversed. They
name a dependency edge, and a dependency edge runs in the opposite
direction to descent. A task that waits is the child. A task that others
wait for is the parent. The root task of a decomposed job waits for every
worker, so the root task is the last child, never the first parent.

The schema says the same thing in two columns, and it carries no third
word for hierarchy:

```
task_links: parent_id, child_id
```
