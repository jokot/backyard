# Stage 2 Implementation Plan: Sunflower, Crazy Dave, and the kanban board

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Sunflower (a second specialist, planning and spec-writing
domain), Crazy Dave (a coordinator), and a shared kanban board, so a
cross-domain request routes to the correct specialist without a manual
`hermes kanban` command.

**Architecture:** Two new Hermes profiles (`sunflower`, `crazydave`),
each with its own `SOUL.md`, model, and Telegram bot, plus one shared
kanban board initialized once. Crazy Dave's hard rule is to create a
kanban task and stop, never to answer directly. Hermes's own
`decompose`/dispatch pipeline does the routing, keyed off each
profile's `--description` — no custom router code is written.

**Tech Stack:** Hermes Agent CLI (profiles, gateway, kanban), Telegram
(via `hermes gateway`), the `teach` skill's lesson format (one
self-contained HTML file per hands-on step).

**Spec:** `docs/superpowers/specs/2026-09-06-stage2-sunflower-crazydave-design.md`

## Global Constraints

- Profile identifiers are single lowercase tokens: `sunflower`,
  `crazydave`.
- `--clone-from` copies memory files along with config. Every new
  profile gets `hermes memory reset` run immediately after creation,
  before first real use.
- `SOUL.md` for both new profiles uses the hard-rule pattern from the
  first draft: domain exclusions written as "HARD RULE, not a
  suggestion," an explicit ban on partial answers, and an explicit
  "always respond in English" line.
- After every edit to a real profile's `SOUL.md` or `config.yaml`,
  mirror the file into `hermes-config/<profile>/` in this repo and
  commit it. Never copy `.env` or `auth.json`.
- `kanban.orchestrator_profile` is set explicitly to `crazydave`, not
  left to the active-profile fallback.
- No custom routing code. Routing is `hermes kanban decompose` reading
  profile descriptions, and the dispatcher built into `hermes gateway
  start`.
- Every hands-on step is run by the user in their own terminal or
  Telegram app, not run on their behalf — the goal is the user
  learning the Hermes CLI, not just a working system.
- Lesson HTML body text and commit messages follow the STE-flavored
  writing style already used in Stage 1's lessons.
- Commit at every checkpoint: each lesson file, each learning record,
  each mirrored config file.

---

## File Structure

- `teach/lessons/0007-sunflower-a-second-specialist.html` through
  `teach/lessons/0015-the-stage2-end-to-end-check.html` — one lesson
  per task below, following the Stage 1 template
  (`teach/lessons/0001*.html` through `0006*.html`).
- `teach/lessons/0006-the-end-to-end-check.html` — modify, add a
  forward nav link to Lesson 7 (Stage 1's last lesson currently has no
  forward link).
- `teach/reference/glossary.html` — modify across several tasks, add
  entries for "Hermes skill," "Bundled skill manifest," "Kanban board,"
  "Profile description," "Decompose," and "Orchestrator profile" as
  each concept is introduced.
- `teach/learning-records/000N-<finding>.md` — create one per real
  finding, numbered following on from `0007-stage1-complete.md`.
  Content cannot be predicted ahead of the real run; see Stage 1's
  0002–0006 for the expected shape (root cause, fix, generalization).
- `hermes-config/sunflower/SOUL.md`, `hermes-config/sunflower/config.yaml`
  — create, mirroring the real files at
  `~/.hermes/profiles/sunflower/`.
- `hermes-config/crazydave/SOUL.md`, `hermes-config/crazydave/config.yaml`
  — create, mirroring `~/.hermes/profiles/crazydave/`.

## Amendment (post-Task 2)

After Task 2, the user asked to give Sunflower two skills from the
Claude Code superpowers plugin (`brainstorming`, `writing-plans`), and
to prune both Sunflower's and Peashooter's skill rosters down to what
each profile's own domain actually needs — not addressed in the
original spec, since it surfaced during Lesson 8's follow-up
questions. This inserted a new Task 3 below, and every task after it
shifted down by one (old Task 3 → Task 4, ... old Task 8 → Task 9), so
lesson filenames from `0009` on shifted by one number too.

---

### Task 1: Create Sunflower and assign its model

