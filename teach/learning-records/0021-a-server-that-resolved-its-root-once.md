# A server that resolved its root once

Moving the exercise directories into `projects/` broke the running Zuma
deployment. One rename did it:

```
mv zuma projects/zuma
```

Every request then returned 404, including the root path.

```
$ curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/
404
```

## The structural check said the process was healthy

[Learning record 0011](0011-a-report-that-was-true-when-it-was-sent.md)
established the check for a claim about a running server. Read the
descriptors, because an open descriptor is checkable now and predicts
later. The check passed:

```
$ lsof -p 61826 -a -d cwd,1,2
Python  61826  cwd  DIR  /Users/jokot/dev/plants/projects/zuma
Python  61826  1w   REG  /Users/jokot/dev/plants/projects/zuma/logs/web.log
Python  61826  2w   REG  /Users/jokot/dev/plants/projects/zuma/logs/web.log
```

The kernel updated the working directory and both log descriptors for
free, because a rename moves an inode and every open reference follows
it. Descriptor 1 and descriptor 2 were open to a real file. The socket
still listened on port 8000. The server served nothing.

## The proof

I recreated the old path, put one file in it, and asked for that file.

```
$ mkdir -p /Users/jokot/dev/plants/zuma
$ printf 'proof-marker\n' > /Users/jokot/dev/plants/zuma/probe.txt
$ curl -s http://127.0.0.1:8000/probe.txt
proof-marker
$ curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/index.html
404
```

The server served a file created 30 seconds earlier at the path it was
started from. It refused the file it was deployed to serve. The document
root was the old path, and the old path was a string.

Python 3.9 confirms it in four lines of `http/server.py`:

```
1274:  parser.add_argument('--directory', '-d', default=os.getcwd(), ...)
1286:  handler_class = partial(SimpleHTTPRequestHandler, directory=args.directory)
 659:  self.directory = os.fspath(directory)
 843:  path = self.directory
```

Line 1274 calls `os.getcwd()` once, while the argument parser is built.
Line 659 stores the answer as a string. Line 843 resolves every request
against that string. The process never reads its working directory again.

## The fix

Restart the server from the new location. The helper script also carried
the old path, so it needed one edit:

```
-cd /Users/jokot/dev/plants/zuma || exit 1
+cd /Users/jokot/dev/plants/projects/zuma || exit 1
```

New process ids are 98168 for the server and 98169 for ngrok. The local
root returns 200, `index.html` returns 200, and `check_public.py` returns
200 from `https://exporter-uninsured-manor.ngrok-free.dev`. The public
address did not change, so the Telegram report and the closed Fizzy card
still name a working URL.

## What generalizes

**A structural check covers only the structure the program actually
uses.** Record 0011 chose descriptor 1 and descriptor 2 because
`http.server` writes a log line before it writes a response byte. That
choice was correct and it is not a general health check. This process
held every descriptor record 0011 names and served 404 to everything,
because its document root is a string it never rereads.

**A running process holds private copies of its startup environment.**
The kernel keeps a working directory current across a rename. It cannot
update a value a program already copied into memory. Ask which values the
program resolved once, and treat each one as a fact frozen at start.

**Prove a binding, do not infer it.** One file at the old path settled
the question in a single request, before I read any source. The source
then explained the result rather than being asked to predict it.

**A move is a deployment event.** The files did not change, the tests
still pass, and the service went down. Any claim of the form "it is
running" must be rechecked after a rename, exactly as it is rechecked
after an edit. See also
[record 0018](0018-a-path-that-stopped-existing.md), which is the same
fact from the other side. A path is a claim about the future, and a
rename is how that claim expires.
