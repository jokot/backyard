# 0033 — A path that sat in memory

**Date:** 2026-09-14
**Stage:** 4, Lesson 29, test 1
**Status:** Fixed in Lesson 28 and in the plan.

## What happened

Jokot posted test 1 of Lesson 29:

```
I want a prompt for adding a pause key to projects/tetris
```

Torchwood replied:

```
📖 Reading TEMPLATE.md L1-2000
🔎 Searching files for *
📚 Reading skill ste-writing
Context — what is the exact path to the Tetris project directory?
```

`SOUL.md` line 27 states: "Never ask Jokot for a path that you can list
yourself." The directory exists at
`/Users/jokot/dev/plants/projects/tetris`, and it holds `SPEC.md`,
`game.js`, `index.html`, `style.css`, and `test.js`.

## Two facts that make this worse than a missed command

Torchwood ran no shell command. The transcript holds no `💻 terminal`
line. One `ls` answers the question.

The answer was already in the prompt. Hermes loads `USER.md` into every
request, and line 3 of
`~/.hermes/profiles/torchwood/memories/USER.md` names `~/dev/plants` as
the repository of this project.

## Root cause

The soul file forbids the question and never supplies the method.

The gateway runs Torchwood with the working directory
`/Users/jokot/.hermes/profiles/torchwood`. The launchd job sets it, and
`lsof -a -p <pid> -d cwd` confirms it. So `projects/tetris` names
nothing where Torchwood stands.

Jokot writes paths against the repository. Torchwood reads them against
the profile. Neither side states the rule, so every relative path in
every interview is ambiguous.

The same ambiguity produced the opposite error earlier the same day. In
the Fizzy interview, Torchwood ran `git status` inside
`/Users/jokot/dev/plants` without being told to. It guessed the root
once and asked for it once.

## The first fix, and why Jokot rejected it

The first repair wrote `~/dev/plants` into `SOUL.md`. Jokot refused it:

> i don't like to put hardcode path on any of the souls, because my
> final goal is to deploy this on other machine or on the server

He is right. A soul file states a role, and a role travels. A path
describes one machine. The first repair traded a broken interview for an
unportable profile.

## The fix

The path moved to the one key that exists for it. `config.yaml` holds
`terminal.cwd`, and `agent/runtime_cwd.py` bridges that key to the
environment variable `TERMINAL_CWD` when the gateway starts. The value
must be absolute, because `tools/file_tools.py` line 242 rejects a
relative anchor.

```bash
HERMES_HOME=~/.hermes/profiles/torchwood   hermes config set terminal.cwd /Users/jokot/dev/plants
```

`agent/prompt_builder.py` line 1115 then writes the same path into the
prompt, on a line that starts with `Current working directory`. So the
soul file can name the directory without naming the machine:

```
Jokot writes every relative path against your working directory. The
system prompt names that directory on the line that starts with Current
working directory. Resolve each relative path there, then confirm it
with one ls before you write it into a prompt. Ask Jokot for a directory
only after that ls fails.
```

The same change removed the second path from `SOUL.md`. The template
paragraph now reads `cat "$HERMES_HOME/TEMPLATE.md"` in place of
`~/.hermes/profiles/torchwood/TEMPLATE.md`. The launchd job exports that
variable already.

The last sentence of the new rule keeps the question legal for the case
that earns it. A directory that no `ls` finds is a real question, and the
Fizzy interview of the same day proved that case exists.

`terminal.cwd` became the eighth row of the specialist reference.

## Generalization

*A prohibition without a method produces the prohibited act.* "Never ask
for a path you can list yourself" tells the agent what not to do. It
never says where to list. The agent that cannot compute the answer asks,
because asking is the only remaining move.

*State the frame of a relative path.* Two processes with different
working directories read `projects/tetris` as two different places. A
rule about paths must name the root that the paths hang from.

*A machine fact belongs in machine configuration.* The rule that needed
a path was correct. The file that held it was wrong. Ask which of the two
travels, the rule or the value, and put each one where it belongs.

*Memory in the prompt is not memory in use.* The repository root sat in
`USER.md`, inside the same request that produced the question. Loading a
fact does not make an agent apply it. A rule that names the fact does.

## Related

- Record 0032 — a ban written as a mechanism, found the same day.
- Record 0031 — an exception written broader than its intent.
- Record 0026 — an instruction to read a file that did not exist, which
  also came from a gap between what the file says and where the agent
  stands.
- Lesson 28 — the lesson corrected here.
