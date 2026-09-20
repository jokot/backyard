# Stage 6 Implementation Plan: The server move

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task by task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all four Hermes profiles to a rented OVHcloud VPS-1 in
Singapore, and prove that each one answers from there with its history
intact.

**Architecture:** Install Hermes on Linux from source at the same commit
that the Mac runs. Carry 109 MB of state and leave 2.0 GB of arm64 files
behind. Move the static bulk before anything stops. Then stop all four
bots in one window, checkpoint every database, copy, rewrite four paths,
and start the bots one at a time behind four gates.

**Tech Stack:** Ubuntu 24.04 LTS, systemd in user scope, uv, the Hermes
Agent CLI (`gateway`, `send`), rsync over SSH, SQLite, and the `teach`
skill lesson format.

**Spec:** `docs/superpowers/specs/2026-09-18-stage6-the-server-move-design.md`

---

## Global Constraints

- **Jokot runs every command that changes the server, then reports the
  output.** Record 0052 holds the reason. Compose the command, state what
  output proves the step, and wait.
- **Jokot also runs every command that stops or starts a gateway**, on
  either machine. A stopped gateway means a bot that does not answer
  Telegram, and Jokot is the person who sees that.
- **Claude runs commands on the Mac and in the repository** without asking
  first. This covers measurement, file edits, the mirror, and commits.
- Never read or print the contents of `.env` or `auth.json`. Prove that a
  file arrived with `test -f` and with a byte count, never with `cat`.
- Never assert a diagnosis without real command output or real Hermes
  source. Quote the output that supports the claim. Record 0035 holds the
  cost of a guess.
- Every real defect gets a fix and a learning record. Never write a
  workaround.
- Lessons continue at `0036`. Learning records continue at `0054`.
- Every lesson links `../assets/style.css`.
- Lesson HTML must hold balanced tags. Verify the balance before each
  commit.
- Run a link existence check over every relative `href` in a new lesson or
  record before the commit.
- After Jokot edits a real file under `~/.hermes/profiles/<name>/`, copy
  that file into `hermes-config/<name>/`. Never copy `.env`, `auth.json`,
  `channel_directory.json`, `memories/USER.md`, or `memories/MEMORY.md`.
- Run this secret scan before every commit. Replace `<DM>` with the
  9-digit private chat id of Jokot. This plan never prints that id, and no
  tracked file in this repository holds it:
  `git diff --cached | grep -nE '<DM>|TELEGRAM_BOT_TOKEN=|FIZZY_TOKEN=|[0-9]{9,10}:[A-Za-z0-9_-]{35}' | grep -v 'grep -nE'`
  The final `grep -v` matters. A commit that adds this document also adds
  the text of the pattern, and the scan then matches itself.
- Use `assert s.count(old) == 1` before every scripted string replacement.
- The shell of the Mac is zsh. zsh does not split an unquoted variable
  into words. Hold a list of arguments in an array, and expand it with
  `"${NAME[@]}"`.
- End every commit message with
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

---

## Verified facts

Every fact below comes from a command that ran on the Mac on 20 September
2026. No fact comes from memory.

**The upstream repository is public.** `git ls-remote
https://github.com/NousResearch/hermes-agent.git HEAD` answers without
credentials. The server needs no SSH key and no deploy key.

**The Mac runs one exact version.** `hermes --version` prints
`Hermes Agent v0.18.2 (2026.7.7.2) · upstream 3e7c563d`. Upstream `main`
has moved to `8a92051f2`, which is about two months ahead.

**uv provisions Python.** Line 36 of `setup-hermes.sh` reads
`PYTHON_VERSION="3.11"`. The version that Ubuntu ships has no effect.

**The installer never touches node.** `grep -cE 'npm|node|web/'
setup-hermes.sh` returns 0. The 545 MB node tree on the Mac is a lazy
install, which line 497 of `config.yaml` enables.

**The installer asks for ripgrep by name.** Line 291 reads
`sudo apt install -y ripgrep && INSTALLED=true`.

**The installer writes a shim to `$HOME/.local/bin`.** On the Mac the shim
holds four lines and ends with
`exec "/Users/jokot/.hermes/hermes-agent/venv/bin/hermes" "$@"`.

**Each profile gets its own systemd unit.** `get_service_name()` at line
1797 of `gateway.py` builds the unit name from `HERMES_HOME`. The roster
becomes four units named `hermes-gateway-<profile>`.

**User scope is the default, and it needs linger.** Line 1184 of
`gateway.py` reads
`systemctl_prefix = "systemctl " if system else "systemctl --user "`.
Line 2006 names the fix for a missing user session:
`sudo loginctl enable-linger <user>`.

**The gateway runs the cron scheduler.** Line 4799 of `gateway.py` prints
`Messaging platforms + cron scheduler`. crazydave owns both jobs, which
are `roster-audit` at 09:00 each day and `blocked-watch` every 60 minutes.
Both stop when the gateway of crazydave stops.

**A report crosses machines.** Line 49 of `hermes-report.sh` calls
`hermes -p "$PROFILE" send --to telegram "$MSG"`. Delivery uses the
Telegram API under the bot token of the profile.

**An accidental overlap repairs itself.** `_looks_like_polling_conflict()`
at line 1312 of `adapter.py` matches `Conflict`. The caller at line 2295
logs that the gateway stays alive while the retry runs.

**Four gateways idle at 181 MB of total memory.** The measured values are
50.2, 45.1, 43.7 and 42.1 MB.

