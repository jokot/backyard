# Notes

- User is an experienced software engineer, 2 years of daily AI-tool use
  at work. Skip beginner explanations of git/CLI/APIs — focus term
  explanations on domain-specific vocabulary (Hermes concepts, agent-
  system patterns).
- User wants lessons interleaved with the real build: each lesson should
  advance the actual Stage 1 spec, not a toy example.
- User explicitly asked for unfamiliar terms explained on every lesson —
  keep the glossary (`reference/glossary.html`) current and link it from
  each lesson.
- This teaching workspace lives at `plants/teach/`, a subfolder — kept
  separate from the actual project build artifacts (which live at
  `plants/docs/` and, once created, `~/.hermes/profiles/peashooter/`) so
  the two concerns (learning materials vs. shipped config) don't get
  tangled in the same directories.
- The approved build spec this teaching track follows:
  `../docs/superpowers/specs/2026-09-06-peashooter-stage1-design.md`.
- Bot naming theme: Plants vs. Zombies. First agent = Peashooter (coding
  specialist).
- **Hermes gotcha (verified 2026-09-06):** `hermes auth add <provider>
  --type api-key` writes to a separate credential pool that `hermes
  model`/`hermes doctor` do NOT read for plain API-key providers like
  OpenRouter. The real mechanism is the `OPENROUTER_API_KEY` env var,
  which `hermes model`'s own interactive picker prompts for directly and
  presumably writes to a profile's `.env`. Watch for the same split with
  other API-key providers (GLM, Kimi, MiniMax, Novita, Gemini, Ollama —
  all templated as env vars in `.env`) before writing future lessons that
  touch `hermes auth add` for a non-OAuth provider.
