#!/usr/bin/env bash
# Start the SEOScout Python ML service (FastAPI + uvicorn) on port 8001.
# Thread-limiting env vars prevent BLAS/numpy from spawning too many
# threads, which previously caused OOM-kills of the worker.
cd "$(dirname "$0")"

export OMP_NUM_THREADS=1
export OPENBLAS_NUM_THREADS=1
export MKL_NUM_THREADS=1
export NUMEXPR_NUM_THREADS=1

exec python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 1