**The payload is 109 MB, and 2.0 GB stays.** crazydave carries 10 MB,
peashooter 23 MB, sunflower 52 MB, torchwood 7 MB, and the shared root
files 17 MB.

**49.6 MB of the payload is static.** `profiles/sunflower/skills` holds
43 MB and the root `skills` holds 6.6 MB.

**sunflower has no `projects.db`.** crazydave, peashooter and torchwood
each hold a 44 KB file. `sqlite3` creates an empty database at any path
that it cannot find, so every loop tests with `[ -f ]` first.

**Ten databases cross.** They are `state.db` and `kanban.db` at the root,
`state.db` in four profiles, and `projects.db` in three profiles.

**The counts move while the bots work.** The `tasks` table held 84 rows on
18 September 2026 and 90 rows on 20 September 2026. Verification compares
two measurements, never a measurement against a number in a document.

**torchwood owns no board rows.** `SELECT COUNT(*) FROM tasks WHERE
assignee='torchwood'` returns 0. Two of the 884 rows in `task_events`
name torchwood, and another bot wrote both.

**A path that starts with a tilde is not a path.** Record 0051 section 4
holds the reason, and `roster-audit.sh` checks it. Four soul file lines
keep the full path and change at copy time.

**An edit to a soul file makes running sessions report drift.** Record
0053 holds the evidence. So the order is copy, then rewrite, then start.

---

## File structure

**Created on the Mac and in the repository:**

| Path | Responsibility |
|---|---|
| `hermes-config/scripts/roster-manifest.sh` | The repository mirror of the manifest script. |
| `~/.hermes/profiles/crazydave/scripts/roster-manifest.sh` | The live copy that runs on both machines. |
| `teach/lessons/0036-a-copy-that-proves-itself.html` | Lesson on the manifest and the four gates. |
| `teach/lessons/0037-a-machine-that-keeps-running.html` | Lesson on linger, user scope and swap. |
| `teach/lessons/0038-the-same-commit-on-a-different-machine.html` | Lesson on uv, the lazy node install and the pinned commit. |
| `teach/lessons/0039-the-window.html` | Lesson on the cutover order and the board constraint. |
| `teach/learning-records/0054-stage-6-complete.md` | The closing record for the stage. |

**Modified on the Mac and in the repository:**

| Path | Change |
|---|---|
| `teach/MISSION.md` | Score the server criterion as met. |
| `hermes-config/{crazydave,peashooter,sunflower}/SOUL.md` | No change on the Mac. The rewrite happens on the server only. |

**Created on the server:**

| Path | Responsibility |
|---|---|
| `/home/hermes/.hermes/hermes-agent/` | The clone at commit `3e7c563d`. |
| `/home/hermes/.hermes/profiles/<name>/` | Four profiles, copied from the Mac. |
| `/home/hermes/.local/bin/hermes` | The shim that the installer writes. |
| `/swapfile` | 2 GB of swap, listed in `/etc/fstab`. |
| `~/.config/systemd/user/hermes-gateway-<name>.service` | Four units. |

**Never created and never copied:** `hermes-agent/`, `node/`, `bin/`,
`lsp/`, every cache, every log, every `.lock` file, every `.pid` file,
`gateway_state.json`, `processes.json` and `.curator_state`.

---

### Task 1: A copy that proves itself (Lesson 36)

**Who runs the commands:** Claude. Every command in this task reads the
Mac or writes the repository.

**Files:**
- Create: `hermes-config/scripts/roster-manifest.sh`
- Create: `~/.hermes/profiles/crazydave/scripts/roster-manifest.sh`
- Create: `teach/lessons/0036-a-copy-that-proves-itself.html`

**Interfaces:**
- Produces: `roster-manifest.sh`, which prints one row for each database
  that Stage 6 copies. Every row is `<key> <count> <integrity>`. Keys are
  relative to `HERMES_HOME`, so the output never names a machine. Tasks 4,
  5 and 6 compare two runs of this script.

- [ ] **Step 1: Write the script**

Write this file to `hermes-config/scripts/roster-manifest.sh`:

```bash
#!/usr/bin/env bash
# roster-manifest.sh -- print a count and an integrity result for every
# database that Stage 6 copies. Run on the Mac before the copy, and on the
# server after it. The two outputs must be identical.
#
# Keys are relative to HERMES_HOME, so the output does not name a machine.
set -uo pipefail
H="${HERMES_HOME:-$HOME/.hermes}"

row() {  # row <key> <db> <table>
  if [ -f "$2" ]; then
    printf '%-34s %8s  %s\n' "$1" \
      "$(sqlite3 "$2" "SELECT COUNT(*) FROM $3;" 2>/dev/null || echo ERR)" \
      "$(sqlite3 "$2" 'PRAGMA integrity_check;' 2>/dev/null | head -1)"
  else
    printf '%-34s %8s  %s\n' "$1" absent -
  fi
}

row "kanban/tasks"          "$H/kanban.db" tasks
row "kanban/task_events"    "$H/kanban.db" task_events
row "kanban/task_comments"  "$H/kanban.db" task_comments
row "kanban/task_links"     "$H/kanban.db" task_links
row "kanban/task_runs"      "$H/kanban.db" task_runs
row "root/messages"         "$H/state.db"  messages

for d in "$H"/profiles/*/; do
  p="$(basename "$d")"
  row "$p/messages"  "$d/state.db"    messages
  row "$p/sessions"  "$d/state.db"    sessions
  row "$p/projects"  "$d/projects.db" projects
done
```

