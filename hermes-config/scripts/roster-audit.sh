#!/usr/bin/env bash
# Check four roster rules. Print one line for each rule that fails. Print
# nothing when every rule holds, so a healthy run delivers no message.
#
# Each check names the learning record that found the defect.
set -uo pipefail

# 1. Every profile speaks into the same room. Record 0043.
n=$(grep -h '^TELEGRAM_HOME_CHANNEL=' "$HOME"/.hermes/profiles/*/.env 2>/dev/null \
      | sort -u | wc -l | tr -d ' ')
[ "$n" = "1" ] || echo "home channel: $n distinct values across profiles, expected 1"

# 2. The allowlist of Crazy Dave holds exactly three entries. Record 0046.
n=$(hermes -p crazydave config get command_allowlist 2>/dev/null | grep -c '^- ')
[ "$n" = "3" ] || echo "allowlist: crazydave holds $n entries, expected 3"

# 3. Crazy Dave keeps the kanban toolset. Record 0044.
hermes -p crazydave config get toolsets 2>/dev/null | grep -q '^- kanban$' \
  || echo "toolsets: crazydave is missing kanban"

# 4. No live session runs a prompt that has drifted from its SOUL.md.
#    Record 0051. A Telegram session keeps the prompt it was born with, so a
#    soul edit never reaches it; the true rule is "the birth prompt must equal
#    the current soul text". Spec: teach/drafts/prompt-drift-check-spec.md.
#    Each prompt is the soul text of its birth plus runtime boilerplate that
#    begins "\n\nYou run on Hermes Agent"; cut at that marker, trim, then
#    require an exact string match against the current SOUL.md. Only
#    telegram-sourced, open, non-empty prompts are judged. An ended session
#    is never reused, so its old prompt is history and not a defect. Reports
#    drift, never repairs it: SOUL.md is only read.
for p in crazydave peashooter sunflower torchwood; do
  db="$HOME/.hermes/profiles/$p/state.db"
  soul="$HOME/.hermes/profiles/$p/SOUL.md"
  sqlite3 "file:$db?mode=ro" "
    SELECT 'prompt-drift: $p session ' || s.id ||
           ' runs a prompt that does not match the current SOUL.md'
    FROM sessions s
    WHERE s.source='telegram'
      AND s.ended_at IS NULL
      AND s.system_prompt IS NOT NULL AND s.system_prompt != ''
      AND trim(
            CASE WHEN instr(s.system_prompt,
                            char(10)||char(10)||'You run on Hermes Agent') > 0
                 THEN substr(s.system_prompt, 1,
                        instr(s.system_prompt,
                              char(10)||char(10)||'You run on Hermes Agent') - 1)
                 ELSE s.system_prompt END,
            char(10)||char(13)||' ')
        != trim(readfile('$soul'), char(10)||char(13)||' ');" 2>/dev/null
done
exit 0
