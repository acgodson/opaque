#!/bin/sh
echo "opaque Enclave Starting..."

ip link set dev lo up

node /app/packages/enclave/dist/index.js &
NODE_PID=$!

python3 /app/packages/enclave/vsock-bridge.py &
PYTHON_PID=$!

wait $NODE_PID $PYTHON_PID
