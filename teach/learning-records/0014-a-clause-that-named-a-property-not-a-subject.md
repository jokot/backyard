# A clause that named a property, not a subject

The board questions exception from Lesson 20 worked, and then it failed on
the next message. Both messages were about the same 19 tasks. Only one of
them got an answer.

```
23:24  What's on the board right now?
       → hermes kanban list → "19 tasks, all completed", no task created

23:25  list it one by one
       → hermes kanban list → all 19 named with assignees, no task created

23:26  which one do you think it's a noise task
       (not an actual software engineering task)
       → hermes kanban create "Identify the noise task among board tasks
         and justify the call" → t_a8886bb1, assigned to sunflower,
         completed 23:29
```

The third message was a Telegram reply to Dave's own list. Every task it
asked about was on the screen. Dave still filed it.

## The clause

```
Exception — board questions: a message that asks about the state of work
already on the board.
```

The word is `state`. A state is a status: ready, in progress, done. "Which
of these does not belong" is not a status of anything. It is a judgement
about the contents. The message fell outside the exception, so the hard
rule took it, and the hard rule did exactly what it says.

Dave was not wrong. Reading the transcript shows a model working the rule
it was given: message 248 arrives, Dave tries
`hermes kanban create --title "Identif..."`, gets a usage error, runs
`hermes kanban --help`, then `hermes kanban create --help`, then files the
task with the title as a positional argument. That is four turns of effort
to obey a clause that should never have applied.

## The fix

The replacement names the subject rather than a property of it.

```
Exception — board questions: a message about the board and the tasks on
it. This covers their status, their content, their assignees, what
happened inside them, how they group, and which of them look wrong. Read
the board, then answer from what you read. Give your own judgement when
the message asks for one. Do not create a task.

Two limits on this exception. The message must be about the board: a
request to build, write, fix, or plan something new is not a board
question, even when it mentions the board. Answering must change nothing:
if the message asks you to archive, edit, close, assign, or run anything,
the HARD RULE applies.
```

The two limits carry the safety argument the removed sentence used to
carry. The first limit stops a work request from hiding inside a board
question. The second stops a group chat from becoming a way to change the
board. Both are mechanical. Neither asks the model to judge how important a
request is.

## What generalizes

A rule that names a property of its subject only fires for that property. A
rule that names the subject fires for the whole subject. `state of work`
covers status and nothing else. `about the board and the tasks on it`
covers status, content, assignees, history and judgement.

Prefer the subject, then add limits. The limits are visible, testable, and
easy to argue about. A narrow noun is none of those things, because it
looks correct until the second question arrives.

This is the second time one clause in this file needed a second pass, and
both passes came from a real message rather than from review. See
[learning record 0013](0013-a-restart-does-not-erase-a-precedent.md) for
the first, and [Lesson 20](../lessons/0020-dave-answers-the-room.html) for
the current wording.

## Closed on 2026-09-16

Every kanban action in this run went through the `terminal` tool, not the
kanban tool. The gateway log records `_check_kanban_mode returned False` on
those turns, which is why Dave guessed at CLI flags and read
`hermes kanban create --help` in the middle of a conversation. The
`SOUL.md` says "using the kanban tool". The two do not agree yet.

The two agree now. The profile of Crazy Dave was missing `kanban` in its
`toolsets` list, which is the only door for a profile that no dispatcher
spawned. See
[record 0044](0044-a-tool-that-was-never-turned-on.md).

## Superseded in part

The second limit quoted above named `archive` as a hard-rule verb. That
part lasted one day. A request to archive noise tasks produced task
`t_bc7c0f90` instead of an archive command, which is one more task rather
than one fewer. Crazy Dave owns the board, so maintenance of the board is
its own work. See
[learning record 0015](0015-the-line-between-work-and-maintenance.md) and
[Lesson 21](../lessons/0021-the-exception-that-changes-something.html) for
the replacement. The first limit, and the widening this record describes,
stand unchanged.
