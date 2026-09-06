# Gotcha: cheap models can drift language despite English input

Peashooter (`deepseek/deepseek-v4-flash-0731` via OpenRouter) replied in
Bahasa Indonesia to a plain English prompt ("create simple snack game so i
can play it on web"), with nothing in any config file instructing that —
verified by checking `.hermes_history` (input was English), Peashooter's
`SOUL.md` (English only, no language clause), and the global `SOUL.md`
(also English only).

Conclusion: this was the model itself, not Hermes or the profile config.
Cheaper/free-tier model routes are less reliable at following the
implicit "reply in the input's language" convention that stronger models
follow by default.

Fix applied: added an explicit line to `SOUL.md`'s Personality section —
"Always respond in English, even if the user writes in another
language." SOUL.md is free text with no schema, so this kind of
behavioral pin is cheap to add whenever a cheap model's default behavior
needs correcting.

This should generalize: when picking cheap models per specialist (the
whole point of [[0002-model-provider-preference]]), expect to need a few
explicit SOUL.md pins to compensate for things a frontier model would
just get right by default. Don't assume a cheaper model matches a
frontier model's implicit conventions.
