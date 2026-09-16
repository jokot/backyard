# 0043 — A report that went to the wrong room

**Date:** 2026-09-16
**Stage:** 4, after the retraction of record 0035
**Status:** Active. This record replaces the diagnosis in
[record 0035](0035-a-fix-that-nobody-scheduled.md), which is retracted.

Record 0035 stated that two tasks blocked on 14 September 2026 and that
Telegram delivered no message. The first half is true. The second half is
wrong. Peashooter sent both messages. Each message arrived in a private
chat that Jokot does not watch.

## What the machine shows

Two tasks blocked. The `task_events` table names the time and the reason:

```
676  t_8e9c7cfb  blocked  17:28:35  review-required: index.html + style.css built
681  t_34115dfd  blocked  17:32:38  review-required: Connect Four logic ... needs_input
```

A third task, `t_cd4639bb`, never ran. The decomposer gated it on the
other two, so it moved from `promoted` to `archived` at 17:38:33 without
a single claim. Record 0035 counted three blocked tasks. Two blocked.

Peashooter obeyed the reporting rule both times. The task log holds the
command, and `agent.log` holds the result:

```
17:28:41  tool terminal completed (2.22s, 95 chars)
17:32:45  tool terminal completed (2.41s, 95 chars)
```

The word is `completed`, not `returned error`. Both sends succeeded.

## Where the messages went

The soul file of each worker names the command without a chat:

```
hermes send --to telegram "your message here"
```

With no chat, `send_message_tool.py:443` reads the home channel:

```python
used_home_channel = False
if not chat_id:
    home = config.get_home_channel(platform)
    ...
    chat_id = home.chat_id
```

The home channel comes from `TELEGRAM_HOME_CHANNEL` in the profile
`.env`, per `gateway/config.py:1569`. All four profiles held the same
value, and that value was the private chat with Jokot. So every worker
report went to a one-to-one chat with that worker's bot. Four bots, four
private chats, none of them the room where the board lives.

## Why the value was correct when somebody wrote it

[Lesson 17](../lessons/0017-workers-report-their-own-results.html) chose
that command on purpose, and it stated the reason:

> Note what the command does *not* contain: a chat id. `--to telegram`
> resolves to `TELEGRAM_HOME_CHANNEL`, which each profile already sets
> from its own `.env`. Writing the number into `SOUL.md` would work
> today and break the day you move the team into a group.

The reasoning holds. The indirection exists so that one variable moves
the whole roster. Stage 2 had no group, so the private chat was the only
destination, and it was the right one.

Stage 3 built the group. It changed the side that listens, because
`free_response_topics` gives each profile one topic. It never changed
the side that speaks. The variable that Lesson 17 created for exactly
this day sat unread for six days.

## The fix

Set the home channel of every profile to the group:

```
TELEGRAM_HOME_CHANNEL=-1004371805465
```

No soul file changes, and no chat id enters a soul file. This is the
change that Lesson 17 specified in advance.

One command proves the rule, and it fails when the rule breaks:

```
grep -h '^TELEGRAM_HOME_CHANNEL=' ~/.hermes/profiles/*/.env | sort -u
```

One line of output means every profile agrees. Two lines mean a profile
drifted. The count is the test.

No gateway restart is needed. `hermes send` reads the `.env` file on
each call, through `_load_hermes_env()` at `send_cmd.py:300`.

Jokot proved the fix against the real machine on 2026-09-16:

```
hermes -p peashooter send --to telegram "reporting path now lands in the group"
```

The message arrived in the General topic of the Backyard group, and the
Peashooter bot sent it. The destination moved, and the sender identity
of record 0010 held. The gateway of Peashooter never restarted.

## A second defect, found on the way, and not fixed here

A forum group routes a message to a topic by `message_thread_id`. The
home channel carries a thread. `gateway/config.py:1575` reads it:

```python
thread_id=getenv("TELEGRAM_HOME_CHANNEL_THREAD_ID") or None,
```

`send_message_tool.py` then drops it. Both places that read the home
channel, line 317 and line 452, copy `home.chat_id` and never copy
`home.thread_id`. The variable `TELEGRAM_HOME_CHANNEL_THREAD_ID` has no
effect on `hermes send`.

So a report cannot reach a chosen topic through the home channel. Every
report lands in the General topic of the group, which is thread 1, where
Crazy Dave listens and where Jokot coordinates. For a blocked task that
destination is correct, because the coordinator is the agent that can
unblock it. The defect is upstream, in the Hermes source under
`~/.hermes/hermes-agent/`, so this project does not patch it.

No message loop follows. Telegram never delivers the message of one bot
to another bot. Discord and Feishu both carry a setting for that case,
`DISCORD_ALLOW_BOTS` and `FEISHU_ALLOW_BOTS`. Telegram carries no such
setting, because the platform never raises the case.

## What generalizes

**An indirection records an intention. It does not perform it.**

Lesson 17 wrote the variable so that one edit could move the roster into
a group. Writing the variable felt like solving the problem. The edit
still had to happen, and nobody scheduled it.

A second rule, for this project specifically. **A report that nobody
reads is not a report.** The soul rule fired, the command exited zero,
and the log recorded success. Every layer reported that the work was
done. The measure of a report is a reader, not an exit code.

A third rule, which record 0035 learned the hard way and this record
confirms. **Read the lesson that made the setting before you call the
setting a defect.** Lesson 17 named this failure six days in advance and
even named the day it would arrive.

See [record 0010](0010-a-fix-that-amplified-the-defect.md) for the
design that put `hermes send` in the soul files.
See [record 0035](0035-a-fix-that-nobody-scheduled.md) for the retracted
diagnosis.
See [record 0042](0042-stage-4-complete.md) for the Stage 4
generalization that this record repeats: a rule needs a command that
fails when the rule is broken.
