#!/usr/bin/env bash
# Report one message to Telegram, and to the Fizzy card when a card exists.
#
# A worker calls this script instead of `hermes send --to telegram`.
# Telegram always receives the message. Fizzy receives a comment only when
# the task chain carries a `fizzy:<number>` comment.

set -uo pipefail

MSG="${1:-}"
if [ -z "$MSG" ]; then
  echo "usage: hermes-report.sh \"<the message>\"" >&2
  exit 2
fi

# Telegram first. This send is the report that Jokot reads, so a Fizzy
# defect never costs a report.
if ! hermes send --to telegram "$MSG" >/dev/null 2>&1; then
  echo "report: telegram send failed" >&2
  exit 1
fi

TASK="${HERMES_KANBAN_TASK:-}"
[ -z "$TASK" ] && exit 0

# Print the card number held in a `fizzy:<number>` comment, or print
# nothing. The quotation marks anchor the match, so a comment that only
# mentions the word fizzy never matches.
card_of() {
  hermes kanban show "$1" --json 2>/dev/null \
    | grep -o '"fizzy:[0-9][0-9]*"' | head -1 | tr -d '"' | cut -d: -f2
}

CARD="$(card_of "$TASK")"

# A dispatched worker owns a child task, and the card belongs to the root
# task. In this board `children` means "waits for me", so the root task
# appears in the children list of the worker task. Probe every task id
# that the worker task mentions. Only a root task carries a fizzy comment.
if [ -z "$CARD" ]; then
  for id in $(hermes kanban show "$TASK" --json 2>/dev/null \
                | grep -o 't_[0-9a-f]\{8\}' | sort -u); do
    [ "$id" = "$TASK" ] && continue
    CARD="$(card_of "$id")"
    [ -n "$CARD" ] && break
  done
fi

if [ -z "$CARD" ]; then
  echo "report: no fizzy card for $TASK" >&2
  exit 0
fi

if ! fizzy comment create --profile crazydave --card "$CARD" \
       --body "$MSG" >/dev/null 2>&1; then
  echo "report: fizzy comment failed for card $CARD" >&2
fi
exit 0
