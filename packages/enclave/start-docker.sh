#!/bin/sh
echo "Opaque Enclave Starting (Docker Mode)..."

# Only start Node.js (no vsock-bridge in Docker)
exec node --max-old-space-size=1536 --stack-size=2048 --trace-warnings /app/dist/index.js
