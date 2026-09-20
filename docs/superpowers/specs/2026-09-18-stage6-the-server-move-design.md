# Stage 6 — The server move, design

**Status: in progress.** Sections 1 to 5 are approved. Section 6, which
covers verification and rollback, is not designed yet.

**Goal.** Move all four Hermes profiles from the Mac to a rented server.
The profiles are crazydave, peashooter, sunflower and torchwood.

**Scope.** The move only. The Fizzy webhook gets its own later stage.

**Approach.** Install Hermes on Linux from source. Carry only the portable
state. Move the bots in two phases.

**Mission constraint for this stage.** Jokot runs every command that changes
the server. Claude runs commands on the Mac and in the repository.

---

## Section 1 — The server

**2 vCores, 4 GB of RAM, 40 GB of disk, in Singapore.**

The provider is **OVHcloud VPS-1**, at $4.54 each month, plus $1.40 each
month for premium backup. The document
`docs/research/2026-09-18-vps-provider-comparison.md` compares 26 plans and
holds the reason for this choice.

### Why Singapore, and not Jakarta

Every packet that this roster sends goes to `api.telegram.org` or to
`api.anthropic.com`. Both endpoints sit outside Indonesia. The quality of
international transit decides the purchase, and the distance to Jakarta does
not. Singapore carries the better transit for both endpoints.

### The size is measured, not estimated

Measured on 20 September 2026:

| Resource | The roster uses | VPS-1 gives | Use |
|---|---|---|---|
| Memory, idle | 181 MB | 4 GB | 4.5% |
| Disk | about 2.0 GB | 40 GB | 5% |
| Transfer | far less than 16 GB each day | 500 GB each month | small |

Two limits need attention.

The gateway runs the agent in the same process. A language server adds
200 MB to 500 MB of memory while it runs. Four bots that do code work at the
same time can use about 2 GB. Linux without swap stops a process instead of
making it slow, so the server needs a swap file of 2 GB.

Peak memory stays unmeasured until the move is complete. Measure it after one
week of real traffic, and do not estimate it now:

```bash
systemctl --user show hermes-gateway-crazydave -p MemoryPeak
```

If the four peaks together pass 2.5 GB, change the plan to VPS-2, which gives
4 vCores and 8 GB of RAM. OVHcloud changes the plan in place.

### Two corrections to the first draft of this section

The first draft said that Hetzner has no region in Asia. That statement was
wrong. Hetzner has run a Singapore region since August 2024. The real reason
to skip Hetzner is the repricing of 1 April and 15 June 2026.

The first draft also said that Ubuntu 24.04 ships Python 3.12, so the roster
needs no PPA. That statement is true but it does not matter. The installer
pins `PYTHON_VERSION="3.11"` at `setup-hermes.sh:36`, and uv downloads that
version. The Python version of the distribution has no effect.

---

## Section 2 — The payload, and how it crosses

**About 109 MB crosses. About 2.0 GB stays on the Mac.**

| Profile | Total | Stays | Crosses |
|---|---|---|---|
| crazydave | 50 MB | 39 MB | 10 MB |
| peashooter | 170 MB | 146 MB | 23 MB |
| sunflower | 90 MB | 37 MB | 52 MB |
| torchwood | 43 MB | 36 MB | 7 MB |
| shared root files | — | — | 17 MB |
| **total** | | | **about 109 MB** |

**What crosses.** For each profile: `SOUL.md`, `.env`, `auth.json`,
`config.yaml`, `profile.yaml`, `channel_directory.json`, `memories/`,
`scripts/`, `skills/`, `cron/jobs.json`, `sessions/`, `state.db`,
`projects.db` and `plans/`. The shared files are `kanban.db`, `kanban/`, and
the root `config.yaml`, `.env`, `auth.json`, `SOUL.md`, `state.db`,
`memories/`, `skills/` and `scripts/`.

