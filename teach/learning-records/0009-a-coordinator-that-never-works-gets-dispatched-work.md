# A coordinator that never works still gets dispatched work

The Lesson 16 run finished its real job. All three children reached
`done`, `jokot/streak-log` went public, `STREAK_PAT` reached the Actions
secret store, and two `daily-keep` workflow runs came back green. Then the
board grew three tasks nobody asked for.

```
▶ t_f309882a  ready   crazydave  Execute kanban task t_543d3b93
? t_b63b4df5  triage  crazydave  Work kanban task t_543d3b93 per user instruction
? t_9917d2a7  triage  crazydave  Handle worker protocol request for t_543d3b93
```

All three refer to `t_543d3b93`, the root task. Crazy Dave created all
three, at 20:37 and 20:38, while `t_543d3b93` sat in `running` with Crazy
Dave as its assignee.

## What happened

The root task's event log gives the sequence. At 16:18 the auto-decomposer
recorded `root_assignee: crazydave`. At 20:37, after the last child
completed, the root was `promoted` and then `claimed` on run 5. The
dispatcher spawned Crazy Dave as a worker and sent it the worker protocol
message.

Crazy Dave's `SOUL.md` hard rule said every message becomes a kanban task.
Nothing in that rule distinguished a dispatch from the board from a
Telegram message from Jokot. So Crazy Dave obeyed the rule it had and filed
a task about the work instead of doing the work. The body of `t_b63b4df5`
records the confusion in its own words: "User provided a kanban worker
protocol message stating task t_543d3b93 is still running."

Crazy Dave read the board as a user. Each nudge produced another task.

## The contradiction underneath

Lesson 12 defined Crazy Dave as a profile that never does specialist work.
Lesson 15 then set `orchestrator_profile: 'crazydave'` in all three
profiles, which makes Crazy Dave the assignee of every root task after
`decompose` fans it into children. A root task wakes when its children
finish, and waking means someone must read the results and close it.

So the two lessons disagreed. One says Crazy Dave never works. The other
hands Crazy Dave a task. Neither is wrong on its own, and the gap between
them stayed invisible until a root task actually completed for the first
time.

Fix: a second exception in `SOUL.md`, stating that a worker protocol
message is not Jokot, and that the task in hand gets done rather than
refiled. The `orchestrator_profile` setting stays as Lesson 15 wrote it.
Closing a root task is coordinator work, not specialist work, so the
setting was right and the boundary wording was incomplete.

## Generalizes

This is the third `SOUL.md` correction on the same profile, and all three
share one shape. Lesson 12's first draft had no exception for "who are
you", so an identity question became an orphan task. Its second draft never
said `triage`, so every task landed unreachable by the dispatcher. This
draft never said which sender it was answering.

A hard rule written against one input channel breaks on the second channel.
Crazy Dave's rule was written while Telegram was the only way in. The board
became a second way in at Lesson 15, and the rule never learned about it.
Before writing "every message", ask how many senders can reach this agent.

See [[0008-blocked-child-tasks-report-to-nobody]] for the notification
defects found in the same run.
