# 0028 — An example that cited a fixed bug

**Date:** 2026-09-14
**Stage:** 4, Lesson 29
**Status:** Fixed in the lesson and in the plan, before the reader saw it.

## What happened

Lesson 29 teaches one rule above all others. Every path in a prompt
must trace to a command that somebody ran. The lesson carries a worked
example to show the shape of a finished prompt.

The example in the plan read:

```
projects/zuma/start_servers.sh line 12 hardcodes the old path
/Users/jokot/dev/plants/zuma. The directory now lives at
projects/zuma.
```

I ran the two commands that the example lists in its own trailer:

```bash
sed -n '3p' projects/zuma/start_servers.sh
grep -c '/Users/jokot' projects/zuma/start_servers.sh
```

Line 12 is empty. Line 3 reads
`cd /Users/jokot/dev/plants/projects/zuma || exit 1`, which is the
correct path today. The bug in the example was repaired during Stage 2,
and record 0018 holds that repair.

## Root cause

The example came from memory of a fixed defect. The plan was written
after Stage 2, and the sentence described the state of the file before
the repair rather than after it.

The failure survived because a stale example still reads as a correct
example. The file name is right, the shape is right, and only two facts
inside it are wrong. Neither fact carries a warning.

## Fix

The example now states the true condition of the file. The absolute
path on line 3 makes the script fail after a move of the repository,
which is a real and small improvement rather than a repaired defect.

The two checks under `Done when` changed with it:

```
- [ ] grep -c '/Users/jokot' projects/zuma/start_servers.sh prints 0
- [ ] bash projects/zuma/start_servers.sh prints one web_pid and one ngrok_pid
```

Test 4 of the lesson asked the agent to fix line 12. It now asks for
line 3, so the refusal test names a line that exists.

The lesson states in one sentence that the example was built by running
its own trailer, and that the first draft failed that check.

## Generalization

*Run the trailer on your own example.* A document that teaches
verification must pass its own rule. The `Checked:` trailer is a cheap
test, and it costs two commands. The example is the first place to
spend them.

*A repaired defect makes a dangerous example.* The file still exists,
the path still resolves, and the shape of the sentence is still right.
Only the fact is old. Prefer a present condition of the file, which a
command can confirm today, over a past defect that a command can only
deny.

## Related

- Record 0018 — a path that stopped existing, and the repair cited here.
- Record 0024 — a test that never ran.
- Record 0026 — an instruction to read a missing file.
- Lesson 29 — the lesson corrected here.
