#!/usr/bin/env bash
# Check if the Next.js dev server is running on port 3000.
# If not, start it. Designed to be called by cron every 2 minutes.
cd /home/z/my-project

if curl -s -o /dev/null -m 3 http://127.0.0.1:3000/ 2>/dev/null; then
  # Server is alive — do nothing.
  exit 0
fi

# Server is dead — restart it.
echo "[keepalive] restarting dev server at $(date -Is)" >> /home/z/my-project/.keepalive.log
pkill -f "next dev" 2>/dev/null
sleep 1
cd /home/z/my-project
nohup npx next dev -p 3000 >> dev.log 2>&1 &
echo "[keepalive] started PID $!" >> /home/z/my-project/.keepalive.log