- [ ] **Step 2: Run it on the Mac**

Run: `bash hermes-config/scripts/roster-manifest.sh`

Expected: 18 rows. The last column reads `ok` on every row except
`sunflower/projects`, which reads `absent` with a `-`. The counts on
20 September 2026 were `kanban/tasks` 90, `kanban/task_events` 884,
`root/messages` 1059, `crazydave/messages` 721, `peashooter/messages`
1815, `sunflower/messages` 617 and `torchwood/messages` 290. The counts
grow while the bots work, so a higher number is correct and a lower
number is a defect.

- [ ] **Step 3: Prove that the script makes no file**

Run: `ls /Users/jokot/.hermes/profiles/sunflower/projects.db`

Expected: `No such file or directory`. This proves the `[ -f ]` guard.
Without the guard, `sqlite3` creates an empty database, and the copy then
carries a file that does not exist today.

- [ ] **Step 4: Prove that the script is portable**

Run: `HERMES_HOME=/Users/jokot/.hermes bash hermes-config/scripts/roster-manifest.sh | head -3`

Expected: the same first three rows as Step 2. The script reads
`${HERMES_HOME:-$HOME/.hermes}`, which is the idiom at line 402 of
`setup-hermes.sh`. The server runs the same file with no edit.

- [ ] **Step 5: Install the live copy**

```bash
cp hermes-config/scripts/roster-manifest.sh \
   ~/.hermes/profiles/crazydave/scripts/roster-manifest.sh
chmod +x ~/.hermes/profiles/crazydave/scripts/roster-manifest.sh
diff hermes-config/scripts/roster-manifest.sh \
     ~/.hermes/profiles/crazydave/scripts/roster-manifest.sh && echo IDENTICAL
bash -n ~/.hermes/profiles/crazydave/scripts/roster-manifest.sh && echo "SYNTAX OK"
```

Expected: `IDENTICAL` and `SYNTAX OK`.

- [ ] **Step 6: Write Lesson 36**

Write `teach/lessons/0036-a-copy-that-proves-itself.html`. The lesson
links `../assets/style.css`. It teaches one idea: a copy is not finished
when `rsync` exits, and it is finished when two measurements of the same
roster agree.

Cover these points, and cite the command that proves each one:
- The `tasks` table held 84 rows on 18 September and 90 on 20 September.
  So a count in a document is stale, and verification compares two live
  measurements.
- `PRAGMA integrity_check` answers `ok` on all ten databases today. A copy
  that lands corrupt answers something else.
- `sqlite3` creates an empty database at a path that it cannot find.
  sunflower has no `projects.db`, so every loop tests `[ -f ]` first.
- The four gates, named: Gate A compares the manifest across the two
  machines before any bot starts. Gate B asks each bot about its own work.
  Gate C runs the roster audit at the end. Gate D adds four memory peaks
  after one week.
- Gate B is the one that catches a silent failure. A bot with an empty
  `state.db` still answers, and `gateway status` still reads running.

Link to `0035-the-watch-for-a-task-that-stopped.html` as the previous
lesson. End with the standing reminder to ask the teacher a question.

- [ ] **Step 7: Verify the lesson**

```bash
python3 - <<'PY'
import re, pathlib
p = pathlib.Path("teach/lessons/0036-a-copy-that-proves-itself.html")
s = p.read_text()
tags = re.findall(r'</?([a-zA-Z0-9]+)', s)
from collections import Counter
opens = Counter(t for t in re.findall(r'<([a-zA-Z0-9]+)', s))
closes = Counter(t for t in re.findall(r'</([a-zA-Z0-9]+)', s))
void = {'br','hr','img','meta','link','input'}
bad = [t for t in opens if t not in void and opens[t] != closes.get(t,0)]
print("UNBALANCED:", bad if bad else "none")
for m in re.findall(r'href="([^"]+)"', s):
    if m.startswith(('http','#')): continue
    q = (p.parent / m).resolve()
    print(("OK  " if q.exists() else "MISSING "), m)
PY
```

Expected: `UNBALANCED: none`, and every relative link marked `OK`.

- [ ] **Step 8: Commit**

```bash
git add hermes-config/scripts/roster-manifest.sh teach/lessons/0036-a-copy-that-proves-itself.html
git diff --cached | grep -nE '<DM>|TELEGRAM_BOT_TOKEN=|FIZZY_TOKEN=|[0-9]{9,10}:[A-Za-z0-9_-]{35}' | grep -v 'grep -nE'
git commit -m "Add the manifest that proves a copy, and Lesson 36"
```

Expected: the scan prints nothing and exits 1.

---

### Task 2: A machine that keeps running (Lesson 37)

**Who runs the commands:** Jokot runs every command in Steps 2 to 6,
because each one changes the server. Claude writes the lesson in Step 7.

**Files:**
- Create on the server: `/swapfile`, the `hermes` user
- Create: `teach/lessons/0037-a-machine-that-keeps-running.html`

**Interfaces:**
- Produces: a Linux user named `hermes` with linger enabled, 2 GB of swap,
  and the three packages that Task 3 needs. Task 3 runs as that user.

- [ ] **Step 1: Rent the server**

Buy **OVHcloud VPS-1** in the **Singapore** region, with **Ubuntu 24.04
LTS**. The plan costs $4.54 each month. Add **premium backup** at $1.40
each month. The machine gives 2 vCores, 4 GB of RAM and 40 GB of NVMe
storage.

