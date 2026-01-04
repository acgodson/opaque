I want prepare groundbreaking ,impactful submissions and pitch video for 0xvisor.

With over $610 million drained across multiple chains, the 2021 Poly Network hack is a clear example of the damage that can occur when strong policy controls are not in place to protect critical assets.

During the exploit, hackers took advantage of the network’s cross chain bridge contracts, forging contract validated messages that redirected assets to their own addresses. The underlying contracts accepted these messages without confirming that they came from an approved source, which allowed the attacker to impersonate privileged system components.

Today, most wallet infrastructure still relies on implicit trust and user vigilance. Turnkey’s approach has always been to work to strengthen these weak links, providing verifiability over trust and policy over user actions. 

Well-designed policies at the signing layer can enforce strict rules on who can authorize transfers, which contracts can be called, and how much value can move in a single request. 

Turnkey’s policy engine gives teams a deterministic, enforceable layer that governs how keys behave before any signature is produced. This article explains how to use Turnkey’s policyengine to keep critical assets safe and reduce exposure to threats and vulnerabilities.

What is a WaaS policy engine?
Policy engines enforce and maintain rules that determine whether a wallet is allowed to perform a specific action before any signature is produced. 

Today several wallet as a service providers (WaaS) allow developers to set policies for the wallets they issue to their customers. These can include things like contract allowlists, amount limits, method selectors, token approvals, message fields, or entire transaction patterns.

By enforcing these constraints at the signing layer, a policy engine creates a programmable trust boundary that does not depend on the frontend or the surrounding application logic. With the right controls in place, a wallet can block malicious routes, prevent unexpected contract calls, and stop unsafe spending behavior.

In practice, this gives developers a predictable and enforceable way to define key behavior. It also ensures that only transactions matching the approved patterns can ever be signed.

Why a policy engine is necessary
The flexibility of Web3 transactions often introduces serious security risks. A single unexpected contract call or token approval can expose users to large, irreversible losses if it is not tightly controlled.

Common attack surfaces include issues like malicious routing, slippage manipulation, and unapproved program interactions. Even well-intentioned applications can put users at risk when interfaces break or when there is an unsurfaced flaw in a smart contract. 

Policy engines reduce this risk by defining exactly how a wallet is allowed to behave. It ensures that every transaction follows the patterns your application expects, no matter what happens in the surrounding environment.

Developers can use policies to block dangerous behavior such as:

Interacting with unapproved or unknown contracts

Sending assets above a defined spending limit

Executing transactions with excessive slippage

Signing messages that do not match expected fields or domains

Approving tokens or transferring assets to suspicious addresses

By enforcing these rules before any signature is produced, a policy engine protects users from compromised UIs, buggy integrations, and hostile network conditions. It turns wallet behavior into something predictable, testable, and safe.

How Turnkey designed its policy engine
Turnkey designed its policy engine to run entirely inside a Trusted Execution Environment (TEE). This is a secure area of a processor that provides hardware-enforced isolation from the host operating system.

Turnkey uses AWS Nitro Enclaves for its TEE infrastructure to create a sealed, network-isolated environment that cannot be accessed, modified, or observed by the host. Even administrators, cloud providers, or the underlying VM have no ability to read memory, inject instructions, or tamper with code running inside the enclave.

Turnkey’s signing workflow is built on these enclaves. Every signing request enters a Nitro Enclave where private keys are managed, the policy evaluation is run, and the final signature is produced. Nothing leaves the enclave unless it satisfies the rules defined by the developer.

This design stands in sharp contrast to other WaaS providers that run their policy checks in normal application environments. In those setups, a compromised host can often bypass or alter policy logic. Policy enforcement is vulnerable to manipulation, inconsistent deployments, and misconfigurations because it happens outside the hardware boundary that protects the keys. 

Turnkey eliminates that risk by running all policy logic inside the enclave itself. The rules are evaluated in the same trusted hardware boundary that protects the keys, which means policy cannot be bypassed, disabled, or modified without breaking attestation.

If the code or policies running inside the enclave ever differ from what developers expect, the attestation measurement will change and the system will refuse to proceed.

The engine inside the enclave uses a deterministic, JSON-based policy language that supports program allowlists, contract checks, token mint restrictions, amount limits, slippage bounds, memo validation, and structured message constraints.

These capabilities give developers precise control over how their wallets behave, with full hardware-backed assurance that the rules cannot be tampered with.

By combining policy evaluation and signing inside TEE infrastructure, Turnkey ensures that only transactions matching the policy can ever be signed.

Where policies can be implemented across chains
Turnkey’s policy engine is built to work consistently across multiple chains while still giving developers access to each chain’s unique transaction surfaces. This allows teams to enforce precise, chain-aware rules without maintaining separate policy systems for every environment they support.

Ethereum policies
On Ethereum, policies can validate contract addresses, method selectors, call data patterns, gas usage, and EIP-712 domain details. Developers can also set spending caps, restrict token approvals, and limit what kinds of interactions are allowed.

These checks make it possible to enforce safe DeFi actions and other application-specific behaviors. By combining contract allowlists with structured message constraints, Ethereum policies give developers fine-grained control over both onchain transactions and off-chain signatures.

Read more on how to create Ethereum policies with Turnkey.

Solana policies

Turnkey’s policy engine evaluates the full instruction set of a Solana transaction. It inspects program IDs, account lists, token mints, compute budget configuration, address lookup table usage, and all SPL token transfers.

This gives developers the ability to write tightly scoped swap policies, staking flows, NFT minting rules, or program-specific allowlists that ensure transactions only interact with the intended Solana programs.

