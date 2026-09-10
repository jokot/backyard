#!/bin/bash
# Launch detached static server (port 8000) and ngrok, record PIDs.
cd /Users/jokot/dev/plants/projects/zuma || exit 1
mkdir -p logs

# Kill any stale listeners first (idempotent)
[ -f logs/web.pid ] && kill "$(cat logs/web.pid)" 2>/dev/null
[ -f logs/ngrok.pid ] && kill "$(cat logs/ngrok.pid)" 2>/dev/null
pkill -f "http.server 8000" 2>/dev/null
pgrep -f "ngrok http 8000" | xargs -r kill 2>/dev/null
sleep 1

nohup python3 -m http.server 8000 > logs/web.log 2>&1 &
echo $! > logs/web.pid

nohup ngrok http 8000 > logs/ngrok.log 2>&1 &
echo $! > logs/ngrok.pid

echo "web_pid=$(cat logs/web.pid) ngrok_pid=$(cat logs/ngrok.pid)"