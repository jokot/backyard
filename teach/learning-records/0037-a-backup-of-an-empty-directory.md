# 0037 — A backup of an empty directory

**Date:** 2026-09-14
**Stage:** 4, live board, Connect Four
**Status:** Open. The cause of the deletion is unconfirmed.

## What happened

The Connect Four prompt carried a Rollback section. It named one
command:

```
cp -a /Users/jokot/dev/connect-four /Users/jokot/dev/connect-four.bak
```

Sunflower ran it. The command succeeded, and the backup is empty:

```
$ ls -la /Users/jokot/dev/connect-four.bak
total 0
drwxr-xr-x@  2 jokot  staff   64 Sep 14 17:51 .
drwxr-xr-x  32 jokot  staff 1024 Sep 14 17:54 ..
```

Two birth times explain it:

```
/Users/jokot/dev/connect-four      born 2026-09-14 17:51:52  inode 124441701
/Users/jokot/dev/connect-four.bak  born 2026-09-14 17:51:52  inode 124443158
```

The source directory and its backup were born in the same second. The
copy ran against a directory that had existed for no time at all, so it
copied nothing.

## The work that the backup should have held

Two tasks finished before 17:36 and blocked for review. Their comments
named files in `/Users/jokot/dev/connect-four`, and one claimed 24 of 24
Node checks pass. I listed that directory at 17:36 and its files were
there.

The directory that exists now has inode 124441701 and a birth time of
17:51:52. That is a different directory with the same name. The tasks
were archived at 17:38:33. The reviewed work is gone.

No agent log holds the `rm`. I read every log under
`~/.hermes/kanban/logs/` and none records a delete of that path. The
first prompt's Rollback section named
`rm -rf /Users/jokot/dev/connect-four`, and Jokot may have run it by
hand. He has not confirmed that, so this record states the deletion and
not the deleter.

## Root cause

The Rollback section stated a command and stated no precondition.

`cp -a` reports success for an empty source. The exit status is 0, the
destination exists, and the output is silent. Every signal the agent can
read says the safety step worked.

The prompt asked an agent to protect work that the prompt also told it
to create. Those two instructions cannot both hold at the start of a
greenfield task. Nobody noticed, because the backup command reads as
correct in isolation.

## The fix

A Rollback section must state what it restores, and the restore must be
testable before the work begins.

Write the precondition into the command, so the step fails loudly when
there is nothing to protect:

```
test -n "$(ls -A /Users/jokot/dev/connect-four 2>/dev/null)" \
  && cp -a /Users/jokot/dev/connect-four /Users/jokot/dev/connect-four.bak \
  || echo "nothing to back up: directory is absent or empty"
```

Then verify the backup by its contents, never by its existence:

```
ls -1 /Users/jokot/dev/connect-four.bak | wc -l
```

For a greenfield task the honest Rollback is the delete, and it needs no
backup at all. Write that instead of a copy that protects nothing.

## Generalization

*A precondition that nobody checks turns a safety step into theatre.*
The command ran, the exit status was 0, and the protection was zero. A
safety step is finished when its restore is proven, not when its command
succeeds.

*Count what a copy produced.* `cp -a` of an empty directory is a success
by every signal a shell gives. Read the destination, not the return
code.

*A greenfield task has nothing to roll back to.* A Rollback that copies
before creation protects an empty room. Match the rollback to the state
that exists when the work starts.

*Record a deletion you cannot attribute as a deletion.* Birth time and
inode prove that a directory was replaced. They name no process. State
the proven fact and leave the actor open until someone confirms it.

## Related

- Record 0034 — the same prompt generator, a different unverified claim.
- Record 0038 — another failure whose only symptom was silence.
- Record 0011 — a report that was true when it was sent.
