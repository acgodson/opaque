# 0xVisor

**Policy-Governed Execution for MetaMask Advanced Permissions**

0xVisor is a `policy-aware automation engine` that sits between permission grants and transaction execution, providing runtime evaluation and guardrails for MetaMask Advanced Permissions (ERC-7715). 

Unlike other automation apps that execute blindly once permissions are granted, 0xVisor evaluates every transaction against user-configured policies before execution.


## Problem Statement

MetaMask Advanced Permissions allows users to grant dApps the ability to execute transactions on their behalf. However, once a permission is granted, there's **zero runtime control**. The dApp can execute whenever it wants, at any gas price, for any amount up to the limit—with no guardrails.

**0xVisor solves this by:**
- Evaluating every transaction proposal against user-customized policies
- Blocking execution when conditions aren't met (high gas, outside time windows, security alerts)
- Providing full audit trails and real-time monitoring
- Maintaining non-custodial security through enclave-based signing

## 🏗️ Architecture

### The Three Pillars

| Pillar       | Role                    | Question Answered                   |
| ------------ | ----------------------- | ----------------------------------- |
| **Adapters** | Define automation logic | **WHAT** should we execute?         |
| **Policies** | Define safety rules     | **WHEN** is it safe to execute?     |
| **Signals**  | Provide external data   | **WITH WHAT** context do we decide? |

### System Components

| Component         | Technology       | Key Features                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Frontend**      | Next.js          | Dashboard for managing adapters, policies, and monitoring<br>Permission grant flow with MetaMask integration<br>Real-time activity feed and signal status indicators<br>Policy configuration UI with DSL compiler<br>Interactive API Explorer with Envio integration                                                                                                                 |
| **Backend Agent** | Node             | Session Manager: Creates session accounts, provisions keys to enclave (keys never stored in database)<br>Policy Engine: Evaluates transactions against user policies<br>Adapter Registry: Manages automation adapters (Transfer Bot, SwapBot, DCA Bot)<br>Executor: Orchestrates execution flow with offline enclave signing<br>Signal Fetcher: Aggregates gas, time, and Envio data |
| **Enclave**       | Nitro Enclave    | Secure key storage in memory (private keys never leave enclave)<br>Offline transaction signing with policy validation<br>Policy evaluation with attestation<br>Isolated execution environment                                                                                                                                                                                        |
| **Indexer**       | Envio HyperIndex | Monitors DelegationManager contract events<br>Anomaly detection and security alerts<br>Real-time Telegram notifications<br>GraphQL API for dashboard queries<br>tRPC endpoints for API Explorer integration                                                                                                                                                                          |

### Execution Flow

1. **User installs adapter** → Configures automation (e.g., transfer bot with USDC or ETH)
2. **User grants permission** → ERC-7715 delegation via MetaMask (native token periodic or ERC20 token periodic)
3. **Session account created** → Private key generated and provisioned to enclave (never stored in database)
4. **Adapter triggers** → Proposes transaction (manual, cron, or tool call)
5. **Policy Engine evaluates** → Checks gas, time windows, amounts, security alerts, recipient whitelists
6. **Enclave signs offline** → If policies pass, enclave signs UserOperation with stored private key
7. **Transaction broadcasts** → Via Pimlico bundler to Sepolia
   

## Start-up

