# 0045 — A rule that reached no session

**Date:** 2026-09-16
**Stage:** 4, immediately after Lesson 31
**Status:** Active. The fix is one Telegram message, and Jokot must send
it. This record qualifies the status line that Lesson 31 wrote into
[record 0038](0038-a-server-killed-by-its-own-log.md) today. That line
reads "the rule now lives in the soul file of Peashooter". The soul file
is not the place where the agent reads the rule.

Lesson 31 added a hard rule to `~/.hermes/profiles/peashooter/SOUL.md`.
The rule forbids a foreground server and forbids an inherited pipe. The
file changed, the mirror changed, and the commit landed. The running
agent never saw one word of it.

## What the machine shows

The gateway builds a system prompt once for each session, then stores
the prompt in the `sessions` table. `agent/conversation_loop.py:281`
describes the three states of that row. The third state decides this
case:

> `present` — row exists with a usable prompt → **reused verbatim**.

The same docstring names the caller as "the gateway path (which
constructs a fresh `AIAgent` per turn and depends on this DB
roundtrip)". A fresh agent object does not mean a fresh prompt.

Every session row of Peashooter was tested for the old soul text and
for the new soul text:

```
20260914_181716_0e6797   cli       open=True  old_rule=True  NEW_rule=False
20260914_181416_143097   cli       open=True  old_rule=True  NEW_rule=False
20260914_180214_322ec4   cli       open=True  old_rule=True  NEW_rule=False
20260914_175013_9b72ca   cli       open=True  old_rule=True  NEW_rule=False
20260914_172624_4edd37   cli       open=True  old_rule=True  NEW_rule=False
20260914_172624_6d6a69   cli       open=True  old_rule=True  NEW_rule=False
20260910_202515_024dd579 telegram  open=True  old_rule=True  NEW_rule=False
20260910_194853_b58f7c   cli       open=True  old_rule=True  NEW_rule=False
```

The column `old_rule` tests for "Reporting finished kanban work", which
Stage 2 wrote into the same soul file. Every row holds it. So soul text
does reach the prompt, and the path works. The column `NEW_rule` tests
for "Starting a long-lived service". No row holds it.

The row `20260910_202515_024dd579` carries `thread_id` 2, which is the
`#Coding` topic. It opened on 10 September 2026 and never ended. That
row is the live chat with Peashooter.

## The fix

Send one message inside the `#Coding` topic of the Backyard group:

```
/new
```

`gateway/config.py:730` sets the triggers, and the default list is
`["/new", "/reset"]`. `gateway/run.py:10105` routes the command to
`_handle_reset_command`, after a confirmation prompt that names the
cost: "This starts a fresh session and discards the current
conversation history."

Send the message inside the topic, not in the group root.
`gateway/run.py:10106` tests for the topic root lobby and answers with a
different message there.

Then send one ordinary message and wait for the reply. One command
proves the result, and it fails when the rule is not live:

```bash
sqlite3 -readonly ~/.hermes/profiles/peashooter/state.db \
  "SELECT id FROM sessions WHERE source='telegram' AND ended_at IS NULL
     AND system_prompt LIKE '%Starting a long-lived service%';"
```

One row means the rule is live. No row carries two meanings, and the
next section separates them.

## The proof query has a blind window

Jokot sent `/new` at 20:00:02 on 2026-09-16. The database answered at
once:

```
20260910_202515_024dd579  telegram  thread=2  ended=2026-09-16 20:00:02
20260916_200002_bda1e48d  telegram  thread=2  open  system_prompt=NULL
```

The old session closed and a new session opened in the same second. The
new row holds NULL, not the new rule, so the proof query returned no
row. The command that was supposed to confirm the fix reported failure
after a correct fix.

The reason sits in the same docstring at
`agent/conversation_loop.py:281`. The function "persists a freshly-built
prompt back to the session DB on first build". The `/new` command
creates the row. The first turn builds the prompt and writes it.
Between those two events the column is NULL.

So the query needs one message and one reply before it can answer. Read
the `system_prompt` column to separate the two failures. NULL means that
nobody has spoken since `/new`. A non-empty value without the rule text
means a real failure.

## What needs no action

A dispatched kanban worker reads the new rule without any command. The
six `cli` rows above span 51 minutes on 14 September 2026, and each row
holds its own prompt. The dispatcher creates one session for each task,
so the next worker builds its prompt from the file as it stands today.
This matters, because the failure of record 0038 happened inside a
dispatched worker.

The kanban toolset of Crazy Dave also needs no action, and the reason is
different. A tool list is not part of the system prompt. Both open
Telegram prompts of Crazy Dave were tested for the string
`kanban_create`, and neither holds it. The tool registry builds the list
for each request and caches the gate result for about 30 seconds, per
the comment at `tools/kanban_tools.py:53`. So
[record 0044](0044-a-tool-that-was-never-turned-on.md) took effect at
once.

## What generalizes

**A file edit is not a delivery.** This project already named the rule
in [record 0043](0043-a-report-that-went-to-the-wrong-room.md): "An
indirection records an intention. It does not perform it." Record 0043
found a variable that nobody set. This record finds a file that nobody
read. Both look finished at the moment of the edit.

**Ask which cache holds the old value.** The soul file, the config file
and the tool registry each answer a different question, and each has a
different lifetime. A soul file lives in a session prompt and lasts
until `/new`. A toolsets key lives in a registry cache and lasts about
30 seconds. One answer does not cover the other.

**Test the value where it is read, not where it is written.** The soul
file was correct within one minute of the edit. The `sessions` table
stayed wrong for the rest of the day. A `grep` of the file would have
reported success.

**A lesson that changes a file owes a step that activates the change.**
Lesson 31 shipped without the `/new` step, and the checkpoint would have
passed with the rule dead. The step and one proof query are now in the
lesson.
