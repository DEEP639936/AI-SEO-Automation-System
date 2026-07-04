#!/usr/bin/env bash
# Persistent supervisor for the Next.js dev server.
# Respawns the process if the sandbox reaps it.
cd /home/z/my-project

while true; do
  echo "[supervisor] starting next dev at $(date -Is)" >> .next-supervisor.log
  npx next dev -p 3000 >> dev.log 2>&1
  EXIT=$?
  echo "[supervisor] next dev exited with $EXIT at $(date -Is)" >> .next-supervisor.log
  sleep 2
done