`docs/research/2026-09-18-vps-provider-comparison.md` compares 26 plans
and holds the reason for this choice. Section 1 of the spec holds the
reason for Singapore rather than Jakarta.

Write down the IP address. This plan writes it as `SERVER`.

- [ ] **Step 2: Make the user**

```bash
sudo adduser --disabled-password --gecos "" hermes
sudo loginctl enable-linger hermes
loginctl show-user hermes | grep Linger
```

Expected: `Linger=yes`.

A unit in user scope stops when the user logs out, unless linger is on.
Line 1184 of `gateway.py` shows that user scope is the default, and line
2006 names `sudo loginctl enable-linger` as the fix. Without this step,
all four bots stop when the SSH session closes.

- [ ] **Step 3: Add the swap file**

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

Expected: the `Swap:` row reads `2.0Gi` total.

Four gateways idle at 181 MB, which is 4.5% of 4 GB. The gateway runs the
agent in the same process, and a language server adds 200 MB to 500 MB
while it runs. Four bots that do code work at the same time can use about
2 GB. Linux without swap stops a process instead of making it slow.

- [ ] **Step 4: Install the three packages**

```bash
sudo apt-get update && sudo apt-get install -y git curl ripgrep
rg --version
```

Expected: a version line from ripgrep.

Line 291 of `setup-hermes.sh` asks for ripgrep by name. Install it first,
so the installer does not stop.

- [ ] **Step 5: Prove that the server reaches Telegram**

```bash
curl -s -o /dev/null -w '%{http_code} %{time_total}s\n' https://api.telegram.org
curl -s -o /dev/null -w '%{http_code} %{time_total}s\n' https://api.anthropic.com
```

Expected: an HTTP code and a time for each host. Both endpoints sit
outside Indonesia, and the quality of international transit decides this
purchase. A time of more than 1 second to either host is a reason to stop
and report before Task 3.

- [ ] **Step 6: Report the output**

Report the output of Steps 2 to 5. Claude reads it before Task 3 starts.

- [ ] **Step 7: Write Lesson 37**

Write `teach/lessons/0037-a-machine-that-keeps-running.html`, linking
`../assets/style.css`. The lesson teaches one idea: a background service
on Linux needs a decision about scope, and the default scope has a trap.

Cover these points:
- Hermes writes units in user scope by default. Line 1184 of `gateway.py`
  holds the line that chooses. Line 1813 shows that system scope writes to
  `/etc/systemd/system`, and line 1829 shows that system scope needs root.
- A unit in user scope stops at logout. `loginctl enable-linger` keeps the
  user session alive, and line 2006 of `gateway.py` names that command in
  its own error text.
- `get_service_name()` at line 1797 builds the unit name from
  `HERMES_HOME`, so four profiles become four independent units. One bot
  can restart while three keep answering.
- Swap is not a performance setting here. Linux without swap stops a
  process. The gateway runs the agent in the same process, so memory grows
  while a bot answers.
- The tripwire, and what result changes the plan:
  `systemctl --user show hermes-gateway-crazydave -p MemoryPeak`. Four
  peaks that add to more than 2.5 GB mean a change to VPS-2.

Link back to `0031-a-service-that-outlives-its-agent.html`, which covers
the same subject on the Mac, and forward to
`0036-a-copy-that-proves-itself.html`.

- [ ] **Step 8: Verify the lesson and commit**

Run the balance and link check from Task 1 Step 7, with the path of
Lesson 37. Then:

```bash
git add teach/lessons/0037-a-machine-that-keeps-running.html
git diff --cached | grep -nE '<DM>|TELEGRAM_BOT_TOKEN=|FIZZY_TOKEN=|[0-9]{9,10}:[A-Za-z0-9_-]{35}' | grep -v 'grep -nE'
git commit -m "Rent the server, and add Lesson 37 on linger and swap"
```

---

### Task 3: The same commit on a different machine (Lesson 38)

**Who runs the commands:** Jokot runs Steps 1 to 5. Claude writes the
lesson in Step 6.

**Files:**
- Create on the server: `/home/hermes/.hermes/hermes-agent/`,
  `/home/hermes/.local/bin/hermes`
- Create: `teach/lessons/0038-the-same-commit-on-a-different-machine.html`

**Interfaces:**
- Consumes: the `hermes` user from Task 2.
- Produces: a working Hermes install with zero profiles and no secret.
  `hermes --version` prints the same string as the Mac. Task 4 copies
  files into `/home/hermes/.hermes/`.

- [ ] **Step 1: Clone at the commit that the Mac runs**

```bash
sudo -u hermes -i
git clone https://github.com/NousResearch/hermes-agent.git ~/.hermes/hermes-agent
cd ~/.hermes/hermes-agent
git checkout 3e7c563d
git log -1 --format='%h %ad' --date=short
```

Expected: `3e7c563d 2026-07-17`.

The repository is public, so this clone needs no SSH key and no deploy
key. Upstream `main` has moved to `8a92051f2`, which is about two months
ahead. A fresh clone of `main` would put the server on newer code than the
Mac, and a failed cutover would then have two possible causes instead of
one.

- [ ] **Step 2: Run the installer**

```bash
cd ~/.hermes/hermes-agent && ./setup-hermes.sh
```

Expected: the installer ends without an error.

The installer downloads uv if uv is missing, creates a virtual environment
with Python 3.11, and syncs from the lockfile with `--locked`. Line 36
pins the Python version, so the version that Ubuntu ships has no effect.
The installer never touches node, because `grep -cE 'npm|node|web/'
setup-hermes.sh` returns 0. The server downloads its own Linux build of
node later, when a tool first needs one.