**Files:**
- Create: `teach/lessons/0007-sunflower-a-second-specialist.html`
- Modify: `teach/lessons/0006-the-end-to-end-check.html:90-93` (add a
  forward nav link, matching the `<div class="nav">` pattern already
  used in every other lesson)
- Create: `hermes-config/sunflower/config.yaml`

**Interfaces:**
- Consumes: none (first task of Stage 2).
- Produces: a real `sunflower` Hermes profile, with a model assigned
  and memory reset, that Task 2 writes `SOUL.md` for.

- [ ] **Step 1: Write Lesson 7.** Cover: Sunflower's domain
  (brainstorming, planning, task breakdown, PRDs, proposals, specs),
  why the name fits (Sunflower produces the resource other plants
  need, same as this specialist produces the plans Peashooter later
  implements), and the exact commands to run:
  ```
  hermes profile create sunflower --clone-from default --description "Brainstorming, planning, task breakdown, and writing PRDs, proposals, and specs"
  hermes profile use sunflower
  echo yes | hermes memory reset
  ```
  Include a "Correction" box up front, citing
  `teach/learning-records/0005-clone-from-carries-memory-too.md`,
  explaining why the memory reset runs immediately this time, instead
  of being discovered as a bug.
- [ ] **Step 2: Ask the user to run the three commands above** in
  their own terminal, and report the output of each.
- [ ] **Step 3: Verify the reset.** Ask the user to run
  `cat ~/.hermes/profiles/sunflower/memories/MEMORY.md` and confirm it
  returns "No such file or directory" (clean slate), matching Stage
  1's verification method.
- [ ] **Step 4: Assign Sunflower's model.** Ask the user to run
  `hermes model` while `sunflower` is the active profile, and pick the
  same OpenRouter model used for Peashooter, unless the user prefers a
  different one.
- [ ] **Step 5: Mirror the config and commit.** Read the real
  `~/.hermes/profiles/sunflower/config.yaml`, confirm it has no live
  secret (an empty-string `api_key: ''` placeholder is fine, a real
  key is not), copy it to `hermes-config/sunflower/config.yaml`, then:
  ```
  git add teach/lessons/0007-sunflower-a-second-specialist.html \
          teach/lessons/0006-the-end-to-end-check.html \
          hermes-config/sunflower/config.yaml
  git commit -m "Add Lesson 7: create Sunflower and assign its model"
  ```

---

### Task 2: Write Sunflower's SOUL.md

**Files:**
- Create: `teach/lessons/0008-sunflower-soul-and-scope.html`
- Create: `hermes-config/sunflower/SOUL.md`
- Modify: `teach/reference/glossary.html` (no new terms yet — SOUL.md
  is already defined; this task links back to that entry)

**Interfaces:**
- Consumes: the `sunflower` profile from Task 1.
- Produces: a real `SOUL.md` for `sunflower`, tested against clearly
  on-topic and clearly off-topic questions.

- [ ] **Step 1: Write Lesson 8.** Include the exact `SOUL.md` text to
  write, with the hard-rule pattern applied from the first draft, not
  discovered later:
  ```
  You are Sunflower, the planning and spec-writing specialist in
  Jokot's personal agent team.

  Domain: brainstorming, planning, task breakdown, and writing PRDs,
  proposals, and specs — turning a rough idea into a structured
  document. You do not write or review code; that is Peashooter's
  domain.

  Out of scope — HARD RULE, not a suggestion: software implementation,
  personal finance, tax, family/scheduling, health, religion, politics,
  general trivia, or any topic that is not planning or spec-writing.
  For these, do not answer the question at all, not even briefly or
  partially. Reply with exactly one short sentence declining and
  pointing back to planning topics, then stop. Never give the real
  answer "just in case it's useful."

  Personality: ask clarifying questions before writing a plan or spec,
  rather than guessing at scope. Always respond in English, even if the
  user writes in another language.

  You have persistent memory (MEMORY.md, USER.md) — use it. Record
  recurring facts about Jokot's planning conventions and past
  decisions so they don't have to be re-explained each session.
  ```
- [ ] **Step 2: Ask the user to write this to
  `~/.hermes/profiles/sunflower/SOUL.md`, replacing the inherited
  file, then report back once done.**
