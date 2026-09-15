# 0042 — Stage 4 complete

**Date:** 2026-09-15
**Stage:** 4, Torchwood and the roster pattern
**Specification:** [2026-09-11 Stage 4 design](../../docs/superpowers/specs/2026-09-11-stage4-torchwood-and-the-roster-pattern-design.md)
**Score:** 10 of 10 criteria pass

## Section 0 — The ten criteria, scored

Every line below names the output that decided the score. A criterion
with no reported command output and no reported Telegram text does not
pass.

| # | Criterion | Score | Evidence |
|---|---|---|---|
| 1 | A fourth bot answers in Prompts, under a new username | pass | Lesson 25 test 1. Torchwood answered in Prompts, alone, from the new username. |
| 2 | Torchwood answers in Prompts and stays silent in threads 1, 2 and 3 | pass | Lesson 26 tests 2, 3 and 4. The owner answered in each thread and Torchwood stayed silent. |
| 3 | One `auto_decompose` tick assigns Peashooter or Sunflower, never `torchwood` | pass | Lesson 27. Sixty seconds after the create command the board held `t_2c9f7149 todo crazydave`, `t_db020b96 running sunflower`, `t_7ae96c4d todo peashooter`. No child named `torchwood`. |
| 4 | One message, one fenced code block | pass | Lesson 29 test 1, second run, 15 September 2026. |
| 5 | Headings match the `##` headings of `TEMPLATE.md`, in file order | pass | Lesson 29 test 1, second run. Six headings, file order. |
| 6 | A `Checked:` trailer lists at least one command, and every path traces to one | pass | Lesson 29 test 1, second run. Three distinct paths, each traced to its own `ls -l`. Both `Done when` commands ran, and `node test.js` printed `RESULT  20/20 checks passed`. |
| 7 | A new heading changes the next prompt, and removal changes it back | pass | Lesson 29 test 2. The heading arrived 14 September at 07:08:39 and appeared in three prompts. The heading left on 15 September and the next prompt held five headings. Gateway process 68460 ran unchanged across both halves. |
| 8 | A per-prompt override changes one prompt only | pass | Lesson 29 test 3. The override crossed two turns. `git diff --stat hermes-config/torchwood/TEMPLATE.md` printed nothing, and `diff` against the live file printed nothing. |
| 9 | Torchwood declines a file edit, and `git status` stays clean | pass | Lesson 29 test 4, second run. The first message read `I write no file; I will interview you and produce a finished edit prompt for another agent.` `git status --short -- projects/` printed nothing, and `notify.sh` kept its mtime of 2026-09-10 17:43:31. |
| 10 | The reference document holds seven rows | pass | `teach/reference/adding-a-specialist.html` holds 7 rows in table 1, counted by script. |

Criteria 4, 5 and 6 come from one run of one test. Criterion 6 failed on
14 September and passed on 15 September. The failing run is in
[record 0034](0034-a-path-that-lost-a-segment.md).

## Section 1 — What the stage built

Stage 4 added one profile to the roster and one reusable pattern to the
course.

The profile is Torchwood, the prompt specialist.

- Model: `openai/gpt-5.6-luna`, key `model.default` in `config.yaml`.
- Topic: `Prompts`, thread 157, key `telegram.free_response_topics`.
  Telegram built the id from a message id, so the fourth topic did not
  take the number 4.
- Board membership: `kanban.orchestrator_profile: crazydave`, and no work
  ever assigned.
- Routing description: "Interactive prompt writing in the Prompts topic.
  Never a work destination. Do not assign kanban tasks here."
  `description_auto: false`.
- Limits: `SOUL.md`, 74 lines. It writes no file, it moves no file, and
  it deletes no file.
- Skeleton: `TEMPLATE.md`, six `##` headings, edited by the user without
  a restart.
- Skill kit: two skills, `ste-writing` and
  `prompting/prompt-interviewing`.

The pattern is `teach/reference/adding-a-specialist.html`. It holds seven
rows. Each row names one decision, the one file that holds it, the value
Torchwood used, and the trap the decision hides. The roster table below
it holds four plants.

## Section 2 — What the stage cost

Six lessons, numbered 0025 to 0030.

Fourteen learning records, numbered 0029 to 0042. Thirteen of them name a
defect. One line for each:

- 0029 — a clone carried the skill kit of the profile it copied.
- 0030 — a delete of the skill kit did not hold, because `skills_sync`
  rebuilt the category directories.
