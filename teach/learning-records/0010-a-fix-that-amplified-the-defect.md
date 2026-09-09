# A fix that amplified the defect it was written for

Record [[0008-blocked-child-tasks-report-to-nobody]] found two defects in the
kanban notifier. A child task blocked, and Telegram stayed silent. The repair
was a script, `kanban-autosubscribe.sh`, registered as a cron job that ran
every minute.

The repair turned a silent failure into a message every two minutes, for six
hours.

## What the run produced

The Stage 2 end-to-end test ran at 01:17 on 2026-09-09. It succeeded. Six
tasks, correct fan-out, spec by Sunflower, three implementation tasks by
Peashooter, root closed by Crazy Dave. The last event landed at 01:33:29.

```
✓ t_e6f5dc9f  done  crazydave   Create and serve Flappy Bird web game
✓ t_3ce59841  done  sunflower   Write SPEC.md for Flappy Bird web game
✓ t_29e6cbb8  done  peashooter  Implement Flappy Bird Canvas game
✓ t_db0cfead  done  peashooter  Write and run headless Node logic tests
✓ t_30e1d677  done  peashooter  Initialize git and commit with personal identity
✓ t_64e9b555  done  peashooter  Serve via HTTP and verify ngrok 200
```

At 06:53 the same completion messages were still arriving, from three
different bots.

## The amplification loop

The subscription rows read `created_at = 06:53:08`. The work finished at
01:33:29. The rows were five hours younger than the events they described.

Every one of the 50 cron output files reported new subscriptions:

```
06:51:09  kanban: subscribed t_29e6cbb8 t_30e1d677 t_3ce59841 t_64e9b555 t_db0cfead t_e6f5dc9f
06:53:09  kanban: subscribed           t_30e1d677 t_3ce59841 t_64e9b555 t_db0cfead t_e6f5dc9f
```

Something deleted the rows, and the cron job replaced them. The deletion runs
at `gateway/kanban_watchers.py:461`:

```python
if fails >= MAX_SEND_FAILURES:
    logger.warning("kanban notifier: dropping subscription %s ...")
    await asyncio.to_thread(self._kanban_unsub, sub, board_slug)
```

The column definition is `last_event_id INTEGER NOT NULL DEFAULT 0`. A new row
therefore starts at cursor zero and replays every past event on the task. The
loop closed:

1. The cron job subscribes a task at cursor zero.
2. A gateway replays all past events and delivers the completion message.
3. A different gateway fails to send and calls `_kanban_unsub`.
4. The next cron tick subscribes the task again.

Before the cron job, step 3 happened once and stayed done. The result was
silence. The cron job made step 4 automatic, so the cycle never ended.

## The message format was a second complaint

The delivered text reads:

```
✔ [default] @peashooter Kanban t_64e9b555 done — Serve Flappy Bird
```

Three parts of that line confused the reader, and the source explains all
three at `gateway/kanban_watchers.py:336`:

```python
board_tag = f"[{board_slug}] "
who = (task.assignee if task and task.assignee else None)
tag = f"@{who} " if who else ""
title = (task.title if task else sub["task_id"])[:120]
```

`[default]` is the board name, not a profile. `@peashooter` is the task
assignee, not the sending bot. The truncation is a 120 character limit on the
title. None of that is a defect. It reads as nonsense only because the wrong
bot delivers it, so an `@peashooter` line arrives inside Crazy Dave's chat.

## What the reference project does instead

Zain Fathoni's write-up of the same architecture records the identical
lesson from the other side. He built an in-house task abstraction called
"beads", found it unreliable, and abandoned it. His stated rule is to use a
real task management system rather than a homebrew abstraction.

His specialists report their own results. There is no subscription table, so
no cursor can reset and no second process can claim a row. The agent that did
the work speaks, through its own bot, in its own words.

## Fix

Delete the notifier path rather than repair it. Each profile carries its own
Telegram bot token, so a worker that runs `hermes send` speaks as itself:

```
crazydave   8810262588
peashooter  8824788331
sunflower   8811584417
```

The tool `send_message` is not agent callable. The comment at
`toolsets.py:374` states the rule and names the supported entry point:

> agents do NOT get an agent-callable send_message tool — outbound platform
> messaging is handled outside the agent loop (cron delivery, the gateway
> kanban notifier, and the `hermes send` CLI)

Agents hold the `terminal` tool, so `hermes send` is reachable. Each
`SOUL.md` now carries a reporting rule that uses it.

## Generalizes

A repair that runs on a schedule can convert a failure that happens once into
a failure that happens forever. Before automating a repair, ask what deletes
the thing you are re-creating.

Two smaller rules came out of the same night. The schedule string `1m` creates
a one-shot job, and `every 1m` creates a recurring one, per `parse_schedule` at
`cron/jobs.py:512`. The flag `--script` resolves against the scripts directory
of the profile, not a global directory, per `cron/scheduler.py:2086`.

See [[0008-blocked-child-tasks-report-to-nobody]] for the two original defects
and [[0009-a-coordinator-that-never-works-gets-dispatched-work]] for the
worker dispatch failure found in the same test.
