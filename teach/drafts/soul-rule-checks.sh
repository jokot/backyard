#!/usr/bin/env bash
# soul-rule-checks.sh
#
# Check two soul-file rules. Print one line for each rule that fails. Print
# nothing when every rule holds, so a healthy run delivers no message.
# Exit 0 in both cases (no output is not an error).
#
# Scope: the soul files of crazydave, peashooter, and sunflower. Torchwood
# reports through Crazy Dave, so its soul file is intentionally not checked.
#
#   Rule A - each checked soul file must name the report script
#            (/Users/jokot/.hermes/scripts/hermes-report.sh) so the agent
#            reports finished work, and must NOT name a `hermes send`
#            command (workers call the report script, not the raw sender).
#   Rule B - every reference to the report script inside a checked soul
#            file must use the full literal path. A reference written with
#            `~` or `$HOME` is not a path yet: the security scanner cannot
#            resolve it and stops the command. Such references are flagged.
#
# Usage: soul-rule-checks.sh [TARGET]
#   TARGET is a directory or a file. With no argument it defaults to the
#   live profiles directory (~/.hermes/profiles) and checks each checked
#   profile's SOUL.md. A directory target is treated the same way relative
#   to TARGET (e.g. a scratch copy of the profiles tree). A file target
#   checks only that one soul file. Testing points the script at a scratch
#   copy so a bad reference can be exercised without touching live files.
#   The script only reads; it never writes to any target or to the live
#   profiles.
set -uo pipefail

REPORT='/Users/jokot/.hermes/scripts/hermes-report.sh'

# Considered profiles. Torchwood is deliberately absent (reports via Crazy Dave).
CHECKED='crazydave peashooter sunflower'

# check_soul <profile> <path-to-SOUL.md>
# Emit one line per failed rule for this soul file.
check_soul() {
  local p="$1" soul="$2"

  [ -f "$soul" ] || {
    echo "$p soul: missing $soul"
    return
  }

  # Rule A, part 1: the soul must name the report script.
  if ! grep -qF "$REPORT" "$soul"; then
    echo "$p soul: does not name $REPORT"
  fi

  # Rule A, part 2: the soul must not hold the string `hermes send` at all,
  # in a command or in prose. An anchored match that only reads the start of
  # a line misses a real violation such as "Run hermes send --to telegram".
  # No soul file names the command today, and a file that wants to state the
  # rule can say "the raw sender" instead. The broader rule is the simpler
  # rule, and it has no gap.
  if bad=$(grep -nE 'hermes([[:space:]]+-p[[:space:]]+[^[:space:]]+)?[[:space:]]+send([[:space:]]|$)' "$soul" | head -1); then
    echo "$p soul: names a 'hermes send' command ($bad) -- must call $REPORT instead"
  fi

  # Rule B: every reference to the report script must be the full literal
  # path. A `~` or `$HOME` reference cannot be resolved by the security
  # scanner, so flag any line that names the script without the full path.
  while IFS= read -r l; do
    [ -z "$l" ] && continue
    if ! printf '%s\n' "$l" | grep -qF "$REPORT"; then
      echo "$p soul: report reference must use full literal path, not ~ or \$HOME: $l"
    fi
  done < <(grep -n 'hermes-report\.sh' "$soul")
}

# Resolve the target: argument, else the live profiles directory.
if [ "$#" -ge 1 ] && [ -n "$1" ]; then
  TARGET="$1"
else
  TARGET="${SOUL_CHECKS_PROFILES_DIR:-$HOME/.hermes/profiles}"
fi

if [ -f "$TARGET" ]; then
  # A single soul file: label it by the directory it sits in.
  check_soul "$(basename "$(dirname "$TARGET")")" "$TARGET"
elif [ -d "$TARGET" ]; then
  for p in $CHECKED; do
    check_soul "$p" "$TARGET/$p/SOUL.md"
  done
else
  echo "soul-rule-checks: target not found: $TARGET" >&2
fi

exit 0