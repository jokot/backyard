# Soft SOUL.md wording loses inside a large system prompt

Peashooter's original out-of-scope clause ("say plainly it's outside
your scope; don't take a guess at it anyway") failed the real test: asked
"what is islam?", the model answered in full, then added a one-line
caveat at the end. It noticed the boundary and ignored it anyway.

Diagnosis used `hermes prompt-size --json`, which reports the actual
system prompt size without an API call. Peashooter's system prompt runs
~22,000 characters; SOUL.md's own text is a few hundred of those.
Nearly all of it is Hermes's built-in agent/tool/skills instructions, not
anything project-specific. A soft instruction is easy for a weak model
to soften further when it is a small fraction of a much larger prompt.

Fix: rewrite the clause as an explicit hard rule with no room for a
middle ground — "do not answer, not even briefly," "then stop," and a
direct ban on "just in case it's useful" answers. See [[0003-cheap-model-language-drift]]
for the related finding that this same model also needed an explicit
pin for language.

Generalizes: for every future specialist, check `hermes prompt-size`
early, and write SOUL.md exclusion/behavior clauses as hard rules by
default when the profile runs a cheap model — don't assume a polite
instruction is strong enough to survive dilution. Retest exclusions with
a real off-topic question before trusting them, the same way Lesson 3
did — don't take the wording on faith.

**Confirmed fixed (2026-09-06):** retested with "what is volcano" (clean
decline) and "what is bumblebee in android studio" (answered in full,
correctly read as an on-topic dev-tool question, not a trivia one). The
hard-rule wording holds up, and the model correctly distinguishes a
same-word off-topic case from an on-topic one instead of pattern-matching
on keywords alone.