Read more on how to create Solana policies with Turnkey.

TRON policies
For TRON, policies can validate contract interactions, transfer types, token IDs, method names, and approved spender addresses. This is especially important for enterprises using TRON for stablecoin flows, settlement pipelines, or controlled outbound transfers where enforcing strict transfer behavior is critical.

With these controls, teams can define exactly how their TRON-based wallets are allowed to operate and ensure that every transfer or contract call follows the expected pattern.

Read more on how to create TRON policies with Turnkey.

Policy examples and common use cases
Turnkey’s policy engine gives developers the ability to define precise transactional behavior across a wide variety of scenarios. These policies help ensure that wallets operate only within approved boundaries, regardless of changes in frontend logic or integrations.

Some examples of this include:

Swap-only policies
Swap-only policies restrict a wallet to swapping between specific tokens using an approved program or router. This prevents transactions from routing through malicious contracts or unexpected liquidity sources that could manipulate pricing or extract value.

By limiting swap behavior to known, audited paths, developers can protect users from phishing routes, slippage games, or harmful contract interactions.

Spending-cap policies
Spending-cap policies set hard limits on how much value a wallet can move in a single request or over a defined timeframe. These limits are effective for stablecoins, withdrawals, subscription like payments, and automated workflows.

They create predictable outflows and act as a strong defense against draining attacks, compromised applications, or integrations that try to move more funds than intended.

Contract allowlists
Contract allowlists ensure that a wallet only interacts with approved, trusted smart contracts. This is valuable in exchanges, games, custodial systems, and enterprise architectures where interactions must remain within a controlled ecosystem.

If a transaction references a contract outside the allowlist, the policy blocks the request before any signature is produced.

Structured message governance policies
Structured message governance policies apply to off-chain signing on EVM chains, such as EIP 712 typed data. These policies enforce approved domain separators, contract addresses, message fields, and allowable values.

By controlling how off-chain messages are constructed, developers can prevent signature replay, unauthorized approvals, and rogue message signing that could grant unexpected permissions.

Tips for implementing strong policy
Implementing effective policy is not only about defining rules but also about designing a predictable and secure operating boundary for your application. A few best practices can help ensure that your policies remain safe, maintainable, and resilient as your system evolves.

Start by creating a minimal allowlist that includes only the programs or contracts your application truly depends on. This establishes a tight perimeter and reduces the surface area for unexpected behavior.

From there, layer in granular constraints such as token mint restrictions, amount limits, slippage caps, memo rules, or specific method selectors to refine how each interaction is allowed to behave.

Before deploying policy changes, test transactions in simulation, devnet, or staging to confirm that the expected instruction patterns and contract calls align with your rules. Keeping policies versioned, regularly updated, and periodically audited is essential as your application logic, token lists, and third party integrations evolve over time.

Finally, design policies with the expectation that unexpected behavior will occur. Write rules that fail closed instead of failing open, so that if an integration changes or a dependency behaves unpredictably, the wallet remains protected.

This approach ensures that security comes from the policy itself, not from assumptions about external systems.

Turnkey’s policy engine: Protecting assets at the signing layer
Web3 applications increasingly operate in environments where value moves quickly and risks emerge without warning. 

Relying on UI checks or off-chain logic is not enough to protect users when contracts change, integrations fail, or attackers look for ways to bypass an application’s intended flow. Strong, deterministic policies are the only reliable way to define how keys are allowed to behave.

Turnkey’s policy engine brings this protection directly into a trusted execution environment, ensuring that every rule is enforced inside hardware isolation and cannot be tampered with. Developers gain precise control over how their wallets operate, and users gain confidence that only safe, expected transactions can ever be signed.

By applying clear guardrails across chains, narrowing allowed behaviors, and designing policies according to your specific needs, your dev team can significantly reduce their exposure to threats and vulnerabilities.

With Turnkey, policy becomes an integral part of your signing architecture, enabling safer, more predictable Web3 applications at every scale.

Get started with Turnkey.

https://www.turnkey.com/blog/turnkey-policy-engine-guardrails-web3-transactions?utm_source=chatgpt.com


this was a turnkey reference above


at this stage I love policy engine, but I also want to get the most precise phrase with the strongesg backing that describes the main advantage of our platform


## Problem Space & Solution Discovery

### The Problem with Current Permissions

MetaMask Advanced Permissions (ERC-7715) allows users to grant dApps the ability to execute transactions on their behalf. This is powerful but introduces a critical gap:

**Current state:** Permission granted = transactions executed blindly. Once you give a dApp permission to spend your tokens, you have zero runtime control. The dApp can execute whenever it wants, at any gas price, for any amount up to the limit.

**The missing layer:** There's no policy evaluation between "permission exists" and "transaction executes." Users need guardrails.

### How We Arrived at 0xVisor

We explored several approaches before landing on the final architecture:

**Initial exploration:** We considered building a simple DCA bot or subscription service on top of Advanced Permissions. But these are just consumer apps—they don't solve the underlying control problem.

**Key insight:** The real opportunity isn't building another automation app. It's building the infrastructure layer that sits between permissions and execution. Other apps execute blindly; 0xVisor evaluates first.

**Model consideration:** We debated B2B (0xVisor as infrastructure for other dApps) vs B2C (users come directly to 0xVisor). For the hackathon, we chose B2C because:
- Simpler to demo
- Full control over the experience
- Can pitch B2B as future vision

### The Three Pillars Framework

We developed a mental model to explain 0xVisor's value:

