# 0041 — A heading that moved instead of leaving

Date: 2026-09-15
Status: accepted
Lesson: [0029 — The template is the skeleton](../lessons/0029-the-template-is-the-skeleton.html)
Criterion: Stage 4 success criterion 7

## What happened

Test 2 measures one claim. `TEMPLATE.md` is the only home of the heading
list, so an edit to that file changes the next prompt with no restart and
no change to `SOUL.md`.

The test ran in two halves. The first half added `## Rollback` on
14 September 2026 at 07:08:39. Three prompts after that edit carried the
heading in position 4.

The second half removed the heading on 15 September 2026. One interview
followed, about `projects/zuma/notify.sh`. The finished prompt held five
headings: `Goal`, `Context`, `Constraints`, `Deliverable`, `Done when`.
`## Rollback` was absent.

The gateway process kept the identifier 68460 across both halves. No
restart happened. The criterion passes.

## The defect the passing test exposed

The heading left. The obligation did not. The last entry of `Done when`
read:

    - [ ] If the change must be rolled back, use
          git checkout -- /Users/jokot/dev/plants/projects/zuma/notify.sh

That entry is not a check. A worker cannot run it and read a pass or a
fail. It states what to do if a condition arrives later.

`TEMPLATE.md` defines the section in one line:

    ## Done when
    Checks the worker can run without asking a question. One checkbox
    for each check.

A second entry of the same list failed the same rule:

    - [ ] Run the relevant local verification commands and inspect the
          final diff

The word "relevant" names no command. The worker must choose the
commands, so the check asks a question. This is the failure of
[record 0016](0016-a-specification-that-could-not-work.md), where
a specification passed review while carrying `tests_run: 0`.

Five of the seven checkboxes were mechanical. Two were not.

## Why the obligation survived

The first explanation in this record was wrong. It claimed that the
answer stayed in the conversation after the template changed. A read of
the profile directory proves a stronger cause.

`TEMPLATE.md` is not the only home of the rollback rule. A second file
holds it:

    ~/.hermes/profiles/torchwood/skills/prompting/prompt-interviewing/SKILL.md

Line 26 of that file states:

    - Give a one-command rollback when the repository state supports one.
      Do not invent a rollback path.

`SOUL.md` never mentions rollback. `grep -n -i rollback` returns no line.
So the rule has exactly two homes, and the test changed one of them.

The message that opened the test 2 interview shows the agent reading this
skill by name. The heading disappeared from the output because
`TEMPLATE.md` no longer lists it. The command appeared inside `Done when`
because the skill still demands it.

Stage 4 claims that `TEMPLATE.md` is the only home of the section list.
That claim is false while line 26 exists.

## Evidence

    $ grep '^## ' ~/.hermes/profiles/torchwood/TEMPLATE.md
    ## Goal
    ## Context
    ## Constraints
    ## Deliverable
    ## Done when

    $ launchctl print "gui/$(id -u)/ai.hermes.gateway-torchwood" | grep pid
        pid = 68460

    $ git status --short -- projects/
    (no output)

    $ stat -f '%Sm %z' -t '%Y-%m-%d %H:%M:%S' projects/zuma/notify.sh
    2026-09-10 17:43:31 437

Twelve paths appeared in the prompt. Every path survived `ls -ld`. The
prompt also claimed that `/Users/jokot/dev/plants/zuma` does not exist,
and `ls -ld` confirms that claim.

## The fix

Two changes, because the record found two faults.

First, remove line 26 from the skill. The heading list belongs to
`TEMPLATE.md` alone, and a rule that repeats it in a second file defeats
the design.

Second, add one sentence to the `Done when` description in
`TEMPLATE.md`:

    Every checkbox names a command. A checkbox that states a condition
    or names no command does not belong here.

This rule is mechanical. A reviewer reads each checkbox and asks one
question: does this line name a command I can run now?

## A second finding: the cut kit did not stay cut

Lesson 30 cut the skill kit of Torchwood on 14 September 2026 at 15:02,
and it wrote `.no-bundled-skills` so that `skills_sync` would not rebuild
the category directories. The marker is present and holds 139 bytes.

The kit still holds two skills:

    ste-writing/SKILL.md                      born 2026-09-07 22:45:34
    prompting/prompt-interviewing/SKILL.md    born 2026-09-14 17:24:05

The second directory was born two hours after the cut, with the marker
already in place. `skills_sync` did not create it. This record does not
name the author, because no log read so far proves one.

The content is a restatement of `SOUL.md`. It repeats the one-question
rule, the section prefix, the single fenced block, the `Checked:` trailer,
and the rule that forbids a prompt without a path. That duplication is the
same fault as the rollback rule. Two files state one rule, so an edit to
one file leaves the other unchanged.

Row 7 of `teach/reference/adding-a-specialist.html` claimed
`ste-writing` only. That row now states two skills and the date.

## Generalizations

**A rule with two homes has no home.** Removing a heading from the file
that lists headings does not remove a rule that a second file states in
words. Find every home before you call a change complete.

**A checkbox is not a check.** The bracket pair is punctuation. A check
names a command and has an outcome.

**The word "relevant" hides the work.** A check that asks the worker to
choose the commands has moved the decision, not made it.

**A test can pass and still teach.** Criterion 7 passed on the first
reading. Reading the rest of the same prompt found two defects that no
criterion measures.

## Related

- [0016 — A specification that could not work](0016-a-specification-that-could-not-work.md)
- [0034 — A path that lost a segment](0034-a-path-that-lost-a-segment.md)
- [0039 — A test task that named no defect](0039-a-test-task-that-named-no-defect.md)
