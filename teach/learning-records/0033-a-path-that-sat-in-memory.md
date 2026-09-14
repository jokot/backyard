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

## Two fixes that Jokot rejected

The first repair wrote `~/dev/plants` into `SOUL.md`. Jokot refused it:

> i don't like to put hardcode path on any of the souls, because my
> final goal is to deploy this on other machine or on the server

He is right. A soul file states a role, and a role travels. A path
describes one machine.

The second repair moved the path to `config.yaml`, key `terminal.cwd`.
That key exists for this purpose. `agent/runtime_cwd.py` bridges it to
the environment variable `TERMINAL_CWD` when the gateway starts, and
`agent/prompt_builder.py` line 1115 writes the value into the prompt.
Jokot refused that one too:

> i still want to keep the cwd to default, because i don't want to setup
> those work directory every time i setup the project on the other
> machine

This objection is different from the first. The first was about the
wrong file. The second is about the count of steps. A correct setting in
the correct file is still one more command on every machine.

## The fix

Torchwood searches for the directory, then remembers it.

```
Jokot names a project by a relative path. Your working directory is the
profile directory, so that path resolves nowhere. Find the directory
before you ask for it. Run the search below, with the path he wrote in
place of PATH:

    find ~ -maxdepth 6 -type d -path '*/PATH' -not -path '*/.*'

One result is the answer. Record the repository root in memory, so that
a later interview skips the search. Ask Jokot for the directory only
when the search returns nothing, or when it returns more than one.
```

The first version of this rule used `projects/tetris` as an example in
place of PATH. Jokot rejected that too. An example is not a value the
agent reads, but it names a project that may not exist on the next
machine, and it can steer an interview toward the project that the
example names. A soul file states a role, so it holds no project name
and no path.

Three facts make this work.

`find` already sits in the permitted command list, so the rule needs no
new permission.

The search costs 669 ms from the profile directory on this machine, and
it returns exactly one result.

`config.yaml` sets `memory.memory_enabled: true` and
`memory.write_approval: false`, so Torchwood records the root without
asking. `SOUL.md` line 51 already tells it to record the conventions of
Jokot's stack.

The last sentence keeps the question legal for the case that earns it. A
directory that no search finds is a real question, and the Fizzy
interview of the same day proved that case exists.

No eighth roster decision was added. The working directory stays at its
default value of `.` on every machine.

## Generalization

*A prohibition without a method produces the prohibited act.* "Never ask
for a path you can list yourself" tells the agent what not to do. It
never says where to list. The agent that cannot compute the answer asks,
because asking is the only remaining move.

*State the frame of a relative path.* Two processes with different
working directories read `projects/tetris` as two different places. A
rule about paths must name the root that the paths hang from.

*Give an agent a search, not a value.* A value is correct on one
machine and wrong on the next. A search is correct on both, and it costs
one command. Prefer the rule that discovers the fact over the rule that
states it.

*A placeholder beats an example.* An example teaches the reader and
dates the file. The reader here is a model that runs on every machine,
and it needs the shape of the command, not a sample of one project.

*A setting in the right file is still a setting.* The second design put
the path where the tool intends it. Jokot still refused, because every
per-machine value is one more step in a deployment. Count the steps a
design adds to the next machine, not only the files it touches.

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
