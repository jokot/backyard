# Stage 3 Design: the Ark group and the Fizzy mirror

**Date:** 2026-09-09
**Status:** Approved for implementation
**Author:** jokot, with Claude Code

## Background

This document is Stage 3 of the plants multi-agent project. Stage 1 built
Peashooter, a coding specialist reachable over Telegram
(`docs/superpowers/specs/2026-09-06-peashooter-stage1-design.md`). Stage 2
added Sunflower, Crazy Dave, and the shared Hermes kanban board
(`docs/superpowers/specs/2026-09-06-stage2-sunflower-crazydave-design.md`).
Stage 2 is complete. Two full runs verified all four success criteria.

The reference project remains
[Zain Fathoni's "Project Transformers"](https://www.zainfathoni.com/blog/project-transformers-building-personal-ai-army)
and [The Ark](https://ark.zainf.dev/). Two parts of the reference design
are still missing from this project.

The first missing part is the room. The Ark is one Telegram supergroup
with one topic per specialist. The user posts in a topic and the owner of
that topic answers. The user names another specialist and that specialist
answers instead. This project currently has three separate direct message
threads and no shared room.

The second missing part is the board that a human can read on a phone.
The Hermes kanban board is a SQLite database behind a command line
interface. The reference project uses [Fizzy](https://www.fizzy.do/), the
kanban tracker from 37signals, as the visible board.

Stage 3 builds both parts. A spike ran before this design and established
the facts in the "Findings from the spike" section below.

## Findings from the spike

These facts come from Hermes source and official documentation. Each one
constrains the design.

- Telegram supports several Hermes bots in one group. The file
  `website/docs/user-guide/messaging/telegram.md` documents the pattern
  under the heading "Multiple Hermes bots in one group".
- `require_mention: true` makes a profile silent in a group until a
  message names it.
- `exclusive_bot_mentions: true` is the default. Only the mentioned
  profile processes a message. Other Hermes bots ignore that message.
- `ignored_threads` is absolute. The documentation states that an ignored
  topic is skipped "before the mention and free-response checks run". A
  bot that ignores a topic cannot answer a mention in that topic.
- `free_response_topics` is the correct primitive for a per-topic default
  listener. The function `_telegram_free_response_topics` at
  `plugins/platforms/telegram/adapter.py:7251` reads
  `extra.free_response_topics` or the environment variable
  `TELEGRAM_FREE_RESPONSE_TOPICS`. Each entry is the string
  `<chat_id>:<thread_id>`. A message with no thread id maps to the
  General topic, which is thread `1`.
- Telegram rejects concurrent polling for one bot token. Each profile
  must own a separate bot token.
- Fizzy publishes an official Go command line interface,
  [basecamp/fizzy-cli](https://github.com/basecamp/fizzy-cli), under the
  MIT license. That tool ships an agent skill and a read-only MCP server.
- A Fizzy webhook payload carries the card `title` and `url` only. The
  payload carries no description body. See
  [the Fizzy webhooks help page](https://help.fizzy.do/3/fizzy-help-guide/67/webhooks)
  and [Rob Zolkos on Fizzy webhooks](https://www.zolkos.com/2025/12/02/fizzy-webhooks-what-you-need-to-know).

## Decisions

- **Three bots, no multiplexing.** Each profile keeps its own gateway and
  its own bot token, exactly as Stage 2 runs today. Hermes offers profile
  routing, which maps one gateway to several profiles by chat id through
  the `profile_routes` list and `gateway.multiplex_profiles: true`. This
  design rejects that feature. Multiplexing would replace three working
  gateways with one untested configuration, and it would put the existing
  direct message threads at risk.
- **Direct messages stay unchanged.** The group is an addition, not a
  replacement. Every direct message thread from Stage 1 and Stage 2
  continues to work with no configuration change.
- **One topic per specialist, plus General.** Peashooter owns #Coding.
  Sunflower owns #Planning. Crazy Dave owns #General. Every profile
  remains reachable by mention in every topic.
- **`free_response_topics`, never `ignored_threads`.** This design uses
  no `ignored_threads` entry anywhere. An `ignored_threads` entry would
  block mentions and would break the "name any specialist" half of the
  reference design.
- **Fizzy is a mirror, never an input.** No agent reads Fizzy to decide
  anything. The Hermes kanban board remains the only source of truth for
  routing and for task state. A stale Fizzy card produces a stale view
  and nothing more.
- **Crazy Dave owns the Fizzy card.** Crazy Dave already runs at both
  moments the mirror needs. Crazy Dave files the root task, and
  `orchestrator_profile: 'crazydave'` spawns Crazy Dave on the root task
  after the children complete. Workers gain no new Fizzy duty.
- **One Fizzy card per root task.** Child tasks produce no card. The
  Telegram group already reports child results, so a card per child adds
  cost and no information.
- **The official Fizzy command line interface, not a custom script.** The
  reference project wrote three helper tools. Two of those tools are now
  obsolete. The tool `fizzy-md` converted Markdown to HTML, and the
  official skill states that rich text fields accept Markdown or HTML.
  The tool `fizzy-create-card.sh` predates the official command line
  interface.
- **Hosted Fizzy.** The hosted free tier allows 1,000 cards and costs
  nothing. The paid tier costs 20 US dollars per month for unlimited
  cards. Self-hosting through Docker or Kamal is free and is a separate
  project. This stage uses the hosted service.

## Design: the Ark group

One Telegram supergroup with Topics enabled. Three topics, listed with
the profile that answers an unnamed message in each.

| Topic | Default listener | Other profiles |
|---|---|---|
| #General | Crazy Dave | reachable by mention |
| #Coding | Peashooter | reachable by mention |
| #Planning | Sunflower | reachable by mention |

Worker results keep the Stage 2 path. Each worker sends its result
through `hermes send` to the direct message thread that started the work.
This stage adds no report topic.

Each profile receives the same three settings, with a different topic in
the third. The example below configures Peashooter, where `-100...` is
the group chat id and `3` is the thread id of #Coding.

```yaml
telegram:
  require_mention: true
  exclusive_bot_mentions: true
  free_response_topics:
    - "-1001234567890:3"
```

Three rules follow from those settings. A message in #Coding with no
mention reaches Peashooter alone. A message in #Coding that names
Sunflower reaches Sunflower alone. A message in #Planning with no mention
never reaches Peashooter.

## Design: the Fizzy mirror

Crazy Dave writes to Fizzy at two moments and reads Fizzy at neither.

1. **On filing a root task.** Crazy Dave creates the kanban task first,
   as Stage 2 defines. Crazy Dave then runs
   `fizzy card create --title "<the request>"` and records the returned
   card number as a kanban comment in the form `fizzy:<number>`.
2. **On closing a root task.** Crazy Dave reads the `fizzy:<number>`
   comment from the kanban task. Crazy Dave then runs
   `fizzy comment create --card <number> --body "<the summary>"` followed
   by `fizzy card close <number>`.

The kanban comment is the only link between the two systems. Fizzy never
tells Hermes anything.

Failure handling is deliberate and simple. A failed `fizzy` command never
blocks the kanban task. Crazy Dave reports the failure in the Telegram
group and completes the kanban work anyway. The kanban board stays
correct and the mirror shows a gap.

## Steps (each step is one lesson)

1. **Create the Ark group.** Create a Telegram supergroup. Enable Topics.
   Create the three topics from the table above. Add all three bots and
   promote each bot to administrator.
2. **Disable privacy mode.** Use BotFather to disable privacy mode for
   all three bots. A bot with privacy mode enabled receives only messages
   that name it. Remove and add each bot again after the change, because
   Telegram can keep the earlier delivery behavior.
3. **Record the identifiers.** Record the group chat id and the three
   thread ids. Every entry in `free_response_topics` needs both numbers.
4. **Configure the three profiles.** Add `require_mention`,
   `exclusive_bot_mentions`, and one `free_response_topics` entry to each
   profile. Restart the three gateways.
5. **Test the group.** Run the five Telegram checks in the success
   criteria below.
6. **Teach Crazy Dave to answer the room.** Add two exceptions to
   `~/.hermes/profiles/crazydave/SOUL.md`. One covers small talk. One
   covers a question about work already on the board. Filing a task
   stays the default for every other message.
7. **Create the Fizzy account and board.** Create one hosted Fizzy
   account and one board. Install the command line interface with
   `brew install --cask basecamp/tap/fizzy`. Create a personal access
   token. Authenticate with
   `fizzy auth login "$TOKEN" --profile crazydave`.
8. **Teach Crazy Dave the mirror.** Add the two Fizzy moments to
   `~/.hermes/profiles/crazydave/SOUL.md`. State that Crazy Dave never
   reads Fizzy, and that a failed `fizzy` command never blocks the kanban
   task.
9. **Run the end-to-end test.** Send one cross-domain request in
   #General. Verify the full route from the card to the closed task.

## Success criteria

1. A message in #Coding with no mention gets an answer from Peashooter
   and from no other bot.
2. A message in #Coding that names Sunflower gets an answer from
   Sunflower and from no other bot.
3. Each of the three bots answers a direct message exactly as it answers
   today.
4. No bot answers an unnamed message in a topic that another profile
   owns.
5. A greeting in #General gets a one sentence reply from Crazy Dave and
   creates no kanban task. A request for work in #General creates a
   triage task and gets no direct answer.
6. A cross-domain request in #General produces one Fizzy card, two or
   more kanban child tasks, one Telegram report per child, and one closed
   Fizzy card that carries the summary.

## Out of scope for Stage 3

- Gateway profile multiplexing through `profile_routes`.
- Private chat topics, which the `dm_topics` setting creates inside a
  one-to-one direct message.
- Per-topic skill binding through `group_topics`.
- A Fizzy webhook receiver, which needs a public HTTPS endpoint and
  HMAC-SHA256 signature verification.
- Any read from Fizzy into Hermes, in this stage or a later one, unless a
  later spec revokes the mirror decision.
- A Fizzy token for Peashooter or Sunflower.
- Self-hosted Fizzy through Docker or Kamal.
- A fourth specialist profile.

## Risks / open questions

- **Unverified: `free_response_topics` against `require_mention: true`.**
  The code path at `plugins/platforms/telegram/adapter.py` reads as an
  allowlist that overrides the mention requirement. Nobody has run that
  combination on this machine. Success criterion 1 tests it first. If the
  combination fails, the fallback is `require_mention: false` on each
  profile plus one `free_response_topics` entry, which produces the same
  behavior through a wider default.
- **Privacy mode is a common failure.** A bot with privacy mode enabled
  reports no error. The bot stays silent for unnamed messages. Step 2
  exists because of this failure mode.
- **The Fizzy free tier counts deleted cards.** Reports state that a
  deleted card still counts against the 1,000 card limit. Test cards
  consume the limit permanently.
- **Crazy Dave gains three more `SOUL.md` clauses in this stage.**
  Learning record 0009 states that a hard rule written for one input
  channel breaks on the second channel. Step 6 adds two reply moments,
  and step 8 adds the Fizzy duty. Every clause names the moment it
  applies to, never the message that arrived. Watch for the same failure
  shape during the end-to-end test.
- **A reply moment can hide a request.** If Crazy Dave answers a work
  request conversationally, no kanban task exists and no record of the
  request survives. A junk task is visible on the board and one archive
  command removes it, so filing stays the default and every reply is a
  named exception. Success criterion 5 tests both directions.