- [ ] **Step 3: Test on-topic.** Ask the user to run `sunflower` (or
  message its bot, once Task 4 connects it) and ask something clearly
  in scope, e.g. "break this feature idea into a task list: [a real
  small feature]." Confirm the reply stays on-topic and does not drift
  into writing the actual code.
- [ ] **Step 4: Test off-topic.** Ask a clearly off-topic question
  (same style as Peashooter's Lesson 3 test, e.g. "what is islam?").
  If Sunflower answers instead of declining, this is the same
  prompt-dilution failure Peashooter hit — check
  `hermes prompt-size --json` and tighten the wording the same way
  `teach/learning-records/0004-soft-instructions-lose-to-prompt-size.md`
  describes, then retest.
- [ ] **Step 5: Mirror and commit.** Copy the real
  `~/.hermes/profiles/sunflower/SOUL.md` (post-fix, if a fix was
  needed) to `hermes-config/sunflower/SOUL.md`. If a fix was needed,
  write `teach/learning-records/0008-<finding>.md` documenting it,
  following the shape of `0004-soft-instructions-lose-to-prompt-size.md`.
  Then:
  ```
  git add teach/lessons/0008-sunflower-soul-and-scope.html \
          hermes-config/sunflower/SOUL.md
  git commit -m "Add Lesson 8: write Sunflower's SOUL.md"
  ```

---

### Task 3: Give Sunflower its skill kit, and prune both profiles

**Files:**
- Create: `teach/lessons/0009-sunflowers-skill-kit.html`
- Modify: `teach/lessons/0008-sunflower-soul-and-scope.html:118-121` (add
  a forward nav link to Lesson 9)
- Modify: `teach/reference/glossary.html` (add "Hermes skill" and
  "Bundled skill manifest" entries — already done during planning;
  verify present)

**Interfaces:**
- Consumes: the `sunflower` profile (Task 1) and Peashooter's existing
  profile from Stage 1.
- Produces: `brainstorming` and `writing-plans` copied into Sunflower's
  own skill folder; the unwanted skill folders deleted from both
  `sunflower`'s and `peashooter`'s `skills/` directory (including
  Peashooter's pre-existing `teach`); five Matt Pocock skills copied
  into Peashooter and two into Sunflower; `ste-writing` copied into
  both. Peashooter ends at twenty-four enabled skills, Sunflower at
  eight. Neither profile's `config.yaml` changes.

- [ ] **Step 1: Write Lesson 9.** Cover four things, each grounded in
  direct verification, not assumption:
  1. Hermes skills and Claude Code skills share one format (a folder
     with a `SKILL.md`). Peashooter already proved a raw folder copy
     works — `~/.hermes/profiles/peashooter/skills/brainstorming/SKILL.md`
     is byte-identical to the official superpowers plugin's copy, and
     `teach/SKILL.md` is byte-identical to `~/.claude/skills/teach/SKILL.md`.
     Neither exists in Sunflower's or the default profile's skill
     folder, confirming skills are scoped per profile, not global.
  2. Two skills already bundled with Hermes overlap the two being
     copied in: `software-development/plan` ("adapted from
     obra/superpowers") and `software-development/spike`. The plan
     keeps `writing-plans` over the bundled `plan` skill for both
     profiles, since it carries the fuller self-review checklist this
     project has been using all along, and removes the thinner bundled
     one. `spike` stays for Peashooter (implementation feasibility
     checks fit its domain) and goes for Sunflower (spec-writing, not
     implementation). Also newly found: `devops/kanban-worker`
     documents the pitfalls a profile hits when Hermes dispatches it a
     kanban task — relevant to both Sunflower and Peashooter once Task
     8 initializes the board, since the dispatcher spawns each of them
     as a worker. Both keep it.
  3. Why deletion, not `skills.disabled`: a first draft of this lesson
     used a hand-typed `skills.disabled` YAML list (documented in
     `hermes_cli/skills_config.py`) instead of deleting folders. Real
     testing found it wrong in four places — a `find -maxdepth 3` scan
     missed six skills nested under `mlops/{evaluation,inference,models}/`,
     and `spike`/`yuanbao` were dropped by hand while copying one
     profile's list into the other's. Deleting the folder removes the
     list to maintain entirely.
  4. Why deletion is safe long-term: every profile's `skills/` folder
     carries a `.bundled_manifest` (`name:hash` per bundled skill),
     read by `tools/skills_sync.py`. Its own comment settles it: "In
     manifest but not on disk — user deleted it" → `skipped += 1`.
     `hermes update` never recopies a skill that is missing but still
     in the manifest. Reversible via
     `hermes skills reset <name> --restore`, which recopies one skill
     from Hermes's own bundled source — no plugin path or backup file
     needed.
  5. Checked against Peashooter's own `SOUL.md` ("software engineering
     only — code review, debugging, architecture, tooling,
     build/dependency issues, technical writing about code"), two
     earlier calls don't hold up. `writing-plans` never goes to
     Peashooter at all — it authors full implementation-plan
     documents, Sunflower's artifact type, not Peashooter's; Peashooter
     implements plans, it doesn't write them. `teach`, copied into
     Peashooter's profile in an earlier session, gets removed too — a
     generic "teach any topic" skill, unrelated to code, that risks
     walking Peashooter past its own HARD RULE if it ever fires.
     `brainstorming` stays: its "bounded" path (scope a change, present
     a short design in chat, get a yes, implement) is a real
     pre-implementation step for engineering work, not a
     planning-domain skill in disguise.
  6. Checked two more sources against each profile's domain: Matt
     Pocock's skill pack (`github.com/mattpocock/skills`, pinned to
     commit `6654f6b`) and a personal `ste-writing` skill already on
     this machine. Five of Matt Pocock's skills add real capability to
     Peashooter with no overlap against what it keeps already —
     `code-review`, `codebase-design`, `improve-codebase-architecture`,
     `domain-modeling`, `resolving-merge-conflicts`. Two do the same
     for Sunflower — `wayfinder`, `research`. The rest of the pack
     either duplicates a skill already kept (`diagnosing-bugs` vs
     `systematic-debugging`, `tdd` vs `test-driven-development`,
     `prototype` vs `spike`, `grilling` vs `brainstorming`'s bounded
     path, `to-spec`/`to-tickets` vs Sunflower's own `to-prd`,
     `to-issues`, `writing-plans`), or is off-domain, or needs a
     configured issue tracker first. `ste-writing` (rewrites
     documentation, READMEs, PR text, commit messages into ASD-STE100
     Simplified Technical English, never code) fits both profiles —
     Peashooter's own domain names "technical writing about code,"
     Sunflower writes PRDs, proposals, and specs.
  7. First copy attempt for `ste-writing` broke: its usual source,
     `~/.claude/skills/ste-writing`, is a symlink into a shared
     `~/.agents/skills/` store (confirmed — all 82 entries under
     `~/.claude/skills/` are symlinks, tracked by that store's own
     `.skill-lock.json`). macOS `cp -R` of a symlink copies the link
     itself, not its target, so the copy landed as a symlink whose
     relative target no longer resolved from its new home inside a
     profile's `skills/` folder — `ls` printed the dead link's target
     path back instead of real files. Fix: source from
     `~/.agents/skills/ste-writing`, the real directory, not the
     `~/.claude/skills/` alias.
  Give the exact commands:
  ```
  cp -R /Users/jokot/.claude/plugins/cache/claude-plugins-official/superpowers/6.3.0/skills/brainstorming ~/.hermes/profiles/sunflower/skills/
  cp -R /Users/jokot/.claude/plugins/cache/claude-plugins-official/superpowers/6.3.0/skills/writing-plans ~/.hermes/profiles/sunflower/skills/
  hermes skills list -p sunflower --source local
  ```
  Then the exact deletion commands for Sunflower — every skill in a
  whole category goes except two mixed categories, where only the
  named skills are removed, keeping `devops/kanban-worker` and
  `openclaw-imports/{grill-me,to-issues,to-prd}` in place:
  ```bash
  cd ~/.hermes/profiles/sunflower/skills

  # Whole categories — nothing inside them fits Sunflower's domain
  rm -rf apple autonomous-ai-agents computer-use creative data-science \
         dogfood email github hermes-desktop-plugins media mlops \
         note-taking productivity research smart-home social-media \
         software-development yuanbao

  # Mixed categories — remove only the unwanted skills, keep the rest
  rm -rf devops/kanban-orchestrator
  rm -rf openclaw-imports/caveman openclaw-imports/diagnose \
         openclaw-imports/find-skills openclaw-imports/grill-with-docs \
         openclaw-imports/improve-codebase-architecture \
         openclaw-imports/prototype openclaw-imports/setup-matt-pocock-skills \
         openclaw-imports/tdd openclaw-imports/triage \
         openclaw-imports/write-a-skill openclaw-imports/zoom-out
  ```
  What's left in Sunflower's `skills/`: `brainstorming`,
  `writing-plans`, `devops/kanban-worker`, and
  `openclaw-imports/{grill-me,to-issues,to-prd}`.

  And, for Peashooter — the whole `github/` category stays (all seven
  skills are wanted), and only four `software-development` skills and
  two `devops` skills are removed:
  ```bash
  cd ~/.hermes/profiles/peashooter/skills

  # Whole categories — nothing inside them fits Peashooter's domain
  rm -rf apple autonomous-ai-agents computer-use creative data-science \
         dogfood email hermes-desktop-plugins media mlops note-taking \
         openclaw-imports productivity research smart-home social-media \
         yuanbao

  # A standalone skill that doesn't fit either — teaches any topic, not
  # code, and risks stepping past Peashooter's own HARD RULE
  rm -rf teach

  # Mixed categories — remove only the unwanted skills, keep the rest
  rm -rf devops/expose-local-web-over-tunnel devops/kanban-orchestrator
  rm -rf software-development/cli-distribution \
         software-development/cli-onboarding-design \
         software-development/hermes-agent-skill-authoring \
         software-development/plan
  ```
  What's left in Peashooter's `skills/`: `brainstorming`, all seven
  `github/` skills, `devops/kanban-worker`, and ten remaining
  `software-development` skills.
- [ ] **Step 2: Ask the user to run the two `cp -R` commands and the
  `hermes skills list -p sunflower --source local` check**, and report
  the output — confirm `brainstorming` and `writing-plans` both show
  `local` / `enabled`.
- [ ] **Step 3: Ask the user to run Sunflower's deletion commands**,
  then run `hermes skills list -p sunflower --enabled-only` and report
  the output. Confirm exactly five skills show enabled: `to-prd`,
  `to-issues`, `grill-me`, `brainstorming`, `writing-plans`.
  `kanban-worker` also stays but won't show — it declares
  `environments: [kanban]`, so it's hidden until Task 8 activates the
  kanban environment.
- [ ] **Step 4: Ask the user to run Peashooter's deletion commands**
  (`teach` included), then run
  `hermes skills list -p peashooter --enabled-only` and report the
  output. Confirm exactly eighteen skills show enabled: `brainstorming`,
  `codebase-inspection`, `git-account-switching`, `git-multi-account`,
  `github-auth`, `github-code-review`, `github-issues`,
  `github-pr-workflow`, `github-repo-management`,
  `headless-webapp-testing`, `node-inspect-debugger`, `python-debugpy`,
  `requesting-code-review`, `simplify-code`, `spike`,
  `systematic-debugging`, `technical-documentation`,
  `test-driven-development`. `kanban-worker` also stays but won't
  show — hidden for the same reason as Sunflower's.
- [ ] **Step 5: Ask the user to copy the five Matt Pocock skills into
  Peashooter and the two into Sunflower**, then confirm each target
  directory has a real `SKILL.md`, not a missing folder.
- [ ] **Step 6: Ask the user to copy `ste-writing` into both profiles**
  from `~/.agents/skills/ste-writing` — not the `~/.claude/skills/`
  alias, which breaks per Step 1 point 7 above.
- [ ] **Step 7: Ask the user to run both
  `hermes skills list -p <profile> --enabled-only` commands again**
  and report the output. Confirm Peashooter shows exactly twenty-four
  skills (the eighteen from Step 4, plus `code-review`,
  `codebase-design`, `improve-codebase-architecture`,
  `domain-modeling`, `resolving-merge-conflicts`, `ste-writing`), and
  Sunflower shows exactly eight (the five from Step 3, plus
  `wayfinder`, `research`, `ste-writing`).
- [ ] **Step 8: Commit.** Nothing in either profile's `config.yaml`
  changed, so there is nothing to mirror into `hermes-config/` this
  time — commit only the lesson and reference changes.
  ```
  git add teach/lessons/0009-sunflowers-skill-kit.html \
          teach/lessons/0008-sunflower-soul-and-scope.html \
          teach/reference/glossary.html
  git commit -m "Add Lesson 9: give Sunflower its skill kit, prune both profiles by deletion"
  ```

---

### Task 4: Set profile descriptions for both specialists

**Files:**
- Create: `teach/lessons/0010-descriptions-are-the-routing-signal.html`
- Modify: `teach/reference/glossary.html` (add "Profile description"
  entry, with a `.from` backlink to this lesson)

**Interfaces:**
- Consumes: `sunflower`'s `--description`, set at creation in Task 1;
  Peashooter's existing `--description` from Stage 1.
- Produces: two profile descriptions specific enough for
  `hermes kanban decompose` (Task 8) to route correctly between them.

- [ ] **Step 1: Write Lesson 10.** Explain, citing
  `hermes_cli/kanban_decompose.py`, that the decomposer reads exactly
  this text to choose an assignee, so a vague description
  ("engineering stuff") routes worse than a specific one. Give the
  exact command to check and, if needed, update each description:
  ```
  hermes profile list
  hermes profile describe peashooter --description "Software engineering: code review, debugging, architecture, tooling, build and dependency issues, technical writing about code"
  hermes profile describe sunflower --description "Brainstorming, planning, task breakdown, and writing PRDs, proposals, and specs"
  ```
- [ ] **Step 2: Ask the user to run `hermes profile list` and paste
  the output**, showing both descriptions as currently set.
- [ ] **Step 3: Sharpen if needed.** If either description reads as a
  one-word label rather than a real routing signal, ask the user to
  run the `hermes profile describe` command above with a more specific
  value, then re-run `hermes profile list` to confirm.
- [ ] **Step 4: Commit.**
  ```
  git add teach/lessons/0010-descriptions-are-the-routing-signal.html \
          teach/reference/glossary.html
  git commit -m "Add Lesson 10: profile descriptions as the routing signal"
  ```

---

### Task 5: Connect Sunflower to Telegram

**Files:**
- Create: `teach/lessons/0011-sunflower-on-telegram.html`

**Interfaces:**
- Consumes: the `sunflower` profile, with model and `SOUL.md` set
  (Tasks 1–2).
- Produces: a running Telegram bot for Sunflower, reachable the same
  way Peashooter's bot is.

- [ ] **Step 1: Write Lesson 11.** Reuse Stage 1 Lesson 5's structure
  (gateway concept already taught; no need to re-explain it in full,
  link back instead). Give the exact commands:
  ```
  hermes profile use sunflower
  hermes gateway setup
  hermes gateway install
  hermes gateway status
  ```
  Note up front that Automatic setup failed in Telegram Web during
  Stage 1 (`teach/learning-records/0006-telegram-automatic-setup-failed-in-web.md`);
  if it fails again, go straight to Manual BotFather rather than
  re-debugging it.
- [ ] **Step 2: Ask the user to run the commands and report the
  output of `hermes gateway status`.**
- [ ] **Step 3: Verify it shows Sunflower's gateway running, not
  stopped or errored.** If Automatic setup fails, walk through Manual
  BotFather (message `@BotFather`, `/newbot`, unique `...bot`
  username, paste the token into the manual prompt), same as Stage 1.
- [ ] **Step 4: Commit.**
  ```
  git add teach/lessons/0011-sunflower-on-telegram.html
  git commit -m "Add Lesson 11: connect Sunflower to Telegram"
  ```

---

### Task 6: Create Crazy Dave and write its SOUL.md

**Files:**
- Create: `teach/lessons/0012-crazy-dave-the-coordinator.html`
- Create: `hermes-config/crazydave/SOUL.md`,
  `hermes-config/crazydave/config.yaml`

**Interfaces:**
- Consumes: none new — a fresh profile, same as Task 1's pattern.
- Produces: a real `crazydave` profile whose only behavior is
  creating a kanban task and subscribing the chat to it. The kanban
  tool calls in its `SOUL.md` become callable once Task 8 initializes
  the board; until then, this task only sets up the profile and its
  instructions.

- [ ] **Step 1: Write Lesson 12.** Explain Crazy Dave's narrow job —
  route, never answer — and why that is a hard rule, not a
  preference, citing Peashooter's own prompt-dilution history as the
  reason to write it strict from day one. Give the exact commands:
  ```
  hermes profile create crazydave --clone-from default --description "Coordinator: routes ambiguous or cross-domain requests to the right specialist via the kanban board"
  hermes profile use crazydave
  echo yes | hermes memory reset
  ```
  and the exact `SOUL.md` text:
  ```
  You are Crazy Dave, the coordinator in Jokot's personal agent team.

  Domain: none — you do not answer requests yourself. Your only job is
  routing.

  HARD RULE, not a suggestion: on every message, create one kanban
  task with the user's request as the task body, using the kanban
  tool. Then subscribe the current chat to that task's events. Then
  stop. Do not answer the request, do not summarize it, do not add
  commentary beyond confirming the task was created. Never give a
  direct answer "just in case it's faster."

  Personality: brief. Confirm the task id was created and that the
  chat is subscribed, nothing more.

  You have persistent memory (MEMORY.md, USER.md) — use it only to
  remember routing corrections Jokot gives you (e.g. "requests like X
  actually belong to Sunflower, not Peashooter").
  ```
- [ ] **Step 2: Ask the user to run the two commands, write the
  `SOUL.md`, and report back.**
- [ ] **Step 3: Mirror and commit.** Copy the real
  `~/.hermes/profiles/crazydave/{SOUL.md,config.yaml}` into
  `hermes-config/crazydave/`, confirming no live secret in
  `config.yaml` first.
  ```
  git add teach/lessons/0012-crazy-dave-the-coordinator.html \
          hermes-config/crazydave/SOUL.md \
          hermes-config/crazydave/config.yaml
  git commit -m "Add Lesson 12: create Crazy Dave and write its SOUL.md"
  ```

---

### Task 7: Connect Crazy Dave to Telegram

**Files:**
- Create: `teach/lessons/0013-crazy-dave-on-telegram.html`

**Interfaces:**
- Consumes: the `crazydave` profile from Task 5.
- Produces: a third, running Telegram bot, separate from Peashooter's
  and Sunflower's.

- [ ] **Step 1: Write Lesson 13.** Same structure as Task 5's lesson,
  commands:
  ```
  hermes profile use crazydave
  hermes gateway setup
  hermes gateway install
  hermes gateway status
  ```
- [ ] **Step 2: Ask the user to run the commands and report the
  output of `hermes gateway status`.**
- [ ] **Step 3: Verify it shows Crazy Dave's gateway running.**
- [ ] **Step 4: Commit.**
  ```
  git add teach/lessons/0013-crazy-dave-on-telegram.html
  git commit -m "Add Lesson 13: connect Crazy Dave to Telegram"
  ```

---

### Task 8: Initialize the kanban board

**Files:**
- Create: `teach/lessons/0014-the-shared-kanban-board.html`
- Modify: `teach/reference/glossary.html` (add "Kanban board,"
  "Decompose," and "Orchestrator profile" entries)

**Interfaces:**
- Consumes: both `sunflower` and `crazydave` profiles, existing and
  described (Tasks 1, 3, 5).
- Produces: one shared kanban board with `orchestrator_profile` set to
  `crazydave`, ready for Task 8's real test.

- [ ] **Step 1: Write Lesson 14.** Cover what the board is (shared
  SQLite task board, columns triage → todo → ready → running → done),
  what `decompose` does (reads the profile roster with descriptions,
  fans a task into assigned children), and what the dispatcher does
  (runs inside `hermes gateway start`, claims ready tasks, spawns the
  assigned profile as a worker). Explain that `orchestrator_profile`
  is a real key under `kanban:` in each profile's own `config.yaml`
  (confirmed present, empty by default, in
  `~/.hermes/profiles/peashooter/config.yaml`), and that it is set in
  all three profiles rather than just Crazy Dave's, since which
  profile's own gateway runs the actual dispatch pass is not
  guaranteed. Give the exact commands:
  ```
  hermes kanban init
  hermes kanban boards
  ```
  Then, for each of `peashooter`, `sunflower`, and `crazydave`, open
  that profile's `~/.hermes/profiles/<name>/config.yaml`, find the
  `kanban:` section, and change:
  ```
  kanban:
    orchestrator_profile: ''
  ```
  to:
  ```
  kanban:
    orchestrator_profile: 'crazydave'
  ```
- [ ] **Step 2: Ask the user to run `hermes kanban init` and
  `hermes kanban boards`, and report the output.**
- [ ] **Step 3: Ask the user to edit `orchestrator_profile` to
  `'crazydave'` in all three profiles' `config.yaml`**, and report
  back once done for each.
- [ ] **Step 4: Verify.** Ask the user to run
  `grep -A1 "^kanban:" ~/.hermes/profiles/<name>/config.yaml` for each
  of the three profiles, and confirm `orchestrator_profile:
  'crazydave'` in each.
- [ ] **Step 5: Mirror and commit.** `orchestrator_profile` changed in
  all three profiles' `config.yaml`, so re-copy
  `hermes-config/peashooter/config.yaml` as well as
  `hermes-config/sunflower/config.yaml` and
  `hermes-config/crazydave/config.yaml`, then:
  ```
  git add teach/lessons/0014-the-shared-kanban-board.html \
          teach/reference/glossary.html \
          hermes-config/peashooter/config.yaml \
          hermes-config/sunflower/config.yaml \
          hermes-config/crazydave/config.yaml
  git commit -m "Add Lesson 14: initialize the shared kanban board"
  ```

---

### Task 9: End-to-end test — the full route

**Files:**
- Create: `teach/lessons/0015-the-stage2-end-to-end-check.html`
- Create: `teach/learning-records/0009-stage2-complete.md` (once all
  four Stage 2 success criteria pass, following the shape of
  `0007-stage1-complete.md`)
- Modify: `docs/superpowers/specs/2026-09-06-stage2-sunflower-crazydave-design.md`
  (update **Status** to Complete, same as Stage 1's spec)

**Interfaces:**
- Consumes: all profiles and the kanban board from Tasks 1–8.
- Produces: a verified, working route from one Telegram message to
  Crazy Dave through to a completion notice back in that same chat.

- [ ] **Step 1: Write Lesson 15.** Give the exact test: message
  Crazy Dave's bot on Telegram with one request spanning both
  specialists, for example "write a short spec for a small feature,
  then implement it," and the exact verification commands:
  ```
  hermes kanban list
  hermes kanban show <task_id>
  ```
- [ ] **Step 2: Ask the user to send the test message and report
  Crazy Dave's Telegram reply.** Confirm it only confirms task
  creation and subscription, and does not answer the request itself.
  If it answers directly, this is Crazy Dave's version of Peashooter's
  Lesson 3 bug — fix the `SOUL.md` hard-rule wording the same way and
  retest before continuing.
- [ ] **Step 3: Ask the user to run `hermes kanban list` and report
  the output.** Confirm two child tasks exist, one assigned to
  `sunflower`, one to `peashooter`, linked so the implementation task
  depends on the spec task.
- [ ] **Step 4: Ask the user to wait for both child tasks to
  complete** (checking `hermes kanban show <task_id>` for each), and
  confirm the Crazy Dave Telegram chat receives a completion message
  for each, with no `hermes kanban` command run by hand during the
  run itself.
- [ ] **Step 5: If any of Steps 2–4 fails**, treat it the same as
  every other real bug found in this project: diagnose, fix, retest,
  write a learning record documenting the root cause and fix.
- [ ] **Step 6: Once all four Stage 2 success criteria pass**, write
  `teach/learning-records/0009-stage2-complete.md`, listing each
  criterion and linking back to any learning records written along
  the way. Update the spec's **Status** field to Complete, with
  today's date.
- [ ] **Step 7: Commit.**
  ```
  git add teach/lessons/0015-the-stage2-end-to-end-check.html \
          teach/learning-records/0009-stage2-complete.md \
          docs/superpowers/specs/2026-09-06-stage2-sunflower-crazydave-design.md
  git commit -m "Complete Stage 2: Sunflower, Crazy Dave, and the kanban board"
  ```
