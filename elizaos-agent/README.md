# AllowanceBot - Demo

This is an ElizaOS agent that demonstrates the "Blind Web3 Agent" architecture using the Opaque plugin.

## Key Concept: Agent is BLIND to Policies

The agent **does not know** your spending limits or policy rules. This is a **security feature**:


## Setup Instructions

### 1. Install Dependencies

First, make sure you have ElizaOS CLI installed:

```bash
npm install -g @elizaos/cli
```

### 2. Build the Plugin

From the plugin directory:

```bash
cd ../plugin-opaque
npm run build
```

### 3. Configure Environment

Edit `.env` in this directory:

```bash
# Required: Agent's private key (the wallet that signs transactions)
AGENT_PRIVATE_KEY=0x...

# Required: User address this agent serves
OPAQUE_USER_ADDRESS=0xf2750684eB187fF9f82e2F980f6233707eF5768C

# Required: Installation ID from dashboard
OPAQUE_INSTALLATION_ID=1

# Contract addresses (already configured for Mantle Sepolia)
OPAQUE_VERIFIER_ADDRESS=0x07D60F1Cf13b4b1E32AA4eB97352CC1037286361
OPAQUE_TOKEN_ADDRESS=0xb9e8f815ADC8418DD28f35A7D147c98f725fa538

# Enclave URL (already configured)
OPAQUE_ENCLAVE_URL=http://35.159.224.254:8001
```

### 4. Fund the Agent Wallet

The agent needs gas (MNT) to submit transactions:

```bash
# Send ~0.1 MNT to the agent's address for gas
# You can get the agent's address from the private key
```

### 5. Run the Agent

```bash
# Development mode (with hot reload)
elizaos dev --character character.json

# Production mode
elizaos start --character character.json
```

## Usage Examples

Once the agent is running, you can chat with it:

```
You: Send 10 tokens to Alice at 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Bot: Let me process that transfer for you. Requesting proof from the vault...
Bot: ✅ Transaction successful! Hash: 0x...

You: Transfer 1000 tokens to Bob
Bot: Let me try that...
Bot: ❌ Transaction blocked: Policy violation - exceeds daily limit

You: What are my spending limits?
Bot: I actually don't know your limits - that's by design! The vault enforces 
     policies cryptographically. You can check your policy settings in the dashboard.
```


## Security Model

**What the agent knows:**
- ✅ User address it serves
- ✅ Installation ID (which vault to use)
- ✅ Enclave URL (where to get proofs)

**What the agent does NOT know:**
- ❌ Policy rules (max amounts, allowed addresses, etc.)
- ❌ Vault balance
- ❌ Transaction history

**Why this matters:**
- If agent is hacked → Attacker still can't bypass policies
- Policies are enforced cryptographically, not by agent logic
- Agent is just a "dumb executor" - vault is the smart enforcer

- Enclave: http://35.159.224.254:8001
- Verifier: https://sepolia.mantlescan.xyz/address/0x07D60F1Cf13b4b1E32AA4eB97352CC1037286361
- Token: https://sepolia.mantlescan.xyz/address/0xb9e8f815ADC8418DD28f35A7D147c98f725fa538
