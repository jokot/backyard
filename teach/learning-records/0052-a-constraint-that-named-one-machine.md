# A constraint that named one machine, on a project that now has two

Stage 6 buys a server, so the word "machine" stops naming one thing. The
constraint that governs who runs a command now names the server, and it
leaves the Mac to the controller.

## What the constraint said, and how it moved

The line arrived in commit `0d87c30` on 2026-09-16, in the revision that
[record 0047](0047-a-mission-that-outlived-its-first-draft.md) describes.
It read: "Jokot runs every command that changes the machine, then reports
the output."

Jokot lifted the line for Stage 5 on 17 September 2026, with the words
"run everything you can execute by yourself, then tell me when I need to
do my part". `teach/NOTES.md` line 212 records the lift, and it records
the limit of the lift: "The constraint still stands for later stages
until Jokot lifts it again."

So Stage 6 met a constraint that had returned, and a stage that makes the
word "machine" ambiguous.

## What the constraint protects, and where that risk now lives

The rule never protected the Mac. The rule protected Jokot from a command
that he did not read before it ran.

That risk moved. Work on the Mac is high in volume and low in cost. The
git history covers every file in the repository, the mirror in
`hermes-config` has a second copy of every script, and a wrong edit shows
as a diff. Stage 6 measured 109 MB of payload, ten databases and fourteen
files that must not cross, and each measurement took several commands.

Work on the server has the opposite shape. The machine is new, it is
remote, Jokot pays for it each month, and its state has no second copy
until Gate A of Section 6 passes. A command there can also reach a live
Telegram bot token.

So the constraint follows the risk. The new line reads: "Jokot runs every
command that changes the server, then reports the output. Claude runs
commands on the Mac and in the repository without asking first."

## What this rules out

The controller still never reads `.env` or `auth.json`, on either
machine. That rule comes from the secrets position in Section 2 of the
Stage 6 design, and the scope of this constraint does not touch it.

## What generalizes

**A rule that names an object by a definite article breaks when a second
object appears.** "The machine" was exact while one machine existed. The
same six words became ambiguous on the day the project bought a server,
and no edit to the server caused the ambiguity.

**Name the risk, not the object.** The constraint means "Jokot reads a
command before it runs where a mistake is expensive and hard to undo."
That sentence needed no revision when the second machine arrived. The
sentence that named a machine did.

**A lift with a stated end is not a repeal.** The Stage 5 lift carried
its own limit in `NOTES.md`, so Stage 6 started from the original rule
and changed it on purpose. A lift without that sentence would have left
the project guessing which rule applied.