**What stays.** The directories `hermes-agent/`, `node/`, `bin/` and `lsp/`,
every cache, every log, every lock file and every file that holds a process
id. These hold 2.0 GB of arm64 binaries that cannot run on Linux. The server
builds its own.

The measured payload is 109 MB, and an earlier draft of this section said
47 MB. The difference is `state.db`, which holds 9 MB at the root and 10 MB
to 21 MB in each profile. That file holds the `messages` table and the
history of every conversation. A roster that arrives without it forgets
every conversation.

### One correctness step comes before the copy

Every `state.db` has a live `-wal` sidecar and a live `-shm` sidecar. A copy
taken while the write-ahead log is hot drops recent writes without a message.
The draft script `blocked-watch-dedup.sh` already carries this lesson in its
header.

So the gateways stop first. Then each database gets a checkpoint. Only then
does the copy run:

```bash
sqlite3 ~/.hermes/state.db 'PRAGMA wal_checkpoint(TRUNCATE);'
sqlite3 ~/.hermes/kanban.db 'PRAGMA wal_checkpoint(TRUNCATE);'
for p in crazydave peashooter sunflower torchwood; do
  sqlite3 ~/.hermes/profiles/$p/state.db 'PRAGMA wal_checkpoint(TRUNCATE);'
  sqlite3 ~/.hermes/profiles/$p/projects.db 'PRAGMA wal_checkpoint(TRUNCATE);'
done
```

Stopping the gateways first also opens the window that the Telegram cutover
needs. Section 5 gives the reason.

### On secrets, plainly

The payload holds `.env` and `auth.json` for every profile. Each `.env` holds
a live Telegram bot token. The server must hold these files unencrypted to
run at all, and rsync over SSH already encrypts the transfer. An extra layer
of encryption on the payload protects nothing that stays exposed on both
ends.

The real risks are different. A file can land world-readable, it can stay
behind after use, or it can drift into the repository. So the copy uses
`rsync -a`, which keeps the mode `0600` on both files. The copy never writes
into `/Users/jokot/dev/plants`. Claude never reads the contents of either
file, which matches the standing rule.

---

## Section 3 — The install order

Four facts from the installer shape this section.

**The repository is public.** The command
`git ls-remote https://github.com/NousResearch/hermes-agent.git` answers
without credentials. The server needs no SSH key and no deploy key.

**uv provisions Python.** The installer pins 3.11 at `setup-hermes.sh:36`.
The version that the distribution ships has no effect.

**The installer never touches node.** All 462 lines of `setup-hermes.sh` hold
zero matches for `npm` or for `node`. The 545 MB node tree on the Mac is a
lazy install, which `config.yaml:497` enables with `allow_lazy_installs:
true`. The server downloads its own Linux build when a tool needs one.

**Each profile gets its own systemd unit.** The function at
`gateway.py:1797` builds the name of the unit from `HERMES_HOME`. The roster
becomes `hermes-gateway-crazydave`, `hermes-gateway-peashooter`,
`hermes-gateway-sunflower` and `hermes-gateway-torchwood`.

### Step 1 — Make a user that keeps running

Hermes writes units in user scope by default, at `gateway.py:1184` and
`gateway.py:1813`. A unit in user scope stops when the user logs out, unless
linger is on.

```bash
sudo adduser --disabled-password --gecos "" hermes
sudo loginctl enable-linger hermes
```

Add the swap file that Section 1 requires:

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Step 2 — Install three packages

The installer asks for ripgrep by name at `setup-hermes.sh:291`.

```bash
sudo apt-get update && sudo apt-get install -y git curl ripgrep
```

### Step 3 — Clone at the commit that the Mac runs

The Mac runs v0.18.2 at upstream commit `3e7c563d`, dated 17 July 2026.
Upstream `main` has moved to `8a92051f2`, about two months ahead. A fresh
clone puts the server on newer code than the Mac. A failed cutover would then
have two possible causes instead of one.

```bash
sudo -u hermes -i
git clone https://github.com/NousResearch/hermes-agent.git ~/.hermes/hermes-agent
cd ~/.hermes/hermes-agent && git checkout 3e7c563d
```

