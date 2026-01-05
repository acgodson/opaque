# 0xVisor

**Policy-Governed Execution for MetaMask Advanced Permissions**

0xVisor is a `policy-aware automation engine` that sits between permission grants and transaction execution, providing runtime evaluation and guardrails for MetaMask Advanced Permissions (ERC-7715). 

Unlike other automation apps that execute blindly once permissions are granted, 0xVisor evaluates every transaction against user-configured policies before execution.

[![Demo Video](slides/demo-preview.png)](https://vimeo.com/1151662393)

## Table of Contents

- [0xVisor](#0xvisor)
  - [Table of Contents](#table-of-contents)
  - [Problem Statement](#problem-statement)
  - [🏗️ Architecture](#️-architecture)
    - [The Three Pillars](#the-three-pillars)
    - [Execution Flow](#execution-flow)
  - [Advanced Permissions Usage](#advanced-permissions-usage)
    - [1. Requesting Advanced Permissions](#1-requesting-advanced-permissions)
    - [2. Redeeming Advanced Permissions](#2-redeeming-advanced-permissions)
  - [Envio Usage](#envio-usage)
    - [How We Use Envio](#how-we-use-envio)
    - [Code Locations](#code-locations)
    - [GraphQL Queries](#graphql-queries)
  - [Security Architecture](#security-architecture)
    - [Enclave-Based Offline Signing](#enclave-based-offline-signing)
    - [Policy Evaluation](#policy-evaluation)
  - [Adapter Samples](#adapter-samples)
    - [Transfer Bot](#transfer-bot)
  - [Policy DSL](#policy-dsl)
  - [📝 Feedback](#-feedback)
    - [Known Issues \& Future Improvements](#known-issues--future-improvements)
    - [Hackathon Experience](#hackathon-experience)
  - [Social Media](#social-media)

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

### Execution Flow

1. **User installs adapter** → Configures automation (e.g., transfer bot with USDC or ETH)
2. **User grants permission** → ERC-7715 delegation via MetaMask (native token periodic or ERC20 token periodic)
3. **Session account created** → Private key generated and provisioned to enclave (never stored in database)
4. **Adapter triggers** → Proposes transaction (manual, cron, or tool call)
5. **Policy Engine evaluates** → Checks gas, time windows, amounts, security alerts, recipient whitelists
6. **Enclave signs offline** → If policies pass, enclave signs UserOperation with stored private key
7. **Transaction broadcasts** → Via Pimlico bundler to Sepolia
   
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


0xVisor uses Envio HyperIndex to monitor on-chain events from the MetaMask DelegationManager contract, enabling real-time anomaly detection (redemption spike detection), monitoring dashboards, and comprehensive activity tracking.

### How We Use Envio

**1. Event Indexing**
- Monitors `RedeemedDelegation` events from the MetaMask DelegationManager contract
- Stores redemption events with full context (block number, timestamp, transaction hash, rootDelegator, redeemer)
- Tracks unique root delegators for monitoring dashboard

**2. Anomaly Detection (Redemption Spike Detection)**
- Detects unusual redemption frequency by comparing current vs previous time windows
- Configurable thresholds (default: 2x multiplier) for global and user-specific spikes
- Feeds into the Security Pause policy to block execution when spikes are detected
- Supports both global monitoring and per-user spike detection

**3. Real-Time Monitoring**
- Provides GraphQL API for dashboard queries
- **Monitoring Dashboard**: Displays unique root delegator count
- **Adapter Explorer**: Shows session account redemption activity within time windows
- **API Explorer Integration**: Query redemption counts, history, and spike detection via tRPC endpoints

**4. Policy Integration**
- Security Pause policy: [`packages/agent/src/policies/rules/security-pause.ts`](packages/agent/src/policies/rules/security-pause.ts#L3-L90)
  - Queries Envio signal for anomaly detection (redemption spikes) - [`packages/agent/src/policies/rules/security-pause.ts#L29-L45`](packages/agent/src/policies/rules/security-pause.ts#L29-L45)
  - Blocks execution when spikes exceed configured thresholds - [`packages/agent/src/policies/rules/security-pause.ts#L47-L65`](packages/agent/src/policies/rules/security-pause.ts#L47-L65)
  - Supports global and user-specific spike detection with configurable thresholds
  - Provides context for policy decisions with configurable time windows and multipliers

### Code Locations

**Indexer Configuration:**
- Config file: [`packages/indexer/config.yaml`](packages/indexer/config.yaml)
- Event handlers: [`packages/indexer/src/EventHandlers.ts`](packages/indexer/src/EventHandlers.ts)

**API Integration:**
- Envio router: [`web/src/trpc/routers/envio.ts`](web/src/trpc/routers/envio.ts)
- API Explorer: [`web/src/app/api-explorer/page.tsx`](web/src/app/api-explorer/page.tsx)
  - Lists all available Envio endpoints with examples
- Adapter API Explorer: [`web/src/app/api-explorer/[adapterId]/page.tsx`](web/src/app/api-explorer/[adapterId]/page.tsx#L370-L425)
  - Shows Envio query examples using user account and session addresses
  - Displays real-time redemption stats and session account activity
- Available endpoints:
  - `envio.getRootDelegatorCount` - Count of unique root delegators (for monitoring dashboard) - [`web/src/trpc/routers/envio.ts#L37-L54`](web/src/trpc/routers/envio.ts#L37-L54)
  - `envio.getUserRedemptionCount` - Total redemptions for a user - [`web/src/trpc/routers/envio.ts#L259-L284`](web/src/trpc/routers/envio.ts#L259-L284)
  - `envio.getUserRedemptions` - Detailed redemption history for a user - [`web/src/trpc/routers/envio.ts#L224-L257`](web/src/trpc/routers/envio.ts#L224-L257)
  - `envio.getRecentRedemptions` - Recent redemptions across all users - [`web/src/trpc/routers/envio.ts#L200-L222`](web/src/trpc/routers/envio.ts#L200-L222)
  - `envio.getSessionAccountRedemptions` - Redemptions by session account (redeemer) within time window - [`web/src/trpc/routers/envio.ts#L56-L96`](web/src/trpc/routers/envio.ts#L56-L96)
  - `envio.getRedemptionSpike` - Anomaly detection: detect redemption spikes over time periods (for signal policy) - [`web/src/trpc/routers/envio.ts#L98-L197`](web/src/trpc/routers/envio.ts#L98-L197)

**Anomaly Detection (Redemption Spike Detection):**
```typescript
// web/src/trpc/routers/envio.ts#L98-L197

    const currentCount = currentData.Redemption?.length || 0;
    const previousCount = previousData.Redemption?.length || 0;
    const average = previousCount > 0 ? previousCount : 1;
    
    const spikeDetected = currentCount >= average * input.thresholdMultiplier;
    
```

**Event Handlers:**
```typescript
// packages/indexer/src/EventHandlers.ts#L3-L22
DelegationManager.RedeemedDelegation.handler(async ({ event, context }) => {
  const rootDelegator = event.params.rootDelegator;
  const redeemer = event.params.redeemer;
  
  const transactionHash = (event.transaction as any).hash || event.block.hash;
  const id = `${transactionHash}-${event.logIndex}`;

  const redemptionEntity = {
    id,
    rootDelegator: rootDelegator.toLowerCase(),
    redeemer: redeemer.toLowerCase(),
    delegationHash: undefined, 
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: transactionHash.toLowerCase(),
    logIndex: BigInt(event.logIndex),
  };

  context.Redemption.set(redemptionEntity);
});
```

**Signal Integration:**
- Envio signal fetcher: [`packages/agent/src/signals/envio-signal.ts`](packages/agent/src/signals/envio-signal.ts#L15-L126)
  - Fetches recent redemptions using `order_by: {blockTimestamp: desc}` - [`packages/agent/src/signals/envio-signal.ts#L35-L48`](packages/agent/src/signals/envio-signal.ts#L35-L48)
  - Performs anomaly detection (redemption spike detection) by comparing current vs previous hour - [`packages/agent/src/signals/envio-signal.ts#L52-L90`](packages/agent/src/signals/envio-signal.ts#L52-L90)
  - Compares current hour vs previous hour to detect 2x threshold spikes
  - Provides spike data to Security Pause policy for execution blocking

**Dashboard Integration:**
- Signal status widget: [`web/src/components/SignalStatusWidget.tsx`](web/src/components/SignalStatusWidget.tsx#L73-L154)=
  - Shows root delegator count from `signals.envio.rootDelegatorCount` - [`web/src/components/SignalStatusWidget.tsx#L97-L104`](web/src/components/SignalStatusWidget.tsx#L97-L104)
  - Displays redemption spike detection status - [`web/src/components/SignalStatusWidget.tsx#L107-L129`](web/src/components/SignalStatusWidget.tsx#L107-L129)
- Monitoring dashboard: [`web/src/app/dashboard/page.tsx`](web/src/app/dashboard/page.tsx#L176-L195)
  - Shows root delegator count for system-wide monitoring using `envio.getRootDelegatorCount` - [`web/src/app/dashboard/page.tsx#L179-L190`](web/src/app/dashboard/page.tsx#L179-L190)
- Adapter explorer: [`web/src/app/api-explorer/[adapterId]/page.tsx`](web/src/app/api-explorer/[adapterId]/page.tsx)
  - Displays session account redemption activity within configurable time windows
  - Uses `envio.getUserRedemptionCount` for user stats - [`web/src/app/api-explorer/[adapterId]/page.tsx#L31-L34`](web/src/app/api-explorer/[adapterId]/page.tsx#L31-L34)
  - Uses `envio.getSessionAccountRedemptions` for session account activity - [`web/src/app/api-explorer/[adapterId]/page.tsx#L42-L48`](web/src/app/api-explorer/[adapterId]/page.tsx#L42-L48)
  - Shows Envio query examples using user account and session addresses - [`web/src/app/api-explorer/[adapterId]/page.tsx#L370-L425`](web/src/app/api-explorer/[adapterId]/page.tsx#L370-L425)

### GraphQL Queries

The indexer exposes a GraphQL API for querying redemption events. The schema includes:

```graphql
type Redemption {
  id: ID!
  rootDelegator: String!
  redeemer: String!
  delegationHash: String
  blockNumber: BigInt!
  blockTimestamp: BigInt!
  transactionHash: String!
  logIndex: BigInt!
}
```

**Example Queries:**

```graphql
# Get recent redemptions
query GetRecentRedemptions($limit: Int!) {
  Redemption(
    limit: $limit
    order_by: {blockNumber: desc}
  ) {
    id
    rootDelegator
    redeemer
    blockNumber
    blockTimestamp
    transactionHash
  }
}

# Get redemptions by redeemer (session account) within time window
query GetSessionAccountRedemptions($redeemer: String!, $since: numeric!) {
  Redemption(
    where: {redeemer: {_eq: $redeemer}, blockTimestamp: {_gte: $since}}
    order_by: {blockNumber: desc}
  ) {
    id
    rootDelegator
    redeemer
    blockNumber
    blockTimestamp
    transactionHash
  }
}

# Get redemptions for anomaly detection (spike detection)
query GetRedemptionSpike($since: numeric!, $previousSince: numeric!) {
  current: Redemption(
    where: {blockTimestamp: {_gte: $since}}
  ) {
    id
    blockTimestamp
  }
  previous: Redemption(
    where: {blockTimestamp: {_gte: $previousSince, _lt: $since}}
  ) {
    id
    blockTimestamp
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
4. **Security Pause Policy** - Blocks execution when Envio anomaly detection detects redemption spikes (configurable thresholds and time windows)

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
