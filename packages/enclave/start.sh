#!/bin/sh
echo "opaque Enclave Starting..."

ip link set dev lo up

node --max-old-space-size=1536 --stack-size=2048 --trace-warnings /app/dist/index.js &
NODE_PID=$!

python3 /app/vsock-bridge.py &
PYTHON_PID=$!

wait $NODE_PID $PYTHON_PID
