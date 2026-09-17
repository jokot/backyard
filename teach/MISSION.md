# Mission: Personal multi-agent AI system on Hermes Agent

## Why
Jokot is a software engineer who has used AI daily at work for two
years. He wants a personal team of specialized AI agents, reachable over
Telegram and built on Hermes Agent. Each domain of life and work gets a
dedicated specialist with its own memory, instead of one assistant that
crosses contexts. The model is the "Project Transformers" roster of Zain
Fathoni, also called The Ark. The end state runs on a server, not on a
laptop.

## Success looks like
- Explain context contamination, and explain why a coordinator with
  specialists fixes it. **Met in Stage 1.**
- Run a real Hermes profile named Peashooter over Telegram, with memory
  that survives a restart. **Met in Stage 1.**
- Design the next specialist without help. Seven decisions and their
  traps live in `reference/adding-a-specialist.html`. **Met in Stage 4.**
- Decide which parts of the reference architecture to build with the
  Hermes kanban board. The board runs, Crazy Dave dispatches work, and
  learning record 0044 opened the kanban tool. **Met in Stage 4.**
- Give every rule that the roster obeys a command that fails when the
  rule is broken. **Four rules are enforced in Stage 5.** The script
  `roster-audit.sh` checks the rules of records 0043, 0044, 0045 and
  0046, and a cron job runs it each day at 09:00. Check 4 now compares
  the stored prompt of every open Telegram session against the current
  soul file, so it tests the rule of record 0045 and no longer counts
  days. The criterion stays open, because two rules that Stage 5 wrote
  have no check: a soul file must name the report script and no send
  command, and a report that does not send must be retried.
- Move all four profiles to a server, and prove that each one answers
  from there. **Open.**
- Run work that Jokot never started. **The cron half is met in Stage 5.**
  The Fizzy webhook receiver stays open, because it needs a public HTTPS
  endpoint.

## Constraints
- Build the real thing. Every lesson produces a working piece of the
  `plants` roster, never a toy exercise.
- Jokot runs every command that changes the machine, then reports the
  output. A lesson states what output proves the step.
- Ground every claim in real output or real source. A diagnosis without
  evidence is a guess, and learning record 0035 shows the cost.
- Turn every defect into a fix and a learning record. Never write a
  workaround.
- Explain an unfamiliar term inside the lesson that first uses it.
- Skip beginner framing of APIs, command lines, and git.

## Out of scope
- The full roster of nine agents. Four profiles run today. Add a fifth
  only when a real task needs one.
- Building orchestration primitives from scratch. Hermes provides
  profiles, kanban, and cron. The mission composes them.
- Patching the Hermes source. Learning record 0043 found an upstream
  defect and worked around it in configuration instead.
- Telegram Bot API internals beyond what `hermes gateway setup` needs.
