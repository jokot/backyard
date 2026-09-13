# 0023 — A setting written to the wrong file

**Date:** 2026-09-14
**Stage:** 4, Lesson 27
**Status:** Fixed in the plan and in the lesson before the user ran it.

## What happened

The Stage 4 plan, in Task 3 step 2, gave two commands to write the
routing description of Torchwood:

```bash
hermes profile describe torchwood --text "..."
hermes -p torchwood config set description_auto false
```

The second command is wrong. A read of the Hermes source before
writing Lesson 27 found it.

## Root cause

Two files hold profile settings, and each has one writer.

- `config.yaml` holds runtime configuration. `hermes config set`
  writes it.
- `profile.yaml` holds `description` and `description_auto`.
  `hermes profile describe` writes it, through
  `write_profile_meta`.

So `config set description_auto false` writes a top-level key into
`config.yaml` that no code reads. The command reports success, because
`config set` accepts any key name. The setting appears to be applied
and is not.

The command is also unnecessary. `hermes_cli/main.py` line 11751 shows
the `--text` path writing both fields in one call:

```python
_profiles_mod.write_profile_meta(
    profile_dir,
    description=text_value,
    description_auto=False,
)
```

The plan carried the second command because I reasoned from the name
of the setting rather than from the code that writes it. The name
`description_auto` sounds like configuration, so I sent it to the
configuration command.

## Fix

The plan step and the lesson now give one command. The lesson states
the two-file rule, quotes the two lines of source, and names this
record.

Lesson 27 also states the real protection rule, which the plan had
stated loosely. `hermes_cli/profile_describer.py` line 191 skips a
profile that holds a description with `description_auto: false`, and
`list_describable_profiles(missing_only=True)` drops the same profiles
from an `--all` sweep. So `hermes profile describe --auto --all`
cannot replace a human-written description. Only
`--auto --overwrite` on that profile replaces it.

## Generalization

*A setting lives in the file its writer writes, and the writer is the
command that owns the feature.* A settings name tells you nothing
about its home. Find the function that sets the field, and read which
path it opens.

*A command that accepts any key cannot report a wrong key.* `config
set` validates nothing, so a typo and a wrong file both print success.
Where a tool accepts free-form keys, the check is never the exit code.
Read the file the feature actually reads, which is what step 2 of
Lesson 27 now does with `cat profile.yaml`.

This is the fourth defect of Stage 4 caused by writing from assumption
rather than from the machine. Records 0022 and this one share the
cause. The habit that catches them is the same one that found the
missing `--profile` flag and the absent thread id in the gateway log:
run the help, or read the source, before the sentence goes in a
lesson.

## Related

- Record 0022 — a clone that answered to the wrong name.
- Record 0019 — a checkpoint with no step behind it.
- Lesson 27 — the lesson that carries the corrected command.