| Pillar       | Role                    | Question Answered               |
| ------------ | ----------------------- | ------------------------------- |
| **Adapters** | Define automation logic | WHAT should we execute?         |
| **Policies** | Define safety rules     | WHEN is it safe to execute?     |
| **Signals**  | Provide external data   | WITH WHAT context do we decide? |

This framework emerged from asking: "What does a user need to trust an automation system?"
- They need to know what it will do (Adapters)
- They need control over when it acts (Policies)
- They need the system to be aware of real-world conditions (Signals)


## Part 2: Architecture Specification

### Core Concept (One Paragraph)

0xVisor is a policy-aware automation platform for MetaMask Advanced Permissions. Users connect their wallet, and 0xVisor generates a session account (an EOA that 0xVisor controls). Users grant ERC-7715 permissions to this session account, then install automation adapters (like SwapBot or DCA Bot). When an adapter triggers, it proposes a transaction. Before executing, 0xVisor's policy engine evaluates the proposal against user-configured rules (gas limits, time windows, amount caps, security alerts). Only if all policies pass does 0xVisor execute the transaction via the session account. Every decision is logged, and Envio indexes on-chain events for monitoring and alerts.

### System Components

**Frontend (Next.js, to be hosted on Vercel)**
- Landing page explaining the value proposition
- Dashboard as the main interface showing:
  - Connected wallet and session account info
  - Installed adapters with status and last run time
  - Policy toggles with configuration options
  - Signal status indicators (gas, time, envio connection)
  - Activity feed showing execution history with decisions
- Permission grant flow as a separate, explicit UI step
- Adapter marketplace (hardcoded list for hackathon)
- Adapter configuration modal for setting parameters
- Policy configuration modal for adjusting thresholds

**Backend Agent**
- Session Manager: Creates one session account per user, generates EOA keypair, encrypts private key with AES-256-GCM, stores in SQLite, loads wallet client on demand for signing
- Permission Storage: Stores granted ERC-7715 permissions with delegation data, tracks active/expired status
- Adapter Registry: Holds definitions for SwapBot and DCA Bot, each adapter knows how to propose transactions (encode Uniswap calldata), validates its own config schema
- Policy Engine: Loads user's enabled policies (global and per-adapter), fetches current signals, evaluates each policy in sequence, returns ALLOW with reasons or BLOCK with the failing policy and reason
- Signal Fetcher: Queries gas price from RPC, provides current time info, queries Envio for alerts and anomalies
- Executor: Orchestrates the full flow—loads adapter, calls proposeTransaction, runs policy evaluation, logs decision, would submit UserOperation via Pimlico if ALLOW (mocked for hackathon MVP)
- Database: SQLite with Drizzle ORM, tables for session_accounts, permissions, installed_adapters, user_policies, execution_logs, security_alerts

### Policies 

**Gas Limit Policy**
**Time Window Policy**
**Max Amount Policy**
**Security Pause Policy**

### Signals (Detailed)

**Gas Signal**
- Source: Sepolia RPC via viem's getGasPrice and getBlock
- Returns: standard (gwei), baseFee (gwei), raw (wei as string), timestamp
- Used by: Gas Limit Policy

**Time Signal**
- Source: System clock
- Returns: now (ISO string), hour (0-23 UTC), dayOfWeek (0-6), dayOfMonth, month, year, isWeekend (boolean), timestamp
- Used by: Time Window Policy

**Envio Signal**
- Source: Local database for alerts, Envio GraphQL API for on-chain data
- Returns: alerts array (active security alerts), recentRedemptions array (from indexer), envioConnected (boolean), alertCount, timestamp
- Used by: Security Pause Policy

Signals are fetched fresh for each policy evaluation. Failed signal fetches return null/error state, and policies handle missing signals gracefully (typically by allowing execution with a note).


## Part 3: Hackathon Strategy

### Target Tracks

| Track                                     | Prize  | Our Angle                                                                                                                                                                                                   |
| ----------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Most Creative Use of Advanced Permissions | $3,000 | We're not building another consumer app (DCA bot, subscription). We're building the infrastructure layer that makes all permission-based apps safer. Other projects use permissions; we govern them.        |
| Best Use of Envio                         | $3,000 | Active monitoring, not passive indexing. We use Envio for: real-time Telegram alerts, anomaly detection feeding back into policy decisions, dashboard stats. The indexer is integral to the security model. |
| Best Feedback                             | $500   | Submit detailed, constructive feedback on the hackathon experience, tools, documentation. Easy win with effort.                                                                                             |
| Best Social Media                         | $500   | Tweet thread explaining the problem and solution, demo video, engage with the community.                                                                                                                    |

**Total target: $7,000**

