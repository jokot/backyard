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

An open port is not a working service. Test a service with a request,
never with lsof. A server that an agent started inherits the pipe of the
agent, and it stops inside a log write at request 978 while the port
stays in LISTEN. Lesson 31 and learning record 0038.

A file edit is not a delivery. A soul file reaches the agent through a
system prompt that the gateway builds once for each session and then
reuses verbatim. Send `/new` in the topic after any soul file change,
then query the `sessions` table for the new text. See record 0045.

An "always" button stores a pattern key, not the command on screen.
`recursive delete` covers every `rm -r` on every path. The permanent
allowlist only grows, because the loader runs
`_permanent_approved.update()` once for each process. A removal needs an
edit of the file and a gateway restart. See record 0046.

A silent job is a job that a person reads. Both Stage 5 cron jobs print
nothing when the roster is healthy. `roster-audit.sh` prints one line for
each broken rule, and `blocked-watch.sh` prints one line for each task
that stayed blocked for more than 3600 seconds. A job that speaks on
every run teaches a person to ignore it.

A threshold is not the rule that it stands for. The first check 4 of the
audit counted Telegram sessions older than 7 days, because days are easy
to count. The rule is "no session runs a prompt older than the last soul
file edit", and a session of 6 days can carry the old rule and pass the
check. Check 4 now reads the stored prompt of each open session and
compares it against the current soul file. When a proxy is easier to
measure than the rule, measure the rule anyway. See record 0051,
section 2.

Test a soft verb before you trust it. `hermes sessions archive` sets
`archived = 1` and never writes `ended_at`. The gateway reuse query
filters on `ended_at IS NULL` and never reads `archived`, so an archived
session is still reused. Only `sessions delete` ends the row, and it
destroys the conversation. See record 0051, section 1.

Ask what deleted a thing before you re-create it. A script that sits on
disk, executable and dated, can be the leftover of a deletion instead of
a finished step that nobody scheduled. See record 0050.

Jokot lifted the "Jokot runs every command" constraint for Stage 5 on
17 September 2026, with the words "run everything you can execute by
yourself, then tell me when I need to do my part". The controller then
installed three scripts, created two cron jobs and edited three soul
files. The constraint still stands for later stages until Jokot lifts it
again.

A path that starts with a tilde is not a path yet. The security scanner
opens a nested script before the command runs, so it must resolve the
path itself. A shell expands the tilde, and an agent never gets that far.
The scanner answers `block` with two findings that read
`analysis_incomplete`. Write every script path in full inside a soul
file. See record 0051, section 4.

Find the binary that the resolver picks, not the binary on your PATH.
Five copies of `tirith` live under `~/.hermes`, and `which tirith` finds
none of them. Each profile runs the copy in its own `bin` directory, and
the versions differ. Testing the wrong copy returned `allow` and hid the
cause for two working sessions.

A script that reads `$1` and `$2` accepts `$3` in silence. A report call
that lost its quotation marks still sent, and it sent one word. The
caller read the wrong message, corrected the call, and sent a second
report for one task. Count the arguments before the side effect, and a
wrong call costs nothing.

A rule is checkable when it leaves a trace. Five rules of Stage 5 have a
check in `roster-audit.sh`. One does not, and it cannot: a report that
does not send must be retried. Only the agent that made the call can see
that the call failed. Name a limit of this kind in the mission, instead
of leaving the criterion open forever.

Read the tests that exist before you decide the code under them is wrong.
The reviewer anchored a `grep` match to the start of a line, to stop a
false alarm that no real file produced. The test fixtures already held
the case that the anchor broke, and they predated the change. The change
was removed.

A test fixture that is a copy of production data carries production data.
The dedup job was proved against a copy of the live kanban board, which
held 90 real tasks with real titles and real comment text. The copy was
not committed, and `.gitignore` now covers that shape.

An idle specialist is a property of the request. The third job of
criterion 7 gave Sunflower no task, because the request already carried
the design. The roster is wrong only when it gives planning work to a
profile that does not plan.

Stage 5 found its defects between a call and its effect. A report met an
approval prompt and reported success. A malformed call sent anyway. An
audit query read every session instead of the open ones. In each case the
caller could not see the failure from where it stood. Ask what the caller
sees when the step fails, and make the failure reach the caller. Learning
record 0051.

**18 September 2026 — the `blocked-watch` job now keeps state.** The job
ran `every 60m` and reported every still-blocked task on every run. A task
blocked overnight produced about 12 identical messages. The installed
script now compares the current set of blocked tasks against the set of
the last run that spoke, and it prints nothing when the two sets match.
State lives at `~/.hermes/profiles/crazydave/scripts/.blocked-watch-state.json`,
mode 0600. The mirror is `hermes-config/scripts/blocked-watch.sh`. The
backup of the old script is `~/blocked-watch.sh.bak-predup`.
