# @tinybirdpro/plugin-opaque

ElizaOS plugin for Opaque - Zero-knowledge proof generation in AWS Nitro Enclave for privacy-preserving blockchain transactions.

## Features

-  **Privacy-Preserving**: Generate ZK proofs inside from Enclave Endpoints
-  **Policy Enforcement**: Enforce spending limits, time windows, and whitelists
-  **Blockchain Integration**: Execute transactions on Mantle with verified proofs
-  **Secure**: Proofs generated in hardware-isolated environment
-  **Easy Integration**: Simple ElizaOS plugin interface

## Installation

```bash
npm install @tinybirdpro/plugin-opaque
# or
bun add @tinybirdpro/plugin-opaque
```

## Configuration

Add these environment variables to your `.env` file:

```env

# Agent Wallet Configuration
AGENT_PRIVATE_KEY=0x...

# User Configuration
OPAQUE_USER_ADDRESS=0x...
OPAQUE_INSTALLATION_ID=1

# Contract Addresses (Mantle Sepolia)
OPAQUE_VERIFIER_ADDRESS=0x...
OPAQUE_TOKEN_ADDRESS=0x...

# Enclave URL
OPAQUE_ENCLAVE_URL=http://{INSTANCE-IP}:8001
```

## Usage

### In your ElizaOS character file:

```json
{
  "name": "YourAgent",
  "plugins": ["@tinybirdpro/plugin-opaque"],
  "settings": {
    "secrets": {}
  }
}
```

### Example Interaction:

```
User: Send 50 USDC to 0x1234...5678

Agent: I'll execute this transaction with privacy protection using Opaque.
       [Generates ZK proof in enclave]
       [Verifies on-chain]
       ✅ Transaction executed: 0xabcd...
```

## How It Works

1. **Policy Storage**: User policies are stored in a remote Enclave
2. **Proof Generation**: When executing a transaction, the agent:
   - Sends transaction data to the enclave via proxy url
   - Enclave validates against stored policies
   - Generates a ZK proof if policies are satisfied
3. **On-Chain Verification**: Proof is verified on-chain before execution
4. **Transaction Execution**: If proof is valid, transaction executes

## Architecture

```
ElizaOS Agent
    ↓
Plugin Opaque
    ↓
AWS Nitro Enclave (Port 8001)
    ├── Policy Storage
    ├── Noir Circuit
    ├── Barretenberg (ZK Proof)
    └── Offline CRS Cache
    ↓
Mantle Blockchain
    ├── Verifier Contract
    └── Vault Contract
```

## API

### Actions

#### `EXECUTE_OPAQUE_TRANSACTION`

Execute a transaction with ZK proof generation.

**Parameters:**
- `recipient`: Address to send tokens to
- `amount`: Amount to send (in token units)

**Example:**
```typescript
{
  "action": "EXECUTE_OPAQUE_TRANSACTION",
  "recipient": "0x1234567890123456789012345678901234567890",
  "amount": "50000000000000000000"
}
```

## Policy Configuration

Policies are configured per user and installation:

```typescript
{
  "maxAmount": {
    "enabled": true,
    "limit": "100000000000000000000" // 100 tokens
  },
  "timeWindow": {
    "enabled": true,
    "startHour": 9,
    "endHour": 17
  },
  "whitelist": {
    "enabled": true,
    "root": "0x...",
    "path": ["0x...", "0x..."],
    "index": 0
  }
}
```

## Enclave Attestation

The enclave provides cryptographic proof that proofs are generated in a genuine AWS Nitro Enclave:

**PCR0**: `c498ee76151fbd1cf0a5824cb958a2b6dfd4757eeebc0997abefa62ad095693bf5714aa6b8122836f67bc43b27c792ba`

Anyone can verify by rebuilding the enclave and comparing PCR measurements.

## Development

```bash
# Install dependencies
bun install

# Build plugin
bun run build

# Run tests
bun test
```

## Links

- [GitHub Repository](https://github.com/acgodson/opaque)
- [Enclave Documentation](https://github.com/acgodson/opaque/blob/main/ATTESTATION.md)
- [ElizaOS Documentation](https://docs.elizaos.ai)

## License

MIT

## Support

For issues and questions:
- GitHub Issues: https://github.com/acgodson/opaque/issues
- Enclave Endpoint: http://{instance-pubic-ip}:8001
