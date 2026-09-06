# Stage 2 Design: Sunflower, Crazy Dave, and the shared kanban board

**Date:** 2026-09-06
**Status:** Approved for implementation
**Author:** jokot, with Claude Code

## Background

This document is Stage 2 of the plants multi-agent project. Stage 1
built Peashooter, one specialist agent reachable over Telegram, with
memory that survives across sessions
(`docs/superpowers/specs/2026-09-06-peashooter-stage1-design.md`).
Stage 1 marked a second specialist and a routing mechanism as future
work. This document builds both together, plus the shared kanban board
that connects them, as one spec, per an explicit decision not to split
this stage into smaller increments.

The project remains grounded in
[Zain Fathoni's "Project Transformers"](https://www.zainfathoni.com/blog/project-transformers-building-personal-ai-army)
and [The Ark](https://ark.zainf.dev/). Both sources were re-read for
this stage to check the real routing mechanism, not assumed from
memory. The reference project routes three separate ways: direct
access to each specialist, a coordinator (Optimus) for cross-domain or
ambiguous requests, and a shared task board (Fizzy) that carries
explicit assignee metadata rather than acting as a live router. Stage
2 adopts this same three-part shape, sized down to two specialists.

Hermes Agent already provides the coordinator mechanism natively,
confirmed by reading its source (`hermes_cli/kanban_decompose.py`,
`hermes_cli/kanban.py`). No custom routing code is written in this
stage.

## Hermes concepts used in this stage

- **Kanban board** — a shared, SQLite-backed task board across all
  profiles on this machine. One board exists by default. Tasks move
  through columns: triage, todo, ready, running, done (plus blocked,
  scheduled, and archived).
- **Profile description** (`--description`) — the routing signal a
  profile carries. Stage 1 set one for Peashooter. Stage 2 sets one
  for Sunflower too, since the decomposer reads these to pick an
  assignee.
- **`hermes kanban decompose`** — an LLM call that reads a triage
  task and the full profile roster with descriptions, then splits the
  task into child tasks, each assigned to the best-matching profile.
  An unmatched task falls back to a configured default assignee, never
  left unassigned.
- **Kanban dispatcher** — runs inside `hermes gateway start` (no
  separate daemon process). It promotes a ready task once its
  dependencies clear, and spawns the assigned profile as a worker in
  an isolated workspace to do the actual work.
- **`hermes kanban notify-subscribe`** — binds a task's completion
  events to one chat (platform and chat id). When the task finishes,
  the result reaches that chat automatically.
- **`kanban` toolset** — once the board exists, every profile's chat
  loop gains the ability to create, comment on, and subscribe to
  tasks as a normal tool call, not only through the `hermes kanban`
  CLI.

## Decisions

- **Second specialist name and domain:** **Sunflower**. Its domain is
  brainstorming, planning, task breakdown, and writing PRDs,
  proposals, and specs. The name mirrors its role: in Plants vs.
  Zombies, Sunflower produces the resource every other plant needs to
  act; here, Sunflower produces the plans and specs that feed the
  other specialist's work.
- **Coordinator name and role:** **Crazy Dave**. Its `SOUL.md` carries
  one hard rule: on any request, create a kanban task with the
  request as the task body, subscribe the originating chat to that
  task, and stop. It never answers a request directly, matching its
  role in Plants vs. Zombies as the character who sends the player
  into a level without fighting himself.
- **Profile identifiers:** the persona name is conversational; the
  Hermes profile identifier is a single lowercase token. Sunflower's
  profile is `sunflower`. Crazy Dave's profile is `crazydave`.
- **Routing shape:** hybrid, scoped to two specialists. Each
  specialist keeps its own Telegram bot for direct requests. Crazy
  Dave's bot is a separate, third Telegram bot, used only for requests
  that do not clearly belong to one specialist, or that span both.
  Two alternatives were considered and rejected: a single
  coordinator-first bot that classifies every message (more routing
  machinery than two specialists justify), and a direct-only design
  with no coordinator at all (under-delivers on this stage's own
  scope).
- **Kanban board:** the single default board created by `hermes
  kanban init`. Multiple boards are not needed at this scale.
- **Orchestrator profile:** `kanban.orchestrator_profile` is set
  explicitly to `crazydave` in the kanban config, rather than left to
  fall back to whichever profile happens to be active. Crazy Dave is
  the profile that creates triage tasks, so it is also the profile
  that owns their fan-out.
- **Model and provider:** Sunflower reuses Stage 1's decision — an
  OpenRouter API key, set via `hermes model` while Sunflower is the
  active profile. Crazy Dave uses the same provider for consistency,
  though its task is narrow enough that model choice matters less
  than for the two specialists.
- **`SOUL.md` pattern:** both new profiles start with the hard-rule
  wording Stage 1 arrived at only after a bug (see Stage 1's Lesson 3
  and its learning record). Domain exclusions are written as "HARD
  RULE, not a suggestion," with an explicit ban on partial answers,
  and an explicit "always respond in English" line, from the first
  draft, not discovered later.
- **Config mirroring:** Stage 1's practice continues. After each edit,
  copy `SOUL.md` and `config.yaml` for both new profiles into
  `hermes-config/sunflower/` and `hermes-config/crazydave/` and commit
  the copy. Never copy `.env` or `auth.json`.

## Steps (each step is one lesson)

1. **Create the Sunflower profile**, then immediately reset its
   memory. `--clone-from` copies memory files along with config
   (Stage 1's Lesson 4 correction), so this step runs `hermes memory
   reset` before Sunflower is used, rather than discovering
   inherited content later.
2. **Assign Sunflower's model and provider**, same OpenRouter flow as
   Peashooter.
3. **Write Sunflower's `SOUL.md`** with the hard-rule pattern applied
   from the start.
4. **Set Sunflower's `--description`.** Check Peashooter's existing
   description too, and sharpen it if needed, since both descriptions
   are what the decomposer reads later.
5. **Connect Sunflower to Telegram**, its own bot, same steps as
   Stage 1's Lesson 5.
6. **Create the Crazy Dave profile**, reset its memory, and write its
   `SOUL.md` with the single hard rule: create a task, subscribe the
   chat, stop.
7. **Connect Crazy Dave to Telegram**, its own bot.
8. **Initialize the kanban board** with `hermes kanban init`, now that
   both profiles exist, and set `kanban.orchestrator_profile` to
   `crazydave`.
9. **End-to-end test.** Message Crazy Dave with one request that
   spans both specialists (for example: write a short spec for a
   small feature, then implement it). Confirm, using `hermes kanban
   list` and `hermes kanban show <task_id>`, that decompose created
   two linked child tasks, assigned correctly to Sunflower and
   Peashooter. Confirm the Crazy Dave Telegram chat receives a message
   when each child completes.

## Success criteria

- Sunflower answers a direct, on-topic (planning or spec) Telegram
  message in character, and declines a clearly off-topic one, matching
  Peashooter's Stage 1 checks.
- A message to Crazy Dave produces a kanban task, never a direct
  answer from Crazy Dave itself.
- A cross-domain request to Crazy Dave produces two linked child
  tasks, assigned to Sunflower and Peashooter respectively, not left
  unassigned or misrouted to the wrong profile.
- One full run completes end to end: task created, dispatched,
  worked, and its completion reported back to the Crazy Dave Telegram
  chat through `notify-subscribe`, with no `hermes kanban` command run
  by hand during the run itself.

## Out of scope for Stage 2

- Kanban Swarm (parallel workers, a verifier, and a synthesizer) —
  not needed with two specialists.
- Multiple kanban boards — one shared default board covers this
  stage.
- Any gateway platform other than Telegram, for Sunflower or Crazy
  Dave — the same boundary Stage 1 set for Peashooter.
- Periodic reassignment scans (the reference project's Optimus
  "heartbeat" pattern) — deferred to a later stage.
- Air-gapped or private specialists (the reference project's
  Ratchet/Arcee pattern) — no specialist in this project needs
  isolation from the kanban board yet.
- Custom retry or timeout logic — Hermes's own `--max-retries`
  (default 2) and `--max-runtime` handle a stuck or failing worker.

## Risks / open questions

- Sunflower's `--description` quality directly decides whether
  decompose assigns work correctly. If Step 9's test misroutes a
  child task, the fix is sharpening the description text, not writing
  new code.
- Crazy Dave's hard rule may need the same prompt-dilution fix
  Peashooter needed in Stage 1, if the model tries to answer directly
  instead of routing. Step 9 tests for this explicitly, rather than
  assuming Stage 1's fix transfers automatically to a new profile's
  own system prompt.