This step takes several minutes and downloads about 1.1 GB.

- [ ] **Step 3: Prove the version matches the Mac**

```bash
~/.local/bin/hermes --version
```

Expected, character for character:
`Hermes Agent v0.18.2 (2026.7.7.2) · upstream 3e7c563d`

A different string means that the checkout in Step 1 did not hold. Stop
and report. Do not continue to Task 4 with a version that differs.

- [ ] **Step 4: Prove that the command resolves**

```bash
which hermes || echo 'NOT ON PATH'
```

If the answer is `NOT ON PATH`, run `exec bash -l` and try again. Ubuntu
adds `~/.local/bin` to `PATH` at login, and only when the directory
already exists. If the command still does not resolve, use
`~/.local/bin/hermes` in every later step of this plan.

- [ ] **Step 5: Prove that the machine holds no profile and no secret**

```bash
ls ~/.hermes/profiles/ 2>/dev/null || echo 'NO PROFILES'
ls ~/.hermes/.env 2>/dev/null || echo 'NO ROOT ENV'
du -sh ~/.hermes
```

Expected: `NO PROFILES`, `NO ROOT ENV`, and a size of about 1.1 GB.

Nothing has moved yet, and nothing can break in Telegram. Report this
output.

- [ ] **Step 6: Write Lesson 38**

Write `teach/lessons/0038-the-same-commit-on-a-different-machine.html`,
linking `../assets/style.css`. The lesson teaches one idea: four questions
about an install answer themselves when somebody reads the installer
instead of guessing.

Cover the four findings, and the command that produced each one:
- Does the server need a key? No. `git ls-remote https://github.com/NousResearch/hermes-agent.git HEAD` answers
  without credentials, so the repository is public over HTTPS.
- Does the distribution need a newer Python? No. Line 36 reads
  `PYTHON_VERSION="3.11"` and uv downloads that version.
- Does the server need node, and 545 MB of it? No. `grep -cE 'npm|node|web/'
  setup-hermes.sh` returns 0. The node tree is a lazy install that line 497
  of `config.yaml` enables.
- Does the roster share one service? No. `get_service_name()` at line 1797
  builds the unit name from `HERMES_HOME`, so four profiles give four
  units.
- Why the install pins `3e7c563d` rather than `main`: a cutover that fails
  on newer code has two possible causes, and this plan keeps one.

Link to `0036-a-copy-that-proves-itself.html`.

- [ ] **Step 7: Verify the lesson and commit**

Run the balance and link check from Task 1 Step 7 with the path of Lesson
38. Then:

```bash
git add teach/lessons/0038-the-same-commit-on-a-different-machine.html
git diff --cached | grep -nE '<DM>|TELEGRAM_BOT_TOKEN=|FIZZY_TOKEN=|[0-9]{9,10}:[A-Za-z0-9_-]{35}' | grep -v 'grep -nE'
git commit -m "Install Hermes on the server, and add Lesson 38"
```

---

### Task 4: The warm pass

**Who runs the commands:** Jokot, because each command writes the server.

**Files:**
- Create on the server: `/home/hermes/.hermes/skills/`,
  `/home/hermes/.hermes/profiles/sunflower/skills/`

**Interfaces:**
- Consumes: the install from Task 3.
- Produces: 49.6 MB of static skills on the server. Task 5 Step 3 copies
  the rest, and rsync then sends only the changes.

No bot stops in this task. All four keep answering Telegram.

- [ ] **Step 1: Copy the static bulk**

```bash
rsync -av -e ssh ~/.hermes/skills hermes@SERVER:~/.hermes/
rsync -av -e ssh ~/.hermes/profiles/sunflower/skills \
  hermes@SERVER:~/.hermes/profiles/sunflower/
```

Skills do not change while a bot answers, so this bulk crosses safely
while the roster runs. This step takes 45% of the payload out of the
window.

Write no slash at the end of `skills`. A slash at the end copies the
contents of the directory and does not copy the directory itself.

- [ ] **Step 2: Prove the sizes on the server**

```bash
du -sh ~/.hermes/skills ~/.hermes/profiles/sunflower/skills
```

Expected: about 6.6 MB for the root and about 43 MB for sunflower.

- [ ] **Step 3: Prove that the roster still answers**

Send any bot a message in Telegram and read the reply. Nothing has stopped
in this task, so a bot that does not answer means a fault that belongs to
the Mac and not to this plan.

- [ ] **Step 4: Report the output**

Report the output of Steps 1 and 2.

---

### Task 5: The window (Lesson 39)

**Who runs the commands:** Jokot runs every command in Steps 1 to 10.
Claude writes the lesson in Step 12.

**This task is one window. The roster does not answer Telegram between
Step 1 and Step 9.** Do not pause for a review inside the window. The
gates below are the checks, and each one names what stops the work.

**Files:**
- Create on the server: four profiles, four systemd units
- Modify on the server: three `SOUL.md` files
- Create: `teach/lessons/0039-the-window.html`

**Interfaces:**
- Consumes: the install from Task 3, the warm pass from Task 4, and
  `roster-manifest.sh` from Task 1.
- Produces: four bots that answer from the server.

- [ ] **Step 1: Copy the manifest script to the server**

```bash
scp ~/.hermes/profiles/crazydave/scripts/roster-manifest.sh hermes@SERVER:~/
```

The script runs on both machines with no edit, which Task 1 Step 4 proved.

