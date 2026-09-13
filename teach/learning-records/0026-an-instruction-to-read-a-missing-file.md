# 0026 — An instruction to read a missing file

**Date:** 2026-09-14
**Stage:** 4, Lesson 28
**Status:** Fixed in the lesson and in the plan, before the reader ran it.

## What happened

The Stage 4 plan gives Torchwood this rule in `SOUL.md`, in Task 4:

```
Read TEMPLATE.md at the start of every interview. Each `##` heading in
that file becomes a `##` heading in your finished prompt, in file order.
```

`~/.hermes/profiles/torchwood/TEMPLATE.md` is created in Task 5, which
is Lesson 29. The same Task 4 then asks the reader to run one smoke
test in Lesson 28, and states the expected reply:

```
Expected: Torchwood asks one question, and that question names a
section.
```

Sections come from the file that does not exist yet. The test had no
defined pass condition, so the lesson would have asked the reader to
compare a real reply against a guess.

## Root cause

Two faults, one cause.

First, the rule names a file and says nothing about the file being
absent. A rule that assumes a file exists is a rule with one untested
branch.

Second, the plan wrote the expected reply from the intended end state
of Stage 4, not from the state the reader reaches at the end of Lesson
28. Lesson 28 ends with the soul file replaced and the template still
missing.

## Fix

`SOUL.md` gained one sentence, which closes the branch:

```
If TEMPLATE.md does not exist, say so in one sentence, then ask for the
goal and wait.
```

The smoke test now states three conditions the reader can check by eye.
One message names the missing file. One question asks for the goal. No
fenced code block arrives. A finished prompt built from invented
headings is a defect, and Lesson 28 says so.

The same rule also gained the full path, because the bare name resolves
against the working directory of the gateway. That directory is set by
the launchd job:

```bash
lsof -a -p <gateway_pid> -d cwd
```

Output: `/Users/jokot/.hermes/profiles/torchwood`. The bare name would
have worked. The path removes the dependence on a setting that lives in
a plist and in `terminal.cwd`, which reads `.`.

## Generalization

*An instruction to read a file must say what to do when the file is
absent.* Prose given to a model is a program with branches. The branch
nobody writes is the branch the model invents, and an invented branch
produces a confident answer built from nothing.

*Write the expected result from the state the reader will be in.* The
plan described the machine at the end of the stage, and the test runs
one lesson earlier. Records 0024 and 0025 are the same failure found
after the reader ran the command. This one was found before, by reading
the order of the tasks against the order of the files.

## Related

- Record 0015 — limits set from the implementation, not from the wording.
- Record 0024 — a test that never ran.
- Record 0025 — a test that dispatched real work.
- Lesson 28 — the lesson corrected here.
- Lesson 29 — the lesson that creates `TEMPLATE.md`.
