# Spec: prompt-drift check for roster-audit.sh (record 0045 / 0051 gap)

A Telegram session keeps the system prompt it was born with — the gateway
reuses it verbatim (`agent/conversation_loop.py:281`, record 0051 §1) — so a
soul edit never reaches open or future-kept sessions. Check 4 counts
7-day age, which record 0051 §2 shows is a proxy: the real rule is "no
session runs a prompt older than the current soul text". This check
tests the rule directly and replaces check 4.

## Evidence (inspected 2026-09-17, read-only)

`sessions` table, `system_prompt` column, per profile
(`~/.hermes/profiles/<p>/state.db`):

| profile | tg sessions | NULL prompt | non-empty | drift now | exact SOUL.md match |
|---|---|---|---|---|---|
| crazydave | 23 | 4 | 19 | 18 | 1 |
| peashooter | 9 | 2 | 7 | 6 | 1 |
| sunflower | 8 | 2 | 6 | 5 | 1 |
| torchwood | 23 | 5 | 18 | 14 | 4 |

Every non-empty prompt (50/50) is SOUL.md text followed by appended
runtime boilerplate starting with `\n\nYou run on Hermes Agent`. Every
current SOUL.md (all four) lacks that string, so the split below cannot
misfire. 43/50 prompts embed an older soul text (similarity to current
soul rises 0.20 → 0.96 over time — version drift, not noise).
Torchwood sessions `20260911_205953_4d3c643d` and `20260913_182607_2563c646`
carry peashooter's prompt — contamination, caught by the same test.
The only open sessions today are the exact-match ones: the audit must
print nothing on the roster as it stands.

## 1. Reads (all read-only)

- `sqlite3 "file:$HOME/.hermes/profiles/<profile>/state.db?mode=ro"`
  for crazydave, peashooter, sunflower, torchwood.
- Table `sessions`: columns `id`, `source`, `system_prompt`.
- `~/.hermes/profiles/<profile>/SOUL.md`, read as bytes, `.strip()`ed.
- Write nothing: no DB writes, no `.backup`, no edits to SOUL.md.

## 2. Comparison (per profile, per row)

A stored prompt has two parts: the soul text of its birth, then runtime
boilerplate. 1) Cut the prompt at the first occurrence of the marker
`\n\nYou run on Hermes Agent`; if the marker is absent, use the whole
prompt (defensive — never seen in the data). 2) `strip()` the cut text.
3) Report drift when `embedded != stripped current SOUL.md` (exact
string equality). Equality catches version drift and the two
torchwood/peashooter contaminations; a similarity threshold does not.

## 3. Output

Exactly one line per drifting profile/session, printed to stdout
(record 0034: output only on failure; 43 lines on today's data):

```
prompt-drift: <profile> session <session id> runs a prompt that does not match the current SOUL.md
```

Example, real: `prompt-drift: torchwood session 20260911_205953_4d3c643d
runs a prompt that does not match the current SOUL.md`.

## 4. Exclusions

- `source != 'telegram'` — cli sessions carry no roster rule (14/40/24/1).
- `system_prompt IS NULL OR system_prompt = ''` — the 13 NULL/empty
  rows (all `ended_at` reset stubs) must not be reported.
- The check never edits any SOUL.md; a mismatch is reported, never repaired.
- Keep the exit-0-always convention of the existing audit.
