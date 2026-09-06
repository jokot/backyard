# Stage 1 Design: Peashooter, the first specialist agent

**Date:** 2026-09-06
**Status:** Approved for implementation
**Author:** jokot, with Claude Code

## Background

This document is Stage 1 of a larger project: a personal team of specialist
AI agents ("plants"), inspired by
[Zain Fathoni's "Project Transformers"](https://www.zainfathoni.com/blog/project-transformers-building-personal-ai-army)
and [The Ark](https://ark.zainf.dev/). Zain's problem statement is the
reason this project exists: a single general-purpose assistant handling
unrelated domains (coding, finance, family) causes "context
contamination" — unrelated context bleeding between tasks. The fix is
several narrow, isolated agents instead of one broad one.

The general term for this pattern is a **multi-agent system**: several
autonomous agents that coordinate on work, instead of one agent doing
everything. Zain built his on a framework called OpenClaw. This project
builds its version on **Hermes Agent**, a different agent CLI already
installed on this machine, which ships most of the needed primitives
natively (see "Hermes concepts" below).

The full multi-agent system is too large for one spec. It decomposes into
stages, each a working increment:

1. **Stage 1 (this document):** one specialist agent, reachable over
   Telegram, with memory that survives across sessions.
2. Stage 2: a second specialist agent, plus a shared task board that
   routes work to the right one.
3. Stage 3: scheduled/background checks (cron) and further specialists.

Only Stage 1 is designed and approved here. Later stages get their own
spec once Stage 1 is working.

## Hermes concepts used in this stage

- **Profile** — Hermes's unit of "a separate agent identity." A profile
  has its own config file, its own default model/provider, its own
  skills, and its own memory. Profiles do not share context with each
  other. This is the direct mechanism behind avoiding "context
  contamination": each specialist is a different profile.
- **SOUL.md** — a per-profile system prompt. It defines who the agent is,
  what its job is, and (just as important) what is out of scope for it.
- **MEMORY.md / USER.md** — Hermes's built-in, always-on memory files for
  a profile. `USER.md` holds stable facts about the user relevant to that
  profile (e.g. preferred stack, conventions). `MEMORY.md` holds a
  running log of what happened in past sessions. Both are created
  automatically the first time the agent writes to them.
- **Gateway** — Hermes's messaging bridge. It connects a profile to chat
  platforms (Telegram, Discord, WhatsApp, Slack, Signal). Once set up,
  messages sent to the bot on that platform reach the profile's agent
  loop, and its replies are sent back on the same platform.

## Decisions

- **Name:** the first specialist is named **Peashooter** — the first,
  simplest plant in Plants vs. Zombies, matching its role as the first
  specialist agent in this project. Later specialists get later plant
  names (decided when Stage 2 is designed).
- **Domain:** Peashooter is a coding/engineering specialist. Its `SOUL.md`
  explicitly excludes non-engineering topics (finance, family, etc.), so
  scope creep back into "one assistant that does everything" is a
  deliberate, visible design violation, not a silent drift.
- **Reach:** global, not project-local. Peashooter runs from
  `~/.hermes` (a Hermes profile), so it is invokable from any repo on
  this machine, not only from the `plants` folder. The `plants` folder is
  where its configuration and this project's history live, versioned in
  git.
- **Model/provider:** an OpenRouter API key, added as a pooled credential
  (`hermes auth add openrouter --type api-key`). OpenRouter is a
  confirmed first-class provider in Hermes (listed in `hermes auth add
  --help` and checked by `hermes doctor`). It aggregates many providers —
  Anthropic, OpenAI, DeepSeek, Qwen, Zhipu/GLM, Moonshot/Kimi, MiniMax,
  and more — behind one key and one bill, pay-per-use, so each profile
  can be pointed at a different model (including cheap Chinese-lab
  models) without a separate account per provider. Superseded from an
  earlier draft of this decision (plain Anthropic API key); rejected
  entirely: OAuth reuse of a personal Claude/Cursor subscription (see
  below and Lesson 2's chat history for why).
- **Provider scope excluded:** Cursor and Antigravity are not usable as
  model providers for any bot in this project. Hermes has no provider
  hook for either, and Cursor does not expose its subscription through
  an API or OAuth surface that a third-party tool could call.
- **Channel:** Telegram, via Hermes's built-in `gateway` subsystem.
  Discord/WhatsApp/Slack/Signal are supported by the same subsystem but
  out of scope for Stage 1.

## Steps (each step is one lesson)

1. **Create the profile.**
   `hermes profile create peashooter --clone-from default --description "Coding and engineering specialist"`
   The `--description` is not cosmetic — a later stage's task router reads
   it to decide which profile handles a given task.
2. **Assign a model/provider.**
   Add an Anthropic API key as a pooled credential, then set it as
   Peashooter's active model via `hermes model` while Peashooter is the
   active profile.
3. **Write `SOUL.md`.**
   Replace Peashooter's inherited `SOUL.md` with a short, scoped
   definition: what it owns, what it does not, and its tone.
4. **Prove memory persists.**
   Run a session as Peashooter, tell it a real fact about your setup,
   end the session, start a new one, and confirm it recalls the fact
   from `MEMORY.md`/`USER.md` without being re-told.
5. **Connect Telegram.**
   `hermes gateway setup` to register a Telegram bot for the Peashooter
   profile, then `hermes gateway start` (or `run`, for foreground/testing)
   to bring it online.
6. **End-to-end check.**
   Message the bot on Telegram from your phone and get a reply that is
   in-character for Peashooter (coding-scoped) and reflects the memory
   from step 4.
7. **Convenience alias.**
   `hermes profile alias peashooter` so invoking it from the terminal in
   any repo is one word.

## Success criteria

- Peashooter responds on Telegram.
- A fact told to Peashooter in one session is recalled, unprompted, in a
  later session.
- Peashooter declines or redirects clearly off-topic (non-engineering)
  requests, showing the scope boundary is real, not just documented.
- Peashooter is invokable from a project folder other than `plants`.

## Out of scope for Stage 1

- A second specialist agent.
- A coordinator/router agent or the kanban task board.
- Cron/scheduled automation.
- Any gateway other than Telegram.
- OAuth reuse of a personal Claude subscription (noted as a future
  optional swap, not built now).
- External memory providers (Hermes supports several as plugins; Stage 1
  uses only the built-in `MEMORY.md`/`USER.md`).

## Risks / open questions

- Telegram bot setup requires creating a bot token via Telegram's
  BotFather and may need a `python-telegram-bot` dependency Hermes
  reported as not yet installed on this machine (`hermes doctor`
  flagged this as optional-but-missing). Step 5 installs it if needed.
- None of the above blocks Stage 1; both are handled inline in step 5.
