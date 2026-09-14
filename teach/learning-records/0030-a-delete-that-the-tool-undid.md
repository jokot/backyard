# 0030 — A delete that the tool undid

**Date:** 2026-09-14
**Stage:** 4, Lesson 30
**Status:** Fixed in the lesson and in the plan.

## What happened

Lesson 30 told the reader to delete 21 directories from
`~/.hermes/profiles/torchwood/skills/` with two `rm -rf` commands. Jokot
ran them and reported this listing:

```
apple            github            research
autonomous-ai-agents    media            smart-home
creative        mlops            social-media
data-science        note-taking        ste-writing
email            productivity
```

Fourteen directories, where the lesson promised one. The report looked
like a failed delete.

The delete had worked. `hermes skills list -p torchwood --enabled-only`
printed `1 enabled shown`, against `24 enabled shown` before the cut.

## Root cause

`tools/skills_sync.py` lines 696 to 705 rebuild category directories:

```python
for desc_md in bundled_dir.rglob("DESCRIPTION.md"):
    rel = desc_md.relative_to(bundled_dir)
    dest_desc = SKILLS_DIR / rel
    if not dest_desc.exists():
        dest_desc.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(desc_md, dest_desc)
```

`hermes_cli/main.py` line 2192 calls that sync from chat, from the
dashboard, and from the gateway. The launchd job for Torchwood exports
`HERMES_HOME=/Users/jokot/.hermes/profiles/torchwood`, so the sync writes
inside the profile.

Thirteen of the 14 directories held one file named `DESCRIPTION.md` and
no skill. The fourteenth was `ste-writing`, which the cut keeps.

## The evidence that separated the two readings

Four measurements, all read from disk after the report arrived.

1. Every returned directory held `DESCRIPTION.md` and nothing else.
2. Every `DESCRIPTION.md` carried the modification time 2026-06-12
   06:59, while every parent directory carried 2026-09-14 07:18:46.
   `shutil.copy2` preserves the time of the source file, and `mkdir`
   does not.
3. `.bundled_manifest` carried 2026-09-14 07:18:59, written by the same
   function 13 seconds later.
4. The curator backup of 2026-09-13 holds the tree before the cut. The
   eight directories that stayed deleted carry no `DESCRIPTION.md` in
   that archive. Every directory that returned carries one.

Measurement 4 explains the single anomaly. The directory `github` sat in
the first delete list, held seven skills, and returned empty. It returned
because it carries a `DESCRIPTION.md`, not because the delete missed it.

## Fix

Lesson 30 gained a step before the delete:

```bash
HERMES_HOME=~/.hermes/profiles/torchwood hermes skills opt-out
```

That command writes `.no-bundled-skills` in the profile directory and
deletes nothing. `tools/skills_sync.py` line 496 returns early when the
marker exists.

The check after the cut now reads the count first and the listing
second. The lesson also states what a listing of 14 directories means,
so a reader who meets it does not read a pass as a failure.

## Generalization

*A delete is not durable until you stop the writer.* A tool that seeds a
directory treats an absent file as work to do. Removing the file asks
that tool to run again. Find the opt-out before the delete, not after.

*Measure the count, never the listing.* The listing carries directories
that hold no skill. The count carries the number the model sees. Two
sources disagreed here, and only one of them describes the prompt.

*A modification time tells you which process wrote a file.* Thirteen
directories dated today and thirteen files dated three months ago is one
fact, not two. A copy that preserves times leaves that signature, and it
turned a guess about a failed delete into a proof of a rebuild.

## Related

- Record 0029 — the clone that kept the skills of its parent.
- Record 0024 — a test that never ran, where an empty result was read as
  a pass. This record is the mirror: a full listing read as a failure.
- Lesson 30 — the lesson corrected here.
