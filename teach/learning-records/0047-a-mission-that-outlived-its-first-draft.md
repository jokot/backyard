# 0047 — A mission that outlived its first draft

**Date:** 2026-09-16
**Stage:** 4, close
**Status:** Active. Jokot approved the revision on 2026-09-16.

`teach/MISSION.md` arrived in commit `3b91057` on 2026-09-06, in the
first commit of the project. Four stages then ran, and the file never
changed. The teach skill states the rule that this record answers:
"Revise when reality shifts. Missions change. When the user's goal
moves, update this file. Do not leave a stale mission steering future
sessions."

## What the old mission still claimed

Three claims had stopped matching the machine.

The fourth success criterion asked Jokot to make "an informed call,
later, about which pieces to replicate with Hermes's `kanban`". The call
happened. Stage 3 built the board, Stage 4 dispatched work through it,
and [record 0044](0044-a-tool-that-was-never-turned-on.md) opened the
kanban tool for Crazy Dave on 2026-09-16.

The out-of-scope list ruled out "Replicating Zain's entire agent roster
(9+ agents)". Four profiles run today. The line read as a limit that the
project had already crossed, rather than as the limit that it means.

The success list held no criterion that any stage after Stage 1 was
working toward. Stages 2, 3 and 4 ran against specifications instead.

## What the revision adds

Three open criteria join the four met ones.

The first asks every rule of the roster for a command that fails when
the rule is broken. [Record 0042](0042-stage-4-complete.md) stated that
rule at the close of Stage 4. Four records then repeated the same
failure inside two days. Record 0043 found a variable that nobody set.
Record 0044 found a toolsets key that nobody wrote. Record 0045 found a
soul file that no session read. Record 0046 found an allowlist key that
only a restart could remove.

The second asks for the roster on a server. The words come from Jokot,
quoted at lines 61 and 62 of
[record 0033](0033-a-path-that-sat-in-memory.md): "i don't like to put
hardcode path on any of the souls, because my final goal is to deploy
this on other machine or on the server". That sentence already
decided one design. Record 0033 rejected a working directory in the soul
file of Torchwood, because a path is one more command on the next
machine. The goal steered a decision before the mission recorded it.

The third asks for work that Jokot never started. Cron has waited since
Stage 1, and the Fizzy webhook receiver has waited since Stage 3.

Four constraints join the list. They describe how this project has
worked since Stage 1, and no file held them. Jokot runs every command
that changes the machine. Every claim needs real output or real source.
Every defect becomes a fix and a record, never a workaround. A lesson
states the output that proves each step.

## What generalizes

**A mission that no stage reads is not a compass.** Four stages ran
against four specifications. Each specification was correct, and none of
them traced to the mission, because the mission had nothing left to say
about them.

**Record a goal at the moment it steers a decision.** The server goal
changed the design of Torchwood on 2026-09-14, two days before any file
named it as a goal. A decision is the evidence that a goal is real.

**A limit that reality passed reads as a broken rule.** The old line
banned nine agents while four ran. The new line states the test instead.
Add a fifth profile only when a real task needs one.