- 0031 — a finished prompt shipped with no path in `Deliverable`.
- 0032 — a ban written as a mechanism told the agent how, not what.
- 0033 — a working directory sat in memory instead of in a setting, and
  two designs were rejected.
- 0034 — a path lost the `projects/` segment in four of nine copies.
- 0035 — a written fix runs on no schedule, so it never runs.
- 0036 — a `review-required` block was read as a fault, and it is the
  normal ending for a code task.
- 0037 — a backup command copied an empty directory and reported
  success.
- 0038 — a detached server filled a 16,384-byte pipe with its own log and
  blocked on every later write.
- 0039 — a test task named a score defect that the code does not hold.
- 0040 — one sentence carried two obligations joined by "and", with no
  order between them.
- 0041 — a removed heading left the output and the rule stayed, because a
  second file also stated it.

Four of the thirteen came from the live board rather than from a lesson
test: 0035, 0036, 0037 and 0038.

## Section 3 — Where the design was wrong

Ten criteria pass. Five of them pass by a mechanism the specification
does not name. A criterion that passes by another mechanism means the
specification described something that does not exist.

**Criterion 6 names the wrong reader.** The specification says "The user
reads this criterion by eye, once." Reading by eye passed the failing run
of 14 September. Four of nine paths were wrong, and `ls` found every one.
The mechanism that settles this criterion is a command, not an eye. The
lesson now says so: copy each path into `ls` and run it.

**Criterion 7 does not change the prompt back.** The specification says
"Removal of that heading changes the prompt back." Removal changed the
heading list. It did not change the prompt back. The rollback command
moved into the `Done when` list, because line 26 of
`prompting/prompt-interviewing/SKILL.md` also demanded it.
[Record 0041](0041-a-heading-that-moved-instead-of-leaving.md) holds the
proof. The criterion passes as a statement about headings and fails as a
statement about content.

**The specification claims one home for the section list.** That claim
was true on 11 September and false on 14 September at 17:24:05, when the
second file arrived. Line 26 is now deleted, so the claim is true again.
The lesson is that the claim needs a check, not a sentence.

**Criterion 9 needed three sentences, not one.** The specification treats
the decline as one rule. One sentence joining two obligations with "and"
produced a reply that obeyed the second and dropped the first. The reply
measured 72 characters, which is the question alone.
[Record 0040](0040-two-obligations-in-one-sentence.md) holds the fix,
which states each obligation in its own sentence and states the order.

**Criterion 10 asked for six rows.** The reference document holds seven.
Lesson 30 wrote row 7 after the specification was written. The
specification now asks for seven, and it states why the count changed.

Five criteria pass by the mechanism the specification names: 1, 2, 3, 4,
5 and 8.

## Section 4 — The generalization

The candidate from the plan reads: Stage 1 found defects in
configuration. Stage 2 found defects in the seams between parts. Stage 3
found defects in writing. Stage 4 found defects in what.

Tested against the thirteen defect records, the answer is the distance
between a rule and its effect.

**Stage 4 found defects in the gap between stating a rule and the rule
taking effect.**

Eleven of thirteen records fit:

- 0029, 0030 — the role said one thing and the kit held another.
- 0031, 0034 — the trailer rule existed and the path was still wrong.
- 0032 — the rule named a mechanism, so the mechanism changed and the
  rule died.
- 0035 — the fix is correct and runs nowhere.
- 0036 — the status is correct and the reader took it for a fault.
- 0037 — the backup command ran and copied nothing.
- 0039 — the task was well formed and named no destination.
- 0040 — the rule was written and the order was not.
- 0041 — the heading left and the rule stayed.

Two do not fit. Record 0033 records a design choice rather than a defect.
Record 0038 records an operating system mechanism, where a full pipe
blocks a write, and no rule is involved.

The practical form of the generalization is one question. After you state
a rule, ask what would change on the machine if the rule were false. If
the answer is nothing, the rule has no effect yet, and you have written a
note about a rule.

Stage 5 should carry one habit from this: every rule gets a command that
fails when the rule is broken.

## Related

- [0034 — A path that lost a segment](0034-a-path-that-lost-a-segment.md)
- [0040 — Two obligations in one sentence](0040-two-obligations-in-one-sentence.md)
- [0041 — A heading that moved instead of leaving](0041-a-heading-that-moved-instead-of-leaving.md)
- [Reference — Adding a specialist](../reference/adding-a-specialist.html)
