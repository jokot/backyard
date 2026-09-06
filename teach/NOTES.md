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
- **Cheap-model gotcha (verified 2026-09-06):** cheap/free-tier models
  (e.g. `deepseek/deepseek-v4-flash-0731`) can drift language even on
  plain English input, with nothing in config causing it. Fix is an
  explicit SOUL.md pin ("Always respond in English..."), not a config
  setting. Expect to need similar explicit pins for other implicit
  conventions when using cheap models — see
  `learning-records/0003-cheap-model-language-drift.md`.
