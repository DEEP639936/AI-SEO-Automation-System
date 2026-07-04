#!/usr/bin/env bash
# Persistent wrapper: respawns the uvicorn worker if it exits.
cd "$(dirname "$0")"

export OMP_NUM_THREADS=1
export OPENBLAS_NUM_THREADS=1
export MKL_NUM_THREADS=1
export NUMEXPR_NUM_THREADS=1

while true; do
  echo "[supervisor] starting uvicorn at $(date -Is)" >> supervisor.log
  python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 1
  EXIT=$?
  echo "[supervisor] uvicorn exited with $EXIT at $(date -Is)" >> supervisor.log
  [ $EXIT -ne 0 ] && sleep 2
done
