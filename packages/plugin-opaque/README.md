# Opaque Plugin for ElizaOS

ZK policy-based transaction execution plugin that enables ElizaOS agents to execute blockchain transactions with cryptographic policy enforcement.

## Features

- 🔐 **Zero-Knowledge Proofs**: Policy compliance verified without revealing transaction details
- 🤖 **AI Agent Integration**: Natural language → secure blockchain execution
- 📋 **Flexible Policies**: Max amounts, time windows, recipient whitelists
- 🔒 **Replay Protection**: Nullifier system prevents double-spending
- ⚡ **Fast**: ~3-4 second proof generation

## Installation

```bash
bun add @opaque/plugin-elizaos
```

Or use locally:
```bash
elizaos add ./plugin-opaque
```

## Configuration

Create a `.env` file or set environment variables:

```bash
# User Configuration
OPAQUE_USER_ADDRESS=0x...              # User's Ethereum address
OPAQUE_INSTALLATION_ID=1               # Installation ID from dashboard

# Opaque Configuration
OPAQUE_VERIFIER_ADDRESS=0x...          # OpaqueVerifier contract address
OPAQUE_ENCLAVE_URL=http://35.159.224.254:8001  # Enclave endpoint
```

## Usage
                                                                                                                    
### 1. Add Plugin to Agent

```typescript
import { opaquePlugin } from '@opaque/plugin-elizaos';

const agent = {
  name: "OpaqueAgent",
  plugins: [opaquePlugin],
  // ... other config
};
```

### 2. Configure Policies

Visit the Opaque Dashboard to configure policies:
- Maximum transaction amounts
- Allowed time windows
- Recipient whitelists

### 3. Execute Transactions

Chat with your agent:
```
User: Send 0.1 MNT to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Agent: I'll execute that transfer via Opaque. Generating ZK proof...
Agent: Transaction executed successfully! Tx Hash: 0x...
```

## How It Works

1. **User configures policies** in the Web Dashboard
2. **Agent parses intent** from natural language
3. **Enclave generates ZK proof** verifying policy compliance
4. **Agent signs transaction** with its Privy wallet
5. **OpaqueVerifier contract** verifies proof and executes on-chain

## Actions

### EXECUTE_WITH_PROOF

Executes a blockchain transaction through the Opaque ZK policy system.

**Triggers**: 
- "Send X tokens to ADDRESS"
- "Transfer X to ADDRESS"
- "Pay ADDRESS X amount"

**Example**:
```typescript
{
  name: "EXECUTE_WITH_PROOF",
  description: "Execute blockchain transaction with ZK policy verification",
  validate: async (runtime, message) => {
    // Checks for required configuration
  },
  handler: async (runtime, message, state, options, callback) => {
    // 1. Parse transaction details
    // 2. Request ZK proof from enclave
    // 3. Sign transaction
    // 4. Submit to OpaqueVerifier
  }
}
```

## Development

```bash
# Install dependencies
bun install

# Build plugin
bun run build

# Run tests
bun test

# Development mode
elizaos dev
```

## Architecture

```
User Message → ElizaOS Agent → Enclave (ZK Proof) → Agent Signs → OpaqueVerifier → Execution
```

## Security

- **Enclave Isolation**: Proof generation in secure Docker environment
- **Private Keys**: Agent wallet keys never exposed to enclave
- **Policy Enforcement**: Cryptographically enforced on-chain
- **Replay Protection**: Nullifiers prevent transaction replay

## Links

- [Documentation](https://github.com/acgodson/opaque)
- [Web Dashboard](https://opaque-web-nine.vercel.app)
- [Smart Contracts](https://github.com/acgodson/opaque/tree/main/mantle_hardhat)

                                                                                                                                                    
