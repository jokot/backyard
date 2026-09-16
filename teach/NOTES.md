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
- **A `SOUL.md` change needs `/new` in every chat, not only a gateway
  restart.** The restart rebuilds the system prompt and keeps the
  conversation history. The model follows the transcript it can see.
  Learning record 0013 holds the log that proves it. Add the reset step to
  every lesson that edits a `SOUL.md` on a profile that is already talking
  to someone.
- **Check that the model could read the instruction before you rewrite
  the instruction.** The greeting failure looked exactly like learning
  record 0004, prompt dilution. Reading `agent/system_prompt.py` ruled
  that out in two minutes and saved a rewrite that would have changed
  nothing.

- A rule that names a property of its subject fires only for that
  property. "The state of work on the board" covered status and excluded
  judgement, so Dave filed a task for "which one is a noise task". Name
  the subject, then add limits. Lesson 20, learning record 0014.

- Draw an agent's boundary from ownership, not from the shape of the
  operation. "Read is safe, write is not" made Crazy Dave file a task to
  delete tasks. Crazy Dave owns the board, so board upkeep is its own
  work. Lesson 21, learning record 0015.

- For a destructive command, take the limits from the implementation, not
  from the conversation. Reading `archive_task` found that an archived
  parent releases its children, which turns a tidy-up request into three
  new workers.

- A formula in a specification is code, so run it before approving the
  specification. Sunflower's Zuma chain rule described gap closure and
  used a clamp that cannot close a gap. Twelve lines of `node` proved a
  100 px gap stays at 100.00 px after 10 seconds. The spec task reported
  `tests_run: 0`. Learning record 0016.

- When two regions of one prompt each describe a complete procedure for
  the same moment, the model runs one region and not the union. Crazy
  Dave's root completion needed five actions stated in three places. One
  run did the Fizzy half, another run did the kanban half, and the file
  never changed. One moment, one numbered list, at the trigger, with the
  commands. Learning record 0017.

- Name a durable destination for every artifact a request asks for. An
  unnamed destination is chosen by the scratch workspace the worker runs
  in, and that directory is removed when the run ends. The timer
  specification was reported at a path that no longer exists, and the
  wrong path is now permanent inside a closed Fizzy card. Learning record
  0018.

- A checklist verifies a step. It never introduces one. Lesson 19 named
  the configuration mirror only in its checkpoint, so three repository
  files stayed at the Stage 2 configuration for a whole stage while the
  live machine was correct. Every checkpoint line must trace to a
  numbered step that carries the command. Learning record 0019.

- Stage 3 found its defects in the writing, not in the code. Five of the
  seven records name a document that instructs someone: a SOUL.md clause,
  a boundary rule, a specification formula, a prompt split across three
  regions, and a lesson checkpoint. No new code path failed. Read an
  instruction the way you read a function signature. Ask what it
  excludes, and name the second caller. Learning record 0020.

- A move is a deployment event. Renaming the Zuma directory left the
  running server with every descriptor open and every request at 404,
  because `python -m http.server` resolves `os.getcwd()` once at startup
  and stores the answer as a string. The record 0011 descriptor check
  reported a healthy process. Ask which values a program resolved once,
  and recheck every "it is running" claim after a rename. Learning
  record 0021.

- Stage 4 found defects in the gap between stating a rule and the rule
  taking effect. A cut skill kit grew back, a written fix ran on no
  schedule, a backup copied an empty directory, and a removed heading
  left the output while the rule stayed. After you state a rule, ask what
  would change on the machine if the rule were false. If the answer is
  nothing, you have written a note about a rule. Every rule needs a
  command that fails when the rule is broken. Learning record 0042.

An indirection records an intention. It does not perform it. Lesson 17
wrote `TELEGRAM_HOME_CHANNEL` so that one edit could move the roster into
a group. Stage 3 built the group and never made the edit. Learning
record 0043.

A soul file states an intention. A toolsets key performs it. The
`SOUL.md` of Crazy Dave named the kanban tool for seven days while the
profile lacked `kanban` in `toolsets`, so every board action went through
the terminal. Learning record 0044.
