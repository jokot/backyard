# A checkpoint with no step behind it

Stage 3 scored all seven success criteria as passing. While collecting the
evidence for the completion record, I read the three profile
configurations in the repository. The four keys that make criteria 1
through 4 work were not there.

```
$ grep -n '^telegram:' -A 4 hermes-config/peashooter/config.yaml
457:telegram:
458-  reactions: false
459-  allowed_chats: ''
460-mattermost:
```

The live file carried them the whole time.

```
$ grep -n '^telegram:' -A 6 ~/.hermes/profiles/peashooter/config.yaml
457:telegram:
458-  reactions: false
459-  allowed_chats: ''
460-  require_mention: true
461-  exclusive_bot_mentions: true
462-  free_response_topics:
463-    - "-1004371805465:2"
```

All three mirrors were stale. The last commit that touched any
`hermes-config/*/config.yaml` is `41c631d`, "Close the path that refills
the subscription table". That is a Stage 2 commit. Every Stage 3 routing
change lived only on the machine.

## Why the copy never ran

Lesson 19 has four numbered steps. Step 1 finds the block. Step 2 adds
the four keys. Step 3 restarts the three gateways. Step 4 runs five
Telegram tests. No step contains a copy command.

The lesson checkpoint, 60 lines further down, contains this line:

```html
<label><input type="checkbox"> Three <code>config.yaml</code> files mirrored into <code>hermes-config/</code></label>
```

So the action was named once, in the checklist, and nowhere in the
procedure.

Lesson 23 is the control case. Its step 6 reads:

```
6. Mirror the file into the repository.
   cp ~/.hermes/profiles/crazydave/SOUL.md hermes-config/crazydave/SOUL.md
```

That copy ran. Commit `4d1a5c4` holds the mirrored `SOUL.md`. The
difference between the two lessons is not the reader and not the file
type. It is that one lesson put the command in the procedure and the
other put the requirement in the checklist.

## The fix

Lesson 19 now has a step 5 that carries the loop and a check that proves
it ran:

```bash
for p in peashooter sunflower crazydave; do
  cp ~/.hermes/profiles/$p/config.yaml hermes-config/$p/config.yaml
done
grep -c free_response_topics hermes-config/*/config.yaml
```

The `grep` prints `1` for each of the three files. A count of `0` means
the copy never ran. The three files are now mirrored, and the only
substantive change against the previous commit is the four telegram keys.
The `api_key`, `token`, `password` and `secret` fields in all three files
are empty, so nothing private entered the repository.

## What generalizes

**A checklist is a second statement of the procedure, and a second
statement does not run.**
[Learning record 0017](0017-three-correct-rules-that-never-combined.md)
measured this in a model: five actions written across three regions of
one prompt produced one region of behaviour per run. A checkpoint list is
the same shape aimed at a person. Use the checkpoint to verify a step,
never to introduce one.

**Every checkpoint line must trace to a numbered step that carries the
command.** If a line does not trace, write the step or delete the line.
A checkpoint that names an unwritten action converts a missing procedure
into a tick mark.

**A configuration mirror fails in silence.** Nothing on this board reads
`hermes-config/`. No gateway starts from it and no test opens it. A copy
that never runs produces no error for weeks. Put the verification beside
the copy, which is the same rule
[record 0018](0018-a-path-that-stopped-existing.md) reached from the
other direction.

**A system can work while the record of it goes stale.** Stage 1 and
Stage 2 found their defects by running something and watching it fail.
This defect broke nothing. It appeared only because the completion record
required reading the repository instead of the machine.
