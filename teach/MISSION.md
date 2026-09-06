# Mission: Personal multi-agent AI system on Hermes Agent

## Why
Jokot is a software engineer who has used AI daily at work for two years,
and wants a personal team of specialized AI agents — modeled on Zain
Fathoni's "Project Transformers" / OpenClaw ("The Ark") — reachable over
Telegram, built on Hermes Agent, so that different domains of life and
work (starting with coding) get a dedicated, memory-persistent
specialist instead of one assistant crossing contexts.

## Success looks like
- Can explain "context contamination" and why a coordinator+specialist
  pattern fixes it, using Zain's project as the worked example.
- Has a real, working Hermes profile ("Peashooter") reachable over
  Telegram, with memory that survives across sessions.
- Can explain the Hermes primitives used so far (profile, SOUL.md,
  MEMORY.md/USER.md, gateway) well enough to design the next specialist
  without help.
- Understands enough of the reference architecture (coordinator agent,
  shared task board, shared/private memory split) to make an informed
  call, later, about which pieces to replicate with Hermes's `kanban`
  and which to skip.

## Constraints
- Learn by building the real thing (the `plants` project) — every
  lesson should produce a working piece of the actual build, not a toy
  exercise.
- Explain unfamiliar terms inline, each lesson.
- Already fluent in software engineering and daily AI-tool use — skip
  beginner framing of things like APIs, CLIs, git.

## Out of scope
- Replicating Zain's entire agent roster (9+ agents).
- Building agent-orchestration primitives from scratch — Hermes already
  provides profiles/kanban/cron; the mission is learning to use and
  compose them, not reimplement them.
- Telegram Bot API internals beyond what `hermes gateway setup` needs.
