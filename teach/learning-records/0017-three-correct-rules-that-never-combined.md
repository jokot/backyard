# Three correct rules that never combined

Crazy Dave completed two root tasks against one unmodified `SOUL.md` and
did a different half of the required work each time.

| | Kanban comment | Fizzy comment and close | Telegram report |
|---|---|---|---|
| `t_7a44199b`, card 13, 08:03 | no | yes | yes |
| `t_ff5eb6e8`, card 14, 17:44 | yes | no | no |

The file did not change between the two runs. `SOUL.md` was last modified
at 07:43:41, and the gateway started at 07:44:52. Both runs read the same
95 lines.

Card 13 carries a comment created at `2026-09-10T01:03:48Z`, which is
08:03 local time and the same minute the task completed. The text ends
"Nothing else is required from you", which is Crazy Dave's voice. He wrote
it and he closed the card. Card 14 held zero comments and `closed: false`
until Joko closed it by hand.

## The cause

The root completion moment needs five actions. `SOUL.md` stated them in
three separate regions, and no region held the whole procedure.

- Lines 11 to 16, the dispatched-work exception: "read the children's
  results, add a summary comment, and complete the task." Three actions,
  written as a finished sentence.
- Lines 25 to 28, the Fizzy block: read the `fizzy:<number>` comment, then
  comment, then close.
- Lines 83 to 91, the reporting rule: run `hermes send --to telegram`.

Every one of those three regions is correct on its own. Each run executed
one region and skipped the others. The model did not merge them.

The file also contradicted itself about the same moment. Line 13 said "You
are not talking to Jokot" and line 84 said "tell Jokot yourself before you
complete it". The contradiction was not the blocker, because the 08:03 run
sent the Telegram message anyway. The scattering was the blocker.

## The fix

The dispatched-work exception now carries all five steps as one ordered
list, at the trigger, with the literal commands:

```
If the task is a root whose children are already complete, do these five
steps in this order. Completing the task is the last step, never the third.

1. Read the children's results and write one summary.
2. Add that summary as a comment on the kanban task.
3. Read the fizzy:<number> comment on that task. Then run
     fizzy comment create --profile crazydave --card <number> --body "<your summary>"
     fizzy card close <number> --profile crazydave
4. Run
     hermes send --to telegram "<your summary, in your own voice>"
5. Complete the kanban task.

Steps 3 and 4 are not optional, and no later rule cancels them. A finished
root task that Jokot never heard about is a failed task.
```

Two more edits stopped the other regions from reading as competing
procedures. `On completing a root kanban task:` became `The step 3
commands, repeated here so you can find them:`. `Reporting a finished root
task — HARD RULE: when you complete a root task whose children are done,
tell Jokot yourself before you complete it.` became `How to write the step
4 message.` The voice guidance under it stayed unchanged, because the
numbered list does not carry it. The line "You are not talking to Jokot"
is gone.

## The fix is confirmed

Root task `t_70d81d4d`, the kitchen timer, run 56 at 19:59:

- Kanban comment from `crazydave`, 474 characters. Pass.
- Fizzy card 15 comment at `12:59:12Z`, which is 19:59 local. Pass.
- `fizzy card show 15 --jq '.data.closed'` prints `true`. Pass.
- Telegram message received. Pass.
- The completed event follows the comment event, so step 5 ran last. Pass.

All five steps, one run, correct order. Three earlier runs each did a
partial subset.

## What generalizes

**When two regions of one prompt each describe a complete procedure for
the same moment, the model runs one region rather than the union.** It
selects, it does not merge. Two regions that each look finished are worse
than one region that looks long.

**A rule can be correct and still never run.** Records 0004, 0009 and 0014
are about rules that were wrong: wrong wording, wrong channel, wrong
subject. This one is about three rules that were each right. Reviewing a
rule for correctness does not tell you whether the model will reach it.

**One moment, one place, in order, with the commands.** A moment that
needs five actions needs one numbered list. Put reference material
elsewhere, but never let reference material open with a trigger sentence,
because a trigger sentence creates a second entry point.

**Non-determinism hides a scattering defect.** The 08:03 run passed the
Fizzy criterion and the reporting criterion. Judged alone, it looks like
proof that the mirror works. Two runs of the same moment, compared against
each other, is what exposed the defect. A single passing run is not
evidence that a scattered rule works.

Related: [[0009-a-coordinator-that-never-works-gets-dispatched-work]],
[[0004-soft-instructions-lose-to-prompt-size]],
[[0013-a-restart-does-not-erase-a-precedent]].
