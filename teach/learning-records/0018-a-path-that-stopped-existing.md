# A path that stopped existing

Crazy Dave reported the kitchen timer specification at this location, in
Telegram and in Fizzy card 15:

```
/Users/jokot/.hermes/kanban/workspaces/t_33a76257/SPEC.md
```

That path does not exist. The task header reads `workspace: scratch`, and
a scratch workspace is removed when the run ends. The report was true at
19:59 and false by the time anyone read it.

The file itself survived, 7625 bytes, written at 19:48, one directory tree
away:

```
/Users/jokot/.hermes/kanban/attachments/t_33a76257/SPEC.md
```

Nothing was lost. The pointer was wrong, and the wrong pointer is now
permanent, because Fizzy card 15 is closed and a closed card is the record
of the job.

## Why the same request shape gave two different results

The Zuma run and the kitchen timer run asked for the same thing: write a
specification, then implement it. Neither request named a path for the
specification. The auto-decomposer wrote the two child tasks differently.

Zuma, task `t_de50525f`:

> Write a complete specification for a browser-based Zuma game at
> `/Users/jokot/dev/plants/zuma/SPEC.md` (create the directory if it does
> not exist).

Kitchen timer, task `t_33a76257`:

> Deliver the full specification text as your output, since a downstream
> implementation task will consume it verbatim.

The Zuma child got a durable destination and wrote `zuma/SPEC.md`, which
is still there at 16.2K. The timer child got no destination, so it worked
inside its scratch workspace, and only the attachment mechanism kept a
copy.

The defect is in the decomposition, not in the worker. The worker obeyed
the task it received.

## The same fate reached the test harness

Peashooter reported "29/29 checks pass" for the timer, using "a Node
harness running the real inline JS". The `timer/` directory holds
`index.html` alone. The harness lived in the scratch workspace and is
gone, so the claim cannot be re-run and cannot be checked.

Compare the Zuma run. `zuma/` holds `SPEC.md`, `index.html` and `test.js`.
`node test.js` still prints `8/8 checks passed` today. The difference is
again the named path: the Zuma implementation task named a project
directory, so everything the worker made landed beside the artifact.

## What generalizes

**A path is a claim about the future, so check it the way you check a
running process.** This is [[0011-a-report-that-was-true-when-it-was-sent]]
applied to files rather than to sockets. Both reports were true at the
instant they were written. Verify the structure that keeps a claim true: a
path under `workspaces/` cannot outlive its run, and a path under the
project directory can.

**Name a durable destination for every artifact you want to keep.** An
unnamed destination is not a free choice for the worker. It is a choice
made by the temporary directory the worker happens to run inside.

**A summary is more durable than the thing it describes.** The Fizzy card
and the Telegram message outlive the run by design. That makes a bad path
inside them worse than a bad path in a terminal, because nothing later
corrects it.

**Leave the verification beside the artifact.** A test harness that proves
a claim, and then disappears, converts a checkable claim into an
unverifiable one. `zuma/test.js` is worth more than the sentence
"29/29 checks pass".

## The fix

Two changes, and the first one carries most of the value.

1. Every request that asks for a document must name where the document
   goes. Add the destination to the request, in the same form the
   implementation path already takes: `at /Users/jokot/dev/plants/<project>/SPEC.md`.
2. A request that asks for verification must ask for the harness to stay
   beside the artifact, so the claim can be re-run.

Both belong in the request, because the decomposer copies what the request
gives it. The Zuma request produced a durable spec by accident. The next
one has to produce it on purpose.
