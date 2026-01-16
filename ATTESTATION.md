# Opaque Enclave Attestation

## Overview

Opaque generates ZK proofs inside an AWS Nitro Enclave to ensure:
- **Isolation**: Code runs in a hardware-isolated environment
- **Integrity**: No one (including AWS) can tamper with the code
- **Verifiability**: Anyone can cryptographically verify the enclave is genuine

## Current PCR Measurements

These measurements prove the exact code running in the enclave:

```
PCR0: c498ee76151fbd1cf0a5824cb958a2b6dfd4757eeebc0997abefa62ad095693bf5714aa6b8122836f67bc43b27c792ba
PCR1: 0343b056cd8485ca7890ddd833476d78460aed2aa161548e4e26bedf321726696257d623e8805f3f605946b3d8b0c6aa
PCR2: 4ff991f94f071e471702fd59ad893f8bfea0e222c489b27f150f5cf6e63c56ed76dbda7ecdd2077e1ef4f8a947a3bea3
```

### What Each PCR Means

- **PCR0**: Hash of the enclave image file (EIF)
  - Proves the exact Docker image and all code running
  - Changes if ANY file in the image changes
  - Verifiable by rebuilding the EIF from our public Docker image

- **PCR1**: Hash of the Linux kernel and bootstrap
  - Proves the enclave kernel version
  - AWS-controlled, ensures genuine Nitro Enclave

- **PCR2**: Hash of the application configuration
  - Proves the enclave configuration (IAM role, debug mode, etc)
  - Includes whether debug mode is enabled

## How to Verify

### Method 1: Reproduce the Build (Strongest Proof)

Anyone can verify our enclave by reproducing the exact build:

```bash
# 1. Pull our public Docker image
docker pull ghcr.io/acgodson/opaque/opaque-enclave:latest

# 2. Build the Nitro Enclave EIF
nitro-cli build-enclave \
  --docker-uri ghcr.io/acgodson/opaque/opaque-enclave:latest \
  --output-file opaque-verify.eif

# 3. Get the measurements
nitro-cli describe-eif --eif-path opaque-verify.eif

# 4. Compare PCR0 with our published PCR0
# If they match → proves we're running the exact same code
```

### Method 2: Runtime Attestation (Coming Soon)

We're implementing a `/attestation` endpoint that will return:

```json
{
  "document": "<base64-encoded-attestation-document>",
  "pcr0": "c498ee76...",
  "pcr1": "0343b056...",
  "pcr2": "4ff991f9...",
  "timestamp": "2026-01-16T14:00:00Z"
}
```

The attestation document:
- Is signed by AWS Nitro hardware
- Contains the PCR measurements
- Proves the code is running in a genuine Nitro Enclave
- Can be verified using AWS public keys

## What This Proves

✅ **Code Integrity**: The exact code running is publicly verifiable via PCR0

✅ **Hardware Isolation**: AWS Nitro signature proves genuine hardware enclave

✅ **No Tampering**: PCRs would change if anyone modified the code

✅ **Offline Proof Generation**: CRS cache is bundled (2.1MB), no external network calls

✅ **Reproducible**: Anyone can rebuild the EIF and verify PCR0 matches

## Docker Image

Our enclave image is publicly available:
- **Registry**: `ghcr.io/acgodson/opaque/opaque-enclave:latest`
- **Source**: https://github.com/acgodson/opaque
- **Dockerfile**: `packages/enclave/Dockerfile.enclave`

## Enclave Configuration

- **Memory**: 1560 MB
- **CPUs**: 2 cores
- **Network**: None (isolated, vsock only)
- **CRS Cache**: Bundled (2.1 MB)
- **Debug Mode**: Currently enabled (will be disabled for production)

## Security Considerations

### Current State (Development)
- ✅ Running in Nitro Enclave
- ✅ Offline proof generation
- ✅ PCR measurements available
- ⚠️ Debug mode enabled (allows console access)

### Production Recommendations
- Disable debug mode (rebuild without `--debug-mode`)
- Implement runtime attestation endpoint
- Publish PCR0 for public verification
- Use signed EIF images

## Verification Tools

### Check Enclave Status
```bash
curl -X POST http://35.159.224.254:8001 \
  -H "Content-Type: application/json" \
  -d '{"type":"HEALTH_CHECK"}'
```

### Test Proof Generation
```bash
# See scripts/test-curl-api.sh for full example
./scripts/test-curl-api.sh
```

### Get PCR Measurements
```bash
./scripts/get-attestation.sh
```

## References

- [AWS Nitro Enclaves Documentation](https://docs.aws.amazon.com/enclaves/)
- [Nitro Enclave Attestation](https://docs.aws.amazon.com/enclaves/latest/user/verify-root.html)
- [PCR Measurements](https://docs.aws.amazon.com/enclaves/latest/user/set-up-attestation.html)

## Next Steps