- [ ] **Step 2: Stop all four bots**

```bash
for p in crazydave peashooter sunflower torchwood; do
  hermes -p "$p" gateway stop
done
hermes gateway list
```

Expected: all four read stopped.

Stop all four together. `kanban.db` is one shared file with no remote
access. If one board bot runs on the server while another runs on the Mac,
the board splits with no way to merge it. The gateway also runs the cron
scheduler, so no cron job fires after this step.

**The window starts here.**

- [ ] **Step 3: Checkpoint every database**

```bash
for db in ~/.hermes/state.db ~/.hermes/kanban.db \
          ~/.hermes/profiles/*/state.db ~/.hermes/profiles/*/projects.db; do
  [ -f "$db" ] && sqlite3 "$db" 'PRAGMA wal_checkpoint(TRUNCATE);'
done
ls -la ~/.hermes/*.db-wal ~/.hermes/profiles/*/*.db-wal 2>/dev/null || echo 'NO WAL FILES'
```

Expected: each checkpoint prints a row of three numbers, then `NO WAL
FILES` or a set of zero-length `-wal` files.

Every `state.db` has a live `-wal` sidecar. A copy taken while the
write-ahead log is hot drops recent writes without a message. Test each
path with `[ -f ]` first, because sunflower has no `projects.db` and
`sqlite3` creates an empty database at a path that it cannot find.

- [ ] **Step 4: Capture the manifest on the Mac**

```bash
bash ~/.hermes/profiles/crazydave/scripts/roster-manifest.sh > ~/manifest-mac.txt
cat ~/manifest-mac.txt
```

Expected: 18 rows, every integrity result `ok` except the `absent` row.

- [ ] **Step 5: The cold copy**

```bash
EX=(--exclude='bin/' --exclude='lsp/' --exclude='logs/' --exclude='cache/'
    --exclude='models_dev_cache.json' --exclude='cron/output/'
    --exclude='gateway.lock' --exclude='gateway.pid'
    --exclude='gateway_state.json' --exclude='processes.json'
    --exclude='.curator_state')

rsync -av -e ssh ~/.hermes/kanban.db ~/.hermes/kanban ~/.hermes/state.db \
  ~/.hermes/scripts ~/.hermes/memories ~/.hermes/config.yaml \
  ~/.hermes/SOUL.md ~/.hermes/.env ~/.hermes/auth.json \
  hermes@SERVER:~/.hermes/

for p in crazydave peashooter sunflower torchwood; do
  rsync -av -e ssh "${EX[@]}" ~/.hermes/profiles/$p/ \
    hermes@SERVER:~/.hermes/profiles/$p/
done
```

Hold the excludes in an array and expand the array with `"${EX[@]}"`. The
shell of the Mac is zsh, and zsh does not split an unquoted variable into
words. A plain string sends all eleven excludes to rsync as one argument,
rsync ignores every one, and the copy then carries the 2.0 GB of arm64
files that cannot run on Linux.

Write no slash at the end of a directory in the first command. Write a
slash at the end of both sides in the second command.

Use `rsync -a` and never `rsync -r`. The archive flag keeps the mode
`0600` on `.env` and on `auth.json`. Do not use `--delete`, because the
server holds the warm pass from Task 4.

- [ ] **Step 6: Gate A, the copy is faithful**

```bash
# Server
bash ~/roster-manifest.sh > ~/manifest-server.txt

# Mac
scp hermes@SERVER:~/manifest-server.txt ~/
diff ~/manifest-mac.txt ~/manifest-server.txt && echo "GATE A PASS"
```

Expected: `GATE A PASS`.

A difference in a count means that the copy lost rows. A result other than
`ok` means that the copy is corrupt. **If Gate A fails, stop.** No bot has
started, so the rollback is free: start the four gateways on the Mac and
copy nothing back.

Also prove that the two secret files arrived, without reading them:

```bash
# Server
for p in crazydave peashooter sunflower torchwood; do
  for f in .env auth.json; do
    printf '%s/%s %s bytes mode=%s\n' "$p" "$f" \
      "$(stat -c%s ~/.hermes/profiles/$p/$f)" \
      "$(stat -c%a ~/.hermes/profiles/$p/$f)"
  done
done
```

Expected: eight rows, every mode `600`, every size more than 0.

- [ ] **Step 7: Rewrite the four paths**

```bash
# Server
sed -i 's#/Users/jokot/\.hermes/#/home/hermes/.hermes/#g' \
  ~/.hermes/profiles/{crazydave,peashooter,sunflower}/SOUL.md
grep -c '/home/hermes/.hermes/scripts/hermes-report.sh' \
  ~/.hermes/profiles/{crazydave,peashooter,sunflower}/SOUL.md
bash ~/.hermes/profiles/crazydave/scripts/roster-audit.sh && echo "AUDIT SILENT"
```

Expected: `2`, `1`, `1` from the counts, then `AUDIT SILENT`.

crazydave holds two references at lines 24 and 97. peashooter holds one at
line 23. sunflower holds one at line 25. torchwood needs no rewrite,
because its soul file never names the report script.

These four lines keep the full path. A path that starts with a tilde is
not a path yet, so the security scanner cannot open the script and it
stops the command. Record 0051 holds the reason, and record 0053 holds a
relapse.

The audit builds `$REPORT` from the machine that runs it, which line 58
does with `${HERMES_HOME:-$HOME/.hermes}`. So the audit passes on the
server only after a correct rewrite. This step checks itself.

- [ ] **Step 8: Start torchwood, and gate on it**