### Step 4 — Run the installer

The installer syncs from the lockfile with hashes, at `setup-hermes.sh:254`.
The same commit and the same lockfile give the same tree of dependencies that
the Mac has.

```bash
./setup-hermes.sh
```

### Step 5 — Prove it

```bash
~/.local/bin/hermes --version
# expect: Hermes Agent v0.18.2 (2026.7.7.2) · upstream 3e7c563d
```

The server now runs the same Hermes as the Mac, with zero profiles and no
secrets. Nothing has moved, and nothing can break in Telegram.

---

## Section 4 — The hardcoded paths

Every `config.yaml` is clean, at the root and in all four profiles. Every
`cron/jobs.json` is clean. The configuration that drives the bots is already
portable.

Ten lines in the carried payload hold a path of the Mac. They fall in three
groups.

### Group 1 — One script, five places

All five lines named `/Users/jokot/.hermes/scripts/hermes-report.sh`.

| File | Line |
|---|---|
| `profiles/crazydave/SOUL.md` | 24, 97 |
| `profiles/peashooter/SOUL.md` | 23 |
| `profiles/sunflower/SOUL.md` | 25 |
| `profiles/crazydave/scripts/roster-audit.sh` | 58 |

**The script is fixed and committed.** Line 58 now reads
`REPORT="${HERMES_HOME:-$HOME/.hermes}/scripts/hermes-report.sh"`, which is
the idiom that the upstream installer uses at `setup-hermes.sh:402`. The
audit now runs on any machine.

**The four SOUL.md lines must keep the full path.** A first attempt changed
them to start with a tilde. Record 0051 forbids this, and the audit states
the reason in its own comments. A path that starts with a tilde is not a path
yet, so the security scanner cannot open the script and it stops the command.
The attempt produced 7 findings in the audit, and a revert cleared them.

So these four lines change at copy time, on the server:

```bash
sed -i 's#/Users/jokot/\.hermes/#/home/hermes/.hermes/#g' \
  ~/.hermes/profiles/{crazydave,peashooter,sunflower}/SOUL.md
```

The rewrite checks itself. The audit builds `$REPORT` from the machine that
runs it, so the audit passes on the server only after a correct rewrite:

```bash
bash ~/.hermes/profiles/crazydave/scripts/roster-audit.sh   # silence is a pass
```

### Group 2 — Three lines that name this repository

The files `torchwood/memories/MEMORY.md` and `sunflower/memories/USER.md`
named `/Users/jokot/dev/plants`. The plants repository stays on the Mac, so
these three lines now say that the repository sits on the Mac and that the
server cannot reach it. These lines are prose and not commands, so the rule
about the security scanner does not apply. This edit is complete.

### Group 3 — Fourteen files that must not cross

None of these need a fix. Hermes builds all of them again on the first start.

| File | Reason |
|---|---|
| `gateway.lock`, `gateway.pid`, `gateway_state.json`, four of each | live state of a process |
| `peashooter/processes.json` | stale, because pid 11760 is dead and its workspace is gone |
| `skills/.curator_state`, four of them | names a directory of logs |
| `cron/output/`, `logs/` | history, and the source of all 426 other matches |

A file from this group tells a new gateway on Linux that it already runs.

---

## Section 5 — The cutover sequence

### The constraint that shapes this section

`kanban.db` is one shared file that holds 84 rows in the `tasks` table.
peashooter owns 40, sunflower owns 23, crazydave owns 21, and 6 have no
owner. The file is local SQLite with no remote access.

So crazydave on the server and peashooter on the Mac write to two different
copies, and the board splits with no way to merge it. **The three bots that
write to the board cannot run on two machines at once.**

torchwood owns 0 rows. This makes torchwood the pilot.

### Two facts that make the move safe

