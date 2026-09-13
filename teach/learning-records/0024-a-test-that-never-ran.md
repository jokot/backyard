# 0024 — A test that never ran

**Date:** 2026-09-14
**Stage:** 4, Lesson 27
**Status:** Fixed in the lesson and in the plan.

## What happened

Lesson 27 asked the reader to test the routing description of
Torchwood. The lesson gave these commands:

```bash
hermes kanban create "write a prompt for the flappy refactor, then apply the prompt"
hermes kanban decompose <task_id>
hermes kanban show <task_id>
```

The reader ran them and reported that no profile held the task:

```
Task t_b98be7e9: write a prompt for the flappy refactor, then appy the prompt
  status:    ready
  assignee:  -

Events (1):
  [2026-09-14 00:08] created {'assignee': None, 'status': 'ready', ...}
```

The reader read this as a pass, because no child reached Torchwood.
The correct reading is that the test never ran.

## Root cause

`hermes kanban create` puts a task in `ready`. The flag `--triage` is
required to put it in `triage`.

`hermes_cli/kanban_decompose.py` line 288 refuses every other status:

```python
if task.status != "triage":
    return DecomposeOutcome(
        task_id, False, f"task is not in triage (status={task.status!r})"
    )
```

So `decompose` printed one line to standard error and changed nothing:

```
kanban: decompose t_b98be7e9: task is not in triage (status='ready')
```

Stage 3 never needed the flag. Work arrived from Telegram, and Crazy
Dave parks a request in triage before the decomposer sees it. I wrote
the lesson from that memory of the flow rather than from the command.

## Why the failure was hard to see

The board after the failed run looks almost correct. The task exists,
it carries the right title, and its assignee is empty. A reader who
expects "no child reached Torchwood" sees exactly that shape.

The one field that tells the truth is the event list. A task that was
decomposed carries more than one event. This task carried one.

## Fix

Lesson 27 step 3 now passes `--triage` and tells the reader to confirm
the status before decomposing. Two checkpoint lines replaced one. The
first requires the status `triage`. The second requires `show` to list
more than one event.

The lesson also gained a section that quotes line 288 and the error
text, so a reader who hits the same state recognizes it.

A second section now quotes lines 231 and 247 of the same file, which
show what the decomposer reads about an undescribed profile:

```
  - torchwood ⚠ undescribed: (no description; profile named 'torchwood')
```

The lesson had asserted that an empty description is not a refusal.
The source shows it, so the lesson now shows it too.

## Generalization

*An empty result is not a passing result until you prove the test
ran.* A test with no output and a test that never started look the
same from the outside. Every test needs one check that fails loudly
when the test itself did not execute. Here that check is the event
count, and the rule generalizes: assert on evidence the run produces,
never only on the absence of the thing you fear.

This is the same failure as record 0011, from Stage 2, seen from the
other side. That record found a claim that was true at the instant of
checking and false later. This one finds a check that was never true
at any instant, and read as a pass.

*A command that writes to standard error can vanish.* The decompose
failure printed a clear message. It reached the terminal and not the
report, because the next command produced a tidy block of output that
looked like the answer.

## Related

- Record 0011 — a report that was true when it was sent.
- Record 0023 — a setting written to the wrong file.
- Lesson 27 — the lesson corrected here.