```bash
# Server
hermes -p torchwood gateway install
hermes -p torchwood gateway start
hermes -p torchwood gateway status
```

Then send torchwood a message in Telegram, and ask it about its own recent
work.

**Gate B for torchwood. Two results must both hold:**
1. The bot replies.
2. The reply shows history. torchwood holds 290 messages.

A bot with an empty `state.db` still replies, and `gateway status` still
reads running. The memory is the test, not the reply.

**If Gate B fails, do not start another bot.** Stop torchwood on the
server, start torchwood on the Mac, and report. torchwood owns 0 of the 90
rows in `tasks`, so a failure here costs nothing and the other three bots
have not moved.

- [ ] **Step 9: Start the other three, one at a time**

Start each bot, then confirm it in Telegram before the next one starts:

1. `hermes -p crazydave gateway install && hermes -p crazydave gateway start`
   — crazydave owns the board and both cron jobs. It holds 721 messages.
2. `hermes -p peashooter gateway install && hermes -p peashooter gateway start`
   — it holds 1815 messages.
3. `hermes -p sunflower gateway install && hermes -p sunflower gateway start`
   — it holds 617 messages.

Apply Gate B to each bot: it replies, and the reply shows history.

One at a time keeps a failure easy to find. **If Gate B fails for any of
these three, all three roll back together.** `kanban.db` is one file, and
a rollback of one board bot while the others stay on the server is the
same split that Step 2 prevents.

**The window closes when sunflower answers.**

- [ ] **Step 10: Gate C, the roster is whole**

```bash
# Server
bash ~/.hermes/profiles/crazydave/scripts/roster-audit.sh && echo "AUDIT SILENT"
bash ~/roster-manifest.sh
hermes gateway list
```

Expected: `AUDIT SILENT`, four units running, and 18 manifest rows.

Compare the manifest against `manifest-mac.txt` by hand. **Do not use
`diff` here.** The bots now answer real messages, so each count must be
equal to the count on the Mac or more than it. A count that is less than
the count on the Mac means lost history, and that is case 2 of the
rollback.

Then wait 60 minutes and confirm that `blocked-watch` fired. crazydave
owns both cron jobs, and the gateway runs the cron scheduler.

- [ ] **Step 11: Report the output**

Report the output of Steps 3, 4, 6, 7 and 10.

- [ ] **Step 12: Write Lesson 39**

Write `teach/lessons/0039-the-window.html`, linking `../assets/style.css`.
The lesson teaches one idea: the order of a cutover is not a preference,
and three facts fix it.

Cover these points:
- **One shared file sets the shape.** `kanban.db` holds 90 rows in `tasks`
  with no remote access. peashooter owns 40, sunflower 23, crazydave 21,
  and 6 have no owner. So the three board bots cannot split across two
  machines, not even for a minute, and not even during a rollback.
- **torchwood owns 0 rows,** so torchwood is the pilot and the gate.
- **Copy, then rewrite, then start.** An edit to a soul file makes every
  running session report `prompt-drift` until its gateway restarts. Record
  0053 holds the evidence, which arrived as three findings that looked
  older than the edit that caused them.
- **Stop before you copy.** A copy taken while the write-ahead log is hot
  drops recent writes without a message. `PRAGMA wal_checkpoint(TRUNCATE)`
  runs after the stop and before the copy.
- **An accidental overlap repairs itself.** Two gateways on one bot token
  give a Telegram 409. Line 1312 of `adapter.py` finds it and line 2295
  logs that the gateway stays alive while the retry runs. So a mistake in
  the order costs a delay and not a crash.
- **The shell decides whether an exclude works.** zsh does not split an
  unquoted variable into words. The same command copies 109 MB in bash and
  2.1 GB in zsh.

Link to `0038-the-same-commit-on-a-different-machine.html`.

- [ ] **Step 13: Verify the lesson and commit**

Run the balance and link check from Task 1 Step 7 with the path of Lesson
39. Then:

```bash
git add teach/lessons/0039-the-window.html
git diff --cached | grep -nE '<DM>|TELEGRAM_BOT_TOKEN=|FIZZY_TOKEN=|[0-9]{9,10}:[A-Za-z0-9_-]{35}' | grep -v 'grep -nE'
git commit -m "Move the roster to the server, and add Lesson 39"
```

---

### Task 6: Gate D, one week later

**Who runs the commands:** Jokot.

**When:** Seven days after Task 5 closes. This task waits, and it does not
block Task 7.

**Interfaces:**
- Consumes: four running units from Task 5.
- Produces: a decision about the size of the plan.

- [ ] **Step 1: Read the four memory peaks**

```bash
for p in crazydave peashooter sunflower torchwood; do
  systemctl --user show hermes-gateway-$p -p MemoryPeak
done
free -h
```

- [ ] **Step 2: Add the peaks, and decide**

Add the four values. The four gateways idled at 181 MB together on the
Mac, which is 4.5% of 4 GB.

- A sum of less than 2.5 GB: the plan stands. Record the number.
- A sum of more than 2.5 GB: change the plan to **VPS-2**, which gives 4
  vCores and 8 GB of RAM. OVHcloud changes the plan in place.

This result changes the size of the machine. **It is not a reason for a
rollback.**

- [ ] **Step 3: Report the numbers**

Report the four peaks and the `free -h` output. Claude records the result
in the closing record of Task 7, or appends it if Task 7 has closed.

---

### Task 7: Close the stage

**Who runs the commands:** Claude. Every command reads the Mac or writes
the repository.