**A report crosses machines.** The line `hermes-report.sh:49` calls
`hermes -p "$PROFILE" send --to telegram`. The report goes out through the
Telegram API under the bot token of the profile, and not through a local
channel. A bot on the server reports correctly while the others stay on the
Mac.

**An accidental overlap repairs itself.** Two gateways on one bot token
produce a Telegram 409. Hermes finds this at `adapter.py:1312`, and the log
line at `adapter.py:2295` states the result: the gateway stays alive while
the retry for the conflict runs. The second gateway does not stop. It retries
and it takes over when the first one stops. Every step below reverses when
one side stops.

### Phase 1 — torchwood, the pilot

torchwood carries 7 MB, owns 0 rows on the board, runs no cron job, and its
SOUL.md never names the report script. So torchwood needs no rewrite of a
path.

```bash
# 1. Mac: stop it, which releases the Telegram token
hermes -p torchwood gateway stop

# 2. Mac: checkpoint the databases of this profile (Section 2)
sqlite3 ~/.hermes/profiles/torchwood/state.db 'PRAGMA wal_checkpoint(TRUNCATE);'
sqlite3 ~/.hermes/profiles/torchwood/projects.db 'PRAGMA wal_checkpoint(TRUNCATE);'

# 3. Mac to server: copy the payload
rsync -av -e ssh \
  --exclude='bin/' --exclude='lsp/' --exclude='logs/' --exclude='cache/' \
  --exclude='models_dev_cache.json' --exclude='cron/output/' \
  --exclude='gateway.lock' --exclude='gateway.pid' --exclude='gateway_state.json' \
  --exclude='processes.json' --exclude='.curator_state' \
  ~/.hermes/profiles/torchwood/ hermes@SERVER:~/.hermes/profiles/torchwood/

# 4. Server: install the unit and start it
hermes -p torchwood gateway install
hermes -p torchwood gateway start

# 5. Server: prove that it is alive
hermes -p torchwood gateway status
```

The subcommands `install`, `start`, `stop` and `status` are all in
`hermes gateway --help` on the Mac today.

Then send torchwood a message in Telegram and confirm the reply.

Use `rsync -a` and never `rsync -r`. The archive flag keeps the mode `0600`
on `.env` and on `auth.json`.

Run torchwood alone for one day. This proves the install, the systemd unit,
the path to Telegram and the quality of the transit, before anything that
owns a task board moves.

### Phase 2 — The three bots of the board, in one window

Stop all three together, so that the board cannot split. Then start them one
at a time, so that a failure stays easy to find.

```bash
# Mac: stop all three
hermes -p crazydave gateway stop && hermes -p peashooter gateway stop \
  && hermes -p sunflower gateway stop

# Mac: checkpoint every database (Section 2 gives the full loop)

# Mac to server: the shared files, then each profile with the excludes above
rsync -av -e ssh ~/.hermes/kanban.db ~/.hermes/kanban ~/.hermes/state.db \
  ~/.hermes/skills ~/.hermes/scripts ~/.hermes/memories \
  ~/.hermes/config.yaml ~/.hermes/SOUL.md ~/.hermes/.env ~/.hermes/auth.json \
  hermes@SERVER:~/.hermes/
```

Write no slash at the end of a directory in this command. A slash at the end
of `kanban/` copies the contents of `kanban` into `~/.hermes/` and it does
not copy the directory. The copy of one profile in Phase 1 is different,
because a slash at the end of both sides is correct there.

On the server, run the rewrite from Section 4 and its check. Then start the
bots in this order, and confirm each one in Telegram before the next one:
**crazydave**, because it owns the board and the cron jobs, then
**peashooter**, then **sunflower**.

### One effect to expect

An edit to a SOUL.md file makes every running session report `prompt-drift`
until its gateway restarts. The effect is harmless, and it fixes the order of
the steps. Copy first, rewrite second, start the gateway third. Never rewrite
a SOUL.md file under a running bot.

### What stays on the Mac

Every gateway stays installed and stopped. This is the path for a rollback.

---

## Section 6 — Verification and rollback

Not designed yet.