> **Live Demo:** [0xvisor-web.vercel.app](https://0xvisor-web.vercel.app) | **Demo Video:** [Watch on YouTube](https://www.youtube.com/watch?v=TKKI5gv9lhs)

### Prerequisites

- Node.js 20+
- pnpm
- Docker (for local Postgres)
- MetaMask snap wallet with Sepolia testnet configured

### Installation

```bash
# Clone repository
git clone https://github.com/acgodson/0xvisor.git
cd 0xvisor

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your keys (see Environment Variables section)
pnpm build

# Start local Postgres
docker-compose up -d

# Run database migrations

cd web
pnpm drizzle-kit push

# Start development servers
pnpm dev:web    # Frontend on http://localhost:3000
```

### Environment Variables

```bash
# RPC & Bundler
RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
BUNDLER_URL=https://api.pimlico.io/v1/sepolia/rpc?apikey=YOUR_KEY

# Database
POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/0xvisor

#  Nitro Enclave
ENCLAVE_URL=http://enclave-proxy:8000

# Envio
ENVIO_GRAPHQL_URL=https://indexer.bigdevenergy.link/YOUR_ID/v1/graphql

```

## Advanced Permissions Usage

0xVisor integrates ERC-7715 for both requesting permissions and redeeming them during execution.

### 1. Requesting Advanced Permissions


![Session Accounts Permissions](slides/Screenshot%202026-01-05%20at%2004.03.33.png)

When a user installs an adapter, they must grant permission for the session account to execute transactions on their behalf. This is done through MetaMask's `requestExecutionPermissions` API.

**Code Location:** [`web/src/hooks/usePermission.ts`](web/src/hooks/usePermission.ts#L77-L98)

```typescript
const permissions = await walletClient.requestExecutionPermissions([
  {
    chainId: sepolia.id,
    expiry,
    isAdjustmentAllowed: true,
    signer: {
      type: "account",
      data: { address: sessionAddress as `0x${string}` },
    },
    permission: {
      type: tokenType === "ETH" ? "native-token-periodic" : "erc20-token-periodic",
      data: {
        ...(tokenType === "ETH" 
          ? { periodAmount: BigInt(request.amount) }
          : { tokenAddress: request.tokenAddress as `0x${string}`, periodAmount: BigInt(request.amount) }
        ),
        periodDuration: request.period,
        justification: `Permission to transfer up to ${request.amount} ${tokenType} every ${
          request.period / 86400
        } day(s)`,
      },
    },
  },
]);
```



**Supported Permission Types:**
- `erc20-token-periodic`: For ERC20 tokens (e.g., USDC) with periodic spending limits
- `native-token-periodic`: For native ETH transfers with periodic spending limits

**Key Features:**
- Uses `erc7715ProviderActions()` extension from `@metamask/delegation-toolkit`
- Creates periodic token transfer permissions with configurable amounts and periods
- Supports both ERC20 tokens and native ETH transfers
- Links permission to session account (the delegate that will execute)
- Stores delegation data in database for later redemption

**Related Files:**
- Permission storage: [`web/src/trpc/routers/permissions.ts`](web/src/trpc/routers/permissions.ts#L14-L120)
- Permission UI: [`web/src/app/dashboard/page.tsx`](web/src/app/dashboard/page.tsx#L59-L98)

### 2. Redeeming Advanced Permissions


![Envio Indexer Dashboard](slides/Screenshot%202026-01-05%20at%2004.01.58.png)

When an adapter proposes a transaction and policies allow execution, 0xVisor redeems the permission by calling `redeemDelegations` on the DelegationManager contract. This is encoded as part of the UserOperation.

**Code Location:** [`packages/agent/src/executor/index.ts`](packages/agent/src/executor/index.ts#L133-L159)

```typescript
const executionEncoded = concat([
  proposedTx.target as `0x${string}`,
  encodePacked(["uint256"], [proposedTx.value || 0n]),
  proposedTx.callData as `0x${string}`,
]);

const redeemCallData = encodeFunctionData({
  abi: [
    {
      name: "redeemDelegations",
      type: "function",
      stateMutability: "payable",
      inputs: [
        { name: "permissionsContexts", type: "bytes[]" },
        { name: "modes", type: "bytes32[]" },
        { name: "executionCallDatas", type: "bytes[]" },
      ],
      outputs: [],
    },
  ],
  functionName: "redeemDelegations",
  args: [
    [permissionDelegationData.context],
    [ExecutionMode.SingleDefault],
    [executionEncoded],
  ],
});
```

**Execution Flow:**
1. Adapter proposes transaction (e.g., Uniswap swap)
2. Policy engine evaluates and approves
3. Executor encodes the proposed transaction
4. Calls `redeemDelegations` with permission context and execution calldata
5. Enclave signs the UserOperation
6. Transaction broadcasts via Pimlico bundler

**Related Files:**
- Full execution flow: [`packages/agent/src/executor/index.ts`](packages/agent/src/executor/index.ts#L58-L400)
- Test implementation: [`packages/agent/src/executor/test.ts`](packages/agent/src/executor/test.ts#L127-L153)

## Envio Usage

![0xVisor Explorer](slides/Screenshot%202026-01-05%20at%2004.00.56.png)


0xVisor uses Envio HyperIndex to monitor on-chain events from the MetaMask DelegationManager contract, enabling real-time anomaly detection, security alerts, and comprehensive activity tracking.

### How We Use Envio

**1. Event Indexing**
- Monitors `RedeemedDelegation`, `EnabledDelegation`, and `DisabledDelegation` events
- Stores events with full context (block number, timestamp, transaction hash, addresses)
- Maintains global and per-user statistics

**2. Anomaly Detection**
- Detects unusual redemption frequency (global >10/hour, per-user >5/hour)
- Creates security alerts that feed into the Security Pause policy
- Triggers automatic execution blocking when thresholds are exceeded

**3. Real-Time Monitoring**
- Sends Telegram alerts for new redemption events
- Provides GraphQL API for dashboard queries
- Tracks delegation lifecycle (enabled, redeemed, disabled)
- **API Explorer Integration**: Query redemption counts, history, and stats via tRPC endpoints

**4. Policy Integration**
- Security Pause policy queries Envio for active alerts
- Blocks execution when anomalies are detected
- Provides context for policy decisions

### Code Locations

**Indexer Configuration:**
- Config file: [`packages/indexer/config.yaml`](packages/indexer/config.yaml)
- Event handlers: [`packages/indexer/src/EventHandlers.ts`](packages/indexer/src/EventHandlers.ts)

**API Integration:**
- Envio router: [`web/src/trpc/routers/envio.ts`](web/src/trpc/routers/envio.ts)
- API Explorer: [`web/src/app/api-explorer/page.tsx`](web/src/app/api-explorer/page.tsx)
- Available endpoints:
  - `envio.getStats` - Global on-chain statistics
  - `envio.getUserRedemptionCount` - Total redemptions for a user
  - `envio.getUserRedemptions` - Detailed redemption history
  - `envio.getRecentRedemptions` - Recent redemptions across all users
  - `envio.getDelegationHistory` - Full delegation lifecycle
  - `envio.getSecurityAlerts` - Security alerts from anomaly detection

**Anomaly Detection:**
```typescript
// packages/indexer/src/EventHandlers.ts#L32-L103
async function checkRedemptionAnomalies(event: any, context: any) {
  // Check global frequency
  const globalStats = await context.Stats.get("global");
  const recentRedemptions = await context.Redemption.findMany({
    where: {
      timestamp: {
        gte: BigInt(Date.now() / 1000 - 3600), // Last hour
      },
    },
  });

  if (recentRedemptions.length > 10) {
    // Create security alert
    await context.SecurityAlert.create({
      alertType: "high_redemption_frequency",
      severity: "high",
      message: "Unusual redemption frequency detected",
      // ...
    });
  }
}
```

**Event Handlers:**
```typescript
// packages/indexer/src/EventHandlers.ts#L105-L142
DelegationManager.RedeemedDelegation.handler(async ({ event, context }: any) => {
  // Store redemption event
  await context.Redemption.create({
    id: `${event.transaction.hash}-${event.logIndex}`,
    rootDelegator: event.params.rootDelegator,
    redeemer: event.params.redeemer,
    delegationHash: event.params.delegationHash,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  });

  // Update global stats
  const stats = await context.Stats.get("global");
  await context.Stats.set({
    id: "global",
    totalRedemptions: (stats?.totalRedemptions || 0n) + 1n,
    // ...
  });

  // Check for anomalies
  await checkRedemptionAnomalies(event, context);

  // Send Telegram alert for new events
  if (event.block.timestamp > INDEXER_START_TIME) {
    await sendTelegramAlert(/* ... */);
  }
});
```

**Signal Integration:**
- Envio signal fetcher: [`packages/agent/src/signals/envio-signal.ts`](packages/agent/src/signals/envio-signal.ts)
- GraphQL queries: [`packages/agent/src/signals/envio-signal.ts`](packages/agent/src/signals/envio-signal.ts#L21-L52)

**Dashboard Integration:**
- Signal status widget: [`web/src/components/SignalStatusWidget.tsx`](web/src/components/SignalStatusWidget.tsx#L73-L113)
- Displays Envio connection status, redemption stats, and active alerts

### GraphQL Queries

The indexer exposes a GraphQL API for querying events and statistics:

```graphql
query EnvioSignalData {
  Redemption(limit: 50, order_by: {timestamp: desc}) {
    id
    rootDelegator
    redeemer
    delegationHash
    blockNumber
    timestamp
    transactionHash
  }
  SecurityAlert(
    where: {isActive: {_eq: true}}
    order_by: {createdAt: desc}
  ) {
    id
    alertType
    severity
    message
    userAddress
    triggerCount
    createdAt
    metadata
  }
  Stats(where: {id: {_eq: "global"}}) {
    totalRedemptions
    totalEnabled
    totalDisabled
    lastUpdated
  }
}
```

## Security Architecture

### Enclave-Based Offline Signing

0xVisor uses AWS Nitro Enclaves to provide secure, isolated signing environments with complete key isolation:

![AWS Nitro Enclave Running on EC2 Instance](slides/Screenshot%202026-01-05%20at%2003.59.24.png)


**Offline Transaction Signing:**
- UserOperations are sent to enclave for signing via HTTP proxy
- Enclave validates policies before signing
- Returns signature with attestation proof

**Code Locations:**
- Enclave client: [`web/src/lib/enclave-client.ts`](web/src/lib/enclave-client.ts#L72-L134)
- Enclave signer: [`packages/enclave/src/signer.ts`](packages/enclave/src/signer.ts#L25-L74)
- Executor integration: [`packages/agent/src/executor/index.ts`](packages/agent/src/executor/index.ts#L248-L284)


### Policy Evaluation

Policies are evaluated in sequence before any transaction execution:

1. **Gas Limit Policy** - Blocks execution when gas prices exceed threshold
2. **Time Window Policy** - Only allows execution during specified hours/days
3. **Max Amount Policy** - Limits transaction size
4. **Security Pause Policy** - Blocks execution when Envio detects anomalies

**Code Location:** [`packages/agent/src/policies/engine.ts`](packages/agent/src/policies/engine.ts)

## Adapter Samples

### Transfer Bot
Automatically transfers tokens (USDC or ETH) on a schedule with configurable limits.

**Key Features:**
- Transfers **0.1 USDC or 0.1 ETH per execution** (fixed amount)
- Configurable **max amount per period** (daily/weekly/monthly)
- Supports both **ERC20 tokens (USDC)** and **native ETH**
- Uses appropriate permission type based on token selection:
  - `erc20-token-periodic` for USDC
  - `native-token-periodic` for ETH

**Configuration:**
- Token type: USDC or ETH
- Recipient address
- Max amount per period (daily/weekly/monthly)
- Period selection

**Code Location:** [`packages/agent/src/adapters/transfer-bot.ts`](packages/agent/src/adapters/transfer-bot.ts)

**Multiple Instances:**
- Users can install multiple transfer bot instances
- Each instance has its own session account and configuration
- Supports different token types, recipients, and limits per instance


## Policy DSL

0xVisor includes a policy DSL compiler that allows users to define policies using a simple JSON structure:

```json
{
  "policies": [
    {
      "type": "gas-limit",
      "enabled": true,
      "config": { "maxGwei": 50 }
    },
    {
      "type": "time-window",
      "enabled": true,
      "config": {
        "startHour": 9,
        "endHour": 17,
        "daysOfWeek": [1, 2, 3, 4, 5],
        "timezone": "UTC"
      }
    }
  ]
}
```

**Code Location:** [`packages/agent/src/policies/dsl/compiler.ts`](packages/agent/src/policies/dsl/compiler.ts)



## 📝 Feedback

Please share your thoughts & adapter idea request:
- **GitHub Issues:** [Open an issue](https://github.com/acgodson/0xvisor/issues) with your feedback


### Known Issues & Future Improvements

- [x] Enclave-based offline signing with keys stored only in enclave memory
- [x] Support for native token periodic permissions (ETH transfers)
- [x] Support for ERC20 token periodic permissions (USDC transfers)
- [x] Multiple adapter instances per user
- [x] Recipient whitelist policy
- [ ] OAuth for API security and authentication
- [ ] Threshold key management implementation (distribute key shares across multiple enclaves/nodes ?)
- [ ] Multi-chain support beyond Sepolia
- [ ] Third-party adapter marketplace

### Hackathon Experience

**What worked well:**
- MetaMask Advanced Permissions API is well-documented and easy to integrate
- Envio HyperIndex provides powerful indexing capabilities with minimal setup- Policy-based execution model resonates with fellow hackers concerned about automation safety


**Suggestions for improvement:**
- More granular permissions (e.g., contract-specific interaction permissions, function-level permissions)
- More examples of permission types and use cases


## Social Media
**Twitter/X:** [@0xVisor](https://x.com/0xvisor) - Tag [@MetaMaskDev](https://x.com/MetaMaskDev)



---

**Built during MetaMask Advanced Permissions Dev Cook-Off • January 2026**
