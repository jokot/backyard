# Personal Multi-Agent AI System — Resources

## Knowledge

- [Blog: "Project Transformers: Building a Personal AI Army" by Zain Fathoni](https://www.zainfathoni.com/blog/project-transformers-building-personal-ai-army)
  Origin story and reasoning for the reference project. Use for: the
  "context contamination" problem statement, agent roster and roles,
  cost-tiering strategy.
- [Site: The Ark by Zain Fathoni](https://ark.zainf.dev/)
  Live showcase of the running system. Use for: seeing the
  coordinator/specialist roster as a finished product, the
  air-gapped-agent privacy pattern, multi-channel access.
- [GitHub: openclaw/openclaw](https://github.com/openclaw/openclaw)
  Source of the framework Zain built The Ark on. Use for: ground truth
  on how a coordinator+specialist system is actually implemented, if we
  want to compare Hermes's approach against it.
- [Hermes Agent docs: Kanban](https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban)
  Official docs for Hermes's durable, multi-profile task board. Use for:
  Stage 2, when we add task routing between specialists.
- [Hermes Agent docs: Fallback providers](https://hermes-agent.nousresearch.com/docs/user-guide/features/fallback-providers)
  Use for: what happens when a profile's primary model is rate-limited
  or down.
- `hermes doctor`, `hermes <command> --help` (local CLI)
  The most reliable source of truth for what this specific installed
  version of Hermes actually supports — checked directly, in this
  workspace, ahead of trusting any doc or memory. Use for: verifying any
  claim about Hermes behavior before it goes in a lesson.

## Wisdom (Communities)

- [OpenClaw Discord](https://discord.com/invite/clawd)
  Community around the framework Zain's project is built on. Likely the
  highest-signal place to ask "has anyone hit this" questions about the
  coordinator/specialist pattern in practice, even though this project
  runs on Hermes rather than OpenClaw.

## Gaps

- No equivalent community identified yet for Hermes Agent specifically
  (beyond its own docs). Worth searching for one once we hit a real
  wall Hermes's docs don't answer.
