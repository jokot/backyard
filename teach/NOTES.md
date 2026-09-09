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
- **Commit practice (established 2026-09-06):** commit at every natural
  checkpoint, not just when asked — lesson files, exercise artifacts
  landing in the repo (e.g. `snake.html`), and profile config. Since
  the real `SOUL.md`/`config.yaml` live outside this repo at
  `~/.hermes/profiles/peashooter/`, mirror them into
  `hermes-config/peashooter/` after each hands-on edit and commit that
  copy — never copy `.env` or `auth.json` (they hold live secrets).

- **Stage 3 scope (decided 2026-09-09):** the Ark Telegram group plus a
  one-way Fizzy mirror, both in one stage. Spec at
  `../docs/superpowers/specs/2026-09-09-stage3-ark-and-fizzy-design.md`,
  plan at `../docs/superpowers/plans/2026-09-09-stage3-ark-and-fizzy.md`.
  Three bots keep three separate gateways. Gateway multiplexing through
  `profile_routes` was considered and rejected, because it would replace
  three working gateways with one untested configuration.
- **Telegram gotcha (verified 2026-09-09 in adapter source):**
  `ignored_threads` is checked before the mention and free-response
  checks, so a bot that ignores a topic cannot be summoned there by
  mention. Use `free_response_topics` instead. That key is checked
  *before* `require_mention`, which is what gives one topic a default
  listener while every other topic still needs a mention. It appears
  nowhere in the Telegram documentation — only at
  `plugins/platforms/telegram/adapter.py:7251`.
- **Fizzy gotcha (verified 2026-09-09):** the repository
  `basecamp/fizzy-cli` uses `master` as its default branch, so a
  `raw.githubusercontent.com/.../main/...` URL returns 404. The JSON
  field that addresses a new card is not documented in `README.md` or
  `SURFACE.txt`. Lesson 21 finds it from real output rather than
  guessing it.
- **Link path gotcha (fixed 2026-09-09):** lessons live at
  `teach/lessons/`, so a link to the build documents needs
  `../../docs/superpowers/...`. Eight Stage 2 lessons used `../docs/`
  and were broken. Verify local links resolve before committing a
  lesson, the same way tag balance is verified.

- **A coordinator in a group room needs reply moments, not a reply
  mode.** Crazy Dave's hard rule filed a kanban task for every message,
  which was safe while a direct chat was the only way in. A free-response
  topic makes greetings and status questions reach the same rule. The fix
  is two named exceptions, small talk and board questions, above the hard
  rule. Do not write "reply when the message is conversational". That
  asks the model to judge every message, which is the failure learning
  record 0004 already recorded.
- **Filing is the safe default, so replies are the exception.** A junk
  task is visible on the board and `hermes kanban archive` removes it. A
  request answered as chat leaves no record anywhere. Lesson 20 names
  this silent non-routing. When a clause could fail in either direction,
  pick the direction that leaves evidence.
