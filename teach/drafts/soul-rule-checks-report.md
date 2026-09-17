# soul-rule-checks.sh — Negative-control verification report

Date: 2026-09-17
Checker: `/Users/jokot/dev/plants/teach/drafts/soul-rule-checks.sh`
Scratch base (ephemeral): `/tmp/soul-rule-scratch.9lIvdI/`
All live files under `~/.hermes/profiles/` and `roster-audit.sh` were only ever read, never written.

## Rules under test

- **Rule A** — Each checked soul (crazydave, peashooter, sunflower) must name the full report script `hermes-report.sh` and must not name a `hermes send` command. Torchwood is exempt (reports through Crazy Dave).
- **Rule B** — Every reference to the report script must use the full literal path; a `~` or `$HOME`-prefixed reference is flagged.

Expected healthy behavior: no output, exit 0. Each rule violation: exactly one failure line, exit 0 (no output is not an error).

## Scratch copies prepared

| Control | Source file (read-only) | Scratch copy | Modification |
|---|---|---|---|
| Neg A | `profiles/sunflower/SOUL.md` | `/tmp/soul-rule-scratch.9lIvdI/ruleA/sunflower-SOUL.md` | Removed the report-script line (sunflower has no `hermes send` line, so Rule A fails on the missing reference only) |
| Neg B | `profiles/crazydave/SOUL.md` | `/tmp/soul-rule-scratch.9lIvdI/ruleB/crazydave-SOUL.md` | Flipped the 2nd report reference (line 97) to `~/.hermes/...`; kept line 24 full-literal so Rule A still passes and only Rule B fires |
| Clean | `profiles/sunflower/SOUL.md` | `/tmp/soul-rule-scratch.9lIvdI/clean/sunflower-SOUL.md` | Unmodified copy |

None of the live originals were modified; scratch copies were created with `cp` and edited in place under `/tmp`.

## Runs

### Negative control A (Rule A violation — missing report reference)

Command:
```
/Users/jokot/dev/plants/teach/drafts/soul-rule-checks.sh /tmp/soul-rule-scratch.9lIvdI/ruleA/sunflower-SOUL.md; echo "exit=$?"
```

Output:
```
ruleA soul: does not name /Users/jokot/.hermes/scripts/hermes-report.sh
exit=0
```

Result: **exactly one failure line**, exit 0. (Label prefix "ruleA" is the scratch directory name, which the checker uses as the label when given a single-file target.)

### Negative control B (Rule B violation — `~`-prefixed report reference)

Command:
```
/Users/jokot/dev/plants/teach/drafts/soul-rule-checks.sh /tmp/soul-rule-scratch.9lIvdI/ruleB/crazydave-SOUL.md; echo "exit=$?"
```

Output:
```
ruleB soul: report reference must use full literal path, not ~ or $HOME: 97:  ~/.hermes/scripts/hermes-report.sh crazydave "your message here"
exit=0
```

Result: **exactly one failure line**, exit 0. (Full-literal reference on line 24 kept Rule A green; only Rule B fired on the `~` reference.)

### Clean-run control (unmodified copy)

Command:
```
/Users/jokot/dev/plants/teach/drafts/soul-rule-checks.sh /tmp/soul-rule-scratch.9lIvdI/clean/sunflower-SOUL.md; echo "exit=$?"
```

Output:
```
exit=0
```

Result: **no output, exit 0.**

### Clean-run control (whole live profiles dir)

Command:
```
/Users/jokot/dev/plants/teach/drafts/soul-rule-checks.sh; echo "exit=$?"
```

Output:
```
exit=0
```

Result: **no output, exit 0.**

## Checksum confirmation — live files untouched

The checker only reads; no live file was edited. But as belt-and-braces, sha1 sums were recorded before and after all runs.

roster-audit.sh (`/Users/jokot/.claude/jobs/c59351bf/tmp/roster-audit.sh`):
- before: `df855e7ee01d0980a007add75d17cc6d8b6fa63b`
- after:  `df855e7ee01d0980a007add75d17cc6d8b6fa63b`
- unchanged ✓

Soul files (`~/.hermes/profiles/*/SOUL.md`):

| Profile | before | after | status |
|---|---|---|---|
| crazydave | c6913f681e8ab794da02f963afdf4d7ec4bc88c1 | c6913f681e8ab794da02f963afdf4d7ec4bc88c1 | unchanged ✓ |
| peashooter | ee5296a9366c0ea3bfae913356e696589258b0ef | ee5296a9366c0ea3bfae913356e696589258b0ef | unchanged ✓ |
| sunflower | 24c9f6c4f6b586e412d217cc7308c2d5d5951c69 | 24c9f6c4f6b586e412d217cc7308c2d5d5951c69 | unchanged ✓ |
| torchwood | 191ea5cece467473d9e098b2369588d8ffd6b049 | 191ea5cece467473d9e098b2369588d8ffd6b049 | unchanged ✓ |

## Acceptance criteria

- [x] Report file exists (`/Users/jokot/dev/plants/teach/drafts/soul-rule-checks-report.md`).
- [x] Negative control A shows exactly one failure line.
- [x] Negative control B shows exactly one failure line.
- [x] Clean runs show silence and exit 0.
- [x] Checksums prove `roster-audit.sh` and all soul files are unchanged.