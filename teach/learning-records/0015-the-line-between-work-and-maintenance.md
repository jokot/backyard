# The line between work and maintenance

Learning record 0014 widened Crazy Dave's board questions exception and
closed it with two limits. The second limit read:

```
Answering must change nothing: if the message asks you to archive, edit,
close, assign, or run anything, the HARD RULE applies.
```

That limit worked as written, and the result was wrong.

```
23:41  which one is noise?    → answered, 6 task ids named, no task created
23:41  any others?            → answered, 6 more ids named, no task created
23:41  can you remove it?     → hermes kanban create "Remove noise ta..."
                              → t_bc7c0f90
```

A request to remove six junk tasks produced a seventh junk task. The
coordinator filed work with a specialist to delete work that no specialist
had asked for.

## Why the limit was drawn wrong

The limit separated reading from writing. That line is easy to state and it
does not match the system. Crazy Dave owns the board. Lesson 15 sets
`orchestrator_profile: 'crazydave'`, and learning record 0009 already made
Crazy Dave complete root tasks on the board as dispatched work.

The line that matches the system is different: **work for the team goes to
the board, and maintenance of the board stays with the coordinator.**
Archiving a task produces no deliverable. No specialist would produce
anything by doing it. Routing it adds a row instead of removing one.

## Why the new exception carries four limits

The board questions exception carries two limits, and both come from what
can go wrong in a conversation. Archive is different, because it changes a
shared database. Its limits come from one function. All four facts below
are in `hermes_cli/kanban_db.py`.

1. `archive_task` at line 5542 sets `status = 'archived'`.
   `promote_task` at line 5092 accepts only a `todo` or a `blocked` task.
   No command returns a task from `archived`. The change is terminal.
2. The same update clears `claim_lock`, `claim_expires` and `worker_pid`,
   then closes any open run with outcome `reclaimed`. Archive is therefore
   also the cancel command. Nothing in that function signals the worker
   process that Hermes already started.
3. `archive_task` ends with `recompute_ready`, above the comment "archived
   parents no longer block children, same as done". Archiving a parent
   releases its children, and the dispatcher spawns workers for them within
   one minute. On this board, archive can start work.
4. `--rm` calls `delete_archived_task`, which removes the row and its
   related rows permanently.

The four limits map one to one: name the ids before the command runs
because fact 1 gives no second chance, ask when no task is named for the
same reason, never run `--rm` because of fact 4, and check for a `children`
line with `hermes kanban show` because of fact 3.

## What generalizes

Draw the boundary from ownership, not from the shape of the operation.
"Read is safe, write is not" is a tempting rule and it put a delete request
on the queue as a feature request. Ask instead who owns the thing being
changed.

Then set the limits from the implementation, not from the conversation. The
conversational limits in record 0014 protect against a misread sentence.
These limits protect against a database function that unblocks children as a
side effect. A destructive verb earns the second kind, and reading twenty
lines of SQL is the cheapest way to find them.

## Count of edits

Crazy Dave's `SOUL.md` has now changed seven times: identity questions,
`triage`, dispatched work, small talk, board questions, judgement about the
board, and board maintenance. Every change came from one real message, not
from review.

That count is the price of an enumerated rule. A rule that says "use your
judgement" never needs an edit and gives no guarantee, which
[learning record 0004](0004-soft-instructions-lose-to-prompt-size.md)
measured on a real model. A rule that names moments is testable, so each
gap appears as one specific message that behaved wrong. The list converges
through use. Do not read the edit count as instability.
