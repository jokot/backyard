# 0038 — A server killed by its own log

**Date:** 2026-09-14
**Stage:** 4, live board, Connect Four
**Status:** Fixed for this server. The pattern remains in the prompts.

## What happened

Peashooter reported the work finished and the site published. Jokot
wrote:

> everyting is done, but no ngrok runing

ngrok was running. It had run for over three days. The tunnel returned
HTTP 503, and the local port returned this:

```
$ curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/
curl: (52) Empty reply from server
```

The port was open. The listener answered nothing. The same failure had
already happened once that day, to a different process.

```
pid 82495  listened on *:8000, stopped answering, killed
pid 11760  started as its replacement, stopped answering hours later
```

## The evidence

The listener was alive and its parent was gone:

```
$ ps -o pid,ppid,state,command -p 11760
  PID  PPID STAT COMMAND
11760     1 S    python3 -m http.server 8000 ...
```

A parent process id of 1 means the agent that started it had exited.

The file descriptors name the cause:

```
$ lsof -a -p 11760 -d 0,1,2
COMMAND   PID  USER  FD  TYPE  SIZE/OFF  NAME
python3 11760 jokot   0r  CHR       0t0  /dev/null
python3 11760 jokot   1w  PIPE    16384  ->0x...
python3 11760 jokot   2w  PIPE    16384  ->0x...
```

Standard input came from `/dev/null`. Standard output and standard error
went to a pipe. That pipe belonged to the agent process, and nothing was
reading it any more.

## Root cause

`python -m http.server` writes one log line to standard error for every
request it serves. The agent started the server as its own child, so the
server inherited the agent's pipe.

A pipe on this machine holds 16,384 bytes. A log line for one request is
roughly 80 bytes, so about 200 requests fill the buffer. The reader died
with the agent, so nothing ever drained it.

The 201st write blocks. The process stops inside `write`, before it ever
returns a response. The socket stays in LISTEN, because the kernel holds
it, and the accept queue keeps taking connections that nobody answers.

This produces the exact symptom Jokot saw. The port is open. `lsof`
shows a healthy listener. ngrok connects, sends the request, receives
nothing, and reports 503. Every layer looks correct except the one that
cannot speak.

## The fix

Detach the server from the agent and send its output to `/dev/null`:

```
nohup python3 -m http.server 8000 --directory /Users/jokot/dev/connect-four \
  >/dev/null 2>&1 &
```

The result, verified:

```
$ lsof -a -p 32523 -d 0,1,2
python3 32523 jokot  0r CHR /dev/null
python3 32523 jokot  1w CHR /dev/null
python3 32523 jokot  2w CHR /dev/null

$ curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/
200
$ curl -sS https://exporter-uninsured-manor.ngrok-free.dev/ | grep -o '<title>.*</title>'
<title>Connect Four</title>
```

All three descriptors point at a character device that never fills. The
server now outlives every agent that touches it.

Keep the log when you want it, and keep it in a file:

```
nohup python3 -m http.server 8000 --directory <dir> \
  >>/tmp/http8000.log 2>&1 &
```

A file has no buffer limit and no reader requirement.

## Generalization

*A process that outlives its parent inherits the parent's pipes.* The
child keeps every descriptor it was given. A pipe with no reader is a
wall that the child walks into later, far from the moment that built it.

*Diagnose a silent process by its descriptors, not by its log.* The logs
were exactly what could not be written. `lsof -a -p <pid> -d 0,1,2` gave
the answer in one line, and `ps -o ppid` confirmed the orphan.

*An open port is not a working service.* LISTEN says the kernel holds
the socket. It says nothing about the process behind it. Test a service
with a request, never with `lsof`.

*A failure with a delay hides its cause.* The server worked for hours,
then stopped at roughly the 200th request. The mistake happened at
start, and the symptom arrived much later. Look at how a process was
started, not only at what it did last.

*Every long-lived service an agent starts needs redirection.* An agent
is a short process by design. Write `>/dev/null 2>&1 &` or a log file
into every prompt that starts a server.

## Related

- Record 0021 — a server that resolved its root once.
- Record 0037 — another failure whose only symptom was silence.
- Record 0035 — a repair that exists and runs nowhere.
