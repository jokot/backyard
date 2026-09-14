# 0036 — A block that was not a failure

**Date:** 2026-09-14
**Stage:** 4, live board, Connect Four
**Status:** Understood. No code change needed.

## What happened

Jokot asked Torchwood for a prompt, sent the prompt to the General
topic, and watched Crazy Dave decompose it into child tasks. Minutes
later he wrote:

> and now the task is blocked / help me to redolve it

The same message arrived three times on 14 September 2026, for three
different tasks. Every one of the three was finished work.

## The evidence

The blocked event carries the reason the worker wrote:

```
17:28:35  t_8e9c7cfb  review-required: index.html + style.css built and
                      verified (42 cells, contract ids, responsive CSS)
17:32:38  t_34115dfd  review-required: Connect Four logic in
                      /Users/jokot/dev/connect-four/game.js implemented
                      and 24/24 Node checks pass
18:09:47  t_1fb4f81c  review-required: Created index.html, style.css,
                      game.js, test.js in /Users/jokot/dev/connect-four
```

Every reason begins with `review-required`. The failure counters are
empty for all three:

```
task_id     status    consecutive_failures  last_failure_error
t_8e9c7cfb  archived  0                     NULL
t_34115dfd  archived  0                     NULL
t_1fb4f81c  done      0                     NULL
```

Zero failures and a NULL error mean the worker hit no error. It stopped
because it was told to stop.

## Root cause

The instruction is in the worker skill. Read
`~/.hermes/profiles/peashooter/skills/devops/kanban-worker/SKILL.md`
line 53:

> For most code-changing tasks, the work isn't truly *done* until a
> human reviewer has eyes on it. Block instead of complete, with
> `reason` prefixed `review-required: ` so the dashboard surfaces the
> row as needing review. Reviewer either approves and runs
> `hermes kanban unblock <id>` (which re-spawns you with the comment
> thread for any follow-ups) or asks for changes via another comment.

Line 72 states the opposite case:

> Use `kanban_complete` only when the task is genuinely terminal.

So `blocked` is the normal ending for a code task, and `done` is the
exception. One word carries two meanings on this board. A worker that
crashed is blocked. A worker that finished and wants a reader is also
blocked.

The board shows the word and hides the difference.

## The fix

No code changes. The design is correct, and the reading was wrong. Read
three fields before you treat a block as a fault:

1. The reason. A `review-required` prefix means the work is finished.
2. `consecutive_failures`. A zero means no attempt ever failed.
3. `last_failure_error`. A NULL means no error was ever recorded.

When all three say the work is finished, you are the missing step. Read
the handoff comment, check the claims yourself, then run:

```
hermes kanban unblock <id>
```

Check the claims against the repository, never against the comment. For
task `t_1fb4f81c` the comment claimed that `node test.js` passes. The
directory held a passing suite of eight checks, and an earlier comment
on a sibling task had claimed twenty-four. Both claims were true when
they were written, and they described two different directories.

## Generalization

*A word that covers two states hides the difference between them.* This
board writes `blocked` for a crash and for a finished handoff. Always
read the field that separates them, never the status alone.

*A stuck board is usually a board waiting for a person.* Three tasks in
one afternoon looked broken, and every one was complete. Before you
debug the machine, check whether the machine is waiting for you.

*Read the skill file that produced the behaviour.* The reason string is
a quotation from a file on disk. The file states the rule, the exception,
and the command that resumes work. One `grep` in the skill directory
answers the question that an hour of log reading does not.

*Verify a handoff against the product, not the report.* A worker reports
what it did. The repository holds what exists. Record 0011 shows how far
those two drift apart.

## Related

- Record 0035 — why no message announced any of these three blocks.
- Record 0011 — a report that was true when it was sent.
- Record 0008 — blocked child tasks that reported to nobody.
