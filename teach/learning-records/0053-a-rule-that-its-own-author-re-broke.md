# A rule that its own author re-broke, and the command that caught it

While preparing the Stage 6 move, the controller changed four soul file
lines from a full path to a path that starts with a tilde. Record 0051
had already banned that form, and `roster-audit.sh` stopped the change
within one command.

## What happened

Section 4 of the Stage 6 design counts ten lines in the payload that name
a path of the Mac. Five of them name
`/Users/jokot/.hermes/scripts/hermes-report.sh`. One is line 58 of
`roster-audit.sh`, and four are in the soul files of crazydave,
peashooter and sunflower.

Line 58 took the portable form correctly:
`REPORT="${HERMES_HOME:-$HOME/.hermes}/scripts/hermes-report.sh"`. That
idiom comes from line 402 of `setup-hermes.sh`, which is the installer of
Hermes.

The controller then applied the same idiom to the four soul file lines.
The reasoning looked sound. One form would work on both machines, and the
move would need no edit at copy time.

## Why the change was wrong

[Record 0051](0051-stage-5-complete.md), section 4, had already settled
this: a path that starts with a tilde is not a path yet. The security
scanner opens a nested script before the command runs, so the scanner
must resolve the path itself. A shell expands the tilde, and an agent
never reaches the shell. The scanner answers `block` with two findings
that read `analysis_incomplete`.

The audit states the same rule in its own comments, at lines 50 to 57.
The controller edited the four files without reading them.

## What caught it

`roster-audit.sh` printed 7 findings. Four came from checks 5 and 6,
which require that a soul file names the report script and writes the
path in full. The revert cleared all 7, and only the change to line 58
reached a commit.

Stage 5 built that audit to satisfy one mission criterion: give every
rule that the roster obeys a command that fails when the rule is broken.
The criterion was met on 18 September 2026. It caught a relapse of its
own rule on 20 September 2026, two days later.

## The finding inside the finding

Three of the 7 findings reported `prompt-drift`, and the sessions carried
dates from 17 September. They looked older than the edit. They were not.
The edit caused them, and the revert cleared them.

That gives an operational fact that Section 5 of the Stage 6 design now
carries. An edit to a soul file makes every running session report drift
until its gateway restarts. So the cutover copies first, rewrites second,
and starts the gateway third. Never rewrite a soul file under a running
bot.

## What generalizes

**A record does not enforce a rule. A command enforces a rule.** The
author of the record broke the rule three days after writing it. Memory
of a rule decays, and it decays for everyone, including the person who
paid for the lesson.

**The strongest argument for a check is a relapse by its author.** Stage
5 could argue that the audit protects future sessions. It no longer needs
that argument.

**A portable form is not always a safer form.** The tilde reads as
strictly better, because it removes a step and works on two machines. It
removes a step that a scanner performs. Test a portability fix against
the tool that reads the file, and not against a shell.

**Run the check before trusting the edit.** The revert cost one command,
because the audit ran before the commit. The same edit inside a commit
would have traveled to the server and stopped every report call there.
