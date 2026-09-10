import urllib.request, ssl, sys

url = "https://exporter-uninsured-manor.ngrok-free.dev/index.html"
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE  # ngrok-free edge cert is self-signed

try:
    req = urllib.request.Request(url, headers={"User-Agent": "curl/8"})
    with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
        body = r.read(200).decode("utf-8", "replace")
        print("PUBLIC_URL_STATUS", r.status)
        print("content_type:", r.headers.get("Content-Type"))
        print("first_bytes_ok:", body.strip().startswith("<!DOCTYPE html>"))
        sys.exit(0 if r.status == 200 else 1)
except Exception as e:
    print("PUBLIC_URL_STATUS ERROR:", type(e).__name__, e)
    sys.exit(1)