# 0046 — A button that answered a wider question

**Date:** 2026-09-16
**Stage:** 4, cleanup
**Status:** Complete on 2026-09-16. The file holds three entries, and a
restarted gateway proves that the fourth entry is gone.

The `command_allowlist` of Crazy Dave held four entries on 16 September
2026. Two of them arrived from a button press during one task. One of
those two, `recursive delete`, granted far more than the task needed.

## What the machine shows

An entry in `command_allowlist` is a pattern key, not a command.
`tools/approval.py:2172` checks the key:

```python
def is_approved(session_key: str, pattern_key: str) -> bool:
    aliases = _approval_key_aliases(pattern_key)
    with _lock:
        if any(alias in _permanent_approved for alias in aliases):
            return True
```

The key `recursive delete` belongs to the pattern at `approval.py:608`:

```python
(r'\brm\s+-[^\s]*r', "recursive delete"),
```

That regex covers any `rm` with the letter `r` in the flag group, on any
path. The upstream documentation states the effect at
`website/docs/user-guide/security.md:230`: "These patterns are loaded at
startup and silently approved in all future sessions."

Three rules stay outside the reach of the allowlist. `approval.py:434`
to `approval.py:436` hold them, and the comment at `approval.py:505`
states the rule: "Hardline patterns are NEVER bypassable, even in YOLO
mode." The three cover the root filesystem, nine system directories, and
the home directory.

## How the entry arrived

The agent log holds two button events, and both name the choice:

```
2026-09-14 17:25:07  Telegram button resolved 1 approval(s) ... (choice=always, user=Joko)
2026-09-14 17:48:50  Telegram button resolved 1 approval(s) ... (choice=always, user=Joko)
2026-09-14 17:48:50  tool execute_code completed (7.73s, 262 chars)
```

The second press maps to `execute_code`, because the tool ran 0.4
seconds later. The first press maps to `recursive delete`, and the
`messages` table names the command. The task brief of 17:24:51 asked for
it:

```
rm -rf /Users/jokot/dev/connect-four
```

The mirror committed on 2026-09-10 holds only two entries, so both
additions fall inside that window.

The button asked one question. May the agent delete one project
directory? The stored answer covers every recursive delete, in every
future session, with no prompt.

## The decision

Jokot removed `recursive delete` on 2026-09-16 and kept `execute_code`.
Crazy Dave coordinates work and never needs to delete a directory tree
without a question. The `execute_code` entry stays, because Crazy Dave
uses that tool and Jokot approved it twice on purpose.

The edit is one deleted line in
`~/.hermes/profiles/crazydave/config.yaml`. Record 0044 gives the
reason to edit the file by hand. The command `hermes config set` writes
the wrong type and deletes the commented block at the end of the file.

## The file change does not reach the running agent

`approval.py:3928` loads the list, and the comment above it states when:

```python
# Load permanent allowlist from config on module import
load_permanent_allowlist()
```

The call runs once for each process. The function then calls
`load_permanent`, which runs `_permanent_approved.update(patterns)` at
`approval.py:2195`. An update adds keys and never removes one. So no
later read of the file can take a key away.

The gateway of Crazy Dave started on 10 September 2026 at 18:49:24 and
has run for 6 days. The button press of 14 September added the key to
that process in memory. The file no longer holds the key, and the
process still does.

Restart the gateway of Crazy Dave:

```bash
hermes -p crazydave gateway restart
```

The command answered `Stopping gateway (PID 73052) — draining in-flight
runs (up to 180s)` and then `Service restarted`. The new process is PID
96752, started at 21:59:14 on 2026-09-16. The config file changed at
21:31:06, so the new process read the new file.

A read of the config file does not prove the result, because the file is
not the place that decides. Call the gate instead, in a fresh process,
with `HERMES_HOME` set to the profile:

```
loaded permanent set: ['execute_code',
                       'kill hermes/gateway process (self-termination)',
                       'script execution via -e/-c flag']
  is_approved('recursive delete')                -> False
  is_approved('execute_code')                    -> True
  is_approved('script execution via -e/-c flag') -> True
```

`recursive delete` now returns False. An `rm -r` command from Crazy Dave
raises an approval prompt again.

The restart broke nothing else. The `toolsets` key still reports
`hermes-cli` and `kanban`. The gateway logged one line about the kanban
dispatcher lock, and the same line appears at the two earlier starts of
10 September 2026. Crazy Dave never held that lock, so the restart
changed nothing about dispatch.

## What generalizes

**An "always" button answers a wider question than the one on screen.**
The prompt names one command. The stored key names a pattern. Read the
key before you press always, and prefer "session" for a one-time task.

**A permanent allowlist grows and never shrinks by itself.** The loader
only adds. A removal needs an edit of the file and a new process. Audit
the list on a schedule, as `security.md:677` recommends.

**Test the gate, never the file.** A read of `config.yaml` reports the
intention. A call to `is_approved` reports the answer that the agent
gets. The two disagreed for 28 minutes on 16 September 2026.

**Three caches, three lifetimes, one day.** Record 0044 found a toolset
cache of about 30 seconds.
[Record 0045](0045-a-rule-that-reached-no-session.md) found a session
prompt that lives until `/new`. This record finds a set that lives until
the process exits. Ask which cache holds the old value, every time.
