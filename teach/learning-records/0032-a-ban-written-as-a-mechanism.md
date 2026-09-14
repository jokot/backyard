# 0032 — A ban written as a mechanism

**Date:** 2026-09-14
**Stage:** 4, Lesson 29
**Status:** Fixed in Lesson 28 and in the plan.

## What happened

Jokot told Torchwood that no Fizzy source repository exists on this
machine. Torchwood replied:

```
💻 terminal
command -v fizzy && fizzy --version &...

Context — where is the source repository or issue/PR for the fizzy card
create implementation? The installed binary already exposes
--description, so I need the source location for the requested change.
```

The finding is correct. Fizzy 4.0.1 already carries the flag:

```
$ fizzy card create --help
  --description <DESCRIPTION> Card description (markdown or HTML)
```

The Stage 3 plan already used the flag at line 82 of
`docs/superpowers/plans/2026-09-09-stage3-ark-and-fizzy.md`. The task
asked for a feature that shipped before the interview started.

Torchwood found that in one command, and it stopped the work. That is
the outcome the profile exists to produce.

## The defect

`SOUL.md` line 12 stated: "You never run fizzy."

Torchwood ran `fizzy --version`, and it ran `fizzy card create --help`.
It broke a hard limit in its own soul file.

## Root cause

The ban named a mechanism, not an outcome. The intended limit is that
Torchwood must never change a board. The sentence before it already
states that limit: "You never create, claim, comment on, or close a
kanban task."

"You never run fizzy" then bans every invocation, including two that
change nothing. `fizzy --help` and `fizzy --version` parse the local
binary and send no request to the server.

Three other rules pushed the other way.

- Line 26: "Run a read command whenever a read command answers your
  question."
- Line 27: "Never ask Jokot for a path that you can list yourself."
- Line 43, added the same day: "Never send a prompt whose Context or
  Deliverable holds no path."

The only command that answers the question is the banned one. The model
chose the three rules that produce an answer over the one that blocks
it, and the answer it produced was correct and useful.

## Fix

The ban now names the outcome:

```
You never create, claim, comment on, or close a kanban task. You never
run a fizzy command that changes a board. You may run fizzy --help and
fizzy --version, because both read the local binary and send nothing to
the server. You are not a work destination.
```

Read commands that reach the server, such as `fizzy card list`, stay
banned. Those need the API token, and they would copy board content into
a prompt.

## Generalization

*State a limit as an outcome, never as a mechanism.* "Never run fizzy"
bans a binary. "Never change a board" bans a result. The first one
blocks safe work and still fails to name what matters, because a second
tool could change the board tomorrow.

*A rule that blocks the only correct action loses.* Torchwood held four
rules. Three demanded evidence and one forbade the single command that
supplies it. A limit that no path satisfies does not hold the agent, it
teaches the agent to rank rules.

*A prohibition earns a read-only carve-out when the profile reads for a
living.* This profile grounds every path with a command. A ban with no
exception for `--help` contradicts the design of the profile.

## Related

- Record 0031 — an exception written broader than its intent, found the
  same day. This record is its mirror, a ban written broader than its
  intent.
- Record 0029 — the same test task, which also exposed a gap in the
  permitted command list.
- Lesson 28 — the lesson corrected here.
