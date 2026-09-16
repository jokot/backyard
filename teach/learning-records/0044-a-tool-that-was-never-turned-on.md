# 0044 — A tool that was never turned on

**Date:** 2026-09-16
**Stage:** 4, cleanup of items carried from Stage 3
**Status:** Active. This record closes the open item of
[record 0014](0014-a-clause-that-named-a-property-not-a-subject.md).

The `SOUL.md` of Crazy Dave said "using the kanban tool" since Stage 3.
Crazy Dave never called the kanban tool. Every board action went through
the `terminal` tool instead, so Crazy Dave guessed at flags and read
`hermes kanban create --help` in the middle of a conversation.

## What the machine shows

One function decides whether the kanban tools exist for a profile.
`tools/kanban_tools.py:52` holds it:

```python
def _profile_has_kanban_toolset() -> bool:
    try:
        from hermes_cli.config import load_config
        cfg = load_config()
        toolsets = cfg.get("toolsets", [])
        return "kanban" in toolsets
    except Exception:
        return False
```

Two gates call it. `_check_kanban_mode()` at line 65 opens ten tools.
The ten include `kanban_create`, `kanban_show`, `kanban_comment`,
`kanban_complete`, `kanban_block` and `kanban_heartbeat`.
`_check_kanban_orchestrator_mode()` at line 82 opens exactly two more,
which are `kanban_list` and `kanban_unblock`. Hermes hides those two from
a dispatched worker on purpose, because a worker owns one task and never
reads the whole board.

Both gates return True at once for a dispatched worker, because the
dispatcher sets `HERMES_KANBAN_TASK`. Crazy Dave is not a dispatched
worker. Crazy Dave reads a chat message, so the environment variable is
absent and the toolsets list is the only door.

The default toolsets list is `["hermes-cli"]`, from
`hermes_cli/config.py:983`. Crazy Dave held the default. The word
`kanban` was never in it.

## The fix

Add one entry to `toolsets` in
`~/.hermes/profiles/crazydave/config.yaml`:

```yaml
toolsets:
  - hermes-cli
  - kanban
```

Edit the file with a text editor. Do not use `hermes config set`, for the
two reasons in the last section of this record. Read the value back with
the command that only reads:

```bash
hermes -p crazydave config get toolsets
```

The upstream documentation states the same rule at
`website/docs/user-guide/features/kanban.md:270`: "The same toolset is
also available to orchestrator profiles that enable `kanban` in their
toolsets config."

No gateway restart is needed. The comment at `kanban_tools.py:53` states
why. `load_config()` caches on file modification time, and the tool
registry caches the gate result for about 30 seconds.

## Proof against the real machine

The gate was called directly, once for each profile, with
`HERMES_HOME` set to the profile directory:

```
crazydave    toolset=True  kanban_mode=True  orchestrator=True
peashooter   toolset=False kanban_mode=False orchestrator=False
torchwood    toolset=False kanban_mode=False orchestrator=False
```

Peashooter needs no entry. A dispatched worker receives the lifecycle
tools from `HERMES_KANBAN_TASK` at spawn time. Torchwood must never
receive one, because the `SOUL.md` of Torchwood forbids every board
change.

## Three checks that ran before the change

The first check asked whether the change revives the defect of
[record 0010](0010-a-fix-that-amplified-the-defect.md). The kanban tool
calls `_maybe_auto_subscribe` at `kanban_tools.py:1179` on the
`kanban_create` path. That function is gated by
`kanban.auto_subscribe_on_create`. All four profiles already set that key
to False, so no subscription row can return.

The second check asked whether `hermes tools enable kanban` is the
command. It is not. `hermes tools list` names a different set, which
includes web, browser, terminal and file. The `toolsets` key is a
separate list, and `hermes config` is the command that writes it.

The third check asked what the `SOUL.md` of Crazy Dave must change to.
The answer is nothing. Line 85 already reads "using kanban tool". The
machine now matches the soul file, rather than the soul file matching
the machine.

## Two defects found in the command that made the fix

`hermes -p crazydave config set toolsets 'hermes-cli,kanban'` reported
success and printed `✓ Set toolsets = hermes-cli,kanban`. The command
wrote a string, not a list:

```yaml
toolsets: hermes-cli,kanban
```

The gate still passed, because `"kanban" in "hermes-cli,kanban"` is a
substring test in Python and returns True. The value was wrong and the
test could not see it. Any consumer that iterates the list reads single
characters. The file was rewritten by hand as a real list.

The same command also deleted the last 22 lines of `config.yaml`. The
22 lines are one blank line and the 21 lines of the commented
`fallback_model` block. A comment carries no value to a YAML parser, so a
write of the parsed document drops it. The block was restored from a
backup taken before the command.

## What generalizes

**A setting that reports success can still hold the wrong type.** Read
the file after the command writes it. The printed confirmation repeats
the input, not the result.

**A substring test hides a type error.** `in` means one thing for a list
and another thing for a string. A gate built on `in` passes for the
wrong reason and gives no warning.

**A soul file states an intention. A toolsets key performs it.** Record
0014 saw the disagreement and named it on 2026-09-09. The disagreement
then stood for seven days, because nobody asked which file decides.

**Copy the file before a command edits it.** The command that added one
entry also removed 22 lines of documentation. Without the backup, the
loss is invisible.
