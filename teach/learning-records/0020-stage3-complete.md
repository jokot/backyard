# Stage 3 complete

All seven of Stage 3's success criteria pass, closing out the spec
(`docs/superpowers/specs/2026-09-09-stage3-ark-and-fizzy-design.md`).

## The evidence

Criteria 1 through 4 test topic routing in the Ark group. Three keys
carry them, and all three are in every live profile:

```
telegram:
  require_mention: true
  exclusive_bot_mentions: true
  free_response_topics:
    - "-1004371805465:2"
```

Crazy Dave holds thread `1` for `#General`, Peashooter holds thread `2`
for `#Coding`, Sunflower holds thread `3` for `#Planning`. An unnamed
message in `#Coding` reaches Peashooter alone. A message that names
Sunflower in `#Coding` reaches Sunflower alone. An unnamed message in
`#Planning` never reaches Peashooter. Each bot answers a direct message
as it did before Stage 3 (Lesson 19).

Criterion 5 covers three message shapes in `#General`. A greeting gets
one sentence and files nothing. A question about the board, including a
question that asks for a judgement, gets an answer read from the board
and files nothing. A request for work files a triage task and gets no
direct answer. Two defects had to be fixed first. The greeting clause was
correct and still lost to the transcript already in the session, which is
[[0013-a-restart-does-not-erase-a-precedent]]. The board questions clause
named a property of its subject instead of the subject, which is
[[0014-a-clause-that-named-a-property-not-a-subject]] (Lesson 20).

Criterion 6 covers board upkeep. A request that names task ids archives
those tasks and files nothing. The same request with no id named gets a
question back and archives nothing.
[[0015-the-line-between-work-and-maintenance]] holds the four limits and
the reason each one exists (Lesson 21).

Criterion 7 is the end-to-end run. The kitchen timer request produced one
Fizzy card, two child tasks with different assignees, one Telegram report
per child, and one closed card carrying the summary. That run is
recorded in [[0017-three-correct-rules-that-never-combined]], which also
holds the defect the first attempt exposed.

## The criteria that needed different words

No criterion was met by a different mechanism than the spec named. Every
setting and every command in the spec is the one that works.

The wording is a different matter. The spec describes the mirror as two
moments, one on filing a root task and one on closing it. Both
descriptions are correct, and neither ran reliably as written. Crazy
Dave's root completion needs five actions, and stating them across three
regions of one prompt produced one region of behaviour per run. The
mechanism did not change. The five actions became one ordered list at one
trigger, and the run passed.

Criteria 5 and 6 tell the same story at a larger scale. The spec names
two exceptions for Crazy Dave. Making those two exceptions hold took four
more edits, and `SOUL.md` now carries seven named moments rather than
three. Each edit came from one real message that behaved wrong.

The Fizzy card carries a title and no description. That is the spec at
line 146, not a shortfall. A webhook from this board carries `title` and
`url`, so the card stays a pointer to the board and never a second copy
of it.

## What the stage cost

Seven lessons, 0018 through 0024, and eight learning records, 0013
through 0020.

Two of the seven defect records describe mistakes in the teaching rather
than in Hermes. [[0016-a-specification-that-could-not-work]] documents an
acceptance criterion that no implementation could satisfy, because the
formula in the specification used a clamp that cannot close a gap.
[[0019-a-checkpoint-with-no-step-behind-it]] documents three repository
files that went stale for a full stage, because the lesson named the copy
in its checklist and never in its procedure.

Nothing in this stage was found by reasoning about what should happen.
Every defect came from one real message, one real run, or one real file
read on the day it mattered.

## Generalizes

The plan proposed a candidate: Stage 3 is the first stage where a message
has more than one correct destination. The evidence supports that for two
records out of seven. Records 0014 and 0015 are both about one message
that could go to the board or to a reply, and both are about drawing that
line. The candidate is real, and it is not the shape of the stage.

The evidence supports a different sentence. **Stage 1 found defects in
configuration. Stage 2 found defects in the seams between parts. Stage 3
found defects in the writing.**

Five of the seven records name a document that instructs someone, and no
new code path failed. A `SOUL.md` clause named a property instead of a
subject. A boundary was drawn from the shape of an operation instead of
from ownership. A specification stated a formula that could not produce
the behaviour beside it. A prompt stated one procedure in three places.
A lesson stated a required action only in its checklist.

The reason follows from what Stage 3 added. It added no new process and
no new daemon. It added a second room and a second system, and it
connected both to the existing agents with words. Every instruction was
already true in the situation its author had in mind. Each one failed in
the second situation, which arrived later and was never written down.

So read an instruction the way you read a function signature. Ask what it
excludes, not what it covers. Ask which caller it was written for, and
then name the second caller.

Next: Stage 4, designed through the same brainstorming process Stage 1,
Stage 2 and Stage 3 went through.
