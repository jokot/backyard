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

- [GitHub: basecamp/fizzy-cli](https://github.com/basecamp/fizzy-cli) —
  the official Fizzy command line interface, in Go, MIT licensed. Ships
  an agent skill and a read-only MCP server. Default branch is
  `master`, not `main`. Use for: exact command shapes. `README.md` has
  real invocations, `SURFACE.txt` lists every command and flag.
- [GitHub: basecamp/fizzy](https://github.com/basecamp/fizzy) — the
  Fizzy server itself, under the O'Saasy License. Use for: deciding
  between the hosted service and self-hosting through Docker or Kamal.
- [Fizzy webhooks help](https://help.fizzy.do/3/fizzy-help-guide/67/webhooks)
  and [Rob Zolkos on Fizzy webhooks](https://www.zolkos.com/2025/12/02/fizzy-webhooks-what-you-need-to-know)
  — Use for: the payload limits. A card payload carries `title` and
  `url` only, with no description body.
- [Telegram Bot API — Privacy mode](https://core.telegram.org/bots/features#privacy-mode)
  — Use for: the one Telegram setting that makes a group bot silent with
  no error and no log entry.
- [Hermes Agent docs: Telegram](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram)
  — Use for: `require_mention`, `exclusive_bot_mentions`,
  `ignored_threads`, and running several Hermes bots in one group. Note
  that `free_response_topics` is absent from this page and exists only
  in the adapter source.

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