**Files:**
- Create: `teach/learning-records/0054-stage-6-complete.md`
- Modify: `teach/MISSION.md`
- Modify: `hermes-config/` mirrors, if Task 5 changed a tracked file

- [ ] **Step 1: Mirror any file that changed**

The rewrite in Task 5 Step 7 changed three `SOUL.md` files **on the server
only**. The Mac copies keep the full Mac path, and the repository mirror
matches the Mac. Prove that, rather than assume it:

```bash
for p in crazydave peashooter sunflower; do
  diff -q ~/.hermes/profiles/$p/SOUL.md hermes-config/$p/SOUL.md \
    && echo "$p IDENTICAL"
done
grep -c '/Users/jokot/.hermes/scripts/hermes-report.sh' \
  hermes-config/{crazydave,peashooter,sunflower}/SOUL.md
```

Expected: three `IDENTICAL` lines, then `2`, `1`, `1`.

If a file differs, copy the live file into the mirror. Never copy `.env`,
`auth.json`, `channel_directory.json`, `memories/USER.md` or
`memories/MEMORY.md`.

- [ ] **Step 2: Score the mission criterion**

The criterion reads: "Move all four profiles to a server, and prove that
each one answers from there. **Open.**"

Change `**Open.**` to `**Met in Stage 6.**` and add the evidence in one
sentence: the four gates of Section 6, and which bot answered from the
server first.

```bash
python3 - <<'PY'
import pathlib
p = pathlib.Path("teach/MISSION.md")
s = p.read_text()
old = """- Move all four profiles to a server, and prove that each one answers
  from there. **Open.**"""
assert s.count(old) == 1
PY
```

Run that assertion before the replacement. The exact replacement text
depends on the result of Task 5, so write it after Task 5 reports.

- [ ] **Step 3: Write record 0054**

Write `teach/learning-records/0054-stage-6-complete.md` in the format of
`0051-stage-5-complete.md`, with a `**Date:**`, a `**Stage:**` and a
`**Specification:**` line that points at the Stage 6 design.

Record what the stage proved, and what it cost. Include at least:
- The payload was 109 MB and not the 47 MB of the first estimate. The
  difference is `state.db`, which holds the conversation history.
- Four findings from reading `setup-hermes.sh` changed the install before
  anybody ran it: the repository is public, uv provisions Python, node is
  a lazy install, and four profiles give four units.
- The three faults that testing found before the window, and not during
  it: the checkpoint loop created a database that sunflower does not have,
  the rsync excludes failed silently under zsh, and a tilde in a soul file
  would have stopped every report call.
- Whether each gate passed on the first attempt.
- Any defect that the window found, with a fix and its own record.

- [ ] **Step 4: Verify the record links**

```bash
python3 - <<'PY'
import re, pathlib
p = pathlib.Path("teach/learning-records/0054-stage-6-complete.md")
s = p.read_text()
for m in re.findall(r'\]\(([^)]+)\)', s):
    if m.startswith(('http','#')): continue
    q = (p.parent / m).resolve()
    print(("OK  " if q.exists() else "MISSING "), m)
PY
```

Expected: every relative link marked `OK`.

- [ ] **Step 5: Commit**

```bash
git add teach/MISSION.md teach/learning-records/0054-stage-6-complete.md hermes-config/
git diff --cached | grep -nE '<DM>|TELEGRAM_BOT_TOKEN=|FIZZY_TOKEN=|[0-9]{9,10}:[A-Za-z0-9_-]{35}' | grep -v 'grep -nE'
git commit -m "Close Stage 6 with the roster answering from the server"
```

---

## Rollback

The first real message that a bot answers on the server divides the two
cases. Section 6 of the spec holds the full text.

**Case 1, inside the window.** No bot has answered a real message. The
state on the server is a copy, and nothing there is worth keeping.

```bash
# Server
for p in crazydave peashooter sunflower torchwood; do hermes -p "$p" gateway stop; done
# Mac
for p in crazydave peashooter sunflower torchwood; do hermes -p "$p" gateway start; done
```

Copy nothing back. A failure of Gate A is the common reason to be here.

**Case 2, after the window.** The server holds messages and board rows
that the Mac does not have. The server is the authority and the Mac is
stale. A rollback is Task 5 in the other direction: stop the bots on the
server, run the checkpoint loop on the server, copy the databases to the
Mac, and start the bots on the Mac. Gate A runs again with the two files
in the other order.

**The error to avoid** is a start of the Mac gateways without a copy. That
action does not roll back. It creates a second roster that answers from
old history, and it forks the board.

**The rule for the board.** crazydave, peashooter and sunflower roll back
together. torchwood rolls back alone, because it owns 0 of the 90 rows in
`tasks`.

**Nothing on the Mac is deleted in this stage.** Every gateway on the Mac
stays installed, and every file stays in place.

| Failure | Action |
|---|---|
| Task 2 Step 5 shows more than 1 second to either host | Stop. Report before Task 3. |
| Task 3 Step 3 prints a different version | Stop. The checkout did not hold. |
| Gate A fails | Case 1. Copy nothing back. Find the fault and copy again. |
| Gate B fails for torchwood | Stop torchwood on the server. The other three never moved. |
| Gate B fails for a board bot | Case 1 or case 2, for all three board bots together. |
| Gate C finds a count that is too low | Case 2. The server lost rows that the Mac still holds. |
| Gate D sums to more than 2.5 GB | Change the plan to VPS-2. Do not roll back. |
