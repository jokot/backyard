# --clone-from copies memory, not just config

Checking Peashooter's real memory files (`~/.hermes/profiles/peashooter/memories/MEMORY.md`
and `memories/USER.md` — not the profile root, an earlier assumption that
was wrong) showed content about `git-swap`, an unrelated past Go CLI
project, plus the user's git identities and a stale note about a
different provider setup. None of this came from anything said to
Peashooter directly.

Cause: `hermes profile create peashooter --clone-from default` (Lesson 1)
clones the source profile's memory files along with its config, not just
config. The isolation `[[0001-profile-isolation-mechanism]]` established
in Lesson 1 is real going forward, but a clone starts from the source
profile's accumulated state, not a blank one.

Fixed by running `hermes memory reset` (asks for a typed "yes"
confirmation, or pipe `echo yes |` to script it) to erase both files and
start Peashooter's memory clean.

Generalizes: cloning a new specialist from an existing profile that has
been used for a while will carry over that profile's memory. Reset it
right after creation, before writing anything meant to be specific to
the new specialist — otherwise the first real memory-persistence test
(Lesson 4) would be muddied by inherited content instead of proving
persistence of something the new agent actually learned.
