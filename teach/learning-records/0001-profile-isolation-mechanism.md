# Understood: profiles isolate by separate files, not by convention

When asked what isolates Peashooter's context from `default`, the user
correctly named "profile," then — on a nudge — articulated the actual
mechanism: separate config, model settings, skills, and memory files per
profile, so nothing is shared to leak through. This is the load-bearing
idea behind "context contamination" not recurring as more profiles get
added, so future lessons can build on it directly instead of re-explaining
profile isolation from scratch.
