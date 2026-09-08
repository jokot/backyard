# A blocked child task reports to nobody

Lesson 16's end-to-end test sent Crazy Dave one real cross-domain
request. `decompose` split it into three children correctly, Sunflower
finished the spec task, and Peashooter then hit a credential it could not
mint and marked its task `blocked`. No message ever arrived in Telegram.
The only way to find out was to run `hermes kanban list` by hand.

Three separate defects stack up to produce that silence. Each one was
confirmed by reading Hermes's own source, not inferred from behavior.

**1. `decompose` never subscribes the children it creates.**
`_maybe_auto_subscribe` (`tools/kanban_tools.py:1164`) runs only on the
`kanban_create` tool path, so it covers the root task Crazy Dave files and
nothing else. `hermes_cli/kanban_decompose.py` contains no reference to
`subscribe` at all, and no config key turns it on. A direct query of
`kanban_notify_subs` confirmed it: only the root task had a row.

**2. A blocked child does not propagate status to its parent.**
`recompute_ready` (`hermes_cli/kanban_db.py:3393`) promotes a task only
when every parent is `done` or `archived`. A parent stuck at `blocked`
never satisfies that test, so the root task sits in `todo` with no status
change of its own and no event to notify on. Nothing carries the problem
upward.

**3. The notifier has two gates that reject opposite values.**
This one is the real bug. Gate 1 (`gateway/kanban_watchers.py:255`)
compares the subscription's stored profile name against the gateway's own
name and skips on a mismatch. Gate 2 is `_authorization_adapter`
(`gateway/authz_mixin.py:49`), which treats any name other than `default`
as a multiplex profile, finds no registry entry for a single-profile
gateway, and fails closed. So `crazydave` passes gate 1 and fails gate 2,
while `default` fails gate 1. No profile name satisfies both.

The visible symptom was subtle. The notifier claimed the event and then
rewound the cursor every 5 seconds, forever, which is why all 8
subscriptions read `last_event_id = 0` hours after they were created —
including tasks that had already been archived.

Fix: store NULL in `notifier_profile`. Gate 1 reads
`sub.get("notifier_profile") or None`, so NULL disables the comparison.
Gate 2 receives `None` and falls through to `adapters.get(platform)`, the
gateway's own adapter. NULL is the only value that passes both gates, and
the CLI cannot write it — `--notifier-profile` falls back to the active
profile when omitted, so it needs a direct SQL update.

Side effect, accepted knowingly: with NULL every gateway treats the row as
its own, and whichever one claims the event first sends it. The claim is
atomic, so exactly one message arrives, but the sending bot is a race. In
the confirming test Peashooter's bot delivered a notification for a task
subscribed through Crazy Dave.

**Diagnosis note worth keeping.** Two false starts cost real time here.
The first was assuming a gateway restart would apply a `SOUL.md` fix — the
gateway had already restarted, and the actual stale layer was the Telegram
conversation session, which needed `/new`. The second was setting
`logging.level: DEBUG` and reading `gateway.log`, which has a hardcoded
`level=logging.INFO` (`hermes_logging.py:345`). Only `agent.log` honors
the configured level. Both mistakes shared a shape: asserting a mechanism
before checking which file or process actually implements it. See
[[0006-telegram-automatic-setup-failed-in-web]] for the earlier instance
of the same habit.

Generalizes: a task board reports what it was asked to watch, not what
went wrong. Until `decompose` subscribes its own children, treat
`hermes kanban list` as the real status check and subscribe every child by
hand with a NULL stamp. Never read silence as progress.
