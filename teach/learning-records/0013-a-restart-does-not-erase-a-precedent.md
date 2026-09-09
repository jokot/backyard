# A restart does not erase a precedent

Crazy Dave got two new `SOUL.md` clauses at 22:48. One tells it to reply to
a greeting in one sentence and create no task. The gateway restarted at
22:52. At 22:54 the word `hi` in the direct chat produced this:

```
hermes kanban create "Respond to greeting" --triage \
  --body "Respond appropriately to the user's greeting: hi." --json
```

The decomposer assigned the task to Sunflower. Sunflower spent 15 seconds
composing a friendly hello. Three tasks of that shape reached `done`:
`t_8dc751c6`, `t_14f3e392` and `t_48e7839f`.

## The first diagnosis was wrong

The obvious reading is prompt dilution, the failure
[[0004-soft-instructions-lose-to-prompt-size]] already recorded. The call
sent 23,123 tokens. The two new clauses are about 150 of them, and the
`HARD RULE` line beside them uses capital letters and claims "every other
message".

That reading was wrong, and the source says so. Hermes stores no system
prompt with a session. `build_system_prompt` in `agent/system_prompt.py`
assembles one per agent init, and the log records an init on each inbound
message. The `messages` table for the session holds no row with role
`system`. So the 22:54 turn read the file saved at 22:48. The clause was in
front of the model.

## The control that settled it

The direct chat received `/new` at 23:04:56. The `#General` chat did not.
The next 38 seconds separated the two variables:

```
23:05:10  #General  'heloo'          old session  2 API calls, terminal, task t_e64f9a01
23:05:24  direct    'good night'     new session  1 API call,  no tool
23:05:38  #General  /new
23:05:48  #General  'good evening'   new session  1 API call,  no tool
23:05:58  #General  'hi how are you' new session  1 API call,  no tool
```

Same file, same model, same minute. The old session filed a task. The reset
session replied in one sentence. The conversation history is the only
difference between them.

Each old session held turn after turn in which Crazy Dave filed a task for
whatever arrived. The model read its own transcript as evidence of what it
does, and the transcript outweighed the clause above it.

Fix: send `/new` in every chat the profile listens to, after the restart.
No wording changed. The clauses were correct as written.

## Generalizes

A configuration change reaches a running gateway at the next restart. A
`SOUL.md` change reaches a chat at the next restart in a chat that has no
history yet. The two look identical from the terminal, and only one of them
is finished when `hermes gateway restart` returns.

This also names a trap in diagnosis. The failure looked exactly like
[[0004-soft-instructions-lose-to-prompt-size]], which is a real failure this
project has already recorded once. A familiar shape invites a familiar
answer. Reading `agent/system_prompt.py` cost less than rewriting the
clauses, and it ruled the familiar answer out before any wording changed.

Before you rewrite an instruction that a model ignored, prove the model
could not have read it. If it could, the instruction is not the defect.

See [[0009-a-coordinator-that-never-works-gets-dispatched-work]] for the
earlier corrections to the same file.
