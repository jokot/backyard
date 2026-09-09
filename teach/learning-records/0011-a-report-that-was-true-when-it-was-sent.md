# A report that was true when it was sent

The Tetris run passed every check. Crazy Dave filed one triage task, the
dispatcher split it into four children, and Sunflower and Peashooter each
reported their own result on Telegram, once, in their own voice. That is
the reporting path built in [[0010-a-fix-that-amplified-the-defect]], and
it worked on its first real run.

Peashooter's last message said this:

> Deployed via python3 http.server 8000 + ngrok; public URL
> https://exporter-uninsured-manor.ngrok-free.dev returns HTTP 200 and
> serves index.html. Both services are still running in the background.

Fifteen minutes later the URL returned `ERR_NGROK_3004`, "The server
returned an invalid or incomplete HTTP response."

## What broke

ngrok was healthy. The tunnel pointed at `http://localhost:8000` and the
Python process still held the listening socket. The local request failed
too:

```
$ curl -sv http://127.0.0.1:8000/
* Request completely sent off
* Empty reply from server
curl exit: 52
```

The process had no file descriptor 1 and no file descriptor 2:

```
0u  /dev/null    3r  /dev/urandom    5u  TCP *:8000 (LISTEN)    7u  unix
```

`http.server` calls `log_request()` inside `send_response()`, before it
writes a single response byte. `log_request()` calls `log_message()`,
which writes to `sys.stderr`. With stderr gone, the handler raises and the
connection closes at zero bytes. The client sees an empty reply. ngrok
reports that as `ERR_NGROK_3004`.

Reproduced directly, rather than assumed. The same server with stderr open
to `/dev/null` returns 200. The same server started with `1>&- 2>&-`
returns `http_code=000` and curl exit 52, matching the live process.

## The descriptors existed at startup

Python allocates the lowest free descriptor. `/dev/urandom` holds fd 3 and
the socket holds fd 5. If fd 1 and fd 2 had been closed before the process
started, `/dev/urandom` would have taken fd 1.

So the server started with working output streams, served real requests,
and lost the descriptors later, when the agent session that started it
ended. Peashooter measured HTTP 200 and the measurement was correct. The
claim decayed after the measurement.

## The fix

Start the server with `nohup`, redirect stdout and stderr to a file outside
the repository, and `disown` it. Then check the structure that keeps the
claim true:

```
lsof -p <pid>   # fd 1 and fd 2 must both be open
```

Verified after the repair: fd 1 and fd 2 both point at the log file, the
local request returns 200, and the public URL returns 200 with the
`canvas id="game"` tag present.

## Generalizes

A worker verifies a claim at one instant. Some claims are not about an
instant. "The server is running" is a claim about every moment after the
check, including the moments after the worker exits, which the worker
cannot observe.

A worker cannot test its own afterlife. So it must verify the structure
that keeps the claim true instead of the claim itself. An open file
descriptor is checkable now and predicts later. An HTTP 200 is checkable
now and predicts nothing.

Two layers failed differently in one run. The reporting path delivered
correctly, and one report carried a wrong claim. Record 0010 fixed
delivery. This record is about content. Fixing how a message travels does
not make the message true.