┌─────────────────────────────────────────────────────────────────────────────┐
  │                         0XVISOR SYSTEM ARCHITECTURE                         │
  └─────────────────────────────────────────────────────────────────────────────┘

  ═══════════════════════════════════════════════════════════════════════════════
   PHASE 1: ADAPTER INSTALLATION & POLICY SETUP
  ═══════════════════════════════════════════════════════════════════════════════

  ┌──────────────┐
  │ User Wallet  │ (MetaMask - 0x123...)
  └──────┬───────┘
         │ 1. Browse adapters
         ├─────────────────────────────────────────────────────┐
         │                                                     │
         ▼                                                     ▼
  ┌────────────────────┐                            ┌──────────────────┐
  │ /adapters page     │                            │ Adapter Registry │
  │ (Next.js)          │◄───────────────────────────│ (@0xvisor/agent) │
  └────────┬───────────┘  2. List available         └──────────────────┘
           │              adapters metadata           - transfer-bot
           │                                           - swap-bot
           │ 3. Select "transfer-bot"                  - dca-bot
           │ Click "Install Adapter"
           ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ /adapters/transfer-bot/policy (Policy Builder)                             │
  │                                                                             │
  │  ┌─────────────────┐        ┌──────────────────┐                          │
  │  │ Template Grid   │        │ Policy Form      │                          │
  │  │ - Conservative  │───────▶│ - Token: USDC    │                          │
  │  │ - Balanced      │        │ - Amount: 0.1    │                          │
  │  │ - Aggressive    │        │ - Period: daily  │                          │
  │  └─────────────────┘        │ - Conditions:    │                          │
  │                             │   * Time window  │                          │
  │  4. User fills form         │   * Gas limit    │                          │
  │                             │   * Security     │                          │
  │                             └────────┬─────────┘                          │
  │                                      │ 5. Real-time compilation            │
  │                                      ▼                                     │
  │                             ┌──────────────────┐                          │
  │                             │ Policy Compiler  │                          │
  │                             │ (dsl/compiler.ts)│                          │
  │                             └────────┬─────────┘                          │
  │                                      │                                     │
  └──────────────────────────────────────┼─────────────────────────────────────┘
                                         │
                                         ▼
                          ┌──────────────────────────────┐
                          │ Compiled Policy Output       │
                          │                              │
                          │ MetaMask Permission:         │
                          │  - type: erc20-token-periodic│
                          │  - token: 0x1c7D...          │
                          │  - allowance: 100000         │
                          │  - period: 86400             │
                          │                              │
                          │ 0xVisor Rules:               │
                          │  - amount-limit: 0.1 USDC    │
                          │  - time-window: 9am-5pm      │
                          │  - gas-limit: 50 gwei        │
                          │  - security-pause: enabled   │
                          └──────────────┬───────────────┘
                                         │ 6. Store in localStorage
                                         │ Redirect to /dashboard
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ /dashboard (Permission Grant)                                              │
  │                                                                             │
  │  ┌────────────────────────────────────────────────────────────────┐        │
  │  │ Grant Permission Card                                          │        │
  │  │  Policy: "Daily USDC Transfer"                                 │        │
  │  │  Summary: Transfer 0.1 USDC daily, 9am-5pm, max 50 gwei       │        │
  │  │                                                                 │        │
  │  │  [ Grant Permission ] ◄── 7. User clicks                       │        │
  │  └─────────────────────────────┬──────────────────────────────────┘        │
  └─────────────────────────────────┼─────────────────────────────────────────┘
                                    │
                                    ▼
                      ┌─────────────────────────────┐
                      │ usePermission hook          │
                      │ hooks/usePermission.ts:58   │
                      └─────────────┬───────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
  ┌──────────────┐        ┌──────────────────┐      ┌─────────────────┐
  │ 8a. Create   │        │ 8b. MetaMask     │      │ 8c. Store in DB │
  │ Session      │        │ Wallet Signature │      │ - Permission    │
  │ Account      │        │ (ERC-7715)       │      │ - Session       │
  │              │        │                  │      │ - UserPolicy    │
  │ session/     │        │ DelegationManager│      │                 │
  │ manager.ts   │        │ 0xdb9B...        │      │ web/db/         │
  └──────────────┘        └──────────────────┘      └─────────────────┘
        │                           │                           │
        │ Returns:                  │ Returns:                  │
        │ sessionAddress:           │ delegationHash:           │
        │ 0xABC... (Smart Account)  │ 0x789...                  │
        └───────────────────────────┴───────────────────────────┘
                                    │
                                    ▼
                      ┌─────────────────────────────┐
                      │ 9. Install Adapter          │
                      │ tRPC: adapters.install      │
                      │ routers/adapters.ts:40      │
                      └─────────────┬───────────────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │ installed_    │
                            │ adapters      │
                            │ table         │
                            │               │
                            │ - id: 1       │
                            │ - userAddress │
                            │ - adapterId   │
                            │ - config      │
                            │ - permissionId│
                            │ - isActive    │
                            └───────────────┘

  ═══════════════════════════════════════════════════════════════════════════════
   PHASE 2: SIGNAL MONITORING (Continuous Background Process)
  ═══════════════════════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────────────────────┐
  │ On-Chain Events (Sepolia Testnet)                                       │
  └──────────────────────────────────────────────────────────────────────────┘
             │
             │ RedeemedDelegation, EnabledDelegation, DisabledDelegation
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ Envio Indexer (HyperIndex)                                             │
  │ packages/indexer/                                                       │
  │                                                                         │
  │  ┌────────────────────────────────────────────────────────────┐        │
  │  │ EventHandlers.ts                                           │        │
  │  │                                                             │        │
  │  │  1. Capture events                                         │        │
  │  │  2. Store in database (Redemption, Stats)                 │        │
  │  │  3. Anomaly Detection:                                     │        │
  │  │     - Check global frequency (>10/hour)                   │        │
  │  │     - Check user frequency (>5/hour)                      │        │
  │  │  4. Create SecurityAlert if threshold exceeded            │        │
  │  │  5. Send Telegram notification                            │        │
  │  └────────────────────────────────────────────────────────────┘        │
  │                                                                         │
  │  GraphQL API: https://indexer.dev.hyperindex.xyz/.../v1/graphql       │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             │ Exposed via GraphQL
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ Signal System (packages/agent/src/signals/)                            │
  │                                                                         │
  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐ │
  │  │ Gas Signal   │  │ Time Signal  │  │ Envio Signal                 │ │
  │  │              │  │              │  │                              │ │
  │  │ - Sepolia RPC│  │ - Current UTC│  │ - Query Envio GraphQL       │ │
  │  │ - Base fee   │  │ - Hour       │  │ - Fetch SecurityAlert       │ │
  │  │ - Standard   │  │ - Weekend?   │  │ - Fetch Stats               │ │
  │  └──────────────┘  └──────────────┘  │ - Fetch recent Redemptions  │ │
  │                                      │                              │ │
  │                                      │ Client-side anomaly check    │ │
  │                                      └──────────────────────────────┘ │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             │ fetchAllSignals()
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ Dashboard UI (Auto-refresh every 10s)                                  │
  │ components/SignalStatusWidget.tsx                                      │
  │                                                                         │
  │  ┌──────────────────────────────────────────────────────────┐          │
  │  │ ● Gas Price: 2.45 gwei (Base: 0.0012)                   │          │
  │  │ ● Current Time: 14:32 UTC (Weekday)                     │          │
  │  │ ● Envio Indexer: Connected                              │          │
  │  │                                                          │          │
  │  │   Stats: 142 Redemptions | 98 Granted | 44 Revoked     │          │
  │  │                                                          │          │
  │  │   ● 2 Active Alerts                                     │          │
  │  │   CRITICAL: User 0x123... has 6 redemptions in last hour│          │
  │  │   HIGH: Unusual activity - 12 redemptions globally      │          │
  │  └──────────────────────────────────────────────────────────┘          │
  └─────────────────────────────────────────────────────────────────────────┘

  ═══════════════════════════════════════════════════════════════════════════════
   PHASE 3: EXECUTION FLOW (Manual or Scheduled)
  ═══════════════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────────┐
  │ Execution Trigger                                                       │
  ├─────────────────────────────────────────────────────────────────────────┤
  │                                                                         │
  │  Option A: Manual (Adapter Playground)                                 │
  │  ┌────────────────────────────────────────┐                            │
  │  │ AdapterPlayground Component            │                            │
  │  │  Recipient: [0x456...]                 │                            │
  │  │  [Execute Transfer] ◄── User clicks    │                            │
  │  └────────────────────────────────────────┘                            │
  │                                                                         │
  │  Option B: Scheduled (Future: Cron job)                                │
  │  ┌────────────────────────────────────────┐                            │
  │  │ Cron Scheduler (not yet implemented)   │                            │
  │  │  "0 9 * * *" → trigger at 9am daily    │                            │
  │  └────────────────────────────────────────┘                            │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             │ Both routes lead to same execution flow
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ tRPC Execute Router                                                     │
  │ web/src/trpc/routers/execute.ts:20                                     │
  │                                                                         │
  │  Input: { userAddress, adapterId, runtimeParams: { recipient } }      │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ STEP 1: Validate Installation                                          │
  │ execute.ts:42-56                                                        │
  │                                                                         │
  │  DB Query: installedAdapters                                           │
  │   WHERE userAddress = 0x123...                                         │
  │     AND adapterId = "transfer-bot"                                     │
  │     AND isActive = true                                                │
  │                                                                         │
  │  ✓ Found → Continue                                                    │
  │  ✗ Not found → Return ERROR                                            │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ STEP 2: Get Adapter Definition                                         │
  │ execute.ts:58-66                                                        │
  │                                                                         │
  │  getAdapter("transfer-bot") from registry                              │
  │  Returns: Adapter interface with proposeTransaction()                  │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ STEP 3: Validate Permission                                            │
  │ execute.ts:68-81                                                        │
  │                                                                         │
  │  DB Query: permissions WHERE id = installed.permissionId               │
  │                                                                         │
  │  ✓ Found → delegationData available                                    │
  │  ✗ Not found → Return ERROR                                            │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ STEP 4: Validate Session                                               │
  │ execute.ts:84-97                                                        │
  │                                                                         │
  │  DB Query: sessionAccounts                                             │
  │   WHERE userAddress = 0x123...                                         │
  │     AND adapterId = "transfer-bot"                                     │
  │                                                                         │
  │  Returns: { address, encryptedPrivateKey, deployParams }              │
  │                                                                         │
  │  ✓ Found → Session 0xABC... (Smart Account)                           │
  │  ✗ Not found → Return ERROR                                            │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ STEP 5: Propose Transaction                                            │
  │ execute.ts:100-126                                                      │
  │                                                                         │
  │  adapter.proposeTransaction({                                          │
  │    userAddress: 0x123...,                                              │
  │    config: { tokenAddress, amountPerTransfer, decimals },             │
  │    permissionData: delegationData,                                     │
  │    runtimeParams: { recipient: 0x456... }                             │
  │  })                                                                     │
  │                                                                         │
  │  ↓ Adapter Logic (adapters/transfer-bot.ts:62-91)                     │
  │                                                                         │
  │  1. Parse config (USDC address, 0.1 amount, 6 decimals)               │
  │  2. Get recipient from runtimeParams (0x456...)                       │
  │  3. Encode ERC20 transfer call data:                                   │
  │     transfer(0x456..., 100000) // 0.1 USDC = 100000 units             │
  │  4. Return ProposedTransaction:                                        │
  │     {                                                                   │
  │       target: 0x1c7D... (USDC contract),                              │
  │       value: 0,                                                        │
  │       callData: 0xa9059cbb...,                                         │
  │       description: "Transfer 0.1 tokens to 0x456...",                 │
  │       tokenAddress: 0x1c7D...,                                         │
  │       tokenAmount: 100000n,                                            │
  │       recipient: 0x456...                                              │
  │     }                                                                   │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ STEP 6: Fetch All Signals                                              │
  │ execute.ts:139 → policyEngine.evaluate() → engine.ts:44                │
  │                                                                         │
  │  fetchAllSignals() returns:                                            │
  │  {                                                                      │
  │    gas: { standard: 2.45, baseFee: 0.0012 },                          │
  │    time: { now: Date, hour: 14, isWeekend: false },                   │
  │    envio: {                                                            │
  │      envioConnected: true,                                             │
  │      alerts: [                                                         │
  │        {                                                               │
  │          alertType: "user-high-frequency",                            │
  │          severity: "critical",                                         │
  │          message: "User has 6 redemptions in last hour"               │
  │        }                                                               │
  │      ],                                                                │
  │      stats: { totalRedemptions: 142, ... },                           │
  │      recentRedemptions: [...]                                          │
  │    }                                                                    │
  │  }                                                                      │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ STEP 7: Policy Engine Evaluation                                       │
  │ packages/agent/src/policies/engine.ts:29-84                           │
  │                                                                         │
  │  Input:                                                                 │
  │   - userAddress: 0x123...                                              │
  │   - adapterId: "transfer-bot"                                          │
  │   - proposedTx: { target, value, callData, ... }                      │
  │   - signals: { gas, time, envio }                                      │
  │                                                                         │
  │  Process:                                                               │
  │   1. Load user policies from DB (user_policies table)                 │
  │   2. Create evaluation context:                                        │
  │      {                                                                  │
  │        userAddress, adapterId, proposedTx, signals,                   │
  │        timestamp, lastExecutionTime                                    │
  │      }                                                                  │
  │   3. Loop through enabled policies:                                    │
  │                                                                         │
  │  ┌─────────────────────────────────────────────────────────┐           │
  │  │ Policy 1: amount-limit                                 │           │
  │  │ policies/rules/amount-limit.ts                         │           │
  │  │                                                         │           │
  │  │ Check: proposedTx.tokenAmount <= maxAmount            │           │
  │  │ Result: 100000 <= 100000 ✓ ALLOW                      │           │
  │  └─────────────────────────────────────────────────────────┘           │
  │                                                                         │
  │  ┌─────────────────────────────────────────────────────────┐           │
  │  │ Policy 2: time-window                                  │           │
  │  │ policies/rules/time-window.ts                          │           │
  │  │                                                         │           │
  │  │ Check: context.signals.time.hour in [9-17]            │           │
  │  │ Result: 14 in [9-17] ✓ ALLOW                          │           │
  │  └─────────────────────────────────────────────────────────┘           │
  │                                                                         │
  │  ┌─────────────────────────────────────────────────────────┐           │
  │  │ Policy 3: gas-limit                                     │           │
  │  │ policies/rules/gas-limit.ts                            │           │
  │  │                                                         │           │
  │  │ Check: context.signals.gas.standard <= maxGas         │           │
  │  │ Result: 2.45 <= 50 ✓ ALLOW                            │           │
  │  └─────────────────────────────────────────────────────────┘           │
  │                                                                         │
  │  ┌─────────────────────────────────────────────────────────┐           │
  │  │ Policy 4: security-pause                               │           │
  │  │ policies/rules/security-pause.ts:18-56                 │           │
  │  │                                                         │           │
  │  │ Check: context.signals.envio.alerts.length > 0         │           │
  │  │ Result: alerts = [{ severity: "critical", ... }]      │           │
  │  │                                                         │           │
  │  │ Filter by severity: ["high", "critical"]               │           │
  │  │ relevantAlerts = 1 alert found                         │           │
  │  │                                                         │           │
  │  │ Decision: ✗ BLOCK                                      │           │
  │  │ Reason: "Security alert active: CRITICAL - User..."   │           │
  │  └─────────────────────────────────────────────────────────┘           │
  │                                                                         │
  │  Final Result:                                                          │
  │  {                                                                      │
  │    allowed: false,                                                     │
  │    blockingPolicy: "security-pause",                                   │
  │    blockingReason: "Security alert active: CRITICAL...",              │
  │    decisions: [                                                        │
  │      { policyType: "amount-limit", allowed: true },                   │
  │      { policyType: "time-window", allowed: true },                    │
  │      { policyType: "gas-limit", allowed: true },                      │
  │      { policyType: "security-pause", allowed: false }                 │
  │    ]                                                                    │
  │  }                                                                      │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ STEP 8: Log Execution Attempt                                          │
  │ execute.ts:159-166                                                      │
  │                                                                         │
  │  INSERT INTO execution_logs:                                           │
  │  {                                                                      │
  │    userAddress: 0x123...,                                              │
  │    adapterId: "transfer-bot",                                          │
  │    proposedTx: {...},                                                  │
  │    decision: "BLOCK",                                                  │
  │    reason: "Security alert active...",                                 │
  │    policyResults: [...],                                               │
  │    executedAt: 2026-01-03T14:32:00Z                                   │
  │  }                                                                      │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             ├─────────────────────────────────────────────────────────────┐
             │                                                             │
             ▼ If BLOCKED                                                  ▼ If ALLOWED
  ┌──────────────────────────┐                              ┌──────────────────────────┐
  │ STEP 9a: Return BLOCK    │                              │ STEP 9b: Execute on-chain│
  │ execute.ts:169-176        │                              │ execute.ts:181-203       │
  │                           │                              │                          │
  │ Return to user:           │                              │ executor.executeAdapter({│
  │ {                         │                              │   userAddress,           │
  │   success: true,          │                              │   adapter,               │
  │   decision: "BLOCK",      │                              │   session: {             │
  │   reason: "Security..."   │                              │     address: 0xABC...,   │
  │ }                         │                              │     encryptedPrivateKey, │
  │                           │                              │     deployParams         │
  │ User sees yellow warning  │                              │   },                     │
  │ in Adapter Playground     │                              │   installedAdapterData,  │
  └───────────────────────────┘                              │   runtimeParams,         │
                                                             │   permissionDelegationData│
                                                             │ })                       │
                                                             │                          │
                                                             │ ↓ Executor Logic         │
                                                             │   (executor/index.ts)    │
                                                             │                          │
                                                             │ 1. Decrypt session key   │
                                                             │ 2. Create viem client    │
                                                             │ 3. Redeem delegation     │
                                                             │    (ERC-7715)            │
                                                             │ 4. Send transaction      │
                                                             │ 5. Wait for receipt      │
                                                             │                          │
                                                             │ Return:                  │
                                                             │ {                        │
                                                             │   success: true,         │
                                                             │   decision: "ALLOW",     │
                                                             │   txHash: 0xDEF...       │
                                                             │ }                        │
                                                             └──────────┬───────────────┘
                                                                        │
                                                                        ▼
                                                             ┌──────────────────────────┐
                                                             │ On-Chain Transaction     │
                                                             │                          │
                                                             │ From: 0xABC... (Session) │
                                                             │ To: 0x1c7D... (USDC)     │
                                                             │ Data: transfer(0x456...) │
                                                             │                          │
                                                             │ Delegation verified ✓    │
                                                             │ Tx confirmed ✓           │
                                                             └──────────┬───────────────┘
                                                                        │
                                                                        ▼
                                                             ┌──────────────────────────┐
                                                             │ Update execution_logs    │
                                                             │ SET txHash = 0xDEF...    │
                                                             │                          │
                                                             │ Update installed_adapters│
                                                             │ SET lastRun = NOW()      │
                                                             └──────────────────────────┘

  ═══════════════════════════════════════════════════════════════════════════════
   PHASE 4: EVENT MONITORING & FEEDBACK LOOP
  ═══════════════════════════════════════════════════════════════════════════════

                          On-Chain Transaction Confirmed
                                      │
                                      ▼
                          ┌────────────────────────┐
                          │ DelegationManager      │
                          │ emits:                 │
                          │ RedeemedDelegation()   │
                          └────────────┬───────────┘
                                       │
                                       ▼
                          ┌────────────────────────┐
                          │ Envio Indexer          │
                          │ Captures event         │
                          │                        │
                          │ Stores Redemption      │
                          │ Updates Stats          │
                          │ Checks anomalies       │
                          │                        │
                          │ If suspicious:         │
                          │ → Create SecurityAlert │
                          │ → Send Telegram alert  │
                          └────────────┬───────────┘
                                       │
                                       ▼
                          ┌────────────────────────┐
                          │ Next Execution Request │
                          │ fetches signals again  │
                          │                        │
                          │ NEW alerts appear      │
                          │ → May BLOCK future txs │
                          └────────────────────────┘

  ═══════════════════════════════════════════════════════════════════════════════
   DATA FLOW SUMMARY
  ═══════════════════════════════════════════════════════════════════════════════

  Frontend (Next.js)
      ↕
  tRPC API Layer (routers/*)
      ↕
  Backend Services (@0xvisor/agent)
      ├─ Policy Compiler (DSL → Rules)
      ├─ Policy Engine (Evaluate with signals)
      ├─ Session Manager (Create smart accounts)
      ├─ Adapter Registry (Propose transactions)
      ├─ Executor (Execute with ERC-7715)
      └─ Signals (Gas, Time, Envio)
          ↕
  External Services
      ├─ Sepolia RPC (Gas prices, chain state)
      ├─ Envio GraphQL (Security alerts, stats)
      └─ Telegram Bot (Notifications)
          ↕
  Smart Contracts (Sepolia)
      ├─ DelegationManager (0xdb9B...)
      ├─ USDC (0x1c7D...)
      └─ Session Smart Accounts (0xABC...)

  Database (Vercel Postgres)
      ├─ installed_adapters (User installations)
      ├─ permissions (Granted delegations)
      ├─ session_accounts (Per-adapter sessions)
      ├─ user_policies (Compiled rules)
      └─ execution_logs (Audit trail)

  ═══════════════════════════════════════════════════════════════════════════════
   KEY ARCHITECTURE DECISIONS
  ═══════════════════════════════════════════════════════════════════════════════

  1. ONE Session Account per (User + Adapter) combination
     - User 0x123... can have:
       * Session 0xAAA... for transfer-bot (USDC)
       * Session 0xBBB... for transfer-bot (USDT)
       * Session 0xCCC... for dca-bot
     - Each session has isolated permissions

  2. Policy Engine runs BEFORE execution
     - All policies must pass (allowed: true)
     - Any single BLOCK → entire execution blocked
     - Logged to execution_logs for audit

  3. Signals are fetched fresh for each execution
     - Real-time gas prices
     - Current time/date
     - Latest security alerts from Envio
     - No caching to ensure safety

  4. Dual-layer anomaly detection
     - Server-side: Envio indexer creates SecurityAlert entities
     - Client-side: envio-signal.ts validates again (backup)
     - Both feed into security-pause policy rule

  5. Complete audit trail
     - Every execution attempt logged (ALLOW/BLOCK/ERROR)
     - Policy evaluation results stored
     - Transaction hashes linked for forensics

  This flow shows the complete lifecycle


but then I made a migration right, and in this I decided to move key signing and storage onto enclave aws nitro enclave

# AWS Nitro Enclave Migration Roadmap
## 0xVisor → Turnkey-like Policy Engine Architecture

**Last Updated**: 2025-01-03
**Status**: Planning Phase
**AWS Region**: eu-central-1
**CLI Profile**: godson

---

## Executive Summary

This document outlines the migration from the current 0xVisor architecture (database-stored encrypted keys + backend policy evaluation) to a Turnkey-inspired architecture where **all policy evaluation and transaction signing happens inside AWS Nitro Enclaves**.

### Key Benefits
- **Hardware-isolated key storage**: Private keys never leave the enclave
- **Attested policy enforcement**: Cryptographic proof that policies were evaluated
- **Reduced attack surface**: Even compromised parent instance cannot bypass policies
- **Compliance-ready**: Hardware root of trust for key management

---

## Architecture Comparison

### Current Architecture (Before)

```
┌─────────────────────────────────────────────────────────────┐
│    Vercel Functions                             │
│                                                              │
│  ┌──────────────┐      ┌─────────────────┐                 │
│  │ tRPC Router  │─────▶│ Policy Engine   │                 │
│  │ (execute.ts) │      │ (engine.ts)     │                 │
│  └──────┬───────┘      └────────┬────────┘                 │
│         │                       │                           │
│         │                       │ Fetches signals           │
│         │                       │ (gas, time, envio)        │
│         │                       │                           │
│         ▼                       ▼                           │
│  ┌────────────────────────────────────┐                    │
│  │ Executor                           │                    │
│  │ - Decrypts private key from DB     │ ◀── SECURITY RISK  │
│  │ - Signs transaction in memory      │                    │
│  │ - Sends to bundler                 │                    │
│  └────────────────────────────────────┘                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
    ┌──────────────┐
    │ Postgres DB  │
    │ - Encrypted  │
    │   keys       │
    └──────────────┘
```

**Problems:**
- Private keys exist decrypted in parent instance memory
- Policy evaluation could be bypassed by compromised host
- No attestation proof of policy enforcement
- Keys stored in database (encrypted but vulnerable to extraction)

---

### Target Architecture (After)

```
┌────────────────────────────────────────────────────────────────┐
│  EC2 Instance                │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Application                             │  │
│  │                                                          │  │
│  │  1. tRPC receive execution request                       │  │
│  │  2. Fetch policy rules from DB                           │  │
│  │  3. Fetch signals (gas, time, envio)                     │  │
│  │  4. Send to enclave via vsock                            │  │
│  │  5. Receive signature (or rejection)                     │  │
│  │  6. Broadcast transaction                                │  │
│  │  7. Verify attestation document                          │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                      │
│                          │ vsock (CID 16, Port 5000)            │
│                          │                                      │
│  ┌───────────────────────▼──────────────────────────────────┐  │
│  │ 🔒 AWS Nitro Enclave (Isolated TEE)                      │  │
│  │                                                           │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ Enclave Application (Node.js)                      │  │  │
│  │  │                                                     │  │  │
│  │  │  1. Receive: {proposedTx, rules, signals, keyId}  │  │  │
│  │  │  2. Load session private key (in-memory only)     │  │  │
│  │  │  3. Run PolicyEngine.evaluate()                   │  │  │
│  │  │  4. If ALLOW: Sign transaction                    │  │  │
│  │  │  5. If BLOCK: Return rejection reason             │  │  │
│  │  │  6. Generate attestation document                 │  │  │
│  │  │  7. Return: {allowed, signature?, attestation}    │  │  │
│  │  └───────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  ┌───────────────────────────────────────────────────┐  │  │
│  │  │ Key Storage (in-memory only, never persisted)     │  │  │
│  │  │ - Session account private keys                    │  │  │
│  │  │ - Never encrypted (no need - hardware isolated)   │  │  │
│  │  │ - Never leave enclave                             │  │  │
│  │  └───────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  No external network access ✓                           │  │
│  │  No persistent storage ✓                                │  │
│  │  No interactive access ✓                                │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```



## Technical Components

### 1. Parent Instance Application

**Responsibilities:**
- Receive execution requests from tRPC
- Fetch policy rules from database
- Fetch signals (gas, time, envio) from external APIs
- Serialize request and send to enclave via vsock
- Receive and parse enclave response
- Verify attestation document
- Broadcast signed transaction to bundler



**Responsibilities:**
- Listen on vsock (CID 16, port 5000)
- Receive: `{ proposedTx, policyRules, signals, sessionAccountId }`
- Load session account private key from in-memory store
- Run PolicyEngine evaluation
- If ALLOW: Sign transaction with viem
- If BLOCK: Return rejection reason
- Generate attestation document
- Return: `{ allowed, signature?, reason, attestation }`


### Internal Documentation
- FLOW.md: Complete system architecture
- POLICY_SYSTEM.md: Policy DSL and compiler
- packages/agent/src/policies/: Policy rules


your goal is to out of research give me heavy problem statements that are linked to my soltion , even real life hacks from policy compromise and backend server wallet signing, you can make reference to turnkey, privy.io other industry verified policy aware server wallet to validate our feasibility while saying metmask advance policy is our advantage over those ones. I added turnkey article cos they wrote well to describe the concept of policy engine

https://www.hackquest.io/hackathons/MetaMask-Advanced-Permissions-Dev-Cook-Off


 