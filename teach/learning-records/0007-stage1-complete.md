# Stage 1 complete

All four of Stage 1's success criteria verified, closing out the spec
(`docs/superpowers/specs/2026-09-06-peashooter-stage1-design.md`):

- Peashooter replies on Telegram.
- A fact taught in one session was recalled, unprompted, in a new one
  (Lesson 4), and again over Telegram (Lesson 6).
- Off-topic questions get declined/redirected, in the terminal (Lesson 3,
  after the hard-rule fix in [[0004-soft-instructions-lose-to-prompt-size]])
  and on Telegram (Lesson 6).
- Peashooter runs from a project folder other than `plants` — confirmed
  by invoking it from a different directory directly, not by asking
  Peashooter itself (an earlier attempt asked it over Telegram, which
  answered a different question — where its own config files live, not
  whether it's callable from any folder).

Six lessons, six real fixes found and documented along the way
([[0002-model-provider-preference]] through
[[0006-telegram-automatic-setup-failed-in-web]]) — none of them
theoretical, all surfaced by actually running the thing and checking
real output before trusting it.

Next: Stage 2 (second specialist + coordinator/routing), designed fresh
through the same brainstorming process Stage 1 went through.
